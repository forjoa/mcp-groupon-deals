# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-06-01

### Added

- Vitest test suite with 36 tests across 6 files, one per tool handler (`search.test.ts`, `bestValue.test.ts`, `expiring.test.ts`, `stats.test.ts`, `compare.test.ts`, `dealByUrl.test.ts`).
- `src/tests/fixtures.ts` — 6 realistic Groupon.es deal fixtures covering spa, hammam, restaurant, gym, theatre, and hotel deals, plus an expired-deal edge case used across all test files.
- `fetchDeals` is fully mocked via `vi.mock` — no real HTTP calls or Groupon API access required to run the tests.
- Added `vitest` to `devDependencies` and `"test": "vitest run"` script to `package.json`.

## [0.2.0] - 2026-06-01

### Added

- `search_deals` — filters deals by keyword (matched against title and merchant), with optional `min_discount` and `max_price` filters; results sorted by discount descending.
- `get_best_value_deals` — returns top deals sorted by discount percentage, with optional `max_price` filter.
- `get_expiring_deals` — returns deals expiring within a configurable number of hours, sorted soonest-first.
- `get_deal_stats` — computes aggregate statistics for a division: average price, average discount, maximum discount, number of flash sales, and top categories by deal count.
- `compare_deals` — fetches two deals by ID within a division and returns a structured side-by-side comparison.
- `get_deal_by_url` — resolves a groupon.es deal URL to a full `Deal` object, with automatic division inference from the URL path.
- `src/tools/shared.ts` — shared helpers used across all tools: `DivisionSchema` (Zod), `formatPrice`, `formatDate`, and `hoursUntil`.

### Changed

- All tool names are now canonical and aligned with ARCH.md (`search_deals`, `get_best_value_deals`, `get_expiring_deals`, `get_deal_stats`, `compare_deals`, `get_deal_by_url`).
- Zod input validation added to all six tools with descriptive error messages surfaced to the MCP client.
- Added `postbuild` npm script that automatically sets `dist/index.js` executable (`chmod +x`) after every build, removing the need for a manual step.
- Added `prepare` npm script that runs the build on `npm install`, enabling zero-step setup on fresh clones.
- Bumped package version to `0.2.0`.

## [0.1.1] - 2026-06-01

### Added

- `src/cache.ts` — fully implemented in-memory TTL cache:
  - `Cache<T>` generic class with `get`, `set`, `has`, and `delete` methods; expired entries are evicted automatically on read.
  - `selectTtl(deals)` — returns a 10-minute TTL when active flash sales are present, 30 minutes otherwise.
  - `dealCache` singleton pre-typed for `Deal[]`.
  - Exported constants `TTL_BASE_MS` (30 min) and `TTL_FLASH_MS` (10 min).
- `src/groupon/types.ts` — raw API response interfaces (`RawCard`, `RawGraphQLResponse`, `RawPaginationInfo`, and related types) to model the groupon.es GraphQL payload.
- `src/groupon/parser.ts` — `parseDeals(rawCards, division)` implementation mapping `RawCard` objects to the internal `Deal` type.
- `src/groupon/client.ts` — fully implemented HTTP client:
  - `fetchDeals(params)` with a cache-first strategy.
  - Paginates the groupon.es GraphQL API up to 3 pages (54 deals) per division.
  - `division` parameter typed as the `Division` enum (allowlist validation, prevents header injection).
  - `GrouponApiError` class for HTTP-level and GraphQL-level errors.
  - Dynamic TTL selection via `selectTtl` applied after each fetch.

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

[Unreleased]: https://github.com/your-username/mcp-groupon-deals/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/your-username/mcp-groupon-deals/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/your-username/mcp-groupon-deals/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/your-username/mcp-groupon-deals/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/your-username/mcp-groupon-deals/releases/tag/v0.1.0
