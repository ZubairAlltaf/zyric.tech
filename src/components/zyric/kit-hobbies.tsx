"use client";

/* ==========================================================================
   KIT: HOBBIES & PASTIMES — 8 hands-on tools for the hours away from the desk.
   Film shooters, wedding togs, property photographers, DJs, choristers,
   Roblox devs, darts players and padel regulars. Real maths, editable
   defaults, one accent each, and no two screens alike: a cost ledger with
   a film strip, a backwards-stacked wedding run-sheet, an invoice quote,
   a BPM ramp with an energy curve, a printable concert programme, a gamer
   cash-out card, a giant darts scoreboard (with a real checkout solver)
   and a time-weighted court-fee split.
   ========================================================================== */

import { useState, useMemo } from "react";
import {
  Building2,
  Camera,
  Disc3,
  Film,
  Gamepad2,
  Music,
  Target,
  Users,
} from "lucide-react";
import {
  BigStat,
  Btn,
  Field,
  Grid,
  KV,
  Meter,
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
  money,
  pct,
} from "./kit";
import type { ToolMeta } from "./tool-types";

/* ------------------------------ shared helpers ---------------------------- */

function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

function parseHM(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return 0;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return 0;
  return h * 60 + mm;
}

function fmtHM(mins: number): string {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function fmtDur(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtMS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ========================================================================== */
/* 1. FILM COST PER SHOT                                                      */
/* ========================================================================== */

type ScanTier = "none" | "basic" | "pro" | "tiff";

const SCAN_TIERS: { v: ScanTier; label: string; cost: string }[] = [
  { v: "none", label: "none $0", cost: "0" },
  { v: "basic", label: "basic JPG $8", cost: "8" },
  { v: "pro", label: "pro JPG $15", cost: "15" },
  { v: "tiff", label: "TIFF $22", cost: "22" },
];

const EXPOSURES: { v: "24" | "36"; label: string }[] = [
  { v: "24", label: "24 exp" },
  { v: "36", label: "36 exp" },
];

export function FilmCostPerShotTool() {
  const A = accentOf(0);
  const [tier, setTier] = useState<ScanTier>("basic");
  const [film, setFilm] = useState("14");
  const [expo, setExpo] = useState<"24" | "36">("36");
  const [dev, setDev] = useState("12");
  const [scan, setScan] = useState("8");
  const [ship, setShip] = useState("7");
  const [rolls, setRolls] = useState("4");
  const [keeper, setKeeper] = useState(30);
  const [mo, setMo] = useState("3");

  const frames = Number(expo);
  const rollN = Math.max(1, num(rolls));
  const filmC = Math.max(0, num(film));
  const devC = Math.max(0, num(dev));
  const scanC = Math.max(0, num(scan));
  const shipEach = Math.max(0, num(ship)) / rollN;
  const perRoll = filmC + devC + scanC + shipEach;
  const perFrame = frames > 0 ? perRoll / frames : 0;
  const keeperFrames = Math.max(1, (frames * keeper) / 100);
  const perKeeper = perRoll / keeperFrames;
  const keepCount = Math.min(frames, Math.round(keeperFrames));
  const monthly = perRoll * Math.max(0, num(mo));
  const shares: { k: string; v: number }[] = [
    { k: "film", v: filmC },
    { k: "develop", v: devC },
    { k: "scans", v: scanC },
    { k: "shipping", v: shipEach },
  ];

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <BigStat label="Cost per frame" value={money(perFrame)} accent={A} hint={`÷ ${frames} frames on the roll`} />
        <BigStat
          label="Cost per KEEPER frame"
          value={money(perKeeper)}
          accent={A}
          hint={`only ${keepCount} of ${frames} frames make the cut`}
        />
      </Grid>

      <Split
        left={
          <Panel title="roll economics" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Film price / roll" value={film} onChange={setFilm} type="number" min={0} step={0.5} className="w-28" />
                <Field label="Develop / roll" value={dev} onChange={setDev} type="number" min={0} step={0.5} className="w-28" />
              </Row>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Exposures</span>
                <Seg value={expo} onChange={setExpo} options={EXPOSURES} accent={A} />
              </div>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Scan tier</span>
                <Seg
                  value={tier}
                  onChange={(v) => {
                    setTier(v);
                    setScan(SCAN_TIERS.find((t) => t.v === v)?.cost ?? "0");
                  }}
                  options={SCAN_TIERS}
                  accent={A}
                />
              </div>
              <Row>
                <Field label="Scan cost (override)" value={scan} onChange={setScan} type="number" min={0} step={1} className="w-32" hint="prefilled from tier, still editable" />
                <Field label="Shipping / batch" value={ship} onChange={setShip} type="number" min={0} step={0.5} className="w-28" />
              </Row>
              <Row>
                <Field label="Rolls per batch" value={rolls} onChange={setRolls} type="number" min={1} step={1} className="w-24" hint="spreads shipping" />
                <Field label="Rolls per month" value={mo} onChange={setMo} type="number" min={0} step={0.5} className="w-24" />
              </Row>
              <Slider label="Keeper rate" value={keeper} onChange={setKeeper} min={5} max={100} step={1} suffix="%" accent={A} />
            </div>
          </Panel>
        }
        right={
          <Panel title="where the money goes" accent={A}>
            <div className="space-y-2.5">
              {shares.map((s) => (
                <Meter
                  key={s.k}
                  value={perRoll > 0 ? (s.v / perRoll) * 100 : 0}
                  max={100}
                  accent={A}
                  label={s.k}
                  right={`${money(s.v)} · ${pct(perRoll > 0 ? (s.v / perRoll) * 100 : 0, 0)}`}
                />
              ))}
              <KV k="full roll cost" v={money(perRoll)} accent={A} />
              <KV k={`at ${mo} rolls/mo`} v={money(monthly)} />
              <KV k="keepers per roll" v={`${keepCount} / ${frames}`} />
            </div>
            <p className="mono-kicker mb-1.5 mt-4 text-zinc-500">the keeper strip — lit frames make the album</p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: frames }, (_, i) => (
                <div
                  key={i}
                  className="h-7 w-5 rounded-sm border"
                  style={i < keepCount ? { background: `${A}55`, borderColor: A } : { background: "#18181b", borderColor: "#3f3f46" }}
                />
              ))}
            </div>
          </Panel>
        }
      />
      <Note>
        The classic $0.50–$1.20/frame claim assumes free scans and perfect aim — the per-keeper number is the one that
        actually hurts.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 2. WEDDING PHOTO TIMELINE                                                  */
/* ========================================================================== */

const CEREMONY_LEN = 30; // minutes, stated assumption

