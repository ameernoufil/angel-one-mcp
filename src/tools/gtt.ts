import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AngelOneAPI } from "@/api.js";
import type { SafetyConfig } from "@/config.js";
import { validateOrderLimits } from "@/guards.js";

export function registerGttTools(server: McpServer, api: AngelOneAPI, config: SafetyConfig): void {
  server.registerTool(
    "create_gtt_rule",
    {
      description:
        "Create a GTT (Good Till Triggered) rule. When trigger price is hit, the order is automatically placed.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        tradingsymbol: z.string().describe("Trading symbol (e.g. SBIN-EQ)"),
        symboltoken: z.string().describe("Symbol token from search_scrip"),
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        producttype: z
          .enum(["DELIVERY", "CARRYFORWARD", "MARGIN", "INTRADAY", "BO"])
          .describe("Product type"),
        transactiontype: z.enum(["BUY", "SELL"]).describe("BUY or SELL"),
        price: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .describe("Limit price for the order"),
        qty: z.string().regex(/^\d+$/, "Must be a positive integer").describe("Quantity to trade"),
        disclosedqty: z
          .string()
          .regex(/^\d+$/, "Must be a non-negative integer")
          .describe("Disclosed quantity"),
        triggerprice: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .describe("Price at which the order triggers"),
        timeperiod: z
          .string()
          .regex(/^\d+$/, "Must be a positive integer")
          .describe("Validity in days (e.g. 365)"),
        force: z.boolean().optional().describe("Set true to bypass soft quantity/value limits"),
      },
    },
    async (params) => {
      try {
        const qty = Number(params.qty);
        const price = Number(params.price);
        const disclosedQty = Number(params.disclosedqty);
        if (disclosedQty > qty) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: `Disclosed quantity (${disclosedQty}) cannot exceed total quantity (${qty})`,
                }),
              },
            ],
            isError: true,
          };
        }
        const guard = validateOrderLimits(config, qty, price, params.force ?? false);
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
        const { force: _, ...gttParams } = params;
        const data = await api.createGttRule(gttParams);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, message: "GTT rule created", data }, null, 2),
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
    "modify_gtt_rule",
    {
      description: "Modify an existing GTT rule. Change price, quantity, or trigger price.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        id: z.string().describe("GTT rule ID to modify"),
        tradingsymbol: z.string().describe("Trading symbol (e.g. SBIN-EQ)"),
        symboltoken: z.string().describe("Symbol token from search_scrip"),
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        producttype: z
          .enum(["DELIVERY", "CARRYFORWARD", "MARGIN", "INTRADAY", "BO"])
          .describe("Product type"),
        transactiontype: z.enum(["BUY", "SELL"]).describe("BUY or SELL"),
        price: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .describe("Limit price for the order"),
        qty: z.string().regex(/^\d+$/, "Must be a positive integer").describe("Quantity to trade"),
        disclosedqty: z
          .string()
          .regex(/^\d+$/, "Must be a non-negative integer")
          .describe("Disclosed quantity"),
        triggerprice: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .describe("Price at which the order triggers"),
        timeperiod: z
          .string()
          .regex(/^\d+$/, "Must be a positive integer")
          .describe("Validity in days (e.g. 365)"),
        force: z.boolean().optional().describe("Set true to bypass soft quantity/value limits"),
      },
    },
    async (params) => {
      try {
        const qty = Number(params.qty);
        const price = Number(params.price);
        const guard = validateOrderLimits(config, qty, price, params.force ?? false);
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
        const { force: _, ...gttParams } = params;
        const data = await api.modifyGttRule(gttParams);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `GTT rule ${params.id} modified`,
                  data,
                },
                null,
                2,
              ),
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
    "cancel_gtt_rule",
    {
      description: "Cancel an existing GTT rule by ID.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        id: z.string().describe("GTT rule ID to cancel"),
        symboltoken: z.string().describe("Symbol token"),
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
      },
    },
    async (params) => {
      try {
        await api.cancelGttRule(params);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `GTT rule ${params.id} cancelled`,
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

  server.registerTool(
    "get_gtt_rule_details",
    {
      description: "Get details of a specific GTT rule by ID.",
      annotations: { openWorldHint: true },
      inputSchema: {
        id: z.string().describe("GTT rule ID"),
      },
    },
    async (params) => {
      try {
        const data = await api.getGttRuleDetails(params);
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
    "get_gtt_rule_list",
    {
      description: "List GTT rules filtered by status. Returns paginated results.",
      annotations: { openWorldHint: true },
      inputSchema: {
        status: z
          .string()
          .describe("Comma-separated statuses: FORALL, NEW, ACTIVE, SENTTOEXCHANGE, CANCELLED"),
        page: z.string().describe("Page number (e.g. 1)"),
        count: z.string().describe("Number of rules per page (e.g. 10)"),
      },
    },
    async (params) => {
      try {
        const statusArr = params.status.split(",").map((s) => s.trim());
        const page = Number(params.page);
        const count = Number(params.count);
        if (isNaN(page) || isNaN(count) || page < 1 || count < 1) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: "page and count must be positive numbers",
                }),
              },
            ],
            isError: true,
          };
        }
        const data = await api.getGttRuleList({
          status: statusArr,
          page,
          count,
        });
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
}
