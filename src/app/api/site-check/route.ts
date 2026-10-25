import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface Check {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  why: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    let raw = (body.url ?? "").trim();
    if (!raw) {
      return NextResponse.json({ error: "Please enter a website address." }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    let startUrl: URL;
    try {
      startUrl = new URL(raw);
    } catch {
      return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }
    if (!["http:", "https:"].includes(startUrl.protocol) || !startUrl.hostname.includes(".")) {
      return NextResponse.json({ error: "Enter a normal website address, e.g. example.com" }, { status: 400 });
    }

    const checks: Check[] = [];
    const started = Date.now();

    let res: Response | null = null;
    try {
      res = await fetch(startUrl.toString(), {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ZyricTechLauncher/1.0)" },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
    } catch {
      checks.push({
        id: "reachable",
        label: "Site reachable",
        status: "fail",
        detail: "Could not load the page (timeout, DNS or connection error).",
        why: "If we can't reach it, neither can visitors or search engines.",
      });
      return NextResponse.json({ checks, score: 0, grade: "F", finalUrl: startUrl.toString() });
    }

    const elapsed = Date.now() - started;
    const finalUrl = new URL(res.url || startUrl.toString());
    const htmlBytes = Number(res.headers.get("content-length") ?? 0);

    checks.push({
      id: "reachable",
      label: "Site reachable",
      status: res.ok ? "pass" : "warn",
      detail: res.ok
        ? `Loaded in ${elapsed} ms${finalUrl.toString() !== startUrl.toString() ? " after redirects" : ""}.`
        : `Server responded with HTTP ${res.status}.`,
      why: "A healthy page should return HTTP 200 quickly.",
    });

    const isHttps = finalUrl.protocol === "https:";
    checks.push({
      id: "https",
      label: "HTTPS (secure connection)",
      status: isHttps ? "pass" : "fail",
      detail: isHttps ? "Served over HTTPS." : "This site is not using HTTPS.",
      why: "Browsers mark HTTP sites “Not secure” and Google ranks them lower.",
    });

    const html = (await res.text()).slice(0, 1_500_000);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";
    checks.push({
      id: "title",
      label: "Page title",
      status: !title ? "fail" : title.length < 15 || title.length > 65 ? "warn" : "pass",
      detail: title ? `“${title.slice(0, 70)}” (${title.length} characters)` : "No <title> tag found.",
      why: "The title is the blue link in Google results — the single most important on-page signal.",
    });

    const descMatch = html.match(/<meta\s+[^>]*name\s*=\s*["']description["'][^>]*>/i);
    const desc = descMatch ? (descMatch[0].match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? "") : "";
    checks.push({
      id: "description",
      label: "Meta description",
      status: !desc ? "warn" : desc.length < 50 || desc.length > 165 ? "warn" : "pass",
      detail: desc ? `${desc.length} characters` : "Missing — Google will invent a snippet.",
      why: "A good description (50–160 chars) improves click-through from search results.",
    });

    const hasViewport = /<meta\s+[^>]*name\s*=\s*["']viewport["']/i.test(html);
    checks.push({
      id: "viewport",
      label: "Mobile viewport",
      status: hasViewport ? "pass" : "fail",
      detail: hasViewport ? "Viewport meta tag present." : "Missing viewport tag — page will zoom out on phones.",
      why: "Without it, mobile browsers render a zoomed-out desktop layout and fail Google's mobile test.",
    });

    const langMatch = html.match(/<html[^>]*>/i)?.[0]?.match(/lang\s*=\s*["']([^"']*)["']/i);
    const lang = langMatch ? langMatch[1] : null;
    checks.push({
      id: "lang",
      label: "Language declared",
      status: lang ? "pass" : "warn",
      detail: lang ? `lang="${lang}"` : "No lang attribute on <html>.",
      why: "Screen readers and search engines use it to pick the right language.",
    });

    const canonical = /<link\s+[^>]*rel\s*=\s*["']canonical["']/i.test(html);
    checks.push({
      id: "canonical",
      label: "Canonical URL",
      status: canonical ? "pass" : "warn",
      detail: canonical ? "Canonical link present." : "No canonical — duplicate URLs can split ranking.",
      why: "Canonicals tell Google which version of a page counts when URLs vary.",
    });

    const hasOg = /<meta\s+[^>]*property\s*=\s*["']og:(title|image)["']/i.test(html);
    checks.push({
      id: "og",
      label: "Social share preview (Open Graph)",
      status: hasOg ? "pass" : "warn",
      detail: hasOg ? "og:title / og:image found." : "Missing — shared links will look plain on WhatsApp, X and Facebook.",
      why: "OG tags control the big preview card when people share your link.",
    });

    const hasFavicon = /<link\s+[^>]*rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(html);
    checks.push({
      id: "favicon",
      label: "Favicon",
      status: hasFavicon ? "pass" : "warn",
      detail: hasFavicon ? "Favicon declared." : "No favicon link found.",
      why: "Favicons brand your tab and appear next to mobile search results.",
    });

    const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
    checks.push({
      id: "h1",
      label: "H1 heading",
      status: h1Count === 1 ? "pass" : "warn",
      detail: `${h1Count} <h1> tag${h1Count === 1 ? "" : "s"} found.`,
      why: "Exactly one descriptive H1 tells visitors and search engines what the page is about.",
    });

    const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
    const noAlt = imgs
      .slice(0, 100)
      .filter((t) => !/\balt\s*=\s*["'][^"']+["']/i.test(t) || /\balt\s*=\s*["']["']/i.test(t)).length;
    checks.push({
      id: "alts",
      label: "Image alt text",
      status: imgs.length === 0 ? "warn" : noAlt === 0 ? "pass" : noAlt <= 2 ? "warn" : "fail",
      detail: imgs.length === 0 ? "No <img> tags in the HTML." : `${noAlt} of ${Math.min(imgs.length, 100)} images missing alt text.`,
      why: "Alt text is required for accessibility and helps images rank in search.",
    });

    const origin = finalUrl.origin;
    const probe = async (path: string) => {
      try {
        const r = await fetch(origin + path, {
          signal: AbortSignal.timeout(6000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ZyricTechLauncher/1.0)" },
          cache: "no-store",
        });
        return r.ok;
      } catch {
        return false;
      }
    };
    const [robotsOk, sitemapOk] = await Promise.all([probe("/robots.txt"), probe("/sitemap.xml")]);
    checks.push({
      id: "robots",
      label: "robots.txt",
      status: robotsOk ? "pass" : "warn",
      detail: robotsOk ? "Found at /robots.txt." : "Not found at /robots.txt.",
      why: "robots.txt guides crawlers and points to your sitemap.",
    });
    checks.push({
      id: "sitemap",
      label: "XML sitemap",
      status: sitemapOk ? "pass" : "warn",
      detail: sitemapOk ? "Found at /sitemap.xml." : "Not found at /sitemap.xml.",
      why: "A sitemap helps Google discover every page faster.",
    });

    const enc = (res.headers.get("content-encoding") ?? "").toLowerCase();
    checks.push({
      id: "compression",
      label: "Text compression",
      status: enc.includes("gzip") || enc.includes("br") || enc.includes("zstd") ? "pass" : "warn",
      detail: enc ? `Served with ${enc}.` : "No Content-Encoding header — pages are sent uncompressed.",
      why: "Compression typically cuts load size by 70%+ — free speed.",
    });

    const secHeaders = ["strict-transport-security", "x-content-type-options", "content-security-policy", "x-frame-options", "referrer-policy"];
    const present = secHeaders.filter((h) => res?.headers.get(h));
    checks.push({
      id: "security",
      label: "Security headers",
      status: present.length >= 3 ? "pass" : present.length >= 1 ? "warn" : "fail",
      detail: present.length ? `Present: ${present.join(", ")}` : "None of the common security headers were found.",
      why: "Headers like HSTS and CSP protect visitors from common attacks.",
    });

    const mixed = isHttps && /(?:src|href)\s*=\s*["']http:\/\//i.test(html);
    checks.push({
      id: "mixed",
      label: "Mixed content",
      status: !isHttps ? "warn" : mixed ? "fail" : "pass",
      detail: !isHttps ? "Not applicable over HTTP." : mixed ? "Found http:// resources on an HTTPS page." : "All resources load over HTTPS.",
      why: "One http:// asset can trigger browser warnings and break the padlock.",
    });

    const kb = htmlBytes > 0 ? htmlBytes : html.length;
    checks.push({
      id: "weight",
      label: "HTML size",
      status: kb < 200_000 ? "pass" : kb < 1_000_000 ? "warn" : "fail",
      detail: `${Math.max(1, Math.round(kb / 1024))} KB of HTML${htmlBytes === 0 ? " (estimated)" : ""}.`,
      why: "Heavy pages load slowly on mobile data and cost more to serve.",
    });
    checks.push({
      id: "speed",
      label: "Server response time",
      status: elapsed < 800 ? "pass" : elapsed < 2000 ? "warn" : "fail",
      detail: `${elapsed} ms until content started arriving.`,
      why: "Slow servers push visitors (and rankings) away — aim for under 800 ms.",
    });

    const weight = { pass: 1, warn: 0.5, fail: 0 } as const;
    const score = Math.round((checks.reduce((s, c) => s + weight[c.status], 0) / checks.length) * 100);
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 55 ? "C" : score >= 35 ? "D" : "F";

    return NextResponse.json({ checks, score, grade, finalUrl: finalUrl.toString() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? `Check failed: ${e.message}` : "Check failed unexpectedly." },
      { status: 500 }
    );
  }
}
