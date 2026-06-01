#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { handleSearch, SearchSchema } from "./tools/search.js";
import { handleBestValue, BestValueSchema } from "./tools/bestValue.js";
import { handleExpiring, ExpiringSchema } from "./tools/expiring.js";
import { handleStats, StatsSchema } from "./tools/stats.js";
import { handleCompare, CompareSchema } from "./tools/compare.js";
import { handleDealByUrl, DealByUrlSchema } from "./tools/dealByUrl.js";

const server = new Server(
  { name: "mcp-groupon-deals", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_deals",
      description: "Search for deals in a Spanish city by keyword, with optional discount and price filters.",
      inputSchema: {
        type: "object" as const,
        properties: {
          division: { type: "string", description: "Spanish city (e.g. 'madrid', 'barcelona')" },
          query: { type: "string", description: "Keyword to match against deal title and merchant name" },
          min_discount: { type: "number", description: "Minimum discount percentage (0–100)" },
          max_price: { type: "number", description: "Maximum discounted price in euros" },
          limit: { type: "number", description: "Maximum results to return (1–50, default 10)" },
        },
        required: ["division", "query"],
      },
    },
    {
      name: "get_best_value_deals",
      description: "Get the highest-discount deals in a Spanish city, optionally filtered by max price.",
      inputSchema: {
        type: "object" as const,
        properties: {
          division: { type: "string", description: "Spanish city (e.g. 'madrid', 'barcelona')" },
          max_price: { type: "number", description: "Maximum discounted price in euros" },
          limit: { type: "number", description: "Maximum results to return (1–50, default 10)" },
        },
        required: ["division"],
      },
    },
    {
      name: "get_expiring_deals",
      description: "Find deals expiring soon in a Spanish city within a given time window.",
      inputSchema: {
        type: "object" as const,
        properties: {
          division: { type: "string", description: "Spanish city (e.g. 'madrid', 'barcelona')" },
          hours: { type: "number", description: "Time window in hours from now (default 24)" },
          limit: { type: "number", description: "Maximum results to return (1–50, default 10)" },
        },
        required: ["division"],
      },
    },
    {
      name: "get_deal_stats",
      description: "Get aggregate statistics for all deals in a Spanish city: pricing, discounts, categories.",
      inputSchema: {
        type: "object" as const,
        properties: {
          division: { type: "string", description: "Spanish city (e.g. 'madrid', 'barcelona')" },
        },
        required: ["division"],
      },
    },
    {
      name: "compare_deals",
      description: "Compare two deals side-by-side by their IDs within a Spanish city.",
      inputSchema: {
        type: "object" as const,
        properties: {
          division: { type: "string", description: "Spanish city (e.g. 'madrid', 'barcelona')" },
          deal_id_a: { type: "string", description: "ID of the first deal" },
          deal_id_b: { type: "string", description: "ID of the second deal" },
        },
        required: ["division", "deal_id_a", "deal_id_b"],
      },
    },
    {
      name: "get_deal_by_url",
      description: "Look up a specific Groupon.es deal by its URL.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "Full groupon.es URL of the deal" },
          division: { type: "string", description: "Optionally narrow search to one city" },
        },
        required: ["url"],
      },
    },
  ],
}));

function parseOrError<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): { ok: true; data: z.output<S> } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data as z.output<S> };
  return {
    ok: false,
    error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  };
}

function textResponse(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errorResponse(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const rawArgs = request.params.arguments ?? {};

  switch (request.params.name) {
    case "search_deals": {
      const parsed = parseOrError(SearchSchema, rawArgs);
      if (!parsed.ok) return errorResponse(parsed.error);
      return textResponse(await handleSearch(parsed.data));
    }
    case "get_best_value_deals": {
      const parsed = parseOrError(BestValueSchema, rawArgs);
      if (!parsed.ok) return errorResponse(parsed.error);
      return textResponse(await handleBestValue(parsed.data));
    }
    case "get_expiring_deals": {
      const parsed = parseOrError(ExpiringSchema, rawArgs);
      if (!parsed.ok) return errorResponse(parsed.error);
      return textResponse(await handleExpiring(parsed.data));
    }
    case "get_deal_stats": {
      const parsed = parseOrError(StatsSchema, rawArgs);
      if (!parsed.ok) return errorResponse(parsed.error);
      return textResponse(await handleStats(parsed.data));
    }
    case "compare_deals": {
      const parsed = parseOrError(CompareSchema, rawArgs);
      if (!parsed.ok) return errorResponse(parsed.error);
      return textResponse(await handleCompare(parsed.data));
    }
    case "get_deal_by_url": {
      const parsed = parseOrError(DealByUrlSchema, rawArgs);
      if (!parsed.ok) return errorResponse(parsed.error);
      return textResponse(await handleDealByUrl(parsed.data));
    }
    default:
      return errorResponse(`Unknown tool: ${request.params.name}`);
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
