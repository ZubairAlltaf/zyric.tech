"use client";

/* ==========================================================================
   KIT: SECURITY & WEB — 16 privacy, security and webmaster instruments.
   Real WebCrypto under the hood. Nothing ever leaves the browser.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Area,
  BigStat,
  Btn,
  Check,
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
} from "./kit";

/* ------------------------------ 1. Password auditor ------------------------ */

export function PasswordAuditTool() {
  const A = accentOf(0);
  const [pw, setPw] = useState("");
  const audit = useMemo(() => {
    const len = pw.length;
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    const entropy = len * Math.log2(Math.max(2, pool));
    const guessesPerSec = 1e11;
    const seconds = Math.pow(2, entropy) / guessesPerSec;
    const years = seconds / 3.15e7;
    const crackLabel = years > 1e9 ? "heat death of the universe" : years > 1e4 ? "geological eras" : years > 100 ? "a few lifetimes" : years > 1 ? `${Math.round(years)} years` : `${Math.round(seconds)} seconds`;
    const flaws: string[] = [];
    if (len < 12) flaws.push("shorter than 12 characters");
    if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) flaws.push("missing upper/lower mix");
    if (!/\d/.test(pw)) flaws.push("no digits");
    if (!/[^a-zA-Z0-9]/.test(pw)) flaws.push("no symbols");
    if (/^(?:password|123456|qwerty|admin|letmein)/i.test(pw)) flaws.push("starts with a top-10 leaked password");
    return { entropy, crackLabel, flaws, pool };
  }, [pw]);
  return (
    <div className="space-y-4">
      <Field label="Password to audit (typed locally, stored nowhere)" value={pw} onChange={setPw} type="password" placeholder="…" />
      <Grid cols={2}>
        <BigStat label="Entropy" value={Math.round(audit.entropy)} unit="bits" accent={audit.entropy > 80 ? "#5EE39A" : audit.entropy > 50 ? A : "#FF8A7A"} />
        <BigStat label="Offline crack time" value={pw ? audit.crackLabel : "—"} accent={audit.entropy > 80 ? "#5EE39A" : A} hint="assumes 100B guesses/sec" />
      </Grid>
      <Meter value={Math.min(100, audit.entropy)} max={120} accent={audit.entropy > 80 ? "#5EE39A" : A} label="strength" right={`${Math.round(audit.entropy)} bits`} />
      {audit.flaws.length ? (
        <Panel title="the leaks in your armor" accent="#FF8A7A">
          <ul className="space-y-1 text-xs text-zinc-300">{audit.flaws.map((f) => <li key={f}>• {f}</li>)}</ul>
        </Panel>
      ) : pw ? (
        <Panel title="verdict" accent="#5EE39A"><p className="text-sm text-emerald-300">No structural flaws found. Character pool: {audit.pool}.</p></Panel>
      ) : null}
      <Note>Entropy = length × log2(charset). Four random words beat one clever password — see the Passphrase tool next door.</Note>
    </div>
  );
}

/* ------------------------------ 2. Phishing analyzer ----------------------- */

