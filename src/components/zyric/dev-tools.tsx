"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Download,
  FileJson,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import { CopyButton, inputCls, labelCls, uid } from "./hooks";

/* ----------------------------- Password Generator -------------------------- */

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

function makePassword(cs: string, len: number) {
  if (!cs) return "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += cs[arr[i] % cs.length];
  return out;
}

export function PasswordTool() {
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState(() =>
    makePassword(SETS.lower + SETS.upper + SETS.digits + SETS.symbols, 16)
  );

  const charset = useMemo(
    () =>
      (useLower ? SETS.lower : "") +
      (useUpper ? SETS.upper : "") +
      (useDigits ? SETS.digits : "") +
      (useSymbols ? SETS.symbols : ""),
    [useLower, useUpper, useDigits, useSymbols]
  );

  const generate = () => {
    setPassword(makePassword(charset, length));
  };
  const entropy = charset ? length * Math.log2(charset.length) : 0;
  const strength =
    entropy >= 80
      ? { label: "Very strong", color: "text-emerald-400", bar: "bg-emerald-500", icon: ShieldCheck, pct: 100 }
      : entropy >= 60
      ? { label: "Strong", color: "text-emerald-400", bar: "bg-emerald-500", pct: 78 }
      : entropy >= 40
      ? { label: "Moderate", color: "text-amber-400", bar: "bg-amber-500", pct: 52 }
      : entropy >= 28
      ? { label: "Weak", color: "text-orange-400", bar: "bg-orange-500", pct: 30 }
      : { label: "Very weak", color: "text-rose-400", bar: "bg-rose-500", pct: 14 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-12 flex-1 items-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70 px-4">
          <span className="truncate font-mono text-lg text-emerald-300">
            {password || "Select at least one character set"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generate}
            disabled={!charset}
            className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> Generate
          </Button>
          <CopyButton text={password} label="Copy" className="h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <Label htmlFor="pw-len" className={labelCls}>Length: {length}</Label>
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${strength.color}`}>
            <strength.icon className="h-4 w-4" aria-hidden /> {strength.label}
          </span>
        </div>
        <Slider
          id="pw-len"
          value={[length]}
          min={4}
          max={64}
          step={1}
          onValueChange={([v]) => setLength(v)}
          onValueCommit={generate}
          aria-label="Password length"
          className="[&_[role=slider]]:border-emerald-400 [&_[role=slider]]:bg-emerald-500 [&_.bg-primary]:bg-emerald-600"
        />
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${strength.bar}`}
            style={{ width: `${strength.pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Lowercase (a–z)", useLower, setUseLower],
            ["Uppercase (A–Z)", useUpper, setUseUpper],
            ["Numbers (0–9)", useDigits, setUseDigits],
            ["Symbols (!@#…)", useSymbols, setUseSymbols],
          ] as const
        ).map(([label, val, set]) => (
          <label
            key={label}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 has-checked:border-emerald-600/60 has-checked:bg-emerald-950/20"
          >
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => {
                set(e.target.checked);
              }}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
            />
            {label}
          </label>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Shield className="h-3.5 w-3.5" aria-hidden />
        Generated locally with your browser&apos;s crypto RNG — never sent anywhere.
        Entropy ≈ {Math.round(entropy)} bits.
      </p>
    </div>
  );
}

/* ------------------------------- UUID Generator ---------------------------- */

export function UuidTool() {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>(() =>
    Array.from({ length: 5 }, () => uid())
  );

  const generate = () => {
    setIds(Array.from({ length: count }, () => uid()));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="uuid-count" className={labelCls}>How many?</Label>
          <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
            <SelectTrigger id="uuid-count" className={`w-28 ${inputCls}`} aria-label="UUID count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {[1, 3, 5, 10, 20].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={generate}
          className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Generate
        </Button>
        <CopyButton text={ids.join("\n")} label="Copy all" />
      </div>
      <div className="space-y-2">
        {ids.map((id, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2.5"
          >
            <span className="truncate font-mono text-sm text-emerald-300">{id}</span>
            <CopyButton text={id} label="" className="h-7 w-7 border-0 bg-transparent px-0 hover:bg-zinc-800" />
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Version 4 (random) UUIDs, generated with your browser&apos;s crypto API.
      </p>
    </div>
  );
}

/* --------------------------- Base64 / URL Encoder -------------------------- */

type EncTab = "b64-enc" | "b64-dec" | "url-enc" | "url-dec";

export function EncoderTool() {
  const [tab, setTab] = useState<EncTab>("b64-enc");
  const [input, setInput] = useState("");

  // output & error are pure functions of (input, tab) — derived during render
  const { output, error } = useMemo<{ output: string; error: string }>(() => {
    if (!input) return { output: "", error: "" };
    try {
      if (tab === "b64-enc") {
        const bytes = new TextEncoder().encode(input);
        let bin = "";
        bytes.forEach((b) => (bin += String.fromCharCode(b)));
        return { output: btoa(bin), error: "" };
      }
      if (tab === "b64-dec") {
        const bin = atob(input.trim());
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        return { output: new TextDecoder().decode(bytes), error: "" };
      }
      if (tab === "url-enc") {
        return { output: encodeURIComponent(input), error: "" };
      }
      return { output: decodeURIComponent(input), error: "" };
    } catch {
      return {
        output: "",
        error: tab.startsWith("b64")
          ? "Not valid Base64 — check the input."
          : "Not valid URL-encoded text — check the input.",
      };
    }
  }, [input, tab]);

  const TABS: { id: EncTab; label: string }[] = [
    { id: "b64-enc", label: "Base64 → Encode" },
    { id: "b64-dec", label: "Base64 → Decode" },
    { id: "url-enc", label: "URL → Encode" },
    { id: "url-dec", label: "URL → Decode" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Encoding mode">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === t.id
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enc-in" className={labelCls}>Input</Label>
        <Textarea
          id="enc-in"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text…"
          className={`min-h-28 resize-y font-mono text-sm ${inputCls}`}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Output</Label>
          <CopyButton text={output} label="Copy" />
        </div>
        {error ? (
          <p className="flex items-center gap-2 rounded-xl border border-rose-800/50 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden /> {error}
          </p>
        ) : (
          <div className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 font-mono text-sm break-all whitespace-pre-wrap text-emerald-300">
            {output || <span className="text-zinc-600">Result appears here…</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- JSON Formatter ---------------------------- */

export function JsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (minify: boolean) => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setError("");
      setOutput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="json-in" className={labelCls}>JSON input</Label>
          <Textarea
            id="json-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"paste":"your json here"}'
            className={`h-64 resize-y font-mono text-xs ${inputCls}`}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className={labelCls}>Output</Label>
            <CopyButton text={output} label="Copy" />
          </div>
          {error ? (
            <div className="flex h-64 items-start gap-2 overflow-auto rounded-xl border border-rose-800/50 bg-rose-950/20 p-3 text-sm text-rose-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold">Invalid JSON:</span> {error}
              </span>
            </div>
          ) : (
            <Textarea
              readOnly
              value={output}
              aria-label="Formatted JSON output"
              className="h-64 resize-y border-zinc-800 bg-zinc-900/50 font-mono text-xs text-emerald-300"
            />
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => run(false)}
          className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
        >
          <FileJson className="h-4 w-4" aria-hidden /> Format / beautify
        </Button>
        <Button
          variant="outline"
          onClick={() => run(true)}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          Minify
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setInput("");
            setOutput("");
            setError("");
          }}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- QR Generator ------------------------------ */

export function QrTool() {
  const [text, setText] = useState("https://zyric.tech");
  const [dark, setDark] = useState("#09090b");
  const [light, setLight] = useState("#a7f3d0");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [genError, setGenError] = useState("");
  const [ready, setReady] = useState(false);

  // synchronous input validation, derived during render
  const validation = useMemo(() => {
    const value = text.trim();
    if (!value) return "Enter some text or a URL to encode.";
    if (value.length > 800)
      return "Keep it under ~800 characters for reliable scanning.";
    return "";
  }, [text]);

  useEffect(() => {
    const value = text.trim();
    if (!value || value.length > 800) return;
    let cancelled = false;
    QRCode.toCanvas(canvasRef.current, value, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark, light },
    })
      .then(() => {
        if (!cancelled) {
          setGenError("");
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
          setGenError("Could not generate a QR for this input.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, dark, light]);

  const error = validation || genError;

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "zyric-qr.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
      <div className="mx-auto flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <canvas ref={canvasRef} className="h-[260px] w-[260px]" aria-label="QR code preview" role="img" />
        </div>
        <Button
          onClick={download}
          disabled={!ready}
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> Download PNG
        </Button>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="qr-text" className={labelCls}>Text or URL</Label>
          <Textarea
            id="qr-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com"
            className={`min-h-24 resize-y text-sm ${inputCls}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="qr-dark" className={labelCls}>Dots color</Label>
            <div className="flex items-center gap-2">
              <input
                id="qr-dark"
                type="color"
                value={dark}
                onChange={(e) => setDark(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
                aria-label="QR dots color"
              />
              <Input value={dark} onChange={(e) => setDark(e.target.value)} className={`${inputCls} font-mono text-xs`} aria-label="Dots hex value" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-light" className={labelCls}>Background</Label>
            <div className="flex items-center gap-2">
              <input
                id="qr-light"
                type="color"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
                aria-label="QR background color"
              />
              <Input value={light} onChange={(e) => setLight(e.target.value)} className={`${inputCls} font-mono text-xs`} aria-label="Background hex value" />
            </div>
          </div>
        </div>
        {error ? (
          <p className="flex items-center gap-2 text-sm text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden /> {error}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Generated entirely in your browser — scan it with any camera app.
          </p>
        )}
      </div>
    </div>
  );
}
