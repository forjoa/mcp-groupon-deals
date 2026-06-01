# mcp-groupon-deals

An MCP (Model Context Protocol) server that exposes Groupon Spain deals to AI assistants. It reverse-engineers the groupon.es GraphQL API and surfaces six tools for searching, comparing, and analysing deals across 12 Spanish cities.

## Prerequisites

- Node.js 20 or later
- npm 9 or later

## Installation

```bash
git clone https://github.com/your-username/mcp-groupon-deals.git
cd mcp-groupon-deals
npm install
npm run build
```

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

| Tool | Parameters | Description |
|------|-----------|-------------|
| `search_deals` | `division` (required), `query?`, `category_guid?`, `min_discount?`, `max_price?`, `limit?` | Search deals in a division with optional keyword, category, discount, and price filters |
| `get_best_value_deals` | `division` (required), `min_rating?`, `max_price?`, `limit?` | Retrieve top-rated or highest-discount deals in a division |
| `get_expiring_deals` | `division` (required), `hours?`, `limit?` | List deals expiring within a given number of hours |
| `get_deal_stats` | `division` (required) | Return aggregate statistics (counts, average discount, price distribution) for a division |
| `compare_deals` | `deal_ids[]` (required), `division` (required) | Fetch and compare multiple deals side-by-side |
| `get_deal_by_url` | `url` (required) | Retrieve a single deal by its groupon.es URL |

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