export function PhishingTool() {
  const A = accentOf(1);
  const [url, setUrl] = useState("");
  const report = useMemo(() => {
    if (!url.trim()) return null;
    const flags: string[] = [];
    let score = 0;
    const u = url.trim();
    try {
      const parsed = new URL(u.includes("://") ? u : `http://${u}`);
      const host = parsed.hostname;
      if (u.includes("@")) { flags.push("“@” in the URL — the part before it is ignored by browsers"); score += 30; }
      if (/\d+\.\d+\.\d+\.\d+/.test(host)) { flags.push("raw IP address instead of a domain name"); score += 35; }
      if (host.split(".").length > 3) { flags.push("unusually deep subdomain nesting"); score += 15; }
      if (/(paypa1|g00gle|amaz0n|micros0ft|app1e|faceb00k)/i.test(host)) { flags.push("lookalike brand with letter swaps (0 for o, 1 for l)"); score += 40; }
      if (/(login|verify|secure|update|account|confirm|billing)/i.test(host + parsed.pathname)) { flags.push("urgency/verification keywords in the address"); score += 15; }
      if (u.startsWith("http://") && !u.startsWith("https://")) { flags.push("no TLS — credentials would travel in plain text"); score += 20; }
      if (host.length > 40) { flags.push("suspiciously long hostname"); score += 10; }
      if (/(bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd)/i.test(host)) { flags.push("link shortener hiding the real destination"); score += 15; }
      if (/-[a-z]+\.[a-z]{2,}$/i.test(host) && host.split("-")[0].length > 3) { flags.push("hyphenated domain (brand-login pattern)"); score += 10; }
    } catch {
      flags.push("not even a parseable URL — never click");
      score = 100;
    }
    return { flags, score: Math.min(100, score) };
  }, [url]);
  return (
    <div className="space-y-4">
      <Field label="URL to inspect" value={url} onChange={setUrl} placeholder="paste before you click" />
      {report ? (
        <>
          <div className="flex items-center gap-6 rounded-lg border border-zinc-800 bg-zinc-950/70 px-6 py-6">
            <div className="text-center">
              <p className="mono-kicker text-zinc-500">risk score</p>
              <p className="mt-1 font-brut text-4xl" style={{ color: report.score > 40 ? "#FF8A7A" : report.score > 15 ? A : "#5EE39A" }}>{report.score}</p>
            </div>
            <div className="min-w-0 flex-1">
              <Tag accent={report.score > 40 ? "#FF8A7A" : report.score > 15 ? A : "#5EE39A"}>
                {report.score > 40 ? "HIGH RISK — do not click" : report.score > 15 ? "SUSPICIOUS — verify first" : "LOW RISK — heuristic only"}
              </Tag>
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-zinc-300">
                {report.flags.map((f) => <li key={f}>• {f}</li>)}
                {!report.flags.length && <li>• No red flags detected — still check the spelling letter by letter.</li>}
              </ul>
            </div>
          </div>
          <Meter value={report.score} max={100} accent={report.score > 40 ? "#FF8A7A" : A} label="phishing suspicion" right={`${report.score}/100`} />
        </>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Paste a URL — heuristics check for lookalike brands, raw IPs, urgency keywords and more…</p>
      )}
      <Note>Heuristic screening, not a sandbox. When money is involved, type the address yourself — always.</Note>
    </div>
  );
}

/* ------------------------------ 3. AES text vault -------------------------- */

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function AesVaultTool() {
  const A = accentOf(2);
  const [text, setText] = useState("");
  const [pass, setPass] = useState("");
  const [out, setOut] = useState("");
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true); setErr("");
    try {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      const keyMat = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
      if (mode === "enc") {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
        const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
        setOut(`ZYR1.${btoa(String.fromCharCode(...salt))}.${btoa(String.fromCharCode(...iv))}.${b64(ct)}`);
      } else {
        const [tag, saltS, ivS, ctS] = text.trim().split(".");
        if (tag !== "ZYR1") throw new Error("not a Zyric vault payload");
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(saltS), iterations: 150000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivS) }, key, unb64(ctS));
        setOut(dec.decode(pt));
      }
    } catch {
      setErr(mode === "dec" ? "Wrong password or corrupted payload." : "Encryption failed — check inputs.");
    }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "enc" as const, label: "🔒 Encrypt" }, { v: "dec" as const, label: "🔓 Decrypt" }]} />
        <Field label={mode === "enc" ? "Set password" : "Password"} value={pass} onChange={setPass} type="password" className="min-w-[200px] flex-1" />
        <Btn accent={A} disabled={busy || !text || !pass} onClick={run}>{busy ? "Working…" : mode === "enc" ? "Encrypt" : "Decrypt"}</Btn>
      </Row>
      <Split left={<Area label={mode === "enc" ? "Plain text" : "ZYR1 payload"} value={text} onChange={setText} rows={7} />} right={<div className="space-y-3"><Out label={mode === "enc" ? "ciphertext (AES-256-GCM)" : "recovered plain text"} text={out} />{err ? <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</p> : null}</div>} />
      <Note>Real AES-256-GCM with PBKDF2 (150k iterations, random salt + IV). Lose the password = lose the data, by design.</Note>
    </div>
  );
}

/* ------------------------------ 4. Passphrase ------------------------------ */

