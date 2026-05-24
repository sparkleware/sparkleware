# Contributing to sparkleware-registry

Thanks for wanting to add a pack ✦. This repo is the source of truth for **verified packs** in the [Sparkleware](https://github.com/sparkleware/sparkleware) registry.

## Two ways to get your pack listed

### Path A — Auto-discovery (no PR needed)

Add the GitHub topic **`aeon-skill-pack`** to your repo. Within 24 hours, a daily crawl on the Sparkleware website will pick it up and list it with the `auto-indexed` badge. This is the easiest path and good for early experimentation.

### Path B — Verified submission (recommended for serious packs)

Open a PR here. Verified packs get the `verified ✦` badge, higher placement in search, and are eligible for `featured` curation.

## How to submit a verified pack

1. **Fork** this repo.
2. **Create** `packs/<your-handle>/<pack-name>.json` using the template below.
3. **Validate locally** (optional but recommended):
   ```
   pnpm install
   pnpm validate
   ```
4. **Open a PR**. The `validate` workflow will check your JSON against the schema. A maintainer will review within ~3 business days.

## Pack manifest template

Copy this template into your new file and fill it in:

```json
{
  "name": "your-pack-name",
  "author": "your_github_handle",
  "repo": "your_github_handle/your-pack-name",
  "description": "One sentence (10-280 chars) describing what the pack does.",
  "category": "research",
  "tags": ["optional", "lowercase", "hyphenated"],
  "version": "0.1.0",
  "skills_count": 1,
  "skills": [
    { "name": "skill-name", "description": "What this skill does." }
  ],
  "install_command": "./install-skill-pack your_github_handle/your-pack-name",
  "submitted_at": "2026-05-24T00:00:00Z",
  "license": "MIT"
}
```

### Field reference

See [`pack-schema.json`](./pack-schema.json) for the full schema. Highlights:

- **`category`** must be one of: `research`, `crypto`, `dev`, `social`, `productivity`, `meta`.
- **`version`** must be valid semver (e.g. `1.4.2`).
- **`install_command`** must literally be `./install-skill-pack <repo>` — used verbatim on the pack detail page.
- **`license`** should be an SPDX identifier (e.g. `MIT`, `Apache-2.0`, `BSD-3-Clause`).
- **`verified`** and **`featured`** are set by maintainers — don't include them in your PR.

## Quality criteria (what reviewers check)

- Repo URL resolves and the pack source is publicly accessible.
- README exists and explains what the pack does.
- License is OSS (any SPDX-listed permissive license).
- At least one skill is implemented and loads in Aeon (`./install-skill-pack` succeeds).
- Pack name and author handle are not impersonating another project.

## Claiming an auto-discovered pack

If your pack is already listed via auto-discovery and you want to upgrade it to verified status (with full metadata, tags, custom description), open a PR following the steps above. The verified entry takes precedence over the auto-indexed one.

## Reporting a broken or abandoned pack

Open an [issue](https://github.com/sparkleware/sparkleware/issues/new) with the label `broken-pack` and link to the affected manifest. Packs whose repo becomes unreachable for 30+ days are auto-archived.
