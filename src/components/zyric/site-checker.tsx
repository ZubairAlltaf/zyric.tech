"use client";

import { useState } from "react";
import {
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputCls, labelCls } from "./hooks";

interface Check {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  why: string;
}

interface SiteResult {
  checks: Check[];
  score: number;
  grade: string;
  finalUrl: string;
}

const STATUS_ICON = {
  pass: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />,
  warn: <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />,
  fail: <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />,
};

const SCORE_COLOR = (score: number) =>
  score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";

export function SiteCheckerTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SiteResult | null>(null);

  const run = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/site-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as SiteResult & { error?: string };
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("Something went wrong while checking the site. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fails = result?.checks.filter((c) => c.status === "fail").length ?? 0;
  const warns = result?.checks.filter((c) => c.status === "warn").length ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="sc-url" className={labelCls}>Website address</Label>
          <Input
            id="sc-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()}
            className={inputCls}
            placeholder="example.com"
            type="text"
            inputMode="url"
          />
        </div>
        <Button type="button" onClick={() => void run()} disabled={loading || !url.trim()} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Globe className="h-4 w-4" aria-hidden />}
          {loading ? "Checking…" : "Run launch check"}
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/20 p-3.5 text-sm text-red-300">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-center">
              <p className={`text-5xl font-black ${SCORE_COLOR(result.score)}`}>{result.score}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Launch score</p>
            </div>
            <div className="h-14 w-px bg-zinc-800" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">{result.finalUrl}</p>
              <p className="mt-1 text-sm text-zinc-400">
                Grade <span className={`font-bold ${SCORE_COLOR(result.score)}`}>{result.grade}</span> · {fails} critical
                issue{fails === 1 ? "" : "s"} · {warns} warning{warns === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Fix the red items before you announce the site — amber items are worth doing soon.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void run()}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden /> Re-test
            </Button>
          </div>

          <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
            {result.checks.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border p-3.5 ${
                  c.status === "pass"
                    ? "border-emerald-900/40 bg-emerald-950/10"
                    : c.status === "warn"
                      ? "border-amber-900/40 bg-amber-950/10"
                      : "border-red-900/40 bg-red-950/10"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {STATUS_ICON[c.status]}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">{c.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{c.detail}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      <span className="font-medium text-zinc-400">Why it matters: </span>
                      {c.why}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs leading-relaxed text-zinc-500">
        This checker inspects the publicly visible HTML of one page plus robots.txt and sitemap.xml, then explains every
        finding in plain language. It complements — not replaces — full audits like PageSpeed Insights.
      </p>
    </div>
  );
}