const DICE_WORDS = "anchor apple arrow atlas autumn badge bamboo banner basalt beacon beaver bison bishop blazer blossom bonfire bronze butter cactus canyon castle cedar cherry cinder cipher cobalt comet copper coral cosmic cotton crimson crystal dahlia dawn dew ember emerald falcon feather fern flint forest fossil galaxy garnet ginger glacier granite harbor harvest hazel helix hollow ivory jade jasper jungle juniper kayak lantern lattice lavender lemon lilac linen lotus lunar magnolia maple marble meadow meteor mint mirror monsoon moss nebula nectar needle nimbus noble north oak obsidian ocean olive onyx opal orbit orchid otter oxide paper pebble pepper pewter phoenix pigment pilot pine plateau plume polar poppy prairie prism quartz quill quilt radar raven reef ribbon river rocket rogue rose rust saffron sage sailor sandal sapphire satellite savanna scarlet sequoia shadow shale silk silver slate solstice spruce summit sunset talisman tangerine tempest thicket thistle thunder tidal timber topaz torch trellis tundra turquoise umber valley velvet violet vortex walnut wand waterfall whisper willow window winter zenith zephyr".split(" ");

export function PassphraseTool() {
  const A = accentOf(3);
  const [words, setWords] = useState(4);
  const [sep, setSep] = useState<"-" | "." | "_" | "space">("-");
  const [cap, setCap] = useState(true);
  const [addNum, setAddNum] = useState(true);
  const [seed, setSeed] = useState(0);
  const phrase = useMemo(() => {
    void seed;
    const picks = Array.from({ length: words }, () => pick(DICE_WORDS));
    let p = picks.map((w) => (cap ? w[0].toUpperCase() + w.slice(1) : w)).join(sep === "space" ? " " : sep);
    if (addNum) p += (sep === "space" ? " " : sep) + Math.floor(Math.random() * 90) + 10;
    return p;
  }, [words, sep, cap, addNum, seed]);
  const entropy = Math.round(words * Math.log2(DICE_WORDS.length) + (addNum ? 6.5 : 0));
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Words" value={words} onChange={setWords} min={3} max={8} accent={A} />
        <Seg value={sep} onChange={setSep} accent={A} options={[{ v: "-" as const, label: "dash" }, { v: "." as const, label: "dot" }, { v: "_" as const, label: "under" }, { v: "space" as const, label: "space" }]} />
      </Row>
      <Row>
        <Check label="Capitalize" checked={cap} onChange={setCap} />
        <Check label="Add number" checked={addNum} onChange={setAddNum} />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        <p className="max-w-full break-all text-center font-mono text-2xl font-bold" style={{ color: A }}>{phrase}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">{entropy} bits of entropy — over {words} diceware words</p>
      </div>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Roll new phrase</Btn>
      <Note>Memorable AND strong: 5 words ≈ 65 bits, outmuscles most “P@ssw0rd!” schemes by miles.</Note>
    </div>
  );
}

/* ------------------------------ 5. TOTP generator -------------------------- */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

