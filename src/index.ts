#!/usr/bin/env node

import "dotenv/config";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AngelOneAPI } from "@/api.js";
import { loadConfig } from "@/config.js";
import { registerAllTools } from "@/tools/index.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as {
  version: string;
};

const config = loadConfig();
const api = new AngelOneAPI(config);

const safetyConfig = {
  softMaxOrderQty: config.softMaxOrderQty,
  hardMaxOrderQty: config.hardMaxOrderQty,
  softMaxOrderValue: config.softMaxOrderValue,
  hardMaxOrderValue: config.hardMaxOrderValue,
};

const server = new McpServer({
  name: "angel-one",
  version: pkg.version,
});

registerAllTools(server, api, safetyConfig);

const transport = new StdioServerTransport();
await server.connect(transport);
