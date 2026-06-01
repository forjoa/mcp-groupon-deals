# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-01

### Added

- Initial project skeleton with ESM TypeScript configuration (Node.js 20, `NodeNext` module resolution, strict mode).
- `package.json` with runtime dependencies (`@modelcontextprotocol/sdk`, `zod`) and scripts: `build`, `start`, `typecheck`.
- `tsconfig.json` targeting ES2022 with full strict checks.
- MCP server entry point (`src/index.ts`) over stdio transport with six tool stubs registered.
- Tool stubs in `src/tools/`:
  - `search.ts` — search deals by division with keyword, category, discount, and price filters.
  - `bestValue.ts` — retrieve top-rated or highest-discount deals.
  - `expiring.ts` — list deals expiring within a configurable time window.
  - `stats.ts` — aggregate statistics for a division.
  - `compare.ts` — side-by-side comparison of multiple deals.
  - `dealByUrl.ts` — fetch a single deal by its groupon.es URL.
- Groupon API layer stubs in `src/groupon/`:
  - `types.ts` — shared TypeScript types and Zod schemas.
  - `divisions.ts` — registry of 12 supported Spanish city divisions (madrid, barcelona, valencia, sevilla, bilbao, malaga, zaragoza, murcia, palma, alicante, valladolid, granada).
  - `client.ts` — HTTP client stub for the groupon.es GraphQL endpoint.
  - `parser.ts` — response parser stub.
- `src/cache.ts` — TTL cache stub for reducing redundant API calls.
- Zero TypeScript errors confirmed (`tsc --noEmit`).

[Unreleased]: https://github.com/your-username/mcp-groupon-deals/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-username/mcp-groupon-deals/releases/tag/v0.1.0
