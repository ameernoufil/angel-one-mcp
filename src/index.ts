#!/usr/bin/env node

import "dotenv/config";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AngelOneAPI } from "@/api.js";
import { ConfigError, REQUIRED_ENV_VARS, loadConfig } from "@/config.js";
import { registerAllTools } from "@/tools/index.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as {
  version: string;
};

const HELP_TEXT = `angel-one-mcp v${pkg.version}

MCP stdio server for Angel One SmartAPI.

Usage:
  npx -y angel-one-mcp

Required environment variables:
${REQUIRED_ENV_VARS.map((name) => `  - ${name}`).join("\n")}

Optional safety limits:
  - SOFT_MAX_ORDER_QTY (default: 25)
  - HARD_MAX_ORDER_QTY (default: 100)
  - SOFT_MAX_ORDER_VALUE (default: 10000)
  - HARD_MAX_ORDER_VALUE (default: 100000)

Example MCP client config:
{
  "mcpServers": {
    "angel-one": {
      "command": "npx",
      "args": ["-y", "angel-one-mcp"],
      "env": {
        "ANGEL_API_KEY": "your_smartapi_key",
        "ANGEL_CLIENT_ID": "your_client_id",
        "ANGEL_PASSWORD": "your_mpin",
        "ANGEL_TOTP_SECRET": "your_base32_totp_secret"
      }
    }
  }
}
`;

function wantsHelp(args: string[]): boolean {
  return args.includes("--help") || args.includes("-h");
}

async function main(): Promise<void> {
  if (wantsHelp(process.argv.slice(2))) {
    process.stdout.write(HELP_TEXT);
    return;
  }

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
}

try {
  await main();
} catch (error) {
  if (error instanceof ConfigError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  throw error;
}
