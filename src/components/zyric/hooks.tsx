"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

const PREFIX = "zyric:";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // load asynchronously so React doesn't cascade renders inside the effect
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem(PREFIX + key);
        if (raw !== null) setValue(JSON.parse(raw) as T);
      } catch {
        /* corrupted data — keep default */
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage full or blocked */
    }
  }, [key, value, loaded]);

  return [value, setValue] as const;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateStrOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return todayStr(d);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onClick = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      className={`border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white ${className}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? "Copied!" : label}
    </Button>
  );
}

export const inputCls =
  "border-zinc-700 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/25";

export const selectTriggerCls =
  "border-zinc-700 bg-zinc-900/70 text-zinc-100 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/25";

export const labelCls = "text-xs font-medium uppercase tracking-wide text-zinc-400";

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-zinc-50">{value}</p>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}
