import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AngelOneAPI } from "@/api.js";
import type { SafetyConfig } from "@/config.js";
import { validateOrderLimits } from "@/guards.js";
import type { HoldingItem, PositionItem, RMSData } from "@/types.js";

export function registerPortfolioTools(
  server: McpServer,
  api: AngelOneAPI,
  config: SafetyConfig,
): void {
  server.registerTool(
    "get_holdings",
    {
      description: "Get portfolio holdings: stocks owned, quantities, average prices, P&L, LTP.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getHoldings<HoldingItem[]>();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, count: data?.length ?? 0, data }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_positions",
    {
      description:
        "Get open positions: intraday/carryforward, buy/sell qty, avg prices, unrealised P&L.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getPositions<PositionItem[]>();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, count: data?.length ?? 0, data }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_funds",
    {
      description:
        "Get available funds and margins: cash, collateral, utilised margins, net value.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getRMS<RMSData>();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, data }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_all_holdings",
    {
      description:
        "Get extended portfolio holdings with total holding value, total investment, total P&L, and P&L percentage.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getAllHoldings();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, data }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "convert_position",
    {
      description:
        "Convert an existing position from one product type to another (e.g. INTRADAY to DELIVERY).",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        symboltoken: z.string().describe("Symbol token"),
        tradingsymbol: z.string().describe("Trading symbol"),
        oldproducttype: z
          .enum(["DELIVERY", "CARRYFORWARD", "MARGIN", "INTRADAY", "BO"])
          .describe("Current product type"),
        newproducttype: z
          .enum(["DELIVERY", "CARRYFORWARD", "MARGIN", "INTRADAY", "BO"])
          .describe("Target product type to convert to"),
        transactiontype: z.enum(["BUY", "SELL"]).describe("BUY or SELL"),
        quantity: z.string().describe("Quantity to convert"),
        type: z.enum(["DAY"]).describe("Conversion type"),
        force: z.boolean().optional().describe("Set true to bypass soft quantity limits"),
      },
    },
    async (params) => {
      try {
        const qty = Number(params.quantity);
        const guard = validateOrderLimits(config, qty, null, params.force ?? false);
        if (!guard.allowed) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ success: false, error: guard.error }),
              },
            ],
            isError: true,
          };
        }
        const { force: _, ...convertParams } = params;
        await api.convertPosition(convertParams);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: "Position converted",
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
