# sparkleware-mcp ✦

An [MCP](https://modelcontextprotocol.io) server for the [Sparkleware](https://sparkleware.fun) registry of Aeon AI agent skill packs. Lets any MCP-compatible agent (Claude Desktop, Cursor, Claude Code, …) search skill packs, **compose a loadout from a plain-language goal**, and **simulate that loadout** against MiroShark's x402 market simulation — without leaving the chat.

It's a discovery / composition aid, **not** a payment endpoint: it never holds funds and never signs a payment. `simulate_loadout` returns a ready-to-run plan; your agent signs the x402 payment itself.

## Install

Add it to your MCP client config:

```json
{
  "mcpServers": {
    "sparkleware": {
      "command": "npx",
      "args": ["-y", "sparkleware-mcp"]
    }
  }
}
```

Or run locally:

```bash
pnpm install
pnpm build
node dist/index.js
```

## Tools

| Tool | Args | Returns |
|---|---|---|
| `search_packs` | `query`, `category?`, `limit?` | Packs matching a keyword across name, description, tags, and skills |
| `list_packs` | `category?`, `tier?`, `limit?` | Packs, optionally filtered |
| `get_pack` | `author`, `name` | Full details for one pack |
| `recommend` | `author`, `name`, `limit?` | Packs related to one pack — same category + shared tags |
| `list_categories` | — | Categories with pack counts |
| **`compose_loadout`** | `goal`, `limit?` | A goal → a ready-to-install loadout: best pack per intent clause, install block, and which packs settle real USDC per call. Deterministic — no model. |
| **`simulate_loadout`** | `goal`, `packs?`, `market_question?`, `preflight?` | A loadout (or bare goal) → a ready-to-run MiroShark simulation plan (25 agents, 10 rounds) for a fixed **$1 USDC over x402 on Base**. Seeds scenarios from MiroShark's free `/suggest`, returns the exact `POST /run` body + payment details. |

### The compose → simulate bridge

```
goal ──▶ compose_loadout ──▶ install block + cost / safety flags
                          └─▶ simulate_loadout ──▶ MiroShark $1 sim plan (x402 / Base)
```

Aeon on one side, MiroShark on the other, both settling in USDC on Base. Sparkleware is the shelf in the middle; your agent does the paying. Simulation output is **not financial advice**.

## Config

| Env | Default | Purpose |
|---|---|---|
| `SPARKLEWARE_API` | `https://sparkleware.fun/api/packs.json` | Registry feed. Point at `http://localhost:3000/api/packs.json` for local dev. |
| `SPARKLEWARE_COSTS` | `https://sparkleware.fun/api/costs.json` | Priced-rail feed — which packs settle USDC per call. |
| `MIROSHARK_API` | `https://x402.miroshark.xyz` | Simulation service base URL. |

The feeds are fetched once per process and cached. Data is sourced from the same canonical Aeon registry Sparkleware indexes; installs still go through Aeon's `./install-skill-pack`.

MIT licensed ✦
