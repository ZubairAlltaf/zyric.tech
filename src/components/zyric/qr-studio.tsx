"use client";

/*
 * QR STUDIO — everything the freemium QR sites gate, free and offline.
 * Features: 6 content templates (URL/Text, WiFi, Email, Phone, SMS, vCard)
 * with smart per-template fields; export sizes 256–1024px; error-correction
 * L/M/Q/H; quiet-zone margin control; color presets + custom colors; center
 * logo upload (auto high error-correction); PNG + SVG download; copy image
 * to clipboard; live scan-safety hint showing payload capacity usage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Copy,
  Download,
  FileCode2,
  Globe,
  ImageUp,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  QrCode as QrIcon,
  Trash2,
  Wifi,
} from "lucide-react";
import QRCode from "qrcode";
import { inputCls, labelCls, selectTriggerCls } from "./hooks";

type TemplateId = "url" | "wifi" | "email" | "phone" | "sms" | "vcard";

const TEMPLATES: { id: TemplateId; label: string; icon: typeof Globe }[] = [
  { id: "url", label: "URL / Text", icon: Globe },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "vcard", label: "vCard", icon: Link2 },
];

const COLOR_PRESETS: { name: string; dark: string; light: string }[] = [
  { name: "Classic", dark: "#111827", light: "#ffffff" },
  { name: "Emerald", dark: "#064e3b", light: "#d1fae5" },
  { name: "Ink", dark: "#09090b", light: "#f4f4f5" },
  { name: "Sunset", dark: "#7c2d12", light: "#ffedd5" },
  { name: "Ocean", dark: "#0c4a6e", light: "#e0f2fe" },
  { name: "Grape", dark: "#4c1d95", light: "#ede9fe" },
];

const ECL_LEVELS: { id: "L" | "M" | "Q" | "H"; label: string }[] = [
  { id: "L", label: "L — 7% recovery" },
  { id: "M", label: "M — 15% recovery" },
  { id: "Q", label: "Q — 25% recovery" },
  { id: "H", label: "H — 30% recovery" },
];

const SIZES = [256, 512, 1024, 2048];

function escapeEsc(s: string): string {
  return s.replace(/([\\;,:"])/g, "\\$1");
}

export function QrTool() {
  const [tpl, setTpl] = useState<TemplateId>("url");
  const [text, setText] = useState("https://zyric.tech");
  const [ssid, setSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiEnc, setWifiEnc] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [phone, setPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [vName, setVName] = useState("");
  const [vOrg, setVOrg] = useState("");
  const [vTitle, setVTitle] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vUrl, setVUrl] = useState("");

  const [dark, setDark] = useState("#111827");
  const [light, setLight] = useState("#ffffff");
  const [ecl, setEcl] = useState<"L" | "M" | "Q" | "H">("M");
  const [margin, setMargin] = useState(2);
  const [size, setSize] = useState(512);
  const [logo, setLogo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [genError, setGenError] = useState("");

  const effectiveEcl: "L" | "M" | "Q" | "H" = logo ? "H" : ecl;

  const payload = useMemo<string>(() => {
    switch (tpl) {
      case "wifi": {
        if (!ssid.trim()) return "";
        const t = wifiEnc === "nopass" ? "nopass" : wifiEnc;
        return `WIFI:T:${t};S:${escapeEsc(ssid)};${wifiEnc !== "nopass" ? `P:${escapeEsc(wifiPass)};` : ""}${wifiHidden ? "H:true;" : ""};`;
      }
      case "email": {
        if (!email.trim()) return "";
        const q: string[] = [];
        if (subject.trim()) q.push(`subject=${encodeURIComponent(subject)}`);
        if (body.trim()) q.push(`body=${encodeURIComponent(body)}`);
        return `mailto:${email.trim()}${q.length ? `?${q.join("&")}` : ""}`;
      }
      case "phone":
        return phone.trim() ? `tel:${phone.trim().replace(/\s+/g, "")}` : "";
      case "sms": {
        if (!phone.trim()) return "";
        return smsMsg.trim() ? `SMSTO:${phone.trim().replace(/\s+/g, "")}:${smsMsg.trim()}` : `sms:${phone.trim().replace(/\s+/g, "")}`;
      }
      case "vcard": {
        if (!vName.trim() && !vPhone.trim() && !vEmail.trim()) return "";
        const lines = ["BEGIN:VCARD", "VERSION:3.0"];
        const nameParts = vName.trim().split(/\s+/);
        if (nameParts.length > 1) {
          const last = nameParts.pop();
          lines.push(`N:${last};${nameParts.join(" ")};;;`);
        }
        if (vName.trim()) lines.push(`FN:${vName.trim()}`);
        if (vOrg.trim()) lines.push(`ORG:${vOrg.trim()}`);
        if (vTitle.trim()) lines.push(`TITLE:${vTitle.trim()}`);
        if (vPhone.trim()) lines.push(`TEL;TYPE=CELL:${vPhone.trim()}`);
        if (vEmail.trim()) lines.push(`EMAIL:${vEmail.trim()}`);
        if (vUrl.trim()) lines.push(`URL:${vUrl.trim()}`);
        lines.push("END:VCARD");
        return lines.join("\n");
      }
      default:
        return text.trim();
    }
  }, [tpl, text, ssid, wifiPass, wifiEnc, wifiHidden, email, subject, body, phone, smsMsg, vName, vOrg, vTitle, vPhone, vEmail, vUrl]);

  const validation = useMemo(() => {
    if (!payload) {
      const hints: Record<TemplateId, string> = {
        url: "Enter some text or a URL to encode.",
        wifi: "Enter your WiFi network name (SSID).",
        email: "Enter the recipient email address.",
        phone: "Enter the phone number to dial.",
        sms: "Enter the phone number to message.",
        vcard: "Enter at least a name, phone or email.",
      };
      return hints[tpl];
    }
    if (payload.length > 1200) return "Content too long — keep it under ~1,200 characters for reliable scanning.";
    return "";
  }, [payload, tpl]);

  const drawQr = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !payload || payload.length > 1200) return;
    try {
      await QRCode.toCanvas(canvas, payload, {
        width: size,
        margin,
        errorCorrectionLevel: effectiveEcl,
        color: { dark, light },
      });
      if (logo) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("logo"));
            img.src = logo;
          });
          const lw = canvas.width * 0.22;
          const lh = lw;
          const x = (canvas.width - lw) / 2;
          const y = (canvas.height - lh) / 2;
          const r = lw * 0.18;
          ctx.fillStyle = light;
          ctx.beginPath();
          ctx.roundRect(x - 4, y - 4, lw + 8, lh + 8, r);
          ctx.fill();
          ctx.drawImage(img, x, y, lw, lh);
        }
      }
      setGenError("");
    } catch {
      setGenError("Could not generate a QR for this input — try less content or a lower error-correction level.");
    }
  }, [payload, size, margin, effectiveEcl, dark, light, logo]);

  useEffect(() => {
    let cancelled = false;
    if (cancelled) return;
    void drawQr();
    return () => {
      cancelled = true;
    };
  }, [drawQr]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `qr-${tpl}-${size}px.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const downloadSVG = async () => {
    if (!payload) return;
    try {
      const svg = await QRCode.toString(payload, {
        type: "svg",
        width: size,
        margin,
        errorCorrectionLevel: effectiveEcl,
        color: { dark, light },
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.download = `qr-${tpl}-${size}px.svg`;
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setGenError("Could not export SVG for this input.");
    }
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("blob");
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setGenError("Clipboard image copy isn't supported in this browser — use Download instead.");
    }
  };

  const onLogo = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(f);
  };

  const TplIcon = TEMPLATES.find((t) => t.id === tpl)?.icon ?? QrIcon;
  const capacity = Math.min(100, Math.round((payload.length / 1200) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
      {/* preview column */}
      <div className="flex flex-col items-center gap-3 lg:sticky lg:top-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <canvas
            ref={canvasRef}
            className="h-60 w-60 max-w-full"
            style={{ width: 240, height: 240 }}
            aria-label="QR code preview"
            role="img"
          />
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <TplIcon className="h-3 w-3" aria-hidden />
          {size}px · ECL {effectiveEcl} · margin {margin} · {payload.length}/1200 chars
        </p>
        <div className="grid w-full grid-cols-2 gap-2">
          <Button onClick={downloadPNG} variant="outline" size="sm" disabled={!payload} className="border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">
            <Download className="h-3.5 w-3.5" aria-hidden /> PNG
          </Button>
          <Button onClick={() => void downloadSVG()} variant="outline" size="sm" disabled={!payload} className="border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">
            <FileCode2 className="h-3.5 w-3.5" aria-hidden /> SVG
          </Button>
          <Button onClick={() => void copyImage()} variant="outline" size="sm" disabled={!payload} className="border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">
            {copied ? <Copy className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copied!" : "Copy image"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (logo ? setLogo(null) : fileRef.current?.click())}
            className={`border-zinc-700 bg-zinc-900 text-xs hover:bg-zinc-800 ${logo ? "text-emerald-400" : "text-zinc-300"} disabled:opacity-40`}
          >
            {logo ? <Trash2 className="h-3.5 w-3.5" aria-hidden /> : <ImageUp className="h-3.5 w-3.5" aria-hidden />}
            {logo ? "Remove logo" : "Add logo"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onLogo(e.target.files?.[0])}
            aria-label="Upload center logo"
          />
        </div>
        {logo && (
          <p className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
            Logo mode switched error-correction to H. Always test-scan before printing.
          </p>
        )}
      </div>

      {/* controls column */}
      <div className="space-y-4">
        {/* template picker */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="QR content type">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTpl(t.id)}
              aria-pressed={tpl === t.id}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                tpl === t.id
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              <t.icon className="h-3 w-3" aria-hidden /> {t.label}
            </button>
          ))}
        </div>

        {/* per-template fields */}
        {tpl === "url" && (
          <div className="space-y-1.5">
            <Label htmlFor="qr-text" className={labelCls}>Text or URL</Label>
            <Textarea id="qr-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="https://example.com" className={`min-h-20 resize-y text-sm ${inputCls}`} />
          </div>
        )}

        {tpl === "wifi" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="qr-ssid" className={labelCls}>Network name (SSID)</Label>
              <Input id="qr-ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} className={inputCls} placeholder="HomeWiFi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-wpass" className={labelCls}>Password</Label>
              <Input id="qr-wpass" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} className={inputCls} placeholder="••••••••" disabled={wifiEnc === "nopass"} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Security</Label>
              <Select value={wifiEnc} onValueChange={setWifiEnc}>
                <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="WiFi security type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                  <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                  <SelectItem value="WEP">WEP (legacy)</SelectItem>
                  <SelectItem value="nopass">Open — no password</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-2 self-end rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 text-xs text-zinc-300">
              <span>Hidden network</span>
              <input type="checkbox" checked={wifiHidden} onChange={(e) => setWifiHidden(e.target.checked)} className="h-4 w-4 accent-emerald-500" aria-label="Hidden network" />
            </label>
            <p className="text-xs text-zinc-500 sm:col-span-2">Guests scan and join instantly — no more reading passwords aloud.</p>
          </div>
        )}

        {tpl === "email" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="qr-email" className={labelCls}>To</Label>
              <Input id="qr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="hello@zyric.tech" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-subject" className={labelCls}>Subject (pre-filled)</Label>
              <Input id="qr-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="Quote request" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-body" className={labelCls}>Message (pre-filled)</Label>
              <Textarea id="qr-body" value={body} onChange={(e) => setBody(e.target.value)} className={`min-h-16 resize-y text-sm ${inputCls}`} placeholder="Hi there…" />
            </div>
          </div>
        )}

        {tpl === "phone" && (
          <div className="space-y-1.5">
            <Label htmlFor="qr-phone" className={labelCls}>Phone number</Label>
            <Input id="qr-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+1 555 123 4567" />
            <p className="text-xs text-zinc-500">Scanning opens the dialer with the number ready.</p>
          </div>
        )}

        {tpl === "sms" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="qr-smsphone" className={labelCls}>Phone number</Label>
              <Input id="qr-smsphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+1 555 123 4567" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-smsmsg" className={labelCls}>Pre-filled message</Label>
              <Textarea id="qr-smsmsg" value={smsMsg} onChange={(e) => setSmsMsg(e.target.value)} className={`min-h-16 resize-y text-sm ${inputCls}`} placeholder="JOIN to subscribe…" />
            </div>
          </div>
        )}

        {tpl === "vcard" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="qr-vname" className={labelCls}>Full name</Label>
              <Input id="qr-vname" value={vName} onChange={(e) => setVName(e.target.value)} className={inputCls} placeholder="Ada Lovelace" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-vorg" className={labelCls}>Company</Label>
              <Input id="qr-vorg" value={vOrg} onChange={(e) => setVOrg(e.target.value)} className={inputCls} placeholder="Zyric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-vtitle" className={labelCls}>Job title</Label>
              <Input id="qr-vtitle" value={vTitle} onChange={(e) => setVTitle(e.target.value)} className={inputCls} placeholder="Founder" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-vphone" className={labelCls}>Phone</Label>
              <Input id="qr-vphone" type="tel" value={vPhone} onChange={(e) => setVPhone(e.target.value)} className={inputCls} placeholder="+1 555 123 4567" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-vemail" className={labelCls}>Email</Label>
              <Input id="qr-vemail" type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} className={inputCls} placeholder="ada@zyric.tech" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-vurl" className={labelCls}>Website</Label>
              <Input id="qr-vurl" value={vUrl} onChange={(e) => setVUrl(e.target.value)} className={inputCls} placeholder="https://zyric.tech" />
            </div>
            <p className="text-xs text-zinc-500 sm:col-span-2">Scanning saves a contact card straight to the phone — the modern business card.</p>
          </div>
        )}

        {/* style controls */}
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className={labelCls}>Style</p>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setDark(p.dark);
                  setLight(p.light);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                  dark === p.dark && light === p.light ? "border-emerald-500/60 text-emerald-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
                aria-label={`Apply ${p.name} color preset`}
              >
                <span className="h-3.5 w-3.5 rounded-sm border border-zinc-600" style={{ background: p.light }} aria-hidden>
                  <span className="block h-full w-1/2 rounded-l-sm" style={{ background: p.dark }} aria-hidden />
                </span>
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="qr-dark2" className={labelCls}>Dots</Label>
              <input id="qr-dark2" type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1" aria-label="QR dots color" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-light2" className={labelCls}>Background</Label>
              <input id="qr-light2" type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1" aria-label="QR background color" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Export size</Label>
              <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="Export size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s} px</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Error correction</Label>
              <Select value={ecl} onValueChange={(v) => setEcl(v as "L" | "M" | "Q" | "H")} disabled={Boolean(logo)}>
                <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="Error correction level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                  {ECL_LEVELS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="qr-margin" className={labelCls}>Quiet zone (margin): {margin}</Label>
            </div>
            <input
              id="qr-margin"
              type="range"
              min={0}
              max={6}
              step={1}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="h-1.5 w-full accent-emerald-500"
              aria-label="Quiet zone margin"
            />
          </div>
        </div>

        {validation || genError ? (
          <p className="flex items-center gap-2 text-sm text-rose-300">
            <QrIcon className="h-4 w-4 shrink-0" aria-hidden /> {validation || genError}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            Generated entirely in your browser — nothing is uploaded. Higher error-correction survives more damage and works with logos.
          </p>
        )}
      </div>
    </div>
  );
}
