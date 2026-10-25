"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  Globe,
  Smartphone,
  Sparkles,
  Star,
  Check,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ECOSYSTEM, FREE_TOOLS, type Tool } from "@/data/tools";
import { ToolCard, ToolIcon } from "./tool-card";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

function freeTierLabel(tool: Tool): string {
  switch (tool.freeType) {
    case "completely-free":
      return "Everything free";
    case "freemium":
      return "Free with ads";
    case "paid":
      return "—";
    case "donation":
      return "Free to browse";
  }
}

export function CompareSection() {
  return (
    <section id="compare" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="At a glance"
          title="Free vs premium, tool by tool"
          description="Every free tool side by side with what upgrading unlocks — so you know exactly what ৳0 gets you across the zyric.tech ecosystem."
        />
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="h-12 text-zinc-300">Tool</TableHead>
                <TableHead className="text-zinc-300">Free tier</TableHead>
                <TableHead className="text-zinc-300">Premium unlocks</TableHead>
                <TableHead className="text-zinc-300">Premium from</TableHead>
                <TableHead className="text-zinc-300">Platforms</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FREE_TOOLS.map((tool) => (
                <TableRow key={tool.id} className="border-zinc-800/70">
                  <TableCell className="font-medium text-zinc-100">
                    <span className="flex items-center gap-2">
                      <span className="hidden text-zinc-400 sm:inline">
                        <ToolIcon tool={tool} className="h-4 w-4" />
                      </span>
                      {tool.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tool.freeType === "completely-free" ? (
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                        <Check className="h-4 w-4" aria-hidden /> {freeTierLabel(tool)}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-300">{freeTierLabel(tool)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {tool.premiumNote ?? "Nothing — fully free"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tool.pricing ? (
                      <span className="font-semibold text-zinc-200">
                        {tool.pricing[0].price}
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          / {tool.pricing[0].duration.toLowerCase()}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-zinc-500">
                        <Minus className="h-4 w-4" aria-hidden /> Free
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-3 text-zinc-400">
                      {tool.platforms.includes("web") && (
                        <Globe className="h-4 w-4" aria-label="Web" />
                      )}
                      {tool.platforms.includes("android") && (
                        <Smartphone className="h-4 w-4" aria-label="Android" />
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Beyond free"
          title="The wider zyric.tech ecosystem"
          description="The free tools are built on a bigger platform: a Bengali course academy, a halal ad network, and a transparent community fund. Worth knowing, even when they're not free."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "What is zyric.tech?",
    a: "zyric.tech is the home of the Qamarix ecosystem — a Bangladeshi digital product company building Bengali-first apps and platforms. Its products include the AyBay income & expense tracker, the Hishab business accounting app, Quran Words, Qamarix Academy, Comarix Ad, and the Tamkin community fund, all reachable from qamarix.com.",
  },
  {
    q: "Which tools are completely free?",
    a: "Quran Words is 100% free forever — no subscription, no ads, no locked lessons. The Qamarix Community, the video tutorial library, and the monthly leaderboard are also entirely free. AyBay and Hishab are freemium: their free tiers are fully usable day to day, with optional premium upgrades that remove ads and add extras.",
  },
  {
    q: "Do I need to pay for AyBay or Hishab?",
    a: "No — both apps are free to download and use. On the free tier you get the core experience (tracking, reports, budgets, customer management, and more). Paying only removes ads and unlocks extras like unlimited transactions on AyBay. Premium starts at ৳290/year for AyBay and ৳190/3-months for Hishab, with lifetime one-time options.",
  },
  {
    q: "Can I use the tools on the web, or only on Android?",
    a: "AyBay and Quran Words both have full web apps (aybay.qamarix.com and quranwords.qamarix.com) alongside their Android apps. Hishab is currently Android-only. The Community, Video Tutorials, Leaderboard, Academy, and Tamkin Fund all run in the browser.",
  },
  {
    q: "What language are the tools in?",
    a: "Everything is Bengali-first, designed for Bangladeshi users — interfaces, tutorials, courses, and support content. Quran Words teaches Quranic Arabic through Bengali meanings. If you read Bengali, you'll feel right at home.",
  },
  {
    q: "Is this the official zyric.tech website?",
    a: "No — this is an independent directory that catalogs every free tool in the zyric.tech / Qamarix ecosystem in one place. Every 'Open' button links straight to the official product pages and app stores.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="The essentials about the free tools on zyric.tech and how they fit together."
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-zinc-800"
              >
                <AccordionTrigger className="text-left text-sm font-medium text-zinc-100 hover:text-emerald-300 hover:no-underline sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-400">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-semibold text-zinc-100">Zyric Tools Hub</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              An independent directory of every free tool in the zyric.tech /
              Qamarix ecosystem — researched, organized, and kept current.
            </p>
          </div>
          <nav aria-label="Free tools">
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Free tools</h3>
            <ul className="space-y-2 text-sm">
              {FREE_TOOLS.map((t) => (
                <li key={t.id}>
                  <a
                    href={t.links[0]?.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-emerald-300"
                  >
                    <ChevronRight className="h-3 w-3" aria-hidden />
                    {t.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Ecosystem">
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Ecosystem</h3>
            <ul className="space-y-2 text-sm">
              {ECOSYSTEM.map((t) => (
                <li key={t.id}>
                  <a
                    href={t.links[0]?.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-emerald-300"
                  >
                    <ChevronRight className="h-3 w-3" aria-hidden />
                    {t.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Official links">
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Official</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "qamarix.com", url: "https://qamarix.com" },
                { label: "About the team", url: "https://qamarix.com/about" },
                {
                  label: "Play Store developer",
                  url: "https://play.google.com/store/apps/dev?id=7263660397360351705",
                },
                { label: "Facebook", url: "https://www.facebook.com/qamarixbd" },
                { label: "YouTube", url: "https://www.youtube.com/@qamarix" },
                { label: "Telegram", url: "https://t.me/qamarix" },
              ].map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-emerald-300"
                  >
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-800/70 pt-6 text-xs text-zinc-500 sm:flex-row">
          <p>© {year} Zyric Tools Hub · Independent directory, not affiliated with Qamarix.</p>
          <p className="inline-flex items-center gap-1">
            Built with <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            for the Bengali-speaking community
          </p>
        </div>
      </div>
    </footer>
  );
}
