# mcp-groupon-deals

An MCP (Model Context Protocol) server that exposes Groupon Spain deals to AI assistants. It reverse-engineers the groupon.es GraphQL API and surfaces six tools for searching, comparing, and analysing deals across 12 Spanish cities.

## Prerequisites

- Node.js 20 or later
- npm 9 or later
- ~300 MB free disk space for the Playwright Chromium binary (downloaded automatically on `npm install`)

## Installation

```bash
git clone https://github.com/your-username/mcp-groupon-deals.git
cd mcp-groupon-deals
npm install
npm run build
```

> **Note:** The first time any tool is invoked the server launches a headless Chromium browser to obtain a valid Groupon session. This takes approximately 3-5 seconds. All subsequent calls within the 20-minute session window are instant — no browser overhead.

## Connecting to Claude Desktop or Cursor

Add the server to your MCP client configuration file.

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "groupon-deals": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-groupon-deals/dist/index.js"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "groupon-deals": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-groupon-deals/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/mcp-groupon-deals` with the actual path where you cloned the repo. Restart the client after saving.

## Available Tools

| Tool | Required params | Optional params | Returns |
|------|----------------|-----------------|---------|
| `search_deals` | `division` | `query`, `min_discount`, `max_price`, `limit` | Deals matching the keyword (title + merchant), filtered by discount and price, sorted by discount descending |
| `get_best_value_deals` | `division` | `max_price`, `limit` | Top deals sorted by discount percentage, optionally capped by price |
| `get_expiring_deals` | `division` | `hours` (default 24), `limit` | Deals expiring within the given number of hours, sorted soonest first |
| `get_deal_stats` | `division` | — | Aggregate stats: average price, average discount, maximum discount, flash sale count, top categories |
| `compare_deals` | `division`, `deal_id_1`, `deal_id_2` | — | Side-by-side comparison of two deals by ID |
| `get_deal_by_url` | `url` | — | Full deal object resolved from a groupon.es URL; division is inferred from the URL path |

### Parameter details

**`division`** — one of the 12 supported city codes (see Supported Divisions below).

**`query`** (`search_deals`) — free-text string matched against deal title and merchant name.

**`min_discount`** (`search_deals`) — minimum discount percentage (0–100). Only deals at or above this threshold are returned.

**`max_price`** (`search_deals`, `get_best_value_deals`) — maximum deal price in euros. Deals with a higher price are excluded.

**`limit`** (`search_deals`, `get_best_value_deals`, `get_expiring_deals`) — maximum number of results to return (default 10).

**`hours`** (`get_expiring_deals`) — look-ahead window in hours (default 24). Deals without an expiry date are excluded.

**`deal_id_1` / `deal_id_2`** (`compare_deals`) — the internal Groupon deal IDs to compare, both within the same `division`.

**`url`** (`get_deal_by_url`) — a full groupon.es deal URL, e.g. `https://www.groupon.es/deals/madrid/some-merchant/deal-slug`. The division is extracted automatically from the path.

## Example Interactions

These show how an AI assistant would invoke the tools in natural language:

**"Find spa deals in Madrid under €30 with at least 50% off"**
```
search_deals({ division: "madrid", query: "spa", max_price: 30, min_discount: 50 })
```

**"What are the best value deals in Barcelona right now?"**
```
get_best_value_deals({ division: "barcelona", limit: 5 })
```

**"Are there any deals expiring in the next 6 hours in Valencia?"**
```
get_expiring_deals({ division: "valencia", hours: 6 })
```

**"I found this deal — what does it include?"**
```
get_deal_by_url({ url: "https://www.groupon.es/deals/madrid/restaurante-xyz/abc123" })
```

## Supported Divisions

The following Spanish cities are supported as valid `division` values:

`madrid`, `barcelona`, `valencia`, `sevilla`, `bilbao`, `malaga`, `zaragoza`, `murcia`, `palma`, `alicante`, `valladolid`, `granada`

## Architecture

See [ARCH.md](./ARCH.md) for a detailed description of the project architecture, module layout, caching strategy, and API integration approach.

## Development

```bash
# Compile TypeScript to dist/
npm run build

# Start the compiled server (stdio transport)
npm start

# Type-check without emitting files
npm run typecheck
```

The server communicates over **stdio** using the MCP SDK, so it is launched as a subprocess by the MCP client — no network port is needed.

## Testing

```bash
npm test
```

Tests use Vitest with `fetchDeals` fully mocked — no Groupon API access or network connection is required to run the suite.
