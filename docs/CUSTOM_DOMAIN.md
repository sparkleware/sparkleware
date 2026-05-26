# Custom domain setup

The Sparkleware website is hosted on Vercel. The default URL is
`https://sparkleware.vercel.app` (with per-deploy aliases like
`sparkleware-<hash>-pxl.vercel.app`). To attach a custom domain like
`sparkleware.fun`:

## Prerequisites

- A Vercel account with the `sparkleware` project deployed
- A domain registered somewhere (Vercel Domains, Namecheap, Porkbun,
  Cloudflare, etc.)

## Path A — Domain registered at Vercel (simplest)

If you bought the domain through Vercel Domains, it's already in your
account and the attach is one click.

1. **Vercel dashboard → `sparkleware` project → Settings → Domains → Add**
2. Enter `sparkleware.fun` (or whatever you registered).
3. Vercel auto-provisions DNS + SSL (~1-5 minutes).
4. Update the hardcoded `SITE_URL` references (see "Updating SITE_URL"
   below) so RSS / OG meta / `sitemap.xml` all use the new origin.

## Path B — Domain at another registrar

1. **Vercel dashboard → `sparkleware` project → Settings → Domains → Add**
2. Enter `sparkleware.fun`.
3. Vercel shows DNS records to set at your registrar:
   - Apex (`sparkleware.fun`): an `A` record pointing to
     `76.76.21.21`
   - WWW: a `CNAME` record pointing to `cname.vercel-dns.com`
4. Set those records at your registrar's DNS panel. Wait for
   propagation (~5 min - 24 h).
5. Once Vercel detects DNS, SSL provisions automatically.
6. Update `SITE_URL` references as below.

## Verification

After the domain is live:

- Visit `https://sparkleware.fun` — should serve the homepage
- Visit `https://sparkleware.fun/@sparkleware/` — should serve the
  author page via `vercel.json` rewrite (URL stays `/@sparkleware/`,
  status 200)
- Visit `https://sparkleware.fun/rss.xml` — should serve
  `application/rss+xml`
- Check SSL cert via browser padlock — issued by Let's Encrypt via
  Vercel

## Updating `SITE_URL` references

The hardcoded `https://sparkleware.fun` lives in a few places — update
each to match the registered domain if different:

- `src/app/layout.tsx` — `metadataBase` + `metadata.openGraph.url`
- `src/app/rss.xml/route.ts` — `SITE_URL` constant
- `docs/spec.md` — §4 Domain bullet (informational)
- `README.md` — references in the body

Grep for `sparkleware.fun` before launch and verify each occurrence.
