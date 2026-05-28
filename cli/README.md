# sparkleware ✦

The holographic discovery CLI for [Aeon](https://github.com/aaronjmars/aeon) AI agent skill packs.

```
  ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
  ███████╗██████╗  █████╗ ██████╗ ██╗  ██╗██╗     ███████╗██╗    ██╗ █████╗ ██████╗ ███████╗
  ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║     ██╔════╝██║    ██║██╔══██╗██╔══██╗██╔════╝
  ███████╗██████╔╝███████║██████╔╝█████╔╝ ██║     █████╗  ██║ █╗ ██║███████║██████╔╝█████╗
  ╚════██║██╔═══╝ ██╔══██║██╔══██╗██╔═██╗ ██║     ██╔══╝  ██║███╗██║██╔══██║██╔══██╗██╔══╝
  ███████║██║     ██║  ██║██║  ██║██║  ██╗███████╗███████╗╚███╔███╔╝██║  ██║██║  ██║███████╗
  ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
  ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
```

## Install

No install needed — run via `npx`:

```bash
npx sparkleware
```

This drops you into an **interactive REPL** with a holographic banner, status box, and slash commands.

For one-shot queries, pass arguments directly:

```bash
npx sparkleware search arxiv
npx sparkleware random
```

Global install (optional):

```bash
npm install -g sparkleware
```

## Two Modes

### 🌟 Interactive (REPL)

`npx sparkleware` (no args) opens an interactive prompt:

```
  ╭──────────────────────────────────────────────╮
  │ Registry  sparkleware                        │
  │ Endpoint  sparkleware.fun/api/packs.json     │
  │ Packs     7 · 7 verified · 0 auto-indexed    │
  │                                              │
  │ ● live   Ready — type /help to begin         │
  ╰──────────────────────────────────────────────╯

  sparkleware v0.2.0

> /search aeon
> /show arxiv-digest
> /random
> /open eth-gas-watch
> /exit
```

Slash commands:

| Command | Description |
|---|---|
| `/search <query>` | Search packs (name, description, skills, tags, category) |
| `/show <pack>` | Show pack detail (skills, repo, install command) |
| `/top [category]` | Top 10 by stars (optional: filter by category) |
| `/random` | Serendipity pick — one random pack |
| `/list` | List all packs by stars |
| `/open <pack>` | Open pack page in your browser |
| `/clear` | Clear the screen |
| `/help` | Show all commands |
| `/exit` | Quit (also: `Ctrl+C` / `Ctrl+D`) |

Bonus: you can also just type a pack name (e.g. `aeon-pulse`) without `/show`.

### ⚡ One-shot

Pass arguments for quick queries that exit immediately:

| Command | Description |
|---|---|
| `npx sparkleware <pack-name>` | Show pack detail |
| `npx sparkleware search <query>` | Search packs |
| `npx sparkleware top [category]` | Top 10 |
| `npx sparkleware random` | Random pick |
| `npx sparkleware list` | List all packs |
| `npx sparkleware --version` | Print version |
| `npx sparkleware --help` | Help message |

## Categories

`research` · `crypto` · `dev` · `social` · `productivity` · `meta`

## Adaptive Banner

The CLI detects terminal width and serves the best-fit banner:

- **≥ 96 cols** → Full SPARKLEWARE block art with sparkle bands
- **< 96 cols** → Compact single-line `✦ S P A R K L E W A R E ✦`

Set `COLUMNS=120` to force the big banner when piping output.

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
