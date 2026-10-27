"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Store,
  BookOpen,
  Users,
  PlayCircle,
  Trophy,
  GraduationCap,
  Megaphone,
  HeartHandshake,
  Star,
  Download,
  Globe,
  Smartphone,
  ExternalLink,
  Check,
  Lock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Tool } from "@/data/tools";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  aybay: Wallet,
  hishab: Store,
  "quran-words": BookOpen,
  community: Users,
  videos: PlayCircle,
  leaderboard: Trophy,
  academy: GraduationCap,
  "comarix-ad": Megaphone,
  tamkin: HeartHandshake,
};

const ACCENTS: Record<
  Tool["accent"],
  { icon: string; ring: string; chip: string; glow: string; text: string }
> = {
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    ring: "hover:border-emerald-500/40",
    chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    glow: "from-emerald-500/12",
    text: "text-emerald-400",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    ring: "hover:border-amber-500/40",
    chip: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    glow: "from-amber-500/12",
    text: "text-amber-400",
  },
  teal: {
    icon: "bg-teal-500/15 text-teal-400 border-teal-500/20",
    ring: "hover:border-teal-500/40",
    chip: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    glow: "from-teal-500/12",
    text: "text-teal-400",
  },
  cyan: {
    icon: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    ring: "hover:border-cyan-500/40",
    chip: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    glow: "from-cyan-500/12",
    text: "text-cyan-400",
  },
  violet: {
    icon: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    ring: "hover:border-violet-500/40",
    chip: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    glow: "from-violet-500/12",
    text: "text-violet-400",
  },
  rose: {
    icon: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    ring: "hover:border-rose-500/40",
    chip: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    glow: "from-rose-500/12",
    text: "text-rose-400",
  },
};

function FreeBadge({ tool }: { tool: Tool }) {
  if (tool.freeType === "completely-free") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20">
        100% Free
      </Badge>
    );
  }
  if (tool.freeType === "freemium") {
    return (
      <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20">
        Freemium
      </Badge>
    );
  }
  if (tool.freeType === "paid") {
    return (
      <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20">
        Paid
      </Badge>
    );
  }
  return (
    <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20">
      Donation-based
    </Badge>
  );
}

function PlatformIcons({ tool }: { tool: Tool }) {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400" aria-label="Available platforms">
      {tool.platforms.includes("web") && (
        <span className="inline-flex items-center gap-1 text-xs">
          <Globe className="h-3.5 w-3.5" aria-hidden /> Web
        </span>
      )}
      {tool.platforms.includes("android") && (
        <span className="inline-flex items-center gap-1 text-xs">
          <Smartphone className="h-3.5 w-3.5" aria-hidden /> Android
        </span>
      )}
    </div>
  );
}

export function ToolIcon({
  tool,
  className = "h-6 w-6",
}: {
  tool: Tool;
  className?: string;
}) {
  const Icon = ICONS[tool.id] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}

