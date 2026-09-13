#!/usr/bin/env node
/**
 * @mcpx-digital/i18n-keys — MCP server for locale key comparison.
 * Local JSON/YAML files only. Transport: stdio.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { compareLocales, findEmptyTranslations, listKeys } from "./lib.js";

const LOCAL = "Local locale JSON/YAML files only — does not call translation APIs.";

const TOOLS = [
  {
    name: "compare_locales",
    description: `Compare locale files for missing/extra keys vs a base locale. Supports flat and nested keys. ${LOCAL}`,
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Paths to locale JSON/YAML files (min 2).",
          minItems: 2,
        },
        baseLocale: {
          type: "string",
          description: "Base locale file name or path fragment (default: first file).",
        },
      },
      required: ["files"],
    },
  },
  {
    name: "find_empty_translations",
    description: `Find empty/null/whitespace-only translation values in locale files. ${LOCAL}`,
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Paths to locale JSON/YAML files.",
          minItems: 1,
        },
      },
      required: ["files"],
    },
  },
  {
    name: "list_keys",
    description: `List flattened keys for a single locale file. ${LOCAL}`,
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to locale JSON/YAML." },
      },
      required: ["filePath"],
    },
  },
];

const handlers = {
  compare_locales: compareLocales,
  find_empty_translations: findEmptyTranslations,
  list_keys: listKeys,
};

const server = new Server(
  { name: "i18n-keys", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};
  const handler = handlers[name];
  if (!handler) {
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    const result = await handler(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }, null, 2) }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
