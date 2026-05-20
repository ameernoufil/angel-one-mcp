import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AngelOneAPI } from "@/api.js";
import type { SafetyConfig } from "@/config.js";
import { validateOrderLimits } from "@/guards.js";
import type { LtpData, OrderItem, PlaceOrderData, TradeItem } from "@/types.js";

export function registerOrderTools(
  server: McpServer,
  api: AngelOneAPI,
  config: SafetyConfig,
): void {
  server.registerTool(
    "place_order",
    {
      description:
        "Place a buy/sell order on Angel One. Supports NORMAL, STOPLOSS, AMO, ROBO varieties. Returns order ID on success.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        variety: z.enum(["NORMAL", "STOPLOSS", "AMO", "ROBO"]).describe("Order variety"),
        tradingsymbol: z.string().describe("Trading symbol (e.g. RELIANCE-EQ)"),
        symboltoken: z.string().describe("Symbol token from search_scrip"),
        transactiontype: z.enum(["BUY", "SELL"]).describe("BUY or SELL"),
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        ordertype: z
          .enum(["MARKET", "LIMIT", "STOPLOSS_LIMIT", "STOPLOSS_MARKET"])
          .describe("Order type"),
        producttype: z
          .enum(["DELIVERY", "CARRYFORWARD", "MARGIN", "INTRADAY", "BO"])
          .describe("Product type"),
        duration: z.enum(["DAY", "IOC"]).describe("Order duration"),
        quantity: z
          .string()
          .regex(/^\d+$/, "Must be a positive integer")
          .describe("Quantity to trade"),
        price: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .optional()
          .describe("Limit price (for LIMIT orders)"),
        squareoff: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .optional()
          .describe("Square off value (for BO orders)"),
        stoploss: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .optional()
          .describe("Stop loss value (for BO/SL orders)"),
        triggerprice: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .optional()
          .describe("Trigger price (for SL orders)"),
        force: z.boolean().optional().describe("Set true to bypass soft quantity/value limits"),
      },
    },
    async (params) => {
      try {
        const qty = Number(params.quantity);
        let price = params.price ? Number(params.price) : null;

        if (
          price === null &&
          (params.ordertype === "MARKET" || params.ordertype === "STOPLOSS_MARKET")
        ) {
          try {
            const ltpData = await api.getLtpData<LtpData>({
              exchange: params.exchange,
              tradingsymbol: params.tradingsymbol,
              symboltoken: params.symboltoken,
            });
            if (ltpData?.ltp) {
              price = ltpData.ltp;
            }
          } catch {
            if (!params.force) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify({
                      success: false,
                      error:
                        "Cannot verify order value: LTP lookup failed for MARKET order. Pass force: true to bypass value safety check.",
                    }),
                  },
                ],
                isError: true,
              };
            }
          }
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
        const { force: _, ...orderParams } = params;
        const data = await api.placeOrder<PlaceOrderData>(orderParams);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: "Order placed",
                  orderid: data?.orderid,
                  ...(guard.warning && { warning: guard.warning }),
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
    "modify_order",
    {
      description:
        "Modify an existing pending order. Change price, quantity, order type, or trigger price.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        variety: z.enum(["NORMAL", "STOPLOSS", "AMO", "ROBO"]).describe("Order variety"),
        orderid: z
          .string()
          .regex(/^\d+$/, "Must contain only digits")
          .describe("Order ID to modify"),
        ordertype: z
          .enum(["MARKET", "LIMIT", "STOPLOSS_LIMIT", "STOPLOSS_MARKET"])
          .describe("New order type"),
        producttype: z
          .enum(["DELIVERY", "CARRYFORWARD", "MARGIN", "INTRADAY", "BO"])
          .describe("Product type"),
        duration: z.enum(["DAY", "IOC"]).describe("Order duration"),
        price: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .describe("New price"),
        quantity: z.string().regex(/^\d+$/, "Must be a positive integer").describe("New quantity"),
        tradingsymbol: z.string().describe("Trading symbol"),
        symboltoken: z.string().describe("Symbol token"),
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        triggerprice: z
          .string()
          .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
          .optional()
          .describe("New trigger price (for SL orders)"),
        force: z.boolean().optional().describe("Set true to bypass soft quantity/value limits"),
      },
    },
    async (params) => {
      try {
        const qty = Number(params.quantity);
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
        const { force: _, ...orderParams } = params;
        await api.modifyOrder(orderParams);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Order ${params.orderid} modified`,
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
    "cancel_order",
    {
      description: "Cancel a pending order by order ID and variety.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        variety: z.enum(["NORMAL", "STOPLOSS", "AMO", "ROBO"]).describe("Order variety"),
        orderid: z
          .string()
          .regex(/^\d+$/, "Must contain only digits")
          .describe("Order ID to cancel"),
      },
    },
    async (params) => {
      try {
        await api.cancelOrder(params);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Order ${params.orderid} cancelled`,
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
    "get_order_book",
    {
      description:
        "Get all orders for today: pending, executed, rejected. Shows status, prices, quantities.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getOrderBook<OrderItem[]>();
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
    "get_trade_book",
    {
      description: "Get executed trades for today: fill prices, quantities, timestamps.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getTradeBook<TradeItem[]>();
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
    "get_order_details",
    {
      description: "Get detailed information for a specific order by its order ID.",
      annotations: { openWorldHint: true },
      inputSchema: {
        orderid: z.string().describe("Order ID to get details for"),
      },
    },
    async (params) => {
      try {
        const data = await api.getOrderDetails<OrderItem>(params.orderid);
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
