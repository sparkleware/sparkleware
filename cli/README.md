# sparkleware ✦

The holographic discovery CLI for [Aeon](https://github.com/aaronjmars/aeon) AI agent skill packs.

```
✦  S P A R K L E W A R E  ✦
the holographic registry for Aeon skill packs
sparkleware.fun
```

## Install

No install needed — run via `npx`:

```bash
npx sparkleware
```

Or install globally:

```bash
npm install -g sparkleware
sparkleware
```

## Commands

| Command | Description |
|---|---|
| `npx sparkleware` | List top 20 packs by stars |
| `npx sparkleware <pack-name>` | Show pack detail (skills, repo, install command) |
| `npx sparkleware search <query>` | Search packs across name, description, skills, tags |
| `npx sparkleware top [category]` | Top 10 (optional: filter by category) |
| `npx sparkleware random` | Serendipity pick — one random pack |
| `npx sparkleware --version` | Print version |
| `npx sparkleware --help` | Help message |

## Categories

`research` · `crypto` · `dev` · `social` · `productivity` · `meta`

## Examples

```bash
# Browse top packs by stars
npx sparkleware

# Find packs related to AI research
npx sparkleware search arxiv

# Show details for a specific pack
npx sparkleware aeon-pulse

# Browse crypto category leaderboard
npx sparkleware top crypto

# Get a random pack to discover
npx sparkleware random
```

## Data source

Fetches the live registry from [sparkleware.fun/api/packs.json](https://sparkleware.fun/api/packs.json) — a static, open, MIT-licensed JSON feed. No auth, no API keys, no rate limits on the consumer side.

## How install actually works

Sparkleware is a **discovery surface**, not a parallel install path. Installs always resolve through Aeon's canonical script:

```bash
./install-skill-pack <author>/<name>
```

The CLI shows you which command to run — you run it from your Aeon checkout.

## Links

- Website: [sparkleware.fun](https://sparkleware.fun)
- API: [sparkleware.fun/api/packs.json](https://sparkleware.fun/api/packs.json)
- Source: [github.com/sparkleware/sparkleware](https://github.com/sparkleware/sparkleware)
- Aeon: [github.com/aaronjmars/aeon](https://github.com/aaronjmars/aeon)

## License

MIT
