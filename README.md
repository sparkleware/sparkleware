# Sparkleware ✦

> A holographic registry for [Aeon](https://github.com/aaronjmars/aeon) AI agent skill packs.

🚧 **Pre-launch.** The registry data subsystem is live (see [`registry/`](./registry)); the website is in active development.

## What this is

Sparkleware is a public catalog where Aeon users discover, browse, and one-click-install community skill packs. Two ways to get a pack listed:

- **Auto-discovery** — add the GitHub topic `aeon-skill-pack` to your repo. A daily crawler picks it up within 24 hours and lists it with the `auto-indexed` badge.
- **Verified submission** — open a PR adding `registry/packs/<author>/<name>.json`. See [`registry/CONTRIBUTING.md`](./registry/CONTRIBUTING.md) for the template and quality criteria. Verified packs get the `verified ✦` badge.

## Repo layout

```
sparkleware/
├── registry/      Pack manifests + JSON schema + validator
├── docs/spec.md   Full design specification
├── .github/       CI workflows + PR templates
└── LICENSE        MIT
```

The website source (Next.js, deployed to Cloudflare Pages) will land at the repo root during ongoing development.

## Local development — registry

Validate pack manifests and run tests:

```sh
cd registry
pnpm install
pnpm test       # vitest suite over the schema
pnpm validate   # validate every manifest in packs/
```

CI runs the same commands on every PR.

## Local development — website

Pending. Tech stack is locked in [`docs/spec.md`](./docs/spec.md) §8 (Next.js App Router, static export, Cloudflare Pages). Setup instructions land when the website scaffold ships.

## Contributing

- **Submitting a pack** → [`registry/CONTRIBUTING.md`](./registry/CONTRIBUTING.md)
- **Filing an issue / bug report** → [open an issue](../../issues/new)
- **Website code** → [`CONTRIBUTING.md`](./CONTRIBUTING.md) at the root

## Acknowledgments

Built around [Aeon](https://github.com/aaronjmars/aeon) by [@aaronjmars](https://github.com/aaronjmars). Aesthetic direction inspired by Remilia Corporation, Milady, Pokémon TCG holographic foil, and late-90s sticker sheets.

## License

[MIT](./LICENSE).
