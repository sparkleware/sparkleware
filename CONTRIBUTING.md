# Contributing to Sparkleware

Two distinct contribution flows:

## 1. Submitting a pack

If you've built a skill pack for [Aeon](https://github.com/aaronjmars/aeon) and want it listed in the registry, see **[`registry/CONTRIBUTING.md`](./registry/CONTRIBUTING.md)**.

Short version: open a PR adding `registry/packs/<your-handle>/<pack-name>.json`. CI validates the schema. Maintainers review within ~3 business days.

## 2. Contributing to the website

Website code lives at the monorepo root (Next.js + React; see [`docs/spec.md`](./docs/spec.md) §8 for the locked stack).

Flow:

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/<short-description>`
3. Run local checks (instructions land with the website scaffold)
4. Open a PR; the default PR template will be filled in
5. A maintainer reviews

Conventions:

- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`)
- **Code style**: matches the existing patterns; we use TypeScript strict mode
- **Tests**: required for new logic; aim for fast unit tests over slow integration tests
- **No surprise refactors**: keep PRs focused on one concern

## Reporting bugs

[Open an issue](../../issues/new) with reproduction steps and your environment. Tag with `bug`.

## Reporting a broken or abandoned pack

[Open an issue](../../issues/new) labeled `broken-pack`, linking to the affected `registry/packs/` manifest. Packs whose source repo becomes unreachable for 30+ days are auto-archived.

## Security

If you discover a security issue, please **do not** open a public issue. Email the maintainer directly (contact in the maintainer's GitHub profile).

## Code of conduct

Be civil and constructive. We informally follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## License

By contributing, you agree your contributions are licensed under MIT (same as the project).
