# Security Policy

## Reporting a vulnerability

If you discover a security issue in Sparkleware (the registry validator, the website, the CI workflows, or anything else in this repo), **please do not open a public GitHub issue.**

Instead, contact the maintainer privately:

- Open a [GitHub Security Advisory](https://github.com/sparkleware/sparkleware/security/advisories/new) (preferred — keeps the report confidential, discussion threaded, and patches coordinated)
- Or email the maintainer's address listed on the `sparkleware` GitHub profile

Please include:

1. A clear description of the vulnerability
2. Steps to reproduce (or a proof-of-concept, if applicable)
3. The affected component (registry validator, website, workflow, etc.)
4. Your assessment of the impact

## What to expect

- **Acknowledgment** within 3 business days
- **Initial triage** within 7 business days
- **Coordinated disclosure**: we'll work with you on a fix timeline before any public disclosure
- **Credit**: with your permission, we'll credit you in the security advisory and release notes

## Scope

In scope:

- The pack manifest schema and validator (`registry/`)
- The website source (`src/`) once it ships
- The CI workflows (`.github/workflows/`)
- The PR / issue templates (potential template-injection issues)

Out of scope:

- Vulnerabilities in third-party packs listed in the registry (those belong to the pack maintainer's own repo — report them there, then [open an issue](../../issues/new/choose) here with the "Broken pack" template if the pack should be delisted)
- Vulnerabilities in the Aeon framework itself ([report to upstream](https://github.com/aaronjmars/aeon/issues))
- Social engineering / phishing of contributors
- Denial of service requiring physical access or already-compromised credentials

## Supported versions

Sparkleware is pre-launch. The latest commit on `main` is the only supported version. Once we tag releases, this policy will be updated to enumerate supported version ranges.

## Thanks

Security researchers acting in good faith make this project better. Thank you.