export function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const [open, setOpen] = useState(false);
  const a = ACCENTS[tool.accent];
  const freeFeatures = tool.features.filter((f) => f.plan === "free");
  const premiumFeatures = tool.features.filter((f) => f.plan === "premium");
  const primaryLink = tool.links[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
      className="h-full"
    >
      <Card
        className={`group relative flex h-full flex-col overflow-hidden border-zinc-800 bg-zinc-900/50 backdrop-blur transition-colors ${a.ring}`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${a.glow} to-transparent opacity-60`}
        />
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${a.icon}`}
            >
              <ToolIcon tool={tool} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <FreeBadge tool={tool} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-lg font-semibold leading-snug text-zinc-50">
              {tool.name}
            </h3>
            <p className={`font-bengali text-sm ${a.text}`}>{tool.nameBn}</p>
          </div>
          <p className="pt-1 text-sm text-zinc-400">{tool.tagline}</p>
        </CardHeader>
        <CardContent className="relative flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
            <PlatformIcons tool={tool} />
            {tool.rating && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                <span className="font-medium text-zinc-200">{tool.rating.value}</span> (
                {tool.rating.count} reviews)
              </span>
            )}
            {tool.downloads && (
              <span className="inline-flex items-center gap-1">
                <Download className="h-3.5 w-3.5" aria-hidden /> {tool.downloads} downloads
              </span>
            )}
            {tool.students && !tool.rating && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden /> {tool.students}
              </span>
            )}
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">
            {tool.description}
          </p>

          <div className="mt-auto flex flex-wrap gap-1.5">
            {tool.categories.map((c) => (
              <span
                key={c}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${a.chip}`}
              >
                {c}
              </span>
            ))}
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              {freeFeatures.length > 0
                ? `${freeFeatures.length} free features`
                : `${tool.features.length} highlights`}
            </span>
          </div>
        </CardContent>
        <CardFooter className="relative flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
              >
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950/95 text-zinc-100 sm:max-w-2xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a.icon}`}
                  >
                    <ToolIcon tool={tool} />
                  </div>
                  <div>
                    <DialogTitle className="text-left text-xl">{tool.name}</DialogTitle>
                    <p className={`font-bengali text-left text-sm ${a.text}`}>
                      {tool.nameBn}
                    </p>
                  </div>
                </div>
                <DialogDescription className="pt-2 text-left text-sm text-zinc-400">
                  {tool.tagline}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
                <FreeBadge tool={tool} />
                <PlatformIcons tool={tool} />
                {tool.rating && (
                  <span className="inline-flex items-center gap-1">
                    <Star
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                    {tool.rating.value} ({tool.rating.count})
                  </span>
                )}
                {tool.downloads && (
                  <span className="inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" aria-hidden /> {tool.downloads}
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-zinc-300">
                {tool.longDescription}
              </p>

              <Separator className="bg-zinc-800" />

              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-100">
                  Features
                </h4>
                <ScrollArea className="max-h-64 pr-3">
                  <ul className="space-y-2">
                    {freeFeatures.map((f) => (
                      <li key={f.name} className="flex items-start gap-2 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                          aria-hidden
                        />
                        <span className="text-zinc-300">{f.name}</span>
                      </li>
                    ))}
                    {premiumFeatures.map((f) => (
                      <li key={f.name} className="flex items-start gap-2 text-sm">
                        <Lock
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                          aria-hidden
                        />
                        <span className="text-zinc-400">
                          {f.name}
                          <span className="ml-1.5 text-[11px] uppercase tracking-wide text-amber-400/80">
                            Premium
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>

              {tool.pricing && (
                <>
                  <Separator className="bg-zinc-800" />
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-zinc-100">
                      {tool.kind === "tool" ? "Premium pricing" : "Pricing"}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {tool.pricing.map((p) => (
                        <div
                          key={p.duration}
                          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                        >
                          <span className="text-xs text-zinc-400">{p.duration}</span>
                          <span className={`text-sm font-semibold ${a.text}`}>
                            {p.price}
                          </span>
                        </div>
                      ))}
                    </div>
                    {tool.premiumNote && (
                      <p className="mt-2 text-xs text-zinc-500">{tool.premiumNote}</p>
                    )}
                  </div>
                </>
              )}

              <Separator className="bg-zinc-800" />
              <div className="flex flex-wrap gap-2">
                {tool.links.map((l, i) => (
                  <Button
                    key={l.url}
                    asChild
                    size="sm"
                    variant={i === 0 ? "default" : "outline"}
                    className={
                      i === 0
                        ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                        : "border-zinc-700 bg-transparent text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
                    }
                  >
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${l.label} — opens in a new tab`}
                    >
                      {i === 0 ? <ExternalLink className="h-4 w-4" aria-hidden /> : <ArrowUpRight className="h-4 w-4" aria-hidden />}
                      {l.label}
                    </a>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {primaryLink && (
            <Button
              asChild
              size="sm"
              className="flex-1 bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
            >
              <a
                href={primaryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${primaryLink.label} — opens in a new tab`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.article>
  );
}
