"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PenTool, Undo2, Eraser, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { labelCls } from "./hooks";

/* ------------------------------ Signature Maker ---------------------------- */

interface Stroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

const W = 1200;
const H = 440;

export function SignatureMakerTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const [color, setColor] = useState("#111827");
  const [size, setSize] = useState(4);
  const [whiteBg, setWhiteBg] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [empty, setEmpty] = useState(true);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes.current) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size * 2;
      ctx.beginPath();
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      if (s.points.length === 1) {
        ctx.arc(s.points[0].x, s.points[0].y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      }
      ctx.stroke();
    }
    setCanUndo(strokes.current.length > 0);
    setEmpty(strokes.current.length === 0);
  }, []);

  const posOf = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    const p = posOf(e);
    strokes.current.push({ color, size, points: [p] });
    redraw();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = posOf(e);
    strokes.current[strokes.current.length - 1]?.points.push(p);
    redraw();
  };

  const onUp = () => {
    drawing.current = false;
  };

  const undo = () => {
    strokes.current.pop();
    redraw();
  };

  const clear = () => {
    strokes.current = [];
    redraw();
  };

  const download = () => {
    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    if (whiteBg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.drawImage(canvasRef.current!, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "signature.png";
    a.click();
  };

  useEffect(() => {
    redraw();
  }, [redraw]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          className="h-44 w-full cursor-crosshair touch-none rounded-xl border border-zinc-700/70 bg-white sm:h-56"
          aria-label="Signature drawing area"
        />
        <p className="mt-2 text-center text-xs text-zinc-600">
          {empty ? "Draw with your mouse, finger or stylus — it never leaves your device." : "Looking good. Add dots, cross out, undo — then download."}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className={labelCls}>Ink</Label>
          <div className="flex gap-1.5">
            {[
              { c: "#111827", name: "Black" },
              { c: "#1e3a8a", name: "Blue" },
              { c: "#0f766e", name: "Teal" },
              { c: "#b91c1c", name: "Red" },
            ].map((o) => (
              <button
                key={o.c}
                type="button"
                onClick={() => setColor(o.c)}
                aria-label={`Use ${o.name} ink`}
                aria-pressed={color === o.c}
                className={`h-8 w-8 rounded-full border-2 transition-transform ${color === o.c ? "scale-110 border-emerald-400" : "border-zinc-700"}`}
                style={{ backgroundColor: o.c }}
              />
            ))}
          </div>
        </div>
        <div className="min-w-36 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label className={labelCls}>Stroke</Label>
            <span className="font-mono text-xs text-emerald-300">{size}px</span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
            aria-label="Stroke width"
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="sig-white" type="checkbox" checked={whiteBg} onChange={(e) => setWhiteBg(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
          <Label htmlFor="sig-white" className="text-sm text-zinc-300">White background</Label>
        </div>
        <div className="ml-auto flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={undo} disabled={!canUndo} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-40">
            <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={clear} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-500/50 hover:text-red-300">
            <Eraser className="h-3.5 w-3.5" aria-hidden /> Clear
          </Button>
          <Button type="button" size="sm" onClick={download} disabled={empty} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
            <Download className="h-3.5 w-3.5" aria-hidden /> PNG
          </Button>
        </div>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
        <PenTool className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
        <p className="text-xs leading-relaxed text-zinc-500">
          Downloads as a crisp 1200×440 PNG with a transparent background by default — perfect for dropping into
          PDFs, emails and forms. Nothing is uploaded anywhere.
        </p>
      </div>
    </div>
  );
}
