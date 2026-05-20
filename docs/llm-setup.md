# Angel One MCP Server — Setup Guide for LLM Agents

You are setting up the Angel One MCP server. Follow these steps exactly.

## 1. Clone and build

```bash
git clone https://github.com/ameernoufil/angel-one-mcp.git
cd angel-one-mcp
npm install
npm run build
```

## 2. Configure environment

Create a `.env` file in the project root with the user's Angel One credentials:

```env
ANGEL_API_KEY=<user's SmartAPI key from smartapi.angelone.in>
ANGEL_CLIENT_ID=<user's trading account client code>
ANGEL_PASSWORD=<user's account MPIN/password>
ANGEL_TOTP_SECRET=<user's base32 TOTP secret>
```

Ask the user for these values. They can find them at https://smartapi.angelone.in/

## 3. Register as MCP server

Add the server to the MCP client configuration. The command to run is:

```
node <absolute-path-to-project>/build/index.js
```

The server uses stdio transport. Environment variables must be passed from the `.env` file or set in the MCP client config.

Example MCP config:

```json
{
  "mcpServers": {
    "angel-one": {
      "type": "stdio",
      "command": "node",
      "args": ["<absolute-path-to-project>/build/index.js"],
      "env": {
        "ANGEL_API_KEY": "<key>",
        "ANGEL_CLIENT_ID": "<id>",
        "ANGEL_PASSWORD": "<password>",
        "ANGEL_TOTP_SECRET": "<secret>"
      }
    }
  }
}
```

## 4. Verify

Call the `login` tool to verify the connection works. Then call `get_profile` to confirm the user's account is accessible.

## Available Tools

| Category | Tools |
|----------|-------|
| Auth | `login`, `logout` |
| Portfolio | `get_holdings`, `get_all_holdings`, `get_positions`, `get_funds`, `convert_position` |
| Orders | `place_order`, `modify_order`, `cancel_order`, `get_order_book`, `get_trade_book`, `get_order_details` |
| Market Data | `get_ltp`, `search_scrip`, `get_candle_data`, `get_market_quote`, `get_oi_data`, `get_option_greeks`, `get_gainers_losers`, `get_put_call_ratio`, `get_oi_buildup`, `get_nse_intraday`, `get_bse_intraday` |
| GTT | `create_gtt_rule`, `modify_gtt_rule`, `cancel_gtt_rule`, `get_gtt_rule_details`, `get_gtt_rule_list` |
| Calculator | `estimate_margin`, `estimate_charges` |
| User | `get_profile` |

## Safety Guards

Order-placing tools enforce quantity and value limits to prevent accidental large trades.

- **Soft limits** (bypass with `force: true`): max 25 qty, max ₹10,000 value
- **Hard limits** (env var change + restart only): max 100 qty, max ₹1,00,000 value

Soft limit env vars: `SOFT_MAX_ORDER_QTY`, `SOFT_MAX_ORDER_VALUE`
Hard limit env vars: `HARD_MAX_ORDER_QTY`, `HARD_MAX_ORDER_VALUE`

## Notes

- Authentication is lazy — first API call triggers login automatically
- TOTP is generated automatically from the base32 secret, no manual codes needed
- Tokens are stored internally and refresh proactively before 24hr expiry
- MARKET orders auto-fetch LTP to enforce value-based safety limits