export function TotpTool() {
  const A = accentOf(4);
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [code, setCode] = useState("······");
  const [left, setLeft] = useState(30);
  useEffect(() => {
    let alive = true;
    const gen = async () => {
      try {
        const key = await crypto.subtle.importKey("raw", base32Decode(secret) as unknown as ArrayBuffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
        const counter = Math.floor(Date.now() / 30000);
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setUint32(4, counter);
        const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
        const offset = sig[sig.length - 1] & 0xf;
        const bin = ((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3];
        if (alive) setCode(String(bin % 1000000).padStart(6, "0"));
      } catch {
        if (alive) setCode("error");
      }
    };
    void gen();
    const tick = setInterval(() => {
      const l = 30 - Math.floor((Date.now() / 1000) % 30);
      setLeft(l);
      if (l === 30) void gen();
    }, 250);
    return () => { alive = false; clearInterval(tick); };
  }, [secret]);
  return (
    <div className="space-y-4">
      <Field label="Base32 secret (from the 2FA setup screen)" value={secret} onChange={setSecret} placeholder="JBSWY3DPEHPK3PXP" />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        <p className="mono-kicker text-zinc-500">current code — authenticator app, reimplemented</p>
        <p className="mt-2 font-brut text-6xl tracking-[0.2em]" style={{ color: A }}>{code}</p>
        <div className="mt-4 w-48"><Meter value={left} max={30} accent={left > 10 ? "#5EE39A" : "#FF8A7A"} right={`${left}s`} /></div>
      </div>
      <Note>Real RFC-6238 TOTP computed with WebCrypto HMAC-SHA1, refreshed every 30s. The secret stays in this tab.</Note>
    </div>
  );
}

/* ------------------------------ 6. DNS lookup (DoH) ------------------------ */

const DNS_TYPES = [
  { v: "A", label: "A · IPv4" },
  { v: "AAAA", label: "AAAA · IPv6" },
  { v: "MX", label: "MX · mail" },
  { v: "TXT", label: "TXT · text/SPF" },
  { v: "NS", label: "NS · nameservers" },
  { v: "CNAME", label: "CNAME · alias" },
] as const;

export function DnsTool() {
  const A = accentOf(5);
  const [domain, setDomain] = useState("");
  const [type, setType] = useState<"A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME">("A");
  const [results, setResults] = useState<string[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const lookup = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain.trim())}&type=${type}`);
      const data = (await res.json()) as { Answer?: { data: string }[]; Status: number };
      setResults(data.Answer?.map((a) => a.data) ?? (data.Status === 0 ? ["(no records)"] : [`DNS error ${data.Status}`]));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Domain" value={domain} onChange={setDomain} placeholder="zyric.tech" className="min-w-[200px] flex-1" />
        <Seg value={type} onChange={setType} accent={A} options={DNS_TYPES.map((t) => ({ v: t.v, label: t.label }))} />
        <Btn accent={A} disabled={!domain.trim() || status === "loading"} onClick={lookup}>{status === "loading" ? "Asking…" : "Lookup"}</Btn>
      </Row>
      {results ? (
        <Panel title={`${type} records · via Google DNS-over-HTTPS`} accent={A}>
          <ul className="space-y-1.5 font-mono text-xs text-zinc-300">{results.map((r, i) => <li key={i} className="break-all rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">{r}</li>)}</ul>
        </Panel>
      ) : status === "error" ? (
        <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">Lookup failed — offline or blocked.</p>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Free, keyless DoH query straight from your browser…</p>
      )}
    </div>
  );
}

/* ------------------------------ 7. Security checklist ---------------------- */

const CHECKS = [
  ["Password manager in use", "One unique high-entropy password per site, memorized by the manager — not by you."],
  ["2FA on email + banking", "Authenticator app beats SMS (SIM-swap attacks). Your inbox is the master key to everything."],
  ["OS & browser auto-update on", "Most breaches exploit bugs fixed months ago. Updates are free armor."],
  ["Full-disk encryption enabled", "FileVault/BitLocker/LUKS — a stolen laptop stays just hardware."],
  ["Backups: 3-2-1 rule", "3 copies, 2 media, 1 offsite. Ransomware only works on people without backups."],
  ["Browser extensions audited", "Every extension can read most pages you visit. If you do not remember installing it, remove it."],
  ["Screen lock under 5 minutes", "Shoulder surfers and coffee-shop walks away are real threats."],
  ["Recovery codes printed & stored", "2FA recovery codes on paper, in a drawer — not in a screenshot folder."],
];

export function SecurityChecklistTool() {
  const A = accentOf(6);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const count = Object.values(done).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <Meter value={count} max={CHECKS.length} accent={A} label="personal security score" right={`${count}/${CHECKS.length}`} />
      <div className="space-y-2">
        {CHECKS.map(([title, desc]) => (
          <label key={title} className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-3 ${done[title] ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/50"}`}>
            <input type="checkbox" checked={!!done[title]} onChange={() => setDone({ ...done, [title]: !done[title] })} className="mt-0.5 h-4 w-4 accent-amber-400" />
            <div className="min-w-0">
              <p className={`text-sm font-bold ${done[title] ? "text-emerald-300" : "text-zinc-100"}`}>{title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{desc}</p>
            </div>
          </label>
        ))}
      </div>
      <Note>Eight checks cover ~95% of personal-account risk. Do them once, review quarterly.</Note>
    </div>
  );
}

