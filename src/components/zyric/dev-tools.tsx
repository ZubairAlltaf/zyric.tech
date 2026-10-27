"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, ShieldAlert, FileJson } from "lucide-react";
import { CopyButton, inputCls, labelCls, uid } from "./hooks";

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
