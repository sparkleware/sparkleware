# sparkleware-registry ✦

Pack manifests for the [Sparkleware](https://github.com/sparkleware/sparkleware) registry.

This repo is the source of truth for **verified packs**. Each pack is one JSON file at `packs/<author>/<name>.json`, validated against [`pack-schema.json`](./pack-schema.json).

## Submitting a pack

See [CONTRIBUTING.md](./CONTRIBUTING.md).

Short version: fork → add `packs/<your-handle>/<pack-name>.json` → open PR. CI validates the schema on every push. A Sparkleware maintainer reviews and merges.

## Repo layout

```
packs/<author>/<name>.json    # one file per verified pack
pack-schema.json              # JSON Schema (draft 2020-12) for pack files
scripts/validate.ts           # validator CLI (run via pnpm validate)
.github/workflows/validate.yml # CI: validates every PR
```

## Running the validator locally

```
pnpm install
pnpm validate
```

Exits non-zero if any pack fails validation; prints the offending file and the schema errors.

## License

MIT — see [LICENSE](../LICENSE).
