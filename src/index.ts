#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleSearch } from "./tools/search.js";
import { handleBestValue } from "./tools/bestValue.js";
import { handleExpiring } from "./tools/expiring.js";
import { handleStats } from "./tools/stats.js";
import { handleCompare } from "./tools/compare.js";
import { handleDealByUrl } from "./tools/dealByUrl.js";
import type { SearchArgs } from "./tools/search.js";
import type { BestValueArgs } from "./tools/bestValue.js";
import type { ExpiringArgs } from "./tools/expiring.js";
import type { StatsArgs } from "./tools/stats.js";
import type { CompareArgs } from "./tools/compare.js";
import type { DealByUrlArgs } from "./tools/dealByUrl.js";

const server = new Server(
  { name: "mcp-groupon-deals", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "Search for Groupon deals by query and division.",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: { type: "string" },
            division: { type: "string" },
            page: { type: "number" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "best_value",
        description: "Get the best value deals optionally filtered by division and category.",
        inputSchema: {
          type: "object" as const,
          properties: {
            division: { type: "string" },
            category: { type: "string" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "expiring",
        description: "Get deals that are expiring soon within a given number of hours.",
        inputSchema: {
          type: "object" as const,
          properties: {
            division: { type: "string" },
            hoursAhead: { type: "number" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "stats",
        description: "Get deal statistics for a division or category.",
        inputSchema: {
          type: "object" as const,
          properties: {
            division: { type: "string" },
            category: { type: "string" },
          },
        },
      },
      {
        name: "compare",
        description: "Compare two deals by their IDs.",
        inputSchema: {
          type: "object" as const,
          properties: {
            dealIdA: { type: "string" },
            dealIdB: { type: "string" },
          },
        },
      },
      {
        name: "deal_by_url",
        description: "Fetch a specific deal by its URL.",
        inputSchema: {
          type: "object" as const,
          properties: {
            url: { type: "string" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments as unknown;
  switch (request.params.name) {
    case "search":
      return (await handleSearch(args as SearchArgs)) as Record<string, unknown>;
    case "best_value":
      return (await handleBestValue(args as BestValueArgs)) as Record<string, unknown>;
    case "expiring":
      return (await handleExpiring(args as ExpiringArgs)) as Record<string, unknown>;
    case "stats":
      return (await handleStats(args as StatsArgs)) as Record<string, unknown>;
    case "compare":
      return (await handleCompare(args as CompareArgs)) as Record<string, unknown>;
    case "deal_by_url":
      return (await handleDealByUrl(args as DealByUrlArgs)) as Record<string, unknown>;
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

async function main() {
  await server.connect(new StdioServerTransport());
}

main();
