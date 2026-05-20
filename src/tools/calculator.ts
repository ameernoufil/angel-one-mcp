import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AngelOneAPI } from "@/api.js";

export function registerCalculatorTools(server: McpServer, api: AngelOneAPI): void {
  server.registerTool(
    "estimate_margin",
    {
      description:
        "Calculate margin requirements for a batch of potential orders before placing them.",
      annotations: { openWorldHint: true },
      inputSchema: {
        positions: z
          .string()
          .describe(
            'JSON array of position objects. Each: { "exchange": "NSE", "qty": "10", "price": "100.5", "productType": "INTRADAY", "token": "3045", "tradeType": "BUY" }',
          ),
      },
    },
    async (params) => {
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(params.positions);
        } catch {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error:
                    "Invalid JSON in positions. Expected an array of objects with: exchange, qty, price, productType, token, tradeType",
                }),
              },
            ],
            isError: true,
          };
        }
        if (!Array.isArray(parsed)) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: "positions must be a JSON array, not a single object",
                }),
              },
            ],
            isError: true,
          };
        }
        const data = await api.estimateMargin({ positions: parsed });
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
    "estimate_charges",
    {
      description:
        "Estimate brokerage, STT, transaction charges, GST, SEBI charges, and stamp duty for proposed trades.",
      annotations: { openWorldHint: true },
      inputSchema: {
        orders: z
          .string()
          .describe(
            'JSON array of order objects. Each: { "product_type": "DELIVERY", "transaction_type": "BUY", "quantity": "10", "price": "100.5", "exchange": "NSE", "symbol_name": "RELIANCE-EQ", "token": "2885" }',
          ),
      },
    },
    async (params) => {
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(params.orders);
        } catch {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error:
                    "Invalid JSON in orders. Expected an array of objects with: product_type, transaction_type, quantity, price, exchange, symbol_name, token",
                }),
              },
            ],
            isError: true,
          };
        }
        if (!Array.isArray(parsed)) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: "orders must be a JSON array, not a single object",
                }),
              },
            ],
            isError: true,
          };
        }
        const data = await api.estimateCharges({ orders: parsed });
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
