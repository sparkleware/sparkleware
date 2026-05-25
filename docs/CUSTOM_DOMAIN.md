# Custom domain setup

The Sparkleware website is hosted on Cloudflare Workers Assets (the unified
Workers + Pages product, 2026 edition). The default URL is
`https://sparkleware.<account-subdomain>.workers.dev`. To attach a custom
domain like `sparkleware.fun`:

## Prerequisites

- A domain registered at any registrar (Cloudflare, Namecheap, Porkbun, etc.)
- Cloudflare account with the `sparkleware` Workers project deployed
- Owner / admin access on the Cloudflare account

## Path A — Domain already at Cloudflare (recommended)

If `sparkleware.fun` is registered through Cloudflare itself (Domains →
Register), DNS is automatically managed and attachment is one click.

1. **Dashboard → Workers & Pages → `sparkleware` project → Domains → Add**
2. Choose **Use existing domain**, select `sparkleware.fun`.
3. Pick the subdomain or root (`@` for apex `sparkleware.fun`, or `www` for
   `www.sparkleware.fun`).
4. Cloudflare provisions the SSL cert automatically (usually <5 minutes).
5. Edit `src/app/rss.xml/route.ts` and update `SITE_URL` to
   `https://sparkleware.fun`. Commit + push (triggers redeploy).

## Path B — Domain at another registrar

If the domain lives at a third-party registrar (e.g. registered through
Vercel or Namecheap), you have two options:

### B.1 — Move DNS to Cloudflare (simplest long-term)

1. Add `sparkleware.fun` as a Site in Cloudflare (free tier is fine).
2. Cloudflare assigns 2 nameservers — update them at your current registrar.
3. Wait for nameserver propagation (~2-24h).
4. Once DNS is at Cloudflare, follow Path A above.

### B.2 — Keep DNS at current registrar (CNAME / A record)

1. **Dashboard → Workers & Pages → `sparkleware` project → Domains → Add**
2. Enter `sparkleware.fun` — Cloudflare gives you a CNAME target like
   `sparkleware.your-account.workers.dev`.
3. At your registrar's DNS panel, create a `CNAME` record:
   - Type: `CNAME`
   - Name: `@` (or `www`)
   - Target: the value Cloudflare provided
   - TTL: Auto / 300
4. For apex (`sparkleware.fun` without `www`), most registrars don't allow
   `CNAME @` — use `ALIAS`, `ANAME`, or Cloudflare's flattening (only
   available if DNS is at Cloudflare).
5. SSL certs provision once DNS resolves (~5-15 min).
6. Update `SITE_URL` in `src/app/rss.xml/route.ts` to
   `https://sparkleware.fun`, commit + push.

## Verification

After the domain is live:

- Visit `https://sparkleware.fun` — should serve the homepage
- Visit `https://sparkleware.fun/@milady_dev/` — should serve the author page
  via the `_redirects` rewrite (status 200, URL stays unchanged)
- Visit `https://sparkleware.fun/rss.xml` — should serve `application/rss+xml`
- Check SSL cert via browser padlock — issued by Cloudflare

## Updating `SITE_URL` references

The hardcoded `https://sparkleware.fun` lives in a few places:

- `src/app/rss.xml/route.ts` — `SITE_URL` constant
- `src/app/layout.tsx` — `metadata.openGraph.url`
- `package.json` — none currently
- `README.md` — references when shown

Grep for `sparkleware.fun` before launch and update / verify each occurrence.
