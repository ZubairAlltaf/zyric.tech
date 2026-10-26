"use client";

/* ==========================================================================
   KIT: SHOOT PLANNING — 4 tools behind the camera. An astrophotography
   exposure planner (500 rule + NPF-lite), a panorama shot/row calculator,
   a stop-motion frame budget planner and an indie film shoot-day rundown
   with wrap time.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Star, GalleryVertical, Clapperboard, Film } from "lucide-react";
import {
  BigStat,
  Field,
  Grid,
  KV,
  Note,
  Out,
  Panel,
  Row,
  Seg,
  Slider,
  Split,
  Tag,
  accentOf,
  fmt,
} from "./kit";
import type { ToolMeta } from "./tool-types";

function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}
function clockStr(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/* ------------------------ 1. Astro Exposure Planner ------------------------ */

function AstroExposureTool() {
  const A = accentOf(10);
  const [focal, setFocal] = useState(24);
  const [crop, setCrop] = useState(1.5);
  const [declination, setDeclination] = useState(30);
  const [aperture, setAperture] = useState(2.8);
  const [pitch, setPitch] = useState(4.3);
  const [frames, setFrames] = useState(120);
  const [perFrame, setPerFrame] = useState(0);

  const calc = useMemo(() => {
    const eff = focal * crop;
    const rule500 = 500 / eff;
    const declF = Math.cos((declination * Math.PI) / 180);
    // simplified NPF (accurate variant): (35 * aperture + 16 * pitch) / (eff * declF)
    const npf = (30 * aperture + 16 * pitch) / (eff * Math.max(0.15, declF));
    const exposure = perFrame > 0 ? perFrame : Math.min(rule500, npf);
    const trailPerHour = (15 * Math.PI) / 180 / 60; // rad/min arc — simplified arc-minutes drift
    const drift = (15 / 60) * declF; // arc-min per min (approx)
    const totalTime = (exposure + 2) * frames; // +2s gap per frame
    return { eff, rule500, npf, exposure, drift, totalTime, gapTotal: 2 * frames };
  }, [focal, crop, declination, aperture, pitch, frames, perFrame]);

  return (
    <Split
      left={
        <Panel title="SKY & SENSOR" accent={A}>
          <Row>
            <Field label="FOCAL LENGTH (MM)" type="number" value={focal} onChange={(v) => setFocal(num(v))} />
            <Field label="CROP FACTOR" type="number" step={0.1} value={crop} onChange={(v) => setCrop(num(v))} />
            <Field label="APERTURE (F/)" type="number" step={0.1} value={aperture} onChange={(v) => setAperture(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="TARGET DECLINATION" value={declination} onChange={setDeclination} min={0} max={89} suffix="°" hint="0° = celestial equator (worst trailing)" accent={A} />
            <Slider label="PIXEL PITCH" value={pitch} onChange={setPitch} min={2} max={8} step={0.1} suffix=" µm" accent={A} />
            <Slider label="FRAMES TO STACK" value={frames} onChange={setFrames} min={10} max={500} step={10} accent={A} />
            <Slider label="OVERRIDE EXPOSURE (0 = AUTO)" value={perFrame} onChange={setPerFrame} min={0} max={30} step={0.5} suffix=" s" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="500 RULE" value={fmt(calc.rule500, 1)} unit="s" hint="classic ceiling" accent={A} />
            <BigStat label="NPF-LITE" value={fmt(calc.npf, 1)} unit="s" hint="sharper corners" accent={A} />
            <BigStat label="CHOSEN" value={fmt(calc.exposure, 1)} unit="s" hint={perFrame > 0 ? "your override" : "safe min of both"} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <>
          <Grid cols={3}>
            <BigStat label="SESSION LENGTH" value={fmt(calc.totalTime / 60, 0)} unit="min" hint={`incl. ${calc.gapTotal}s gaps`} accent={A} />
            <BigStat label="EFFECTIVE FOCAL" value={fmt(calc.eff, 0)} unit="mm" accent={A} />
            <BigStat label="STAR DRIFT" value={fmt(calc.drift, 2)} unit="′/min" accent={A} />
          </Grid>
          <div className="mt-3">
            <Panel title="SHOOT CARD" accent={A}>
              <KV k="mode" v="manual · RAW" />
              <KV k="exposure" v={`${fmt(calc.exposure, 1)} s`} accent={A} />
              <KV k="aperture" v={`f/${fmt(aperture, 1)} (wide open)`} />
              <KV k="iso" v="start 1600–3200, expose sky to ~1/3" />
              <KV k="interval" v={`${fmt(calc.exposure + 2, 1)} s (gap 2 s)`} />
              <KV k="frames" v={`${frames} lights + 20 darks`} accent={A} />
              <KV k="white balance" v="fixed — never auto" />
              <Out
                className="mt-3"
                label="COPY CARD"
                text={`Astro session: ${focal}mm (×${crop}) f/${aperture}\nExposure ${fmt(calc.exposure, 1)}s (500-rule ${fmt(calc.rule500, 1)}s · NPF ${fmt(calc.npf, 1)}s)\n${frames} frames → ${fmt(calc.totalTime / 60, 0)} min session + darks`}
              />
              <Note>The 500 rule is the old ceiling; NPF shrinks it for high-density sensors. Declination softens drift near the poles — that slider is why one number never fits all skies.</Note>
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* --------------------------- 2. Panorama Planner --------------------------- */

function PanoramaTool() {
  const A = accentOf(11);
  const [sceneW, setSceneW] = useState(120);
  const [sceneH, setSceneH] = useState(60);
  const [focal, setFocal] = useState(35);
  const [sensorW, setSensorW] = useState(36);
  const [sensorH, setSensorH] = useState(24);
  const [overlap, setOverlap] = useState(30);

  const calc = useMemo(() => {
    const aovW = 2 * Math.atan(sensorW / (2 * focal)) * (180 / Math.PI);
    const aovH = 2 * Math.atan(sensorH / (2 * focal)) * (180 / Math.PI);
    const stepW = aovW * (1 - overlap / 100);
    const stepH = aovH * (1 - overlap / 100);
    const cols = Math.ceil(sceneW / Math.max(0.1, stepW));
    const rows = Math.ceil(sceneH / Math.max(0.1, stepH));
    const total = cols * rows;
    const pxW = Math.round(cols * sensorW * 1000 / Math.max(1, 4.3) * 0.001 * 36); // rough stitched width in MP-equivalent — display only
    return { aovW, aovH, stepW, stepH, cols, rows, total, pxW };
  }, [sceneW, sceneH, focal, sensorW, sensorH, overlap]);

  return (
    <Split
      left={
        <Panel title="SCENE & GLASS" accent={A}>
          <Row>
            <Field label="SCENE WIDTH (°)" type="number" value={sceneW} onChange={(v) => setSceneW(num(v))} />
            <Field label="SCENE HEIGHT (°)" type="number" value={sceneH} onChange={(v) => setSceneH(num(v))} />
            <Field label="FOCAL (MM)" type="number" value={focal} onChange={(v) => setFocal(num(v))} />
          </Row>
          <Row className="mt-3">
            <Field label="SENSOR W (MM)" type="number" value={sensorW} onChange={(v) => setSensorW(num(v))} />
            <Field label="SENSOR H (MM)" type="number" value={sensorH} onChange={(v) => setSensorH(num(v))} />
          </Row>
          <div className="mt-3">
            <Slider label="OVERLAP" value={overlap} onChange={setOverlap} min={15} max={50} suffix="%" hint="25–35% stitches cleanly" accent={A} />
          </div>
          <Grid cols={4}>
            <BigStat label="SHOTS / ROW" value={calc.cols} hint={`step ${fmt(calc.stepW, 1)}°`} accent={A} />
            <BigStat label="ROWS" value={calc.rows} hint={`step ${fmt(calc.stepH, 1)}°`} accent={A} />
            <BigStat label="TOTAL FRAMES" value={calc.total} accent={A} />
            <BigStat label="H-FOV" value={fmt(calc.aovW, 1)} unit="°" accent={A} />
          </Grid>
          <Note>Angle of view = 2·arctan(sensor ÷ 2focal). Rows matter for cityscapes and waterfalls — one row loses the foreground or the sky, never both.</Note>
        </Panel>
      }
      right={
        <Panel title="SHOOTING ORDER" accent={A}>
          <div className="space-y-1.5">
            {Array.from({ length: Math.min(calc.rows, 8) }, (_, r) => (
              <div key={r} className="flex items-center gap-1.5">
                <span className="w-10 shrink-0 font-mono text-[9px] text-zinc-600">Row {r + 1}</span>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {Array.from({ length: Math.min(calc.cols, 12) }, (_, c) => {
                    const idx = r % 2 === 0 ? c : calc.cols - 1 - c; // boustrophedon
                    return (
                      <span
                        key={c}
                        className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold"
                        style={{ borderColor: `${A}55`, color: A, background: `${A}0d` }}
                      >
                        {r * calc.cols + idx + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {calc.rows > 8 ? <p className="mt-1 font-mono text-[9px] text-zinc-600">…{calc.rows - 8} more rows.</p> : null}
          <div className="mt-2">
            <KV k="pattern" v="snake — left→right, drop a row, right→left" />
            <KV k="pan pitch" v={`${fmt(calc.stepW, 1)}° horizontal · ${fmt(calc.stepH, 1)}° vertical`} accent={A} />
            <KV k="ball head" v={`tilt marks every ${fmt(calc.stepH, 1)}°`} />
          </div>
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={`Panorama ${sceneW}°×${sceneH}° @ ${focal}mm, ${overlap}% overlap\n${calc.cols} shots × ${calc.rows} rows = ${calc.total} frames\nPan ${fmt(calc.stepW, 1)}° / tilt ${fmt(calc.stepH, 1)}° per step, snake order`}
          />
        </Panel>
      }
    />
  );
}

/* ----------------------- 3. Stop-Motion Frame Planner ---------------------- */

function StopMotionTool() {
  const A = accentOf(12);
  const [scenes, setScenes] = useState("Walk to door: 8: 12\nDoor opens: 3: 20\nCreature reveal: 5: 0\nEscape run: 10: 6");
  // format: NAME : SECONDS : HOLD FRAMES
  const [fps, setFps] = useState(12);
  const [perDay, setPerDay] = useState(240);
  const [hoursPerDay, setHoursPerDay] = useState(6);

  const calc = useMemo(() => {
    const rows = scenes.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      const dur = (() => {
        const m = /^(\d+):(\d+)$/.exec(p[1] ?? "0");
        return m ? Number(m[1]) * 60 + Number(m[2]) : num(p[1] ?? "0"); // seconds
      })();
      return { name: p[0] || "Shot", dur, holds: num(p[2] ?? "0") };
    });
    const withFrames = rows.map((r) => ({ ...r, frames: Math.round(r.dur * fps) + r.holds }));
    const total = withFrames.reduce((s, r) => s + r.frames, 0);
    const days = Math.ceil(total / Math.max(1, perDay));
    const runtime = total / fps;
    return { rows: withFrames, total, days, runtime, framesPerDay: perDay };
  }, [scenes, fps, perDay]);

  return (
    <Split
      left={
        <Panel title="SHOTS" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SHOTS — NAME : SECONDS : HOLD FRAMES</span>
          <textarea
            value={scenes}
            onChange={(e) => setScenes(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="FPS" value={fps} onChange={setFps} min={6} max={30} hint="12 = classic stop-motion" accent={A} />
            <Slider label="FRAMES PER DAY" value={perDay} onChange={setPerDay} min={40} max={600} step={10} accent={A} />
            <Slider label="HOURS PER DAY" value={hoursPerDay} onChange={setHoursPerDay} min={2} max={12} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="TOTAL FRAMES" value={calc.total} accent={A} />
            <BigStat label="RUNTIME" value={fmt(calc.runtime, 1)} unit="s" accent={A} />
            <BigStat label="SHOOT DAYS" value={calc.days} hint={`${fmt(perDay / Math.max(1, hoursPerDay), 1)} frames/hour`} accent={A} />
          </Grid>
          <Note>Hold frames are the frozen beats — a blink-and-stare moment costs zero animation time but adds real frames. Budget them or your schedule lies.</Note>
        </Panel>
      }
      right={
        <Panel title="FRAME BUDGET" accent={A}>
          <div className="space-y-1.5">
            {calc.rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] font-bold text-zinc-200">{r.name}</p>
                  <p className="font-mono text-[9px] text-zinc-600">{fmt(r.dur, 1)} s @ {fps} fps{r.holds > 0 ? ` + ${r.holds} holds` : ""}</p>
                </div>
                <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full" style={{ width: `${(r.frames / Math.max(...calc.rows.map((x) => x.frames))) * 100}%`, background: A }} />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-[11px] font-black" style={{ color: A }}>{r.frames}f</span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <KV k="day 1 covers" v={`frames 1–${Math.min(perDay, calc.total)}`} />
            <KV k="wrap day" v={`day ${calc.days}`} accent={A} />
            <KV k="pacing" v={`${fmt(calc.total / Math.max(1, calc.days), 0)} frames/day × ${calc.days} days`} />
          </div>
          <Out
            className="mt-3"
            label="COPY BUDGET"
            text={calc.rows.map((r) => `${r.name}: ${r.frames} frames`).join("\n") + `\nTotal ${calc.total} frames = ${fmt(calc.runtime, 1)}s @ ${fps}fps → ${calc.days} shoot days`}
          />
        </Panel>
      }
    />
  );
}

/* ---------------------- 4. Short-Film Shoot-Day Planner -------------------- */

function ShootDayTool() {
  const A = accentOf(1);
  const [scenes, setScenes] = useState("Opening kitchen: 2: 15\nBus stop: 1: 10\nPhone call: 3: 12\nChase: 2: 25\nRooftop: 1: 8");
  const [takeMin, setTakeMin] = useState(4);
  const [setupMin, setSetupMin] = useState(25);
  const [moveMin, setMoveMin] = useState(35);
  const [call, setCall] = useState("08:00");

  const plan = useMemo(() => {
    const rows = scenes.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Scene", setups: num(p[1] ?? "1"), takes: num(p[2] ?? "3") };
    });
    const m = /^(\d{1,2}):(\d{2})$/.exec(call.trim());
    let t = m ? Number(m[1]) * 60 + Number(m[2]) : 480;
    const out = rows.map((r) => {
      const shoot = r.setups * (setupMin + r.takes * takeMin);
      const from = t;
      t += shoot + moveMin;
      return { ...r, shoot, from, to: t - moveMin };
    });
    const total = out.reduce((s, r) => s + r.shoot + moveMin, 0);
    return { out, total, wrap: t - moveMin };
  }, [scenes, takeMin, setupMin, moveMin, call]);

  return (
    <Split
      left={
        <Panel title="DAY & SCENES" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SCENES — NAME : SETUPS : TAKES PER SETUP</span>
          <textarea
            value={scenes}
            onChange={(e) => setScenes(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="CREW CALL (HH:MM)" value={call} onChange={setCall} />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="MINUTES PER TAKE" value={takeMin} onChange={setTakeMin} min={2} max={15} accent={A} />
            <Slider label="SETUP PER SETUP" value={setupMin} onChange={setSetupMin} min={5} max={60} step={5} suffix=" min" accent={A} />
            <Slider label="COMPANY MOVE" value={moveMin} onChange={setMoveMin} min={0} max={90} step={5} suffix=" min" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="SCENES" value={plan.out.length} accent={A} />
            <BigStat label="SETUPS" value={plan.out.reduce((s, r) => s + r.setups, 0)} accent={A} />
            <BigStat label="WRAP" value={clockStr(plan.wrap)} hint={`${fmt(plan.total / 60, 1)} h shooting day`} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="RUNNING ORDER" accent={A}>
          <div className="space-y-1.5">
            {plan.out.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                <span className="w-11 shrink-0 font-mono text-[11px] font-black" style={{ color: A }}>{clockStr(r.from)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] font-bold text-zinc-200">{r.name}</p>
                  <p className="font-mono text-[9px] text-zinc-600">{r.setups} setup{r.setups !== 1 ? "s" : ""} × {r.takes} takes · {fmt(r.shoot, 0)} min + move</p>
                </div>
                <Tag accent={A}>{clockStr(r.to)}</Tag>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded border border-dashed border-zinc-600 px-2 py-1.5">
              <span className="w-11 shrink-0 font-mono text-[11px] font-black text-zinc-400">{clockStr(plan.wrap)}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">that&apos;s a wrap</span>
            </div>
          </div>
          <Out
            className="mt-3"
            label="COPY CALL SHEET"
            text={`Call ${call}\n` + plan.out.map((r) => `${clockStr(r.from)} — ${r.name} (${r.setups}×${r.takes}, ${fmt(r.shoot, 0)} min)`).join("\n") + `\nWrap ${clockStr(plan.wrap)}`}
          />
          <Note>Back-to-back setups assume a standing crew. If any scene needs a location change, that&apos;s the move budget — cheap moves are why you shoot in order, not script order.</Note>
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const shootMeta: ToolMeta[] = [
  {
    id: "astro-exposure",
    name: "Astro Exposure Planner",
    description: "500 rule and NPF side by side — the safe star-point exposure for your glass, sky and sensor.",
    category: "media",
    icon: Star,
    keywords: "astrophotography exposure planner 500 rule npf star trail milky way",
    badge: "new",
    component: AstroExposureTool,
  },
  {
    id: "panorama-plan",
    name: "Panorama Shot Planner",
    description: "Scene angle, focal length and overlap → shots per row, rows and the snake order to shoot.",
    category: "media",
    icon: GalleryVertical,
    keywords: "panorama planner shots rows overlap focal length stitching",
    badge: "new",
    component: PanoramaTool,
  },
  {
    id: "stopmotion-frames",
    name: "Stop-Motion Frame Planner",
    description: "Shots, fps and hold frames → a frame budget per shot and honest shoot-day maths.",
    category: "media",
    icon: Clapperboard,
    keywords: "stop motion animation frame planner fps holds shooting days",
    badge: "new",
    component: StopMotionTool,
  },
  {
    id: "shootday-plan",
    name: "Shoot-Day Planner",
    description: "Scenes, setups and takes → a running order with clock times and your wrap time.",
    category: "media",
    icon: Film,
    keywords: "indie short film shoot day planner scenes setups takes wrap",
    badge: "new",
    component: ShootDayTool,
  },
];
