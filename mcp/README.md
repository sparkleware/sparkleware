# sparkleware-mcp ✦

An [MCP](https://modelcontextprotocol.io) server for the [Sparkleware](https://sparkleware.fun) registry of Aeon AI agent skill packs. Lets any MCP-compatible agent (Claude Desktop, Cursor, Claude Code, …) search and look up skill packs without leaving the chat.

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
| `list_categories` | — | Categories with pack counts |

## Config

| Env | Default | Purpose |
|---|---|---|
| `SPARKLEWARE_API` | `https://sparkleware.fun/api/packs.json` | Source feed. Point at `http://localhost:3000/api/packs.json` for local dev. |

The feed is fetched once per process and cached. Data is sourced from the same canonical Aeon registry Sparkleware indexes; installs still go through Aeon's `./install-skill-pack`.

MIT licensed ✦