export function WeddingPhotoTimelineTool() {
  const A = accentOf(1);
  const [ceremony, setCeremony] = useState("14:00");
  const [golden, setGolden] = useState("19:30");
  const [hours, setHours] = useState("8");
  const [travel, setTravel] = useState("20");
  const [guests, setGuests] = useState("80");
  const [blk, setBlk] = useState({ prep: "60", look: "30", formals: "45", portraits: "45", details: "30" });
  const setB = (k: keyof typeof blk, v: string) => setBlk((b) => ({ ...b, [k]: v }));

  const cer = parseHM(ceremony);
  const goldenM = parseHM(golden);
  const tv = Math.max(0, num(travel));
  const guestsN = Math.max(0, num(guests));
  const guestsExtra = guestsN > 50 ? Math.floor((guestsN - 50) / 10) : 0;
  const d = {
    prep: Math.max(0, num(blk.prep)),
    look: Math.max(0, num(blk.look)),
    formals: Math.max(0, num(blk.formals)),
    portraits: Math.max(0, num(blk.portraits)),
    details: Math.max(0, num(blk.details)),
  };

  // Pre-ceremony blocks stack backwards from the ceremony, travel between venues.
  const portraitsEnd = cer;
  const portraitsStart = portraitsEnd - d.portraits;
  const lookEnd = portraitsStart - tv;
  const lookStart = lookEnd - d.look;
  const prepEnd = lookStart - tv;
  const prepStart = prepEnd - d.prep;
  // Post-ceremony: formals at the ceremony site, then details after a venue move.
  const formalsStart = cer + CEREMONY_LEN;
  const formalsDur = d.formals + guestsExtra;
  const formalsEnd = formalsStart + formalsDur;
  const detailsStart = formalsEnd + tv;
  const postEnd = detailsStart + d.details;

  const goldenOver = Math.max(0, postEnd - goldenM);
  const coverage = goldenM - prepStart;
  const contractOver = Math.max(0, coverage - Math.max(0, num(hours)) * 60);
  const over = Math.max(goldenOver, contractOver);
  const totalShoot = d.prep + d.look + d.portraits + formalsDur + d.details + tv * 2;
  const downtime = Math.max(0, goldenM - postEnd);

  const blocks: [string, number][] = [
    ["prep", d.prep],
    ["first look", d.look],
    ["couple portraits", d.portraits],
    ["family formals", formalsDur],
    ["reception details", d.details],
  ];
  const trim = [...blocks].sort((a, b) => b[1] - a[1])[0];

  const lines: { time: string; label: string; dur: string; hot?: boolean }[] = [
    { time: fmtHM(prepStart), label: "prep / getting ready", dur: `${Math.round(d.prep)}m` },
    { time: fmtHM(prepEnd), label: "travel to first look", dur: `${Math.round(tv)}m` },
    { time: fmtHM(lookStart), label: "first look", dur: `${Math.round(d.look)}m` },
    { time: fmtHM(lookEnd), label: "travel to ceremony venue", dur: `${Math.round(tv)}m` },
    { time: fmtHM(portraitsStart), label: "couple portraits", dur: `${Math.round(d.portraits)}m` },
    { time: fmtHM(cer), label: `CEREMONY (${CEREMONY_LEN} min assumed)`, dur: `${CEREMONY_LEN}m`, hot: true },
    { time: fmtHM(formalsStart), label: `family formals · ${Math.round(guestsN)} guests`, dur: `${Math.round(formalsDur)}m` },
    { time: fmtHM(detailsStart), label: "reception details", dur: `${Math.round(d.details)}m` },
    { time: fmtHM(postEnd), label: "details wrapped — hands off until golden hour", dur: fmtDur(downtime) },
    { time: fmtHM(goldenM), label: "GOLDEN HOUR PORTRAITS", dur: "sunset", hot: true },
  ];

  const segs: { m: number; c: string; l: string }[] = [
    { m: d.prep, c: `${A}2E`, l: "prep" },
    { m: tv, c: "#27272a", l: "travel" },
    { m: d.look, c: `${A}55`, l: "first look" },
    { m: tv, c: "#27272a", l: "travel" },
    { m: d.portraits, c: `${A}80`, l: "portraits" },
    { m: CEREMONY_LEN, c: A, l: "ceremony" },
    { m: formalsDur, c: `${A}99`, l: "formals" },
    { m: tv, c: "#27272a", l: "travel" },
    { m: d.details, c: `${A}66`, l: "details" },
    { m: downtime, c: "#1c1c1f", l: "downtime" },
  ];

  const sheet = [
    "WEDDING PHOTOGRAPHY — RUN SHEET",
    `contract ${Math.max(0, num(hours))}h · ceremony ${fmtHM(cer)} · golden hour ${fmtHM(goldenM)}`,
    "--------------------------------------------",
    ...lines.map((l) => `${l.time}  ${l.label.padEnd(38, " ").slice(0, 38)} ${l.dur}`),
    "--------------------------------------------",
    `on-task shooting ${fmtDur(totalShoot)} (blocks + ${Math.round(tv * 2)}m travel)`,
    `coverage ${fmtHM(prepStart)} → ${fmtHM(goldenM)} = ${fmtDur(coverage)} vs ${fmtDur(Math.max(0, num(hours)) * 60)} contract`,
    over === 0 ? "verdict: timeline fits the contract and the light" : `verdict: over by ${Math.round(over)} min — trim ${trim[0]} (${Math.round(trim[1])}m)`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <BigStat label="On-task shooting" value={fmtDur(totalShoot)} accent={A} hint="blocks + two venue moves" />
        <BigStat label="Clock coverage" value={fmtDur(coverage)} accent={A} hint={`${fmtHM(prepStart)} → ${fmtHM(goldenM)}`} />
      </Grid>

      <div className="flex h-7 w-full overflow-hidden rounded-md border border-zinc-800">
        {segs.map((s, i) => (
          <div key={i} className="min-w-0" style={{ flexGrow: Math.max(s.m, 0.6), background: s.c }} title={`${s.l} · ${Math.round(s.m)}m`} />
        ))}
      </div>
      <p className="font-mono text-[10px] text-zinc-600">
        prep → first look → portraits → CEREMONY → formals → details → golden hour (dark spans = travel + downtime)
      </p>

      <Split
        left={
          <Panel title="the day" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Ceremony time" value={ceremony} onChange={setCeremony} type="time" className="w-28" />
                <Field label="Golden hour" value={golden} onChange={setGolden} type="time" className="w-28" />
              </Row>
              <Row>
                <Field label="Contracted hours" value={hours} onChange={setHours} type="number" min={1} max={16} step={0.5} className="w-28" />
                <Field label="Travel between locations" value={travel} onChange={setTravel} type="number" min={0} step={5} className="w-28" hint="minutes one-way" />
              </Row>
              <Field label="Guests (drives formals time)" value={guests} onChange={setGuests} type="number" min={0} step={5} className="w-28" hint="+1 min per 10 guests over 50" />
            </div>
          </Panel>
        }
        right={
          <Panel title="shot blocks (minutes)" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Prep" value={blk.prep} onChange={(v) => setB("prep", v)} type="number" min={0} step={5} className="w-20" />
                <Field label="First look" value={blk.look} onChange={(v) => setB("look", v)} type="number" min={0} step={5} className="w-20" />
                <Field label="Portraits" value={blk.portraits} onChange={(v) => setB("portraits", v)} type="number" min={0} step={5} className="w-20" />
              </Row>
              <Row>
                <Field label="Family formals" value={blk.formals} onChange={(v) => setB("formals", v)} type="number" min={0} step={5} className="w-24" />
                <Field label="Reception details" value={blk.details} onChange={(v) => setB("details", v)} type="number" min={0} step={5} className="w-24" />
              </Row>
              <KV k="formals guest bonus" v={`+${guestsExtra}m`} />
              <KV k="golden hour" v={fmtHM(goldenM)} accent={A} />
              <KV k="downtime before golden hour" v={fmtDur(downtime)} />
            </div>
          </Panel>
        }
      />

      <Panel
        title="run sheet"
        accent={A}
        right={<Tag accent={A}>{over === 0 ? "fits" : "over"}</Tag>}
      >
        {lines.map((l, i) => (
          <div key={i} className="flex items-baseline gap-3 border-b border-zinc-800/50 py-1.5 last:border-b-0">
            <span className="w-12 shrink-0 font-mono text-xs font-bold" style={l.hot ? { color: A } : undefined}>
              {l.time}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{l.label}</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-500">{l.dur}</span>
          </div>
        ))}
      </Panel>

      <Tag accent={A}>
        {over === 0 ? "timeline fits — contract and golden hour both safe" : `over by ${Math.round(over)} min — trim ${trim[0]} (${Math.round(trim[1])}m)`}
      </Tag>
      <Out text={sheet} label="copyable run-sheet" rows={12} />
      <Note>Ceremony length is assumed at {CEREMONY_LEN} minutes — nudge the formals block if your officiant likes to talk. Travel is counted twice: once before the first look, once back to the ceremony venue.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 3. PROPERTY SHOOT PRICER                                                   */
/* ========================================================================== */

const DELIVERY: { v: "72" | "48" | "24"; label: string; mult: number }[] = [
  { v: "72", label: "72h ×1.0", mult: 1 },
  { v: "48", label: "48h ×1.1", mult: 1.1 },
  { v: "24", label: "24h ×1.25", mult: 1.25 },
];

export function PropertyShootPricerTool() {
  const A = accentOf(2);
  const [rooms, setRooms] = useState("8");
  const [perRoom, setPerRoom] = useState("3");
  const [ext, setExt] = useState("4");
  const [edit, setEdit] = useState("4");
  const [travel, setTravel] = useState("30");
  const [rate, setRate] = useState("90");
  const [del, setDel] = useState<"72" | "48" | "24">("72");

  const roomsN = Math.max(0, num(rooms));
  const perRoomN = Math.max(0, num(perRoom));
  const extN = Math.max(0, num(ext));
  const editN = Math.max(0, num(edit));
  const travelN = Math.max(0, num(travel));
  const rateN = Math.max(0, num(rate));
  const mult = DELIVERY.find((x) => x.v === del)?.mult ?? 1;

  const shots = roomsN * perRoomN + extN;
  const shootHrs = roomsN * 0.25 + (travelN * 2) / 60;
  const editHrs = (shots * editN) / 60;
  const totalHrs = shootHrs + editHrs;
  const price = totalHrs * rateN * mult;
  const perPhoto = shots > 0 ? price / shots : 0;

  return (
    <div className="space-y-4">
      <BigStat label="Quote" value={money(price)} accent={A} hint={`${DELIVERY.find((x) => x.v === del)?.label} delivery · ±10% negotiating room`} />

      <Split
        left={
          <Panel title="the job" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Rooms" value={rooms} onChange={setRooms} type="number" min={0} step={1} className="w-20" />
                <Field label="Photos / room" value={perRoom} onChange={setPerRoom} type="number" min={0} step={1} className="w-20" />
                <Field label="Exterior shots" value={ext} onChange={setExt} type="number" min={0} step={1} className="w-20" />
              </Row>
              <Row>
                <Field label="Editing min / photo" value={edit} onChange={setEdit} type="number" min={0} step={0.5} className="w-24" />
                <Field label="Travel one-way" value={travel} onChange={setTravel} type="number" min={0} step={5} className="w-24" hint="minutes" />
              </Row>
              <Field label="Hourly rate" value={rate} onChange={setRate} type="number" min={0} step={5} className="w-24" />
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Delivery deadline</span>
                <Seg value={del} onChange={setDel} options={DELIVERY} accent={A} />
              </div>
            </div>
          </Panel>
        }
        right={
          <Panel
            title="quote sheet"
            accent={A}
            right={<Tag accent={A}>{DELIVERY.find((x) => x.v === del)?.label}</Tag>}
          >
            <KV k="on site" v={`${roomsN} rooms × 15 min + ${Math.round(travelN * 2)}m drive = ${fmt(shootHrs, 2)} h`} />
            <KV k="editing" v={`${shots} photos × ${fmt(editN, 1)} min = ${fmt(editHrs, 2)} h`} />
            <KV k="billable time" v={`${fmt(totalHrs, 2)} h`} />
            <KV k="rate" v={`${money(rateN)}/h`} />
            <KV k="deadline multiplier" v={`×${fmt(mult, 2)}`} />
            <KV k="total" v={money(price)} accent={A} />
            <KV k="range (±10%)" v={`${money(price * 0.9)} – ${money(price * 1.1)}`} />
            <KV k="effective per photo" v={`${money(perPhoto)} across ${shots} shots`} />
          </Panel>
        }
      />

      <p className="mono-kicker text-zinc-500">shot list — {shots} frames</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: Math.min(shots, 36) }, (_, i) => (
          <div key={i} className="h-7 w-9 rounded-sm border" style={{ borderColor: `${A}66`, background: `${A}14`, borderBottomWidth: 3, borderBottomColor: `${A}88` }} />
        ))}
        {shots > 36 ? <Tag accent={A}>+{shots - 36} more</Tag> : null}
        {shots === 0 ? <span className="font-mono text-[10px] text-zinc-600">no shots — add rooms or exteriors</span> : null}
      </div>

      <Grid cols={3}>
        <BigStat label="Total shots" value={shots} accent={A} hint={`${roomsN} rooms × ${perRoomN} + ${extN} exterior`} />
        <BigStat label="Billable hours" value={fmt(totalHrs, 2)} unit="h" accent={A} hint={`${fmt(shootHrs, 2)} shoot + ${fmt(editHrs, 2)} edit`} />
        <BigStat label="Per photo" value={money(perPhoto)} accent={A} hint="price ÷ shot count" />
      </Grid>
      <Note>Drone and twilight add-ons priced separately — agents pay for the hero shot, so charge for it.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 4. DJ SET PLANNER                                                          */
/* ========================================================================== */

const OVERLAPS: { v: "0" | "16" | "32" | "64"; label: string }[] = [
  { v: "0", label: "0s hard cut" },
  { v: "16", label: "16s blend" },
  { v: "32", label: "32s blend" },
  { v: "64", label: "64s blend" },
];

const PEAKS: { v: "last" | "mid" | "steady"; label: string }[] = [
  { v: "last", label: "last third" },
  { v: "mid", label: "middle" },
  { v: "steady", label: "steady" },
];

export function DJSetPlannerTool() {
  const A = accentOf(3);
  const [hours, setHours] = useState("2");
  const [len, setLen] = useState("3.5");
  const [ov, setOv] = useState<"0" | "16" | "32" | "64">("32");
  const [b1, setB1] = useState("126");
  const [b2, setB2] = useState("132");
  const [peak, setPeak] = useState<"last" | "mid" | "steady">("last");

  const hoursN = Math.max(0.25, num(hours));
  const setMin = hoursN * 60;
  const lenN = Math.max(0.5, num(len));
  const ovN = Number(ov);
  const eff = Math.max(0.5, lenN - ovN / 60);
  const tracks = Math.ceil(setMin / eff);
  const b1N = num(b1);
  const b2N = num(b2);
  const perHourBpm = hoursN > 0 ? (b2N - b1N) / hoursN : 0;

  const H = Math.ceil(hoursN);
  const fullHour = Math.floor(60 / eff);
  const hourRows = Array.from({ length: H }, (_, i) => {
    const h = i + 1;
    const spanEnd = Math.min(h, hoursN);
    const sB = b1N + perHourBpm * i;
    const eB = b1N + perHourBpm * spanEnd;
    const trks = h < H ? fullHour : Math.max(1, tracks - fullHour * (H - 1));
    return { h, sB, eB, trks };
  });

  const peakT = peak === "mid" ? 0.5 : peak === "last" ? 5 / 6 : 0.5;
  const S = Math.min(16, Math.max(4, Math.ceil(setMin / 15)));
  const energy = Array.from({ length: S }, (_, s) => {
    const t = (s + 0.5) / S;
    if (peak === "steady") return 0.7;
    if (t < 0.3) return 0.3 + (0.25 * t) / 0.3;
    if (t < peakT) return 0.55 + (0.45 * (t - 0.3)) / (peakT - 0.3);
    return Math.max(0.72, 1 - (0.35 * (t - peakT)) / (1 - peakT));
  });
  const maxE = Math.max(...energy);

  const plan = [
    `SET PLAN — ${fmt(hoursN, 1)}h · ${tracks} tracks needed`,
    `crate: load ${Math.ceil(tracks * 1.2)} tracks (20% spare for requests and dead floors)`,
    `effective track: ${fmt(eff, 2)} min (${fmt(lenN, 1)} min − ${ovN}s blend)`,
    `BPM ramp: ${fmt(b1N, 0)} → ${fmt(b2N, 0)} (${perHourBpm >= 0 ? "+" : ""}${fmt(perHourBpm, 1)}/hour)`,
    "------------------------------------------------",
    ...hourRows.map((r) => `hour ${r.h} · ${fmt(r.sB, 0)}→${fmt(r.eB, 0)} BPM · ~${r.trks} tracks · ${fmt(lenN, 1)}min + ${ovN}s blend`),
    "------------------------------------------------",
    `energy: warm-up 30% → build → peak @ ${pct(peakT * 100, 0)} of the set → closer 72%`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <BigStat label="Tracks needed" value={tracks} accent={A} hint={`ceil ${fmt(setMin, 0)} min ÷ ${fmt(eff, 2)} min`} />
        <BigStat label="Effective track" value={fmt(eff, 2)} unit="min" accent={A} hint={`${fmt(lenN, 1)} min minus ${ovN}s overlap`} />
        <BigStat label="BPM per hour" value={`${perHourBpm >= 0 ? "+" : ""}${fmt(perHourBpm, 1)}`} accent={A} hint={`${fmt(b1N, 0)} → ${fmt(b2N, 0)} across the set`} />
      </Grid>

      <Split
        left={
          <Panel title="set parameters" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Set length (hours)" value={hours} onChange={setHours} type="number" min={0.5} max={6} step={0.5} className="w-28" />
                <Field label="Avg track length (min)" value={len} onChange={setLen} type="number" min={0.5} step={0.5} className="w-28" />
              </Row>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Transition overlap</span>
                <Seg value={ov} onChange={setOv} options={OVERLAPS} accent={A} />
              </div>
              <Row>
                <Field label="BPM start" value={b1} onChange={setB1} type="number" min={60} max={200} step={1} className="w-24" />
                <Field label="BPM end" value={b2} onChange={setB2} type="number" min={60} max={200} step={1} className="w-24" />
              </Row>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Peak placement</span>
                <Seg value={peak} onChange={setPeak} options={PEAKS} accent={A} />
              </div>
            </div>
          </Panel>
        }
        right={
          <Panel
            title="energy curve"
            accent={A}
            right={<Tag accent={A}>{peak === "steady" ? "steady output" : `peak @ ${pct(peakT * 100, 0)}`}</Tag>}
          >
            <div className="flex h-32 items-end gap-1">
              {energy.map((e, i) => (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-t"
                  style={{
                    height: `${Math.round(e * 100)}%`,
                    background: peak !== "steady" && Math.abs((i + 0.5) / S - peakT) < 0.5 / S ? A : `${A}59`,
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] text-zinc-600">
              <span>0:00</span>
              <span>{fmtDur(setMin / 2)}</span>
              <span>{fmtDur(setMin)}</span>
            </div>
            <div className="mt-3">
              <Meter value={maxE * 100} max={100} accent={A} label="peak energy" right={pct(maxE * 100, 0)} />
            </div>
          </Panel>
        }
      />

      <Panel title="hour by hour" accent={A}>
        {hourRows.map((r) => (
          <KV key={r.h} k={`hour ${r.h}`} v={`${fmt(r.sB, 0)} → ${fmt(r.eB, 0)} BPM · ~${r.trks} tracks`} accent={r.h === H ? A : undefined} />
        ))}
      </Panel>

      <Out text={plan} label="BPM ramp plan" rows={10} />
      <Note>Crate 20% more tracks than the maths says — floors run warm, requests eat blends, and nobody ever asks for the filler.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 5. CHOIR PROGRAMME TIMING                                                  */
/* ========================================================================== */

const ROMANS = ["I", "II", "III", "IV", "V", "VI"];

type Piece = { t: string; m: string; s: string };

export function ChoirProgrammeTimingTool() {
  const A = accentOf(4);
  const [start, setStart] = useState("19:30");
  const [interval, setIntervalMin] = useState("15");
  const [speeches, setSpeeches] = useState("5");
  const [curfew, setCurfew] = useState("21:30");
  const [pieces, setPieces] = useState<Piece[]>([
    { t: "Sicut Cervus", m: "4", s: "0" },
    { t: "Ave Verum Corpus", m: "3", s: "30" },
    { t: "Linden Lea", m: "5", s: "0" },
    { t: "The Ground", m: "4", s: "30" },
    { t: "Northern Lights", m: "3", s: "0" },
    { t: "O Radiant Dawn", m: "5", s: "30" },
  ]);
  const setPiece = (i: number, patch: Partial<Piece>) =>
    setPieces((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const durs = pieces.map((p) => Math.max(0, num(p.m)) * 60 + Math.max(0, num(p.s)));
  const singing = durs.reduce((a, b) => a + b, 0);
  const speechM = Math.max(0, num(speeches));
  const intervalM = Math.max(0, num(interval));
  const total = singing / 60 + speechM + intervalM; // minutes
  const startM = parseHM(start);
  const curfewM = parseHM(curfew);
  const over = Math.max(0, total - (curfewM - startM));

  // running order: pieces 1-3 → speeches → interval → pieces 4-6
  type Entry = { kind: "piece" | "break"; n?: number; label: string; clock: number; dur: string };
  const entries: Entry[] = [];
  let cur = startM * 60; // seconds
  const push = (label: string, secs: number, kind: Entry["kind"], n?: number) => {
    entries.push({ kind, n, label, clock: cur, dur: kind === "piece" ? fmtMS(secs) : `${Math.round(secs / 60)}m` });
    cur += secs;
  };
  for (let i = 0; i < 3; i++) push(pieces[i].t.trim() || `Piece ${i + 1}`, durs[i], "piece", i);
  push("words from the podium", speechM * 60, "break");
  push("interval", intervalM * 60, "break");
  for (let i = 3; i < 6; i++) push(pieces[i].t.trim() || `Piece ${i + 1}`, durs[i], "piece", i);
  const endM = cur / 60;

  const programme = [
    "            EVENING CONCERT",
    "   ---------------------------------------",
    ...entries.map((e) => {
      const clock = `${fmtHM(e.clock)}`;
      const name = (e.kind === "break" ? `— ${e.label} —` : `${ROMANS[e.n ?? 0]}. ${e.label}`).slice(0, 30);
      return `${clock}  ${name.padEnd(32, " ")} ${e.dur}`;
    }),
    "   ---------------------------------------",
    `${fmtHM(endM)}  end of programme`,
    `curfew ${fmtHM(curfewM)} — ${over > 0 ? `OVER by ${Math.round(over)} min` : "fits"}`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 px-4 py-5" style={{ borderColor: `${A}55`, background: `${A}0A` }}>
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">evening concert</p>
        <p className="mt-1 text-center font-mono text-xs" style={{ color: A }}>
          {fmtHM(startM)} downbeat · {fmtHM(curfewM)} curfew
        </p>
        <div className="mx-auto mt-4 max-w-md">
          {entries.map((e, i) => (
            <div key={i} className="flex items-baseline gap-2 py-1">
              <span className="w-8 shrink-0 text-right font-mono text-[10px] font-bold" style={{ color: e.kind === "piece" ? A : "#71717a" }}>
                {e.kind === "piece" ? ROMANS[e.n ?? 0] : "·"}
              </span>
              <span className={`min-w-0 flex-1 truncate text-xs ${e.kind === "break" ? "italic text-zinc-500" : "text-zinc-200"}`}>
                {e.label}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-500">{fmtHM(e.clock)}</span>
              <span className="w-10 shrink-0 text-right font-mono text-[10px] text-zinc-600">{e.dur}</span>
            </div>
          ))}
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            ends {fmtHM(endM)} · {over > 0 ? `${Math.round(over)} min past curfew` : "safe against curfew"}
          </p>
        </div>
      </div>

      <Grid cols={2}>
        <BigStat label="Total runtime" value={`${Math.floor(total)}m ${Math.round((total % 1) * 60)}s`} accent={A} hint="pieces + speeches + interval" />
        <BigStat label="Singing time only" value={fmtMS(singing)} accent={A} hint="what the audience came for" />
      </Grid>

      <Split
        left={
          <Panel title="fixed elements" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Downbeat" value={start} onChange={setStart} type="time" className="w-28" />
                <Field label="Curfew" value={curfew} onChange={setCurfew} type="time" className="w-28" />
              </Row>
              <Row>
                <Field label="Speeches (min)" value={speeches} onChange={setSpeeches} type="number" min={0} step={1} className="w-24" />
                <Field label="Interval (min)" value={interval} onChange={setIntervalMin} type="number" min={0} step={1} className="w-24" />
              </Row>
              <KV k="pieces" v={6} />
              <KV k="singing vs filler" v={pct(total > 0 ? (singing / 60 / total) * 100 : 0, 0)} accent={A} />
              <Meter value={total > 0 ? (singing / 60 / total) * 100 : 0} max={100} accent={A} label="singing share of runtime" />
              <Tag accent={A}>{over > 0 ? `over curfew by ${Math.round(over)} min` : "fits before curfew"}</Tag>
            </div>
          </Panel>
        }
        right={
          <Panel title="running order" accent={A}>
            <div className="flex items-end gap-2 border-b border-zinc-800 pb-1">
              <span className="w-5 shrink-0 font-mono text-[9px] uppercase text-zinc-600">#</span>
              <span className="min-w-0 flex-1 font-mono text-[9px] uppercase text-zinc-600">piece</span>
              <span className="w-12 shrink-0 font-mono text-[9px] uppercase text-zinc-600">min</span>
              <span className="w-12 shrink-0 font-mono text-[9px] uppercase text-zinc-600">sec</span>
            </div>
            {pieces.map((p, i) => (
              <div key={i} className="flex items-end gap-2 border-b border-zinc-800/40 py-1.5">
                <span className="w-5 shrink-0 pb-2 font-mono text-[10px] font-bold" style={{ color: A }}>
                  {ROMANS[i]}
                </span>
                <div className="min-w-0 flex-1">
                  <Field label="" value={p.t} onChange={(v) => setPiece(i, { t: v })} />
                </div>
                <div className="w-12 shrink-0">
                  <Field label="" value={p.m} onChange={(v) => setPiece(i, { m: v })} type="number" min={0} max={30} step={1} />
                </div>
                <div className="w-12 shrink-0">
                  <Field label="" value={p.s} onChange={(v) => setPiece(i, { s: v })} type="number" min={0} max={59} step={5} />
                </div>
              </div>
            ))}
          </Panel>
        }
      />

      <Out text={programme} label="printable programme" rows={13} />
      <Note>Clock times are cumulative from the downbeat — print the output and tape it to the music stand. Interval placement after piece III is liturgical tradition, not law.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 6. ROBLOX DEVEX VALUE                                                      */
/* ========================================================================== */

const PENDING: { v: "30"; label: string }[] = [{ v: "30", label: "30 days standard" }];

export function RobloxDevExTool() {
  const A = accentOf(5);
  const [robux, setRobux] = useState("30000");
  const [rate, setRate] = useState("0.0035");
  const [target, setTarget] = useState("350");
  const [pending, setPending] = useState<"30">("30");

  const robuxN = Math.max(0, num(robux));
  const rateN = Math.max(0, num(rate));
  const targetN = Math.max(0, num(target));
  const usd = robuxN * rateN;
  const need = rateN > 0 ? Math.ceil(targetN / rateN) : 0;
  const progress = need > 0 ? Math.min(100, (robuxN / need) * 100) : 0;
  const minCash = 30000 * rateN;
  const eligible = robuxN >= 30000;

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-lg border-2 px-4 py-5"
        style={{ borderColor: `${A}66`, background: `linear-gradient(135deg, ${A}1A, transparent 60%)` }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">cash-out value</p>
        <p className="font-brut mt-1 truncate text-5xl leading-none tabular-nums" style={{ color: A }}>
          {money(usd)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tag accent={A}>R$ {fmt(robuxN, 0)}</Tag>
          <Tag accent={A}>{eligible ? "DevEx eligible" : "under 30k minimum"}</Tag>
          <Tag accent={A}>{money(rateN)} / R$</Tag>
        </div>
      </div>

      <Grid cols={2}>
        <BigStat label="Robux needed for target" value={fmt(need, 0)} unit="R$" accent={A} hint={`${money(targetN)} ÷ ${money(rateN)} per R$`} />
        <BigStat label="Minimum cash-out" value={money(minCash)} accent={A} hint="30,000 R$ minimum balance" />
      </Grid>

      <Panel title="progress to cash-out target" accent={A}>
        <Meter value={progress} max={100} accent={A} label={`${fmt(robuxN, 0)} of ${fmt(need, 0)} R$`} right={pct(progress, 0)} />
      </Panel>

      <Split
        left={
          <Panel title="the numbers" accent={A}>
            <div className="space-y-3">
              <Field label="Robux earned" value={robux} onChange={setRobux} type="number" min={0} step={1000} />
              <Row>
                <Field label="DevEx rate ($ per R$)" value={rate} onChange={setRate} type="number" min={0} step={0.0001} className="w-32" hint="Roblox sets this — currently 0.0035" />
                <Field label="Target USD" value={target} onChange={setTarget} type="number" min={0} step={25} className="w-28" />
              </Row>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Pending period</span>
                <Seg value={pending} onChange={setPending} options={PENDING} accent={A} />
              </div>
              <Row>
                <Btn variant="ghost" accent={A} onClick={() => setRobux("10000")}>10K</Btn>
                <Btn variant="ghost" accent={A} onClick={() => setRobux("30000")}>30K</Btn>
                <Btn variant="ghost" accent={A} onClick={() => setRobux("100000")}>100K</Btn>
              </Row>
            </div>
          </Panel>
        }
        right={
          <Panel title="eligibility card" accent={A}>
            <KV k="DevEx rate" v={`${money(rateN)} per R$`} accent={A} />
            <KV k="Minimum cash-out" v={`30,000 R$ = ${money(minCash)}`} />
            <KV k="Robux in flight" v={`${fmt(robuxN, 0)} R$`} />
            <KV k="Pending after request" v={`${pending} days`} />
            <KV k="Account requirement" v="Premium + verified details" />
            <KV k="Target gap" v={need > robuxN ? `${fmt(need - robuxN, 0)} R$ to go` : "target reached"} accent={need <= robuxN ? A : undefined} />
          </Panel>
        }
      />
      <Note>Rate checked 2026 — Roblox sets it, this tool just does the maths honestly. Earned Robux must sit 30 days before a DevEx request, and you need at least 30,000 R$ plus Premium.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 7. DARTS CHECKOUT FINDER — real exhaustive solver                          */
/* ========================================================================== */

type Dart = { v: number; label: string };
type Route = Dart[];

/* Every single-dart score with its preferred label, ranked for non-final darts:
   highest value first; on equal value prefer treble, then single, then double. */
const NON_FINAL: Dart[] = (() => {
  const arr: Dart[] = [];
  for (let n = 20; n >= 1; n--) arr.push({ v: n, label: String(n) });
  for (let n = 20; n >= 1; n--) arr.push({ v: n * 3, label: `T${n}` });
  for (let n = 20; n >= 1; n--) arr.push({ v: n * 2, label: `D${n}` });
  arr.push({ v: 25, label: "25" });
  arr.push({ v: 50, label: "BULL" });
  const rank = (d: Dart) => (d.v === 50 ? 4 : d.label.startsWith("T") ? 3 : d.label.startsWith("D") ? 1 : d.v === 25 ? 0 : 2);
  return arr.sort((a, b) => b.v - a.v || rank(b) - rank(a));
})();

/* Finishing darts. Double-out: bull (counts as a double) first, then D20 → D1.
   Straight out: any dart value, highest first. */
const FIN_DOUBLE: Dart[] = [
  { v: 50, label: "BULL" },
  ...Array.from({ length: 20 }, (_, i) => ({ v: 40 - i * 2, label: `D${20 - i}` })),
];

const FIN_STRAIGHT: Dart[] = (() => {
  const arr: Dart[] = [
    { v: 50, label: "BULL" },
    { v: 25, label: "25" },
  ];
  for (let v = 60; v >= 21; v--) {
    if (v === 50 || v === 25) continue;
    if (v % 3 === 0) arr.push({ v, label: `T${v / 3}` });
    else if (v % 2 === 0 && v / 2 <= 20) arr.push({ v, label: `D${v / 2}` });
  }
  for (let v = 20; v >= 1; v--) arr.push({ v, label: String(v) });
  return arr.sort((a, b) => b.v - a.v);
})();

/* Route ranking: fewest darts → highest first dart → bull finish → highest second dart.
   (Matches pro checkout charts; 170 → T20 T20 BULL, 100 → T20 D20.) */
function checkout(score: number, doubleOut: boolean): Route | null {
  const fin = doubleOut ? FIN_DOUBLE : FIN_STRAIGHT;
  const minRem = doubleOut ? 2 : 1;
  if (score < minRem || score > 170) return null;
  const f1 = fin.find((f) => f.v === score);
  if (f1) return [f1];
  for (const t1 of NON_FINAL) {
    const r1 = score - t1.v;
    if (r1 < minRem) continue;
    const f = fin.find((x) => x.v === r1);
    if (f) return [t1, f];
  }
  for (const t1 of NON_FINAL) {
    const r1 = score - t1.v;
    if (r1 < minRem + 1) continue;
    for (const t2 of NON_FINAL) {
      const r2 = r1 - t2.v;
      if (r2 < minRem) continue;
      const f = fin.find((x) => x.v === r2);
      if (f) return [t1, t2, f];
    }
  }
  return null;
}

function allRoutes(score: number, k: number, doubleOut: boolean): Route[] {
  const fin = doubleOut ? FIN_DOUBLE : FIN_STRAIGHT;
  const minRem = doubleOut ? 2 : 1;
  const out: Route[] = [];
  if (k === 1) {
    for (const f of fin) if (f.v === score) out.push([f]);
  } else if (k === 2) {
    for (const t1 of NON_FINAL) {
      const r = score - t1.v;
      if (r < minRem) continue;
      const f = fin.find((x) => x.v === r);
      if (f) out.push([t1, f]);
    }
  } else if (k === 3) {
    for (const t1 of NON_FINAL) {
      const r1 = score - t1.v;
      if (r1 < minRem + 1) continue;
      for (const t2 of NON_FINAL) {
        const r2 = r1 - t2.v;
        if (r2 < minRem) continue;
        const f = fin.find((x) => x.v === r2);
        if (f) out.push([t1, t2, f]);
      }
    }
  }
  const rank = (r: Route) =>
    -(r[0]?.v ?? 0) * 10000 - (r[r.length - 1].v === 50 ? 5000 : 0) - (r[1]?.v ?? 0) * 100;
  return out.sort((a, b) => rank(a) - rank(b));
}

const NO_FINISH_DOUBLE: number[] = (() => {
  const out: number[] = [];
  for (let s = 2; s <= 170; s++) if (!checkout(s, true)) out.push(s);
  return out;
})();

const NO_FINISH_STRAIGHT: number[] = (() => {
  const out: number[] = [];
  for (let s = 2; s <= 170; s++) if (!checkout(s, false)) out.push(s);
  return out;
})();

const LEGEND_FINISHES = ["170", "167", "164", "121", "100", "96", "81", "64"];

const VARIANTS: { v: "double" | "straight"; label: string }[] = [
  { v: "double", label: "double out" },
  { v: "straight", label: "straight out" },
];

export function DartsCheckoutTool() {
  const A = accentOf(6);
  const [score, setScore] = useState("170");
  const [variant, setVariant] = useState<"double" | "straight">("double");

  const sc = Math.min(170, Math.max(2, Math.round(num(score))));
  const doubleOut = variant === "double";
  const route = useMemo(() => checkout(sc, doubleOut), [sc, doubleOut]);
  const darts = route ?? [];
  const alts = useMemo(() => (route ? allRoutes(sc, route.length, doubleOut).slice(0, 8) : []), [sc, route, doubleOut]);
  const noFin = doubleOut ? NO_FINISH_DOUBLE : NO_FINISH_STRAIGHT;

  let running = sc;
  const trace: number[] = darts.map((d) => {
    running -= d.v;
    return running;
  });

  const altText = route
    ? [
        `${sc} — every ${route.length}-dart checkout (best first)`,
        ...alts.map((r, i) => `${i + 1}. ${r.map((d) => d.label).join(" · ")}${i === 0 ? "   ← primary" : ""}`),
      ].join("\n")
    : [
        `${sc} — NO checkout in 3 darts under ${doubleOut ? "double-out" : "straight-out"} rules.`,
        "",
        `Scores with no 3-dart finish (${doubleOut ? "double out" : "straight out"}): ${noFin.join(" · ")}`,
        "",
        "Bail-out tip: aim to leave 40 (D20) or 32 (D16) — both finish on one dart.",
      ].join("\n");

  return (
    <div className="space-y-4">
      <Panel
        title="checkout board"
        accent={A}
        right={<Tag accent={A}>{doubleOut ? "double out" : "straight out"}</Tag>}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mono-kicker text-zinc-500">score</p>
            <p className="font-brut text-7xl leading-none tabular-nums" style={{ color: A }}>
              {sc}
            </p>
          </div>
          <div className="min-w-0 flex-1" style={{ maxWidth: 320 }}>
            <Slider label="pick the score" value={sc} onChange={(v) => setScore(String(v))} min={2} max={170} step={1} accent={A} />
            <div className="mt-2">
              <Seg value={variant} onChange={setVariant} options={VARIANTS} accent={A} />
            </div>
          </div>
        </div>

        {route ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const d = darts[i];
              return (
                <div
                  key={i}
                  className="min-w-0 rounded-lg border-2 px-1 py-4 text-center"
                  style={{ borderColor: d ? A : "#27272a", background: d ? `${A}0F` : "transparent" }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">dart {i + 1}</p>
                  <p className="font-brut mt-1 truncate text-3xl sm:text-5xl" style={{ color: d ? A : "#3f3f46" }}>
                    {d ? d.label : "·"}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-zinc-500">
                    {d ? `${d.v} pts → ${trace[i]} left` : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border-2 border-dashed px-4 py-8 text-center" style={{ borderColor: `${A}66` }}>
            <p className="font-brut text-4xl sm:text-5xl" style={{ color: A }}>
              NO FINISH
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {sc} is a bust under {doubleOut ? "double-out" : "straight-out"} rules
            </p>
          </div>
        )}
      </Panel>

      <Row>
        <span className="mono-kicker self-center text-zinc-500">legend finishes:</span>
        {LEGEND_FINISHES.map((s) => (
          <Btn key={s} variant="ghost" accent={A} onClick={() => setScore(s)}>
            {s}
          </Btn>
        ))}
      </Row>

      <Out text={altText} label="alternative routes" rows={9} />

      <Panel title="board facts" accent={A}>
        <KV k="darts used" v={route ? route.length : "—"} accent={A} />
        <KV k="finish on" v={route ? route[route.length - 1].label : "—"} />
        <KV k="route values" v={route ? route.map((d) => d.v).join(" + ") : "—"} />
        <KV k="bust zone (no 3-dart finish)" v={noFin.join(" · ") || "none"} />
      </Panel>
      <Note>Double-out rules: the last dart must land on a double or the inner bull (50) — 169, 168, 166, 165, 163, 162 and 159 are mathematically unfinishable, so never aim to leave them. Adapt for your league.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 8. PADEL COURT SPLIT                                                       */
/* ========================================================================== */

const PLAYER_OPTS: { v: "2" | "3" | "4"; label: string }[] = [
  { v: "2", label: "2 players" },
  { v: "3", label: "3 players" },
  { v: "4", label: "4 players" },
];

const PAID_OPTS: { v: "booker" | "venue"; label: string }[] = [
  { v: "booker", label: "booker paid" },
  { v: "venue", label: "split at venue" },
];

export function PadelCostSplitTool() {
  const A = accentOf(7);
  const [fee, setFee] = useState("24");
  const [hrs, setHrs] = useState("1.5");
  const [players, setPlayers] = useState<"2" | "3" | "4">("4");
  const [ph, setPh] = useState(["1.5", "1.5", "1.5", "1.5"]);
  const [paid, setPaid] = useState<"booker" | "venue">("booker");
  const setPhI = (i: number, v: string) => setPh((p) => p.map((x, j) => (j === i ? v : x)));

  const N = Number(players);
  const th = Math.max(0.5, num(hrs));
  const feeN = Math.max(0, num(fee));
  const played = ph.slice(0, N).map((s) => Math.max(0, num(s)));
  const totPlayed = played.reduce((a, b) => a + b, 0);
  const cpph = totPlayed > 0 ? (feeN * th) / totPlayed : 0;
  const shares = played.map((h) => cpph * h);
  const equal = N > 0 ? (feeN * th) / N : 0;
  const total = feeN * th;
  const owed = shares.slice(1).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="the booking" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Court fee / hour" value={fee} onChange={setFee} type="number" min={0} step={1} className="w-24" />
                <Field label="Hours booked" value={hrs} onChange={setHrs} type="number" min={0.5} step={0.5} className="w-24" />
              </Row>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Players</span>
                <Seg value={players} onChange={setPlayers} options={PLAYER_OPTS} accent={A} />
              </div>
              <div>
                <span className="mono-kicker mb-1.5 block text-zinc-500">Who paid</span>
                <Seg value={paid} onChange={setPaid} options={PAID_OPTS} accent={A} />
              </div>
            </div>
          </Panel>
        }
        right={
          <Panel title="hours on court" accent={A}>
            <div className="space-y-3">
              {played.map((_, i) => (
                <Slider
                  key={i}
                  label={`P${i + 1} hours played`}
                  value={played[i]}
                  onChange={(v) => setPhI(i, String(v))}
                  min={0}
                  max={th}
                  step={0.25}
                  suffix="h"
                  accent={A}
                />
              ))}
              <p className="font-mono text-[10px] text-zinc-600">left early? drag that player down — the split follows time on court.</p>
            </div>
          </Panel>
        }
      />

      <Grid cols={N === 2 ? 2 : N === 3 ? 3 : 4}>
        {shares.map((s, i) => {
          const delta = s - equal;
          return (
            <div key={i} className="min-w-0 rounded-lg border px-3 py-2.5" style={{ borderColor: `${A}44`, background: `${A}0D` }}>
              <div className="flex items-center justify-between gap-1">
                <span className="mono-kicker text-zinc-500">player {i + 1}</span>
                <Tag accent={A}>{Math.abs(delta) < 0.005 ? "even" : delta > 0 ? `+${money(delta)}` : `−${money(-delta)}`}</Tag>
              </div>
              <p className="mt-1 truncate text-xl font-black tabular-nums" style={{ color: A }}>
                {money(s)}
              </p>
              <p className="font-mono text-[10px] text-zinc-600">{fmt(played[i], 2)}h on court</p>
            </div>
          );
        })}
      </Grid>

      <Panel title="the fair ledger" accent={A}>
        <KV k="total court cost" v={money(total)} accent={A} />
        <KV k="naive equal split" v={`${money(equal)} each`} />
        <KV k="cost per player-hour" v={`${money(cpph)}/h`} />
        {paid === "booker" ? (
          <KV k="settlement" v={`P1 is owed ${money(owed)} by the others`} accent={A} />
        ) : (
          <KV k="settlement" v="everyone pays their own share at the venue" />
        )}
        <div className="mt-3 space-y-2">
          {shares.map((_, i) => (
            <Meter
              key={i}
              value={played[i] * 60}
              max={th * 60}
              accent={A}
              label={`P${i + 1} share of court time`}
              right={pct(totPlayed > 0 ? (played[i] / totPlayed) * 100 : 0, 0)}
            />
          ))}
        </div>
      </Panel>
      <Note>Equal splits overcharge whoever left early — time-weighted is fair. Σ shares always lands exactly on the full court fee, so nobody subsidises the empty half hour.</Note>
    </div>
  );
}

/* ============================== REGISTRY =================================== */

export const hobbiesMeta: ToolMeta[] = [
  {
    id: "film-cost-per-shot",
    name: "Film Cost Per Shot",
    description: "True cost per frame and per keeper shot — film, developing, scans and shipping on one roll of truth.",
    category: "fun",
    icon: Film,
    keywords: "film photography cost per shot calculator developing scanning keeper",
    badge: "new",
    component: FilmCostPerShotTool,
  },
  {
    id: "wedding-photo-timeline",
    name: "Wedding Photo Timeline",
    description: "Stack prep, first look and formals against the ceremony clock — see if golden hour saves your contract.",
    category: "fun",
    icon: Camera,
    keywords: "wedding photography timeline calculator shots per hour travel buffer golden hour",
    badge: "new",
    component: WeddingPhotoTimelineTool,
  },
  {
    id: "property-photoshoot-price",
    name: "Property Shoot Pricer",
    description: "Quote a property shoot: rooms, shots, editing hours and a deadline multiplier turned into one number.",
    category: "fun",
    icon: Building2,
    keywords: "property photoshoot pricing calculator rooms editing time real estate",
    badge: "new",
    component: PropertyShootPricerTool,
  },
  {
    id: "dj-set-planner",
    name: "DJ Set Planner",
    description: "Track count, BPM ramp and energy curve for a set of any length — transition overlap included.",
    category: "fun",
    icon: Disc3,
    keywords: "dj set planner bpm tracks per hour transitions energy",
    badge: "new",
    component: DJSetPlannerTool,
  },
  {
    id: "choir-programme-timing",
    name: "Choir Programme Timing",
    description: "Six pieces, speeches and interval against the venue curfew — a printable running order with clock times.",
    category: "fun",
    icon: Music,
    keywords: "choir concert programme timing planner pieces breaks interval",
    badge: "new",
    component: ChoirProgrammeTimingTool,
  },
  {
    id: "roblox-devex",
    name: "Roblox DevEx Value",
    description: "Turn Robux into honest dollars at the real DevEx rate — and see the Robux you need for a cash-out target.",
    category: "fun",
    icon: Gamepad2,
    keywords: "roblox robux to dollars calculator devex rate cash out",
    badge: "new",
    component: RobloxDevExTool,
  },
  {
    id: "darts-checkout",
    name: "Darts Checkout Finder",
    description: "Exhaustive checkout solver for 2–170: fewest darts, bull-finish preference, bust scores and every alternative route.",
    category: "fun",
    icon: Target,
    keywords: "darts checkout calculator finish 170 double out routes",
    badge: "new",
    component: DartsCheckoutTool,
  },
  {
    id: "padel-cost-split",
    name: "Padel Court Split",
    description: "Time-weighted court fee split — the friend who left early stops overpaying the equal-split way.",
    category: "fun",
    icon: Users,
    keywords: "padel court cost splitter players hours booking fair share",
    badge: "new",
    component: PadelCostSplitTool,
  },
];
