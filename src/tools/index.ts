import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AngelOneAPI } from "@/api.js";
import type { SafetyConfig } from "@/config.js";
import { registerAuthTools } from "@/tools/auth.js";
import { registerCalculatorTools } from "@/tools/calculator.js";
import { registerGttTools } from "@/tools/gtt.js";
import { registerMarketTools } from "@/tools/market.js";
import { registerOrderTools } from "@/tools/orders.js";
import { registerPortfolioTools } from "@/tools/portfolio.js";
import { registerUserTools } from "@/tools/user.js";

export function registerAllTools(server: McpServer, api: AngelOneAPI, config: SafetyConfig): void {
  registerAuthTools(server, api);
  registerUserTools(server, api);
  registerPortfolioTools(server, api, config);
  registerOrderTools(server, api, config);
  registerMarketTools(server, api);
  registerGttTools(server, api, config);
  registerCalculatorTools(server, api);
}
