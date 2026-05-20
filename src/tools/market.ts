import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AngelOneAPI } from "@/api.js";
import type { CandleData, LtpData, SearchScripItem } from "@/types.js";

export function registerMarketTools(server: McpServer, api: AngelOneAPI): void {
  server.registerTool(
    "get_ltp",
    {
      description: "Get last traded price for a symbol. Also returns open, high, low, close.",
      annotations: { openWorldHint: true },
      inputSchema: {
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        tradingsymbol: z.string().describe("Trading symbol (e.g. RELIANCE-EQ)"),
        symboltoken: z.string().describe("Symbol token from search_scrip"),
      },
    },
    async (params) => {
      try {
        const data = await api.getLtpData<LtpData>(params);
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
    "search_scrip",
    {
      description:
        "Search for trading instruments by name. Returns symbol tokens needed for other tools.",
      annotations: { openWorldHint: true },
      inputSchema: {
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange to search"),
        searchscrip: z.string().describe("Search query (e.g. RELIANCE, NIFTY)"),
      },
    },
    async (params) => {
      try {
        const data = await api.searchScrip<SearchScripItem[]>(params);
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
    "get_candle_data",
    {
      description:
        "Get historical OHLCV candle data for a symbol. Intervals: ONE_MINUTE, FIVE_MINUTE, FIFTEEN_MINUTE, THIRTY_MINUTE, ONE_HOUR, ONE_DAY.",
      annotations: { openWorldHint: true },
      inputSchema: {
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        symboltoken: z.string().describe("Symbol token"),
        interval: z
          .enum([
            "ONE_MINUTE",
            "FIVE_MINUTE",
            "FIFTEEN_MINUTE",
            "THIRTY_MINUTE",
            "ONE_HOUR",
            "ONE_DAY",
          ])
          .describe("Candle interval"),
        fromdate: z.string().describe("Start date-time (YYYY-MM-DD HH:mm)"),
        todate: z.string().describe("End date-time (YYYY-MM-DD HH:mm)"),
      },
    },
    async (params) => {
      try {
        const data = await api.getCandleData<CandleData>(params);
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
    "get_market_quote",
    {
      description:
        "Get market quote data. Modes: FULL (all fields), OHLC, LTP. Pass exchange and token list.",
      annotations: { openWorldHint: true },
      inputSchema: {
        mode: z.enum(["FULL", "OHLC", "LTP"]).describe("Quote mode: FULL, OHLC, or LTP"),
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        symboltoken: z.string().describe("Comma-separated symbol tokens (e.g. '3045,2885')"),
      },
    },
    async (params) => {
      try {
        const tokens = params.symboltoken.split(",").map((t) => t.trim());
        const data = await api.getMarketQuote({
          mode: params.mode,
          exchangeTokens: { [params.exchange]: tokens },
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

  server.registerTool(
    "get_oi_data",
    {
      description:
        "Get historical Open Interest data for derivatives. Same intervals as candle data.",
      annotations: { openWorldHint: true },
      inputSchema: {
        exchange: z.enum(["NSE", "BSE", "NFO", "MCX", "BFO", "CDS"]).describe("Exchange"),
        symboltoken: z.string().describe("Symbol token"),
        interval: z
          .enum([
            "ONE_MINUTE",
            "FIVE_MINUTE",
            "FIFTEEN_MINUTE",
            "THIRTY_MINUTE",
            "ONE_HOUR",
            "ONE_DAY",
          ])
          .describe("Candle interval"),
        fromdate: z.string().describe("Start date-time (YYYY-MM-DD HH:mm)"),
        todate: z.string().describe("End date-time (YYYY-MM-DD HH:mm)"),
      },
    },
    async (params) => {
      try {
        const data = await api.getOIData(params);
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
    "get_option_greeks",
    {
      description:
        "Get option Greeks (Delta, Gamma, Theta, Vega, IV) for all strikes of a given underlying and expiry.",
      annotations: { openWorldHint: true },
      inputSchema: {
        name: z.string().describe("Symbol name (e.g. NIFTY, BANKNIFTY, SBIN)"),
        expirydate: z.string().describe("Expiry date (e.g. 29MAY2025)"),
      },
    },
    async (params) => {
      try {
        const data = await api.getOptionGreeks(params);
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
    "get_gainers_losers",
    {
      description: "Get top gainers or losers by OI or price change percentage for derivatives.",
      annotations: { openWorldHint: true },
      inputSchema: {
        datatype: z
          .enum(["PercOIGainers", "PercOILosers", "PercPriceGainers", "PercPriceLosers"])
          .describe("Data type filter"),
        expirytype: z.enum(["NEAR", "NEXT", "FAR"]).describe("Expiry type"),
      },
    },
    async (params) => {
      try {
        const data = await api.getGainersLosers(params);
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
    "get_put_call_ratio",
    {
      description: "Get Put-Call Ratio data for the derivatives market.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getPutCallRatio();
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
    "get_oi_buildup",
    {
      description:
        "Get OI Buildup analysis: Long Buildup, Short Buildup, Short Covering, Long Unwinding.",
      annotations: { openWorldHint: true },
      inputSchema: {
        expirytype: z.enum(["NEAR", "NEXT", "FAR"]).describe("Expiry type"),
        datatype: z
          .enum(["Long Buildup", "Short Buildup", "Short Covering", "Long Unwinding"])
          .describe("OI buildup category"),
      },
    },
    async (params) => {
      try {
        const data = await api.getOIBuildup(params);
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
    "get_nse_intraday",
    {
      description: "Get top NSE intraday movers data.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getNseIntraday();
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
    "get_bse_intraday",
    {
      description: "Get top BSE intraday movers data.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getBseIntraday();
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
