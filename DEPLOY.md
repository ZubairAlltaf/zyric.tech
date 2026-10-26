# Deploying Zyric

Three steps: **push to GitHub → import to Vercel → point your domain.**
Total time: ~10 minutes. Free tier covers everything.

---

## 1. Push to GitHub

This repo is already clean and commit-ready (no secrets, no env files tracked).
You need a GitHub account and `git` on your machine.

```bash
# 1. Create an EMPTY repository on https://github.com/new
#    Name: zyric  (do NOT add a README/license — repo must be empty)

# 2. From the project folder:
git init                          # skip if .git already exists
git add .
git commit -m "zyric.tech — 75 free browser tools"

# 3. Connect and push (replace YOUR-USERNAME):
git remote add origin https://github.com/YOUR-USERNAME/zyric.git
git branch -M main
git push -u origin main
```

> HTTPS will prompt for your GitHub username + a **Personal Access Token**
> (GitHub → Settings → Developer settings → Tokens). Or install the
> [GitHub CLI](https://cli.github.com) and run `gh auth login` once.

---

## 2. Deploy to Vercel (recommended)

Vercel is made by the Next.js team — zero-config, free tier, automatic HTTPS.

1. Go to **[vercel.com](https://vercel.com)** → **Sign up with GitHub**
2. **Add New… → Project** → pick your `zyric` repo → **Import**
3. Settings: leave everything default. No environment variables are needed.
   - Framework preset: **Next.js** (auto-detected)
   - Build command: `next build` (default)
4. Click **Deploy** — done in ~2 minutes.
5. You get a live URL like `https://zyric.vercel.app` immediately.

Every `git push` to `main` now auto-deploys the site.

### Alternatives

| Host | Notes |
|------|-------|
| **Netlify** | Works: build `next build`, install plugin `@netlify/plugin-nextjs` |
| **Cloudflare Pages** | Static tools work, but the Website Launch Checker API route needs Node — prefer Vercel/Netlify |
| **Any VPS** | `bun install && bun run build && bun run start` behind nginx/Caddy |

---

## 3. Connect your domain (zyric.tech)

### Buy / own the domain first

If you don't own `zyric.tech` yet, grab it at any registrar
(Cloudflare Registrar, Namecheap, Porkbun, GoDaddy — ~$5–15/yr).

### Connect it to Vercel

1. Vercel Dashboard → your project → **Settings → Domains**
2. Enter `zyric.tech` → **Add**
3. Vercel shows you the DNS records to create. Go to your registrar's DNS panel and add:

| Type  | Name | Value                | TTL   |
|-------|------|----------------------|-------|
| `A`   | `@`  | `76.76.21.21`        | auto  |
| `CNAME` | `www` | `cname.vercel-dns.com` | auto |

*(Copy the exact values from the Vercel screen — they can change.)*

4. Wait for DNS to propagate (5 min – a few hours).
5. Vercel issues a free SSL certificate automatically → **https://zyric.tech** is live.

### Recommended: move DNS to Cloudflare (optional but nice)

Point your registrar's nameservers at Cloudflare, manage records there.
Free CDN + DNS + registrar at cost pricing.

---

## Verify after deploy

- [ ] Homepage loads with the boot animation
- [ ] `⌘K` palette opens and opens tools
- [ ] A local tool (e.g. Quick Notes) saves a note after reload (localStorage works)
- [ ] Website Launch Checker audits a live URL (this is the one serverless function)
- [ ] https padlock shows on your custom domain

---

## Project notes for maintenance

- **Adding a tool**: create the component (client-side only), register it in
  `src/components/zyric/registry.tsx` — the count, palette, marquee, directory
  and stats all update automatically.
- **Design system**: tokens + primitives live in `src/app/globals.css`,
  `src/components/zyric/bruts.tsx` (stickers) and
  `src/components/zyric/experience.tsx` (preloader, cursor, grain, confetti).
- **No secrets**: the app needs zero environment variables.