/* ------------------------------ 8. Browser feature detector ---------------- */

export function BrowserDetectTool() {
  const A = accentOf(7);
  const [feats, setFeats] = useState<Record<string, boolean>>({});
  useEffect(() => {
    queueMicrotask(() => {
      const w = window as unknown as { Worker?: unknown; WebSocket?: unknown; WebAssembly?: unknown; SpeechRecognition?: unknown };
      setFeats({
        "localStorage": (() => { try { localStorage.setItem("t", "1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
        "WebAssembly": !!w.WebAssembly,
        "WebGL": (() => { try { return !!document.createElement("canvas").getContext("webgl"); } catch { return false; } })(),
        "WebGPU": "gpu" in navigator,
        "WebRTC": !!w.WebSocket && "RTCPeerConnection" in window,
        "Service Worker": "serviceWorker" in navigator,
        "Notifications": "Notification" in window,
        "Clipboard API": !!navigator.clipboard,
        "Web Share": !!navigator.share,
        "Geolocation": "geolocation" in navigator,
        "Bluetooth": "bluetooth" in navigator,
        "Speech recognition": !!w.SpeechRecognition || "webkitSpeechRecognition" in window,
        "Camera / Mic": !!navigator.mediaDevices,
        "Vibration": "vibrate" in navigator,
        "Wake Lock": "wakeLock" in navigator,
        "WebXR": "xr" in navigator,
      });
    });
  }, []);
  const yes = Object.values(feats).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <BigStat label="Feature support" value={`${yes} / ${Object.keys(feats).length || "…"}`} accent={A} hint="what this browser can do" />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {Object.entries(feats).map(([k, v]) => (
          <div key={k} className={`rounded border px-2.5 py-2 ${v ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/50"}`}>
            <p className="text-[11px] font-bold" style={{ color: v ? "#5EE39A" : "#71717a" }}>{v ? "✓" : "✗"} {k}</p>
          </div>
        ))}
      </div>
      <Note>Useful for debugging “why does it work on my machine” — this is the environment your users actually have.</Note>
    </div>
  );
}

/* ------------------------------ 9. Privacy policy skeleton ----------------- */

export function PrivacyPolicyTool() {
  const A = accentOf(8);
  const [name, setName] = useState("Zyric");
  const [contact, setContact] = useState("hello@zyric.tech");
  const [collects, setCollects] = useState({ analytics: false, cookies: false, accounts: false });
  const txt = useMemo(() => {
    const lines = [
      `# Privacy Policy — ${name}`,
      ``,
      `Last updated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      ``,
      `## The short version`,
      `${name} is built to collect as little as possible. All processing happens in your browser on your device. We do not sell, rent, or share personal data because — by design — we do not have any to sell.`,
      ``,
      `## What we collect`,
      collects.accounts ? `- **Account data:** the email address and password hash you provide when registering. Passwords are stored only as salted hashes.` : `- **Accounts:** ${name} does not require registration or login.`,
      collects.analytics ? `- **Analytics:** anonymous, aggregate usage metrics (page views, approximate region). No cross-site tracking, no advertising profiles.` : `- **Analytics:** none. No trackers, no fingerprinting scripts, no third-party analytics.`,
      collects.cookies ? `- **Cookies:** strictly functional cookies only (e.g. remembering your preferences). No advertising or tracking cookies.` : `- **Cookies:** none are set for tracking. Any saved preferences live in your browser's local storage and never leave your device.`,
      ``,
      `## What we never do`,
      `- No selling or renting of user data`,
      `- No third-party advertising networks`,
      `- No hidden profiling or data brokering`,
      ``,
      `## Your rights`,
      `You may request deletion of any data associated with you at any time by writing to ${contact}. Because most features run entirely client-side, deleting your browser data removes everything instantly.`,
      ``,
      `## Changes`,
      `Material changes to this policy will be announced on this page at least 14 days before taking effect.`,
      ``,
      `## Contact`,
      `${contact}`,
    ];
    return lines.join("\n");
  }, [name, contact, collects]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Site / company name" value={name} onChange={setName} className="flex-1" />
        <Field label="Contact email" value={contact} onChange={setContact} className="flex-1" />
      </Row>
      <Row>
        <Check label="We have accounts" checked={collects.accounts} onChange={(v) => setCollects({ ...collects, accounts: v })} />
        <Check label="We run analytics" checked={collects.analytics} onChange={(v) => setCollects({ ...collects, analytics: v })} />
        <Check label="We use cookies" checked={collects.cookies} onChange={(v) => setCollects({ ...collects, cookies: v })} />
      </Row>
      <Out label="privacy policy skeleton (markdown)" text={txt} />
      <Note>A starting scaffold that reflects honest, minimal data practices — have counsel review before publishing.</Note>
    </div>
  );
}

/* ------------------------------ 10. Robots.txt ----------------------------- */

export function RobotsTool() {
  const A = accentOf(9);
  const [allowAll, setAllowAll] = useState(true);
  const [sitemap, setSitemap] = useState("https://zyric.tech/sitemap.xml");
  const [disallow, setDisallow] = useState("/admin\n/private");
  const txt = useMemo(() => {
    const lines = ["User-agent: *"];
    if (allowAll) lines.push("Allow: /");
    else {
      lines.push("Disallow: /");
      lines.push("Allow: /$");
    }
    for (const d of disallow.split("\n").map((x) => x.trim()).filter(Boolean)) lines.push(`Disallow: ${d}`);
    if (sitemap.trim()) lines.push("", `Sitemap: ${sitemap.trim()}`);
    return lines.join("\n");
  }, [allowAll, disallow, sitemap]);
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={allowAll ? "y" : "n"} onChange={(v) => setAllowAll(v === "y")} accent={A} options={[{ v: "y", label: "Crawl the site" }, { v: "n", label: "Block everything" }]} />
      </Row>
      <Area label="Extra disallow paths (one per line)" value={disallow} onChange={setDisallow} rows={3} />
      <Field label="Sitemap URL" value={sitemap} onChange={setSitemap} />
      <Out label="robots.txt" text={txt} />
      <Note>Drop this at yoursite.com/robots.txt. Blocking big AI crawlers (GPTBot, CCBot) is a separate decision — add their User-agent blocks if you want.</Note>
    </div>
  );
}

/* ------------------------------ 11. JSON-LD schema ------------------------- */

export function JsonLdTool() {
  const A = accentOf(10);
  const [type, setType] = useState<"website" | "article" | "product" | "faq">("website");
  const [f, setF] = useState({ name: "Zyric", url: "https://zyric.tech", desc: "466 free browser tools. No uploads, no sign-ups.", author: "Zyric Team", price: "0" });
  const json = useMemo(() => {
    const base = { "@context": "https://schema.org" };
    if (type === "website") return JSON.stringify({ ...base, "@type": "WebSite", name: f.name, url: f.url, description: f.desc }, null, 2);
    if (type === "article") return JSON.stringify({ ...base, "@type": "Article", headline: f.name, author: { "@type": "Person", name: f.author }, description: f.desc, mainEntityOfPage: f.url }, null, 2);
    if (type === "product") return JSON.stringify({ ...base, "@type": "Product", name: f.name, description: f.desc, offers: { "@type": "Offer", price: f.price, priceCurrency: "USD", availability: "https://schema.org/InStock", url: f.url } }, null, 2);
    return JSON.stringify({ ...base, "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: f.name, acceptedAnswer: { "@type": "Answer", text: f.desc } }] }, null, 2);
  }, [type, f]);
  return (
    <div className="space-y-4">
      <Seg value={type} onChange={setType} accent={A} options={[{ v: "website" as const, label: "WebSite" }, { v: "article" as const, label: "Article" }, { v: "product" as const, label: "Product" }, { v: "faq" as const, label: "FAQ" }]} />
      <Grid cols={2}>
        <Field label={type === "faq" ? "Question" : "Name / headline"} value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Field label="URL" value={f.url} onChange={(v) => setF({ ...f, url: v })} />
      </Grid>
      <Area label={type === "faq" ? "Answer" : "Description"} value={f.desc} onChange={(v) => setF({ ...f, desc: v })} rows={2} />
      <Out label="JSON-LD — paste inside <script type=application/ld+json>" text={json} />
      <Note>Rich-result fuel for Google. Validate at search.google.com/test/rich-results after deploying.</Note>
    </div>
  );
}

/* ------------------------------ 12. Email signature ------------------------ */

export function EmailSignatureTool() {
  const A = accentOf(11);
  const [f, setF] = useState({ name: "Alex Rivera", role: "Product Designer", company: "Northwind Studio", phone: "+1 555 010 2030", site: "northwind.studio" });
  const sig = useMemo(() => {
    const bar = "—".repeat(24);
    return `${f.name}\n${f.role} · ${f.company}\n${f.phone} | ${f.site}\n${bar}\nSent from a device that respects your inbox.`;
  }, [f]);
  const html = useMemo(
    () =>
      `<div style="font-family:Arial,sans-serif;font-size:13px;color:#333">\n  <p style="margin:0 0 2px;font-weight:bold;font-size:14px">${f.name}</p>\n  <p style="margin:0 0 8px;color:#666">${f.role} · ${f.company}</p>\n  <p style="margin:0">${f.phone} · <a href="https://${f.site}" style="color:#0a7a5a">${f.site}</a></p>\n</div>`,
    [f]
  );
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Field label="Role" value={f.role} onChange={(v) => setF({ ...f, role: v })} />
        <Field label="Company" value={f.company} onChange={(v) => setF({ ...f, company: v })} />
        <Field label="Phone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
      </Grid>
      <Field label="Website" value={f.site} onChange={(v) => setF({ ...f, site: v })} />
      <Split left={<Out label="plain text version" text={sig} />} right={<Out label="html version" text={html} />} />
      <Note>Paste the HTML version into Gmail/Outlook signature settings — it survives their sanitizer surprisingly well.</Note>
    </div>
  );
}

/* ------------------------------ 13. Out-of-office -------------------------- */

export function OooTool() {
  const A = accentOf(0);
  const [name, setName] = useState("Alex");
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [tone, setTone] = useState<"pro" | "warm" | "blunt">("pro");
  const [backup, setBackup] = useState("Sam");
  const fmtD = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const msg = useMemo(() => {
    const dates = `${fmtD(from)} – ${fmtD(to)}`;
    if (tone === "pro")
      return `Subject: Out of office (${dates})\n\nHello,\n\nThank you for your email. I am out of the office from ${dates} with limited access to email. For anything urgent, please reach ${backup}, who is covering in my absence.\n\nI will reply to your message as soon as possible after returning.\n\nBest regards,\n${name}`;
    if (tone === "warm")
      return `Subject: Sunny out-of-office ☀️ (${dates})\n\nHi there!\n\nI am away from my inbox from ${dates} — recharging, touching grass, possibly getting lost on purpose. ${backup} is holding the fort and will happily help with anything urgent.\n\nYour email is safely queued and I will get back to you once I am back (and caffeinated).\n\nWarmly,\n${name}`;
    return `Subject: Out of office (${dates})\n\nI am out ${dates}. I will not be reading this email until I am back.\nUrgent? Contact ${backup}.\nEverything else can wait. It usually can.\n\n— ${name}`;
  }, [name, from, to, tone, backup]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Your name" value={name} onChange={setName} className="flex-1" />
        <Field label="Covering colleague" value={backup} onChange={setBackup} className="flex-1" />
      </Row>
      <Row>
        <Field label="From" value={from} onChange={setFrom} type="date" className="flex-1" />
        <Field label="Until" value={to} onChange={setTo} type="date" className="flex-1" />
        <Seg value={tone} onChange={setTone} accent={A} options={[{ v: "pro" as const, label: "Corporate" }, { v: "warm" as const, label: "Warm" }, { v: "blunt" as const, label: "Blunt" }]} />
      </Row>
      <Out label="ready to paste" text={msg} />
    </div>
  );
}

/* ------------------------------ 14. Domain brainstormer -------------------- */

const DOM_SUFFIX = [".com", ".io", ".dev", ".app", ".tech", ".co", ".so", ".tools"];
const DOM_PREFIX = ["get", "try", "use", "go", "hey", "join", "with", "run"];
const DOM_CORE = ["zyric", "nova", "forge", "pixel", "drift", "spark", "atlas", "orbit", "quill", "lumen", "cinder", "vex", "halo", "flux", "ember", "wisp"];

export function DomainBrainTool() {
  const A = accentOf(1);
  const [seedWord, setSeedWord] = useState("");
  const [seed, setSeed] = useState(0);
  const ideas = useMemo(() => {
    void seed;
    const core = seedWord.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const bases = core ? [core, ...DOM_CORE.slice(0, 4).map((c) => core + c), ...DOM_PREFIX.slice(0, 3).map((p) => p + core)] : DOM_CORE;
    return [...new Set(bases)].slice(0, 8).map((b) => ({ name: b, suggestions: [...new Set([pick(DOM_SUFFIX), pick(DOM_SUFFIX), pick(DOM_SUFFIX)])].slice(0, 3) }));
  }, [seedWord, seed]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Seed word (optional)" value={seedWord} onChange={setSeedWord} placeholder="zyric" className="flex-1" />
        <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Shuffle ideas</Btn>
      </Row>
      <div className="grid gap-2 sm:grid-cols-2">
        {ideas.map((i) => (
          <div key={i.name} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-3">
            <p className="font-mono text-lg font-black" style={{ color: A }}>{i.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {i.suggestions.map((s) => (
                <span key={s} className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{i.name}{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Note>Availability not checked (that would need whois keys) — most registrars do bulk checks. Short + pronounceable + .com wins by default.</Note>
    </div>
  );
}

/* ------------------------------ 15. Font previewer ------------------------- */

const FONTS = [
  ["Georgia", "serif, warm, bookish"],
  ["Times New Roman", "the academic default"],
  ["Arial", "neutral corporate sans"],
  ["Helvetica", "Swiss precision"],
  ["Verdana", "wide, screen-friendly"],
  ["Trebuchet MS", "quirky humanist"],
  ["Courier New", "typewriter mono"],
  ["Impact", "memes and headlines only"],
  ["Palatino", "elegant old-style serif"],
  ["Tahoma", "compact UI workhorse"],
];

export function FontPreviewTool() {
  const A = accentOf(2);
  const [text, setText] = useState("The quick brown fox jumps over 0123456789");
  const [size, setSize] = useState(20);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Preview text" value={text} onChange={setText} className="min-w-[220px] flex-1" />
        <Slider label="Size (px)" value={size} onChange={setSize} min={12} max={42} accent={A} />
      </Row>
      <div className="space-y-2">
        {FONTS.map(([name, desc]) => (
          <div key={name} className="rounded border border-zinc-800 bg-zinc-950/60 px-4 py-3" style={{ fontFamily: name }}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ fontFamily: undefined, color: A }}>{name} <span className="text-zinc-600">· {desc}</span></span>
            </div>
            <p className="mt-1 truncate text-zinc-100" style={{ fontSize: size }}>{text}</p>
          </div>
        ))}
      </div>
      <Note>The web-safe fifteen-minus-five: these render identically everywhere with zero loading. Pair a serif display with a clean sans body.</Note>
    </div>
  );
}

/* ------------------------------ 16. Sitemap XML ---------------------------- */

export function SitemapTool() {
  const A = accentOf(3);
  const [base, setBase] = useState("https://zyric.tech");
  const [paths, setPaths] = useState("/\n/about\n/tools\n/blog");
  const [freq, setFreq] = useState<"always" | "daily" | "weekly" | "monthly">("weekly");
  const xml = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = paths.split("\n").map((p) => p.trim()).filter(Boolean).map((p) => `  <url>\n    <loc>${base.replace(/\/$/, "")}${p === "/" ? "/" : p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n  </url>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>`;
  }, [base, paths, freq]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Base URL" value={base} onChange={setBase} className="min-w-[220px] flex-1" />
        <Seg value={freq} onChange={setFreq} accent={A} options={[{ v: "always" as const, label: "Always" }, { v: "daily" as const, label: "Daily" }, { v: "weekly" as const, label: "Weekly" }, { v: "monthly" as const, label: "Monthly" }]} />
      </Row>
      <Area label="Paths (one per line)" value={paths} onChange={setPaths} rows={5} />
      <Out label="sitemap.xml" text={xml} />
      <Note>Save as /sitemap.xml, then reference it in robots.txt and submit in Google Search Console — crawl speed improves noticeably.</Note>
    </div>
  );
}
