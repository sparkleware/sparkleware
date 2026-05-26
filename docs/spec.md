---
title: Sparkleware — Design Specification
date: 2026-05-23
status: draft (pending user review)
authors: project owner + Claude (Opus 4.7)
---

# Sparkleware ✦ — Design Specification

## 1. Overview

Sparkleware is a public registry and catalog for [Aeon](https://github.com/aaronjmars/aeon) AI agent skill packs. It indexes community-published skill packs, surfaces them through search and curated discovery, and provides one-click install commands.

The project addresses a discovery gap in the Aeon ecosystem: Aeon's `./install-skill-pack` command accepts a GitHub repo URL, but there is no centralized catalog to browse, search, or evaluate available packs. Today, users find packs through GitHub topic search or community awesome-lists.

Sparkleware is intentionally branded as a standalone product (not "AeonHub") and uses a maximalist Y2K aesthetic — full schizo, iridescent, Pokémon-foil-card energy — as deliberate differentiation in a tooling space dominated by minimalist designs.

## 2. Goals & Non-Goals

### Goals
- **Make skill packs discoverable**: search, browse-by-category, trending, "Pack of the Day"
- **Make installation friction-free**: one-click copy of the exact install command
- **Make quality legible at a glance**: GitHub stars, freshness, verified badge, featured curation
- **Build a distinctive brand**: Y2K aesthetic that earns mindshare in the AI agent space
- **Stay infrastructure-light**: zero ongoing server cost for v1, fully static + edge-cached
- **Be welcoming to maintainers**: low-friction submission via either GitHub topic tag or PR

### Non-Goals (v1)
- User accounts / authentication
- Ratings, reviews, comments (deferred to v1.5)
- Pack analytics dashboards for authors
- Multi-language UI (English-only)
- Hosting skill pack source code (we link to GitHub; we don't mirror)
- Acting as a package installer (Aeon's `./install-skill-pack` does that)
- Server-side rendering with personalization

## 3. Concept & Positioning

### Problem
Aeon ships with 121 built-in skills and supports community skill packs via `./install-skill-pack <url>`. But for a user asking *"is there a pack for X?"*, there is no canonical place to look. Discovery is fragmented across GitHub search, README mentions, social posts.

### Target Users
- **Pack consumers**: Aeon users (developers, researchers, crypto builders, content creators) looking for skills outside the built-in 121
- **Pack maintainers**: developers who published a skill pack and want it discovered and used

### Differentiation Moat
- **Aesthetic moat**: full schizo Y2K branding (iridescent / holographic / Remilia-coded) — instantly memorable in a sea of minimalist dev tools; positioned for viral mindshare on AI / Crypto Twitter
- **Ecosystem moat**: first-mover canonical registry for the Aeon ecosystem
- **Trust moat**: hybrid curation (auto-discovery + verified tier) balances broad coverage with quality signal

### Brand Independence
Standalone brand "Sparkleware" — not prefixed with "Aeon". Reasons:
- Trademark safety (Aeon is a separate project; this is community)
- Brand flexibility (can expand beyond Aeon ecosystem later if relevant)
- Memorability (unique brand > yet-another-aeon-prefixed-project)

## 4. Aesthetic & Branding

### Mood Anchor
**Iridescent Dream → Holographic Shift**: soft schizo, pearl/holo palette, anime-cute, Milady-coded, with rainbow holographic gradient as the dominant visual treatment. References: Remilia Corporation, Milady NFT aesthetic, Pokémon TCG foil cards, late-90s holographic stickers.

### Color Palette
| Token | Hex | Role |
|---|---|---|
| `--pink-hot` | `#ff85c1` | Primary accent, headings, CTAs |
| `--pink-soft` | `#ffd1f0` | Soft backgrounds, hover states |
| `--pink-pearl` | `#ffe3f5` | Card backgrounds, gradient stop |
| `--blue-soft` | `#c5d4ff` | Secondary accent, gradient stop |
| `--blue-pearl` | `#e0eaff` | Background gradients |
| `--purple-light` | `#d9c5ff` | Tertiary accent, gradient stop |
| `--purple-pale` | `#ede0ff` | Page background base |
| `--purple-deep` | `#6b3aa0` | Body text, navigation |
| `--magenta-link` | `#cc0066` | Block headers, hot text |
| `--white` | `#ffffff` | Base surface |
| `--dark-violet` | `#1a0033` | Install command background (high contrast) |

**Holo gradient** (signature): `linear-gradient(135deg, #ffd1f0 0%, #c5d4ff 25%, #d9c5ff 50%, #c5e8ff 75%, #ffe3f5 100%)`

**Holo text gradient**: `linear-gradient(90deg, #ff85c1, #6680c8)` with `-webkit-background-clip: text`

### Typography
| Use | Font | Notes |
|---|---|---|
| UI body / nav | `Trebuchet MS, sans-serif` | Y2K browser default |
| Display headings | `Trebuchet MS` heavy/900 weight | With holo gradient text fill |
| Y2K accent headers | `Comic Sans MS, cursive` | Block headers `『 ✦ section ✦ 』` |
| Install command | `Courier New, monospace` | Dark background |
| Italic moments | `Georgia, serif` | Pull quotes, taglines |

### Logo Direction
Wordmark: `Sparkleware` in Trebuchet MS 900 with holo text gradient + `✦` symbol prefix. No standalone mark in v1 (wordmark serves as logo). Favicon: holographic `✦` icon on white.

### Domain
`sparkleware.fun` — mirrors `aeon.fun` (Aeon's own domain), implicit brand association.

## 5. Information Architecture

### Page Map
| Page | URL | Layout |
|---|---|---|
| Home | `/` | Card Wall: hero search + filter chips + holo grid + Pack of the Day + Trending row + New This Week row |
| Browse | `/browse` | Directory: sidebar categories + paginated list |
| Pack detail | `/pack/[author]/[name]` | Hybrid: trading card hero + sidebar stats + Geocities accents |
| Submit | `/submit` | PR instructions + JSON template + link |
| Author | `/@[username]` | Header + grid of packs by that author |
| Trending | `/trending` | Sorted feed: ranked by 14-day stars delta (see §7 Trending Algorithm) |
| About | `/about` | Mission, FAQ, contributors |
| RSS feed | `/rss.xml` | New packs + featured updates |

### Top Navigation
`home · browse · trending · submit pack ✦ · docs`

### Categories
Six categories (mirroring Aeon's own taxonomy): `research · crypto · dev · social · productivity · meta`

## 6. Key UI Components

### Holo Skill Pack Card
The most-used component (appears on home grid, browse list, author pages, trending). Specification:
- Background: `linear-gradient(135deg, #fff 0%, #ffe3f5 30%, #e0eaff 70%, #fff 100%)`
- Border: 2px solid with image-gradient (`#ff85c1, #c5d4ff`)
- Shadow: `0 2px 6px rgba(184,165,232,0.2)`
- Contents: title (holo text gradient) + meta line (`12 skills · ✦ 234 · by @author`) + "view" affordance
- Click anywhere on card → navigate to detail page (the install command lives on the detail page, not the card)
- Hover: subtle shimmer (translate gradient stops)

### Install Command Block
- Background: `#1a0033` (deep violet, high contrast)
- Text: `#d9c5ff` monospace
- Padded: `$ ./install-skill-pack <author>/<name>`
- Copy button: small holo gradient button, top-right corner

### Search & Filters
- Hero search on home (large, centered, holo-bordered input)
- Persistent compact search in header on other pages
- Filter chips below hero on home (categories): pill-shaped, active state = pink fill
- Pagefind powers all search (static index built at deploy time)

### Geocities Accent Elements (used on detail pages)
- **Welcome banner**: yellow-to-pink gradient ridge band, Comic Sans pink text
- **Block headers**: `『 ✦ install ✦ 』` style — Comic Sans, magenta `#cc0066`, decorative brackets
- **Visitor counter**: black box, monospace green `#00ff00` digits — decorative only (display install count from GitHub API)

### Stat Box (sidebar)
- Pearl gradient background
- Large gradient-text number (holo text treatment)
- Small uppercase label below

## 7. Data Architecture

### Hybrid Source-of-Truth Model
Two tiers of skill pack listings, both displayed in the registry with different trust badges:

**Tier 1 — Discovered (auto-crawled)**:
- A GitHub Action runs daily
- Uses GitHub Search API to find all repos tagged with topic `aeon-skill-pack`
- Extracts metadata from each repo: name, description, README excerpt, stars, last commit, license
- Generates "discovered" listings (badge: `auto-indexed`)
- Lower trust signal; broad coverage

**Tier 2 — Verified (PR curated)**:
- Maintainer opens a PR to the `sparkleware` monorepo adding `registry/packs/<author>/<name>.json`
- A reviewer (Sparkleware maintainer) checks the pack against quality criteria
- On merge: pack gets `verified: true` badge
- Higher trust signal; manual quality gate

**Tier 3 — Featured (editorial)**:
- A subset of verified packs marked `featured: true` in the JSON
- Appears in "Pack of the Day" rotation and homepage featured slot
- Curated by Sparkleware maintainers

### Pack JSON Schema
Each pack in `registry/packs/<author>/<name>.json`:

```json
{
  "name": "crypto-watcher",
  "author": "milady_dev",
  "repo": "milady_dev/crypto-watcher",
  "description": "Monitor DeFi positions, yield alerts, swap detection",
  "long_description_md": "Optional longer description in markdown",
  "category": "crypto",
  "tags": ["defi", "alerts", "wallet"],
  "version": "1.4.2",
  "verified": true,
  "featured": false,
  "skills_count": 12,
  "skills": [
    {"name": "defi-position-watch", "description": "Track positions across chains"},
    {"name": "yield-alert", "description": "APR drop alerts"}
  ],
  "install_command": "./install-skill-pack milady_dev/crypto-watcher",
  "submitted_at": "2025-09-12T10:30:00Z",
  "license": "MIT"
}
```

### Stats Enrichment
At build time, for each pack, the build pipeline calls the GitHub API to fetch:
- `stars` (used as quality signal)
- `last_commit_at` (used for freshness signal)
- `open_issues_count`
- `default_branch_readme` (for excerpt rendering)

Enriched data is merged with the static JSON and rendered into the static site. No runtime API calls from the browser — everything is baked at build time.

### Rebuild Cadence
- **Daily**: GitHub Action `daily-refresh.yml` re-runs the stars enrichment + topic crawl, commits any cache deltas, which auto-triggers a Vercel redeploy via the connected Git integration
- **On PR merge**: registry repo merges trigger immediate rebuild (webhook)
- **Manual**: maintainer can trigger rebuild via Action dispatch

### Trending Algorithm
Score per pack: `score = (stars_now - stars_14d_ago) * 1 + (installs_now - installs_14d_ago) * 2`. Sorted descending. Ties broken by `last_commit_at` (newer wins). Only packs with `last_commit_at` within the last 90 days are eligible (excludes stale/abandoned). The 14-day historical stars snapshot is stored as a JSON file in the registry repo, updated by the daily Action.

## 8. Tech Stack

> **Amended 2026-05-24:** originally specified Astro. Project owner re-audited and chose Next.js (App Router, static export) for transferable React skill / ecosystem familiarity / smoother v1.5 path.
>
> **Amended 2026-05-26:** hosting migrated from Cloudflare Workers Assets to Vercel. The original Cloudflare choice was driven by unlimited bandwidth on the free tier; in practice Vercel's 100 GB/month free tier is well above realistic Sparkleware traffic for the foreseeable future, and Vercel's native Next.js DX (built-in analytics, edge rewrites via `vercel.json` instead of a separate `_redirects` file, push-to-deploy with preview deployments) outweighs the bandwidth concern. `output: 'export'` is preserved so the site stays portable to any static host.

| Layer | Choice | Rationale |
|---|---|---|
| Web framework | **Next.js 15+ (App Router, `output: 'export'`)** | React-based, mature ecosystem (shadcn, radix), strong DX; static export ships pure HTML/JS (no SSR runtime), keeping the site portable + cheap; App Router enables clean App / Layout / Metadata composition for the Y2K shell |
| Hosting | **Vercel** | Native Next.js DX; edge rewrites via `vercel.json`; built-in Vercel Analytics (privacy-first, no cookies); 100 GB/month free-tier bandwidth is plenty for projected traffic |
| Search | **Pagefind** | Static search index, zero backend, client-side; very fast; framework-agnostic (operates on built HTML in `out/`) |
| Build pipeline | **GitHub Actions** | Daily cron rebuild; PR merge triggers; matches Aeon's own infrastructure philosophy |
| Data store | **JSON files under `registry/packs/**/*.json` in this monorepo** | Source of truth, transparent, PR-reviewable, no DB needed; loaded at build time via `fs.readdir` (no cross-repo fetch) |
| Backend | **None in v1** | Fully static; ratings/auth deferred to v1.5 (would add Cloudflare Workers + D1, or Next.js Route Handlers if we leave static export) |
| Package manager | **pnpm (pinned via `packageManager` field)** | Same pin pattern as `registry/package.json` (currently `pnpm@8.15.9`); monorepo can later adopt `pnpm-workspace.yaml` if unified install desired |
| Styling | **Plain CSS + CSS variables for design tokens** (no Tailwind in v1) | Y2K aesthetic is highly custom — utility-first CSS would fight it; palette tokens from §4 live in `src/styles/global.css` |
| Domain | `sparkleware.fun` | Mirror `aeon.fun` |
| License | **MIT** | Matches Aeon, maximally permissive |

### Why Not Other Options
- **Astro** (previous choice): genuinely better-suited for pure-static catalog, but team prefers React/Next ecosystem for transferable skill + larger component library (shadcn, radix). The trade-off accepted: ~70-100 KB additional client JS for React runtime vs Astro's 0-KB-JS default. Mitigated by `output: 'export'` which still ships pure HTML.
- **Cloudflare Workers Assets**: deployed there briefly (2026-05-24 → 2026-05-26). Worked, but `wrangler.toml` + `public/_redirects` setup felt brittle vs Vercel's native single-file config. Migrated; documented in the §8 amendment above.
- **Next.js with full SSR / dynamic rendering**: not needed in v1 (no per-request personalization). Static export keeps the deploy story simple and the runtime cost zero.
- **SvelteKit / Remix**: viable but smaller AI-codegen training data and smaller component ecosystem.
- **Algolia / hosted search**: overkill for a static catalog; Pagefind is sufficient and free.
- **Database (Supabase / D1)**: not needed in v1; would only be required for ratings/auth in v1.5.

### Next.js-specific implementation notes
- **App Router + static export:** all routes generated statically via `generateStaticParams`. Dynamic segments (pack detail, author page) emit one HTML file per pack/author at build time.
- **`/@username` route caveat:** Next.js App Router reserves the `@folder` filename for Parallel Routes, AND `next.config.mjs` rewrites do not run with `output: 'export'` (no server runtime). To preserve the spec's `/@username` URL pattern (per §5), Plan 2 implements it via a Cloudflare Pages `_redirects` file at `public/_redirects` with a 200-status rewrite: `/@:user /users/:user 200`. The Next.js route physically lives at `src/app/users/[user]/page.tsx` and is statically generated for every author. The browser address bar shows `/@username` (because the edge rewrites without changing the URL) — same UX as the original spec intent.
- **Data loader:** a build-time helper at `src/lib/registry.ts` reads `../registry/packs/**/*.json` directly (sibling subfolder, monorepo, no network fetch). Use `fs.readdir` + `fs.readFile` in a Server Component or generator function.
- **GitHub API enrichment:** runs in a build-time script (`scripts/enrich-stars.ts`) that mutates an intermediate cache file, NOT inside React components. Keeps pages purely static.

## 9. Submission Flow

### For Pack Maintainers (Two Paths)

**Path A — Auto-discovery (easiest)**:
1. Maintainer adds GitHub topic `aeon-skill-pack` to their repo
2. Within 24 hours, daily crawl picks it up
3. Pack appears in Sparkleware with badge `auto-indexed`

**Path B — Verified submission (recommended for serious packs)**:
1. Maintainer forks the `sparkleware` monorepo
2. Adds `registry/packs/<author>/<name>.json` using the schema template
3. Opens PR
4. Reviewer checks against quality criteria (live link works, README exists, license is OSS, skill files load in Aeon)
5. On merge: pack appears with `verified ✦` badge

### Submit Page UX
The `/submit` page presents both paths clearly with copy-pasteable JSON template and a "Open PR" deep link to GitHub PR creation pre-filled with the template.

### Maintainer Responsibilities (Sparkleware team)
- Review PRs within ~3 business days
- Maintain quality criteria documentation
- Curate `featured` flag (~weekly cadence)
- Triage reports of broken/abandoned packs

## 10. v1 MVP Scope

### IN — ship within 1-2 weeks
- [x] Three core pages: Home, Browse, Pack Detail
- [x] Author profile pages (`/@username`)
- [x] Trending page + Pack of the Day rotation
- [x] Submit Pack page (PR-based instructions)
- [x] About page
- [x] Pagefind search
- [x] RSS feed (`/rss.xml`)
- [x] Category filter chips (six categories)
- [x] Holo skill pack card component
- [x] Install command block (with copy)
- [x] Verified + Featured badges
- [x] GitHub stats enrichment (stars, last update)
- [x] Mobile-responsive layouts (Y2K aesthetic adapts down)
- [x] Daily auto-crawl Action for `aeon-skill-pack` topic
- [x] Initial seed of 5-10 example packs in registry (bootstrap)

### OUT — deferred to v1.5+
- [ ] Ratings (1-5 stars)
- [ ] Comments / reviews
- [ ] GitHub OAuth login
- [ ] Personal collections / favorites
- [ ] Pack analytics dashboard for authors
- [ ] Multi-language UI
- [ ] Theme toggle (only Y2K theme in v1)
- [ ] Notifications (new pack alerts via email)
- [ ] Pack version history view

## 11. Repository Structure

> **Amended 2026-05-24:** originally specified as two separate repos (`sparkleware` + `sparkleware-registry`). After Plan 1 (registry) executed, project owner decided to consolidate into a single monorepo. Rationale: solo + pre-launch, the two-repo overhead exceeded the (future, scale-dependent) benefit of separating contributor data PRs from maintainer code PRs. The data subsystem can be split back out via `git filter-repo --subdirectory-filter registry/` if contributor volume later warrants it.

Single GitHub repository: **`sparkleware/sparkleware`**.

```
sparkleware/                              # the monorepo
├── README.md
├── LICENSE                               # MIT (covers entire monorepo)
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
│
├── package.json                          # Plan 2: Next.js + React deps, pnpm packageManager pin
├── next.config.mjs                       # Plan 2: { output: 'export' } + rewrites for /@username
├── tsconfig.json                         # Plan 2
├── public/
│   ├── favicon.ico                       # Plan 2
│   └── og-image.png                      # Plan 2
├── src/                                  # Plan 2: website source
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (Header, Footer, font, global.css)
│   │   ├── page.tsx                      # Home (Card Wall)
│   │   ├── browse/page.tsx               # Browse (Directory)
│   │   ├── trending/page.tsx
│   │   ├── submit/page.tsx
│   │   ├── about/page.tsx
│   │   ├── rss.xml/route.ts              # RSS feed (static Route Handler)
│   │   ├── pack/[author]/[name]/page.tsx # Pack detail (generateStaticParams over all packs)
│   │   └── users/[user]/page.tsx         # Author page — public URL is /@username via next.config rewrite
│   ├── components/
│   │   ├── HoloCard.tsx
│   │   ├── InstallCommand.tsx            # 'use client' (clipboard interaction)
│   │   ├── SearchBar.tsx                 # 'use client' (Pagefind wiring)
│   │   ├── FilterChips.tsx               # 'use client'
│   │   ├── StatBox.tsx
│   │   ├── BlockHeader.tsx
│   │   ├── VisitorCounter.tsx
│   │   ├── WelcomeBanner.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── github.ts                     # GitHub API enrichment (build-time script consumer)
│   │   ├── registry.ts                   # Load + merge from ../registry/packs at build time
│   │   └── trending.ts                   # Trending algorithm
│   └── styles/
│       └── global.css                    # Holo gradients, palette tokens (CSS variables from §4)
├── scripts/
│   ├── crawl-topic.ts                    # Plan 2: auto-discovery (Tier 1) crawl
│   └── enrich-stars.ts                   # Plan 2: build-time GitHub stars/freshness cache
│
├── registry/                             # Plan 1: data subsystem (DONE)
│   ├── README.md
│   ├── CONTRIBUTING.md                   # How to submit a pack (Path B)
│   ├── package.json                      # Registry-only deps (ajv, vitest, tsx)
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── pack-schema.json                  # JSON Schema 2020-12 contract
│   ├── packs/
│   │   └── <author>/
│   │       └── <name>.json               # One file per verified pack
│   ├── scripts/
│   │   ├── validate.ts                   # CLI validator
│   │   └── validate.test.ts              # 5 vitest tests for validatePack()
│   └── tests/fixtures/
│       ├── valid-minimal.json
│       ├── valid-full.json
│       └── invalid-missing-name.json
│
└── .github/
    ├── PULL_REQUEST_TEMPLATE/
    │   └── pack-submission.md            # Opt-in template for pack PRs
    └── workflows/
        ├── validate-registry.yml         # paths: registry/** — runs validator
        ├── daily-refresh.yml             # Plan 2: cron crawl + rebuild
        └── deploy.yml                    # Plan 2: on push, deploy to CF Pages
```

**Workflow path filtering.** The `validate-registry.yml` workflow filters on `paths: ['registry/**', '.github/workflows/validate-registry.yml']`, so pure-website PRs don't trigger validator runs and pure-registry PRs don't trigger website builds. This preserves the "separated CI concerns" benefit that originally motivated the two-repo design, without paying the two-repo coordination cost.

**Independent package roots.** The website (root) and the registry subsystem each have their own `package.json`. The root will receive its `package.json` during Plan 2 (Next.js scaffold); `registry/package.json` already exists and is self-contained. If the project later wants unified install/test commands across both, the simplest move is to add a top-level `pnpm-workspace.yaml` listing `["registry"]` (and the implicit root). Not adopted in v1 to keep the install surface small.

## 12. Open Questions

Items still TBD that need resolution during implementation:

1. **Logo / mark direction**: wordmark only is fine for v1, but a standalone mark would help favicons and social sharing. Decide during implementation polish.
2. **Pack ownership claim flow**: if an auto-discovered pack's maintainer wants to "claim" and upgrade to verified, what's the process? (Recommendation: handled via PR; document in CONTRIBUTING.md.)
3. **Handling defunct packs**: if a pack's repo is deleted or archived, what happens to its Sparkleware listing? (Recommendation: auto-mark `status: archived` after 30 days of repo unreachable; hide from browse, keep detail page with notice.)
4. **GitHub API rate limits**: enrichment for 1000+ packs may hit unauthenticated rate limit (60/hr). Need to use a GitHub App or PAT with higher limits. Decide during implementation.
5. **Bootstrap seed packs**: which 5-10 packs to seed the registry with at launch? Coordinate with Aeon community before launch.

## 13. Future Considerations (v1.5+)

When/if Sparkleware proves adoption, the following are natural next features:
- **Ratings (1-5 stars) + reviews**: requires Cloudflare Workers + D1 + GitHub OAuth. Adds social proof and quality signal beyond stars.
- **Quick reactions**: `✨ ❤️ 🙏` without login, IP-deduped, lightweight social signal — possibly earlier than full reviews.
- **Author dashboards**: for maintainers to see install stats, top regions, etc.
- **Personal collections**: "save for later", "my installed packs"
- **Pack version history**: timeline of major versions, changelogs
- **Subscriptions / notifications**: email or RSS-per-category
- **Dark mode toggle**: a "midnight holo" variant of the palette
- **Multi-language UI**: starting with the languages of the most active community segments
- **Pack health monitoring**: red badge if install fails, last-CI-status pull
- **Affiliated marketplaces**: support skill packs from non-Aeon agent frameworks (LangChain plugins, etc.) if the registry grows beyond Aeon

## 14. Success Criteria (60 days post-launch)

- **Pack count**: 50+ packs indexed (mix of auto-discovered + verified)
- **Verified packs**: 10+ packs with PR-curated verified status
- **Traffic**: 1000+ unique visitors in launch week, 500+ weekly recurring after week 4
- **Submission velocity**: 2-3 PR submissions per week by week 4
- **Social signal**: featured in at least 2 AI/dev newsletters, organic shares on X

Tracked via Vercel Analytics (privacy-preserving, no cookies).

---

**End of design specification.**

This document is the source of truth for project decisions. Material changes should be made as PR amendments to this file with reasoning in the commit message.
