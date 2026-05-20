# Angel One MCP Server — Setup Guide for LLM Agents

You are setting up the Angel One MCP server. Follow these steps exactly.

## 1. Get credentials from the user

Ask the user for their Angel One SmartAPI credentials. They can find them at https://smartapi.angelone.in/

- `ANGEL_API_KEY` — SmartAPI app key
- `ANGEL_CLIENT_ID` — Trading account client code
- `ANGEL_PASSWORD` — Account MPIN/password
- `ANGEL_TOTP_SECRET` — Base32 secret from TOTP authenticator setup (not the QR code)

## 2. Add to MCP client config

Register the server using `npx` (installs automatically from npm):

```json
{
  "mcpServers": {
    "angel-one": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "angel-one-mcp"],
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

## 3. Verify

Call the `login` tool to verify the connection works. Then call `get_profile` to confirm the user's account is accessible.

## Available Tools

**Auth:** `login`, `logout`

**Portfolio:** `get_holdings`, `get_all_holdings`, `get_positions`, `get_funds`, `convert_position`

**Orders:** `place_order`, `modify_order`, `cancel_order`, `get_order_book`, `get_trade_book`, `get_order_details`

**Market Data:** `get_ltp`, `search_scrip`, `get_candle_data`, `get_market_quote`, `get_oi_data`, `get_option_greeks`, `get_gainers_losers`, `get_put_call_ratio`, `get_oi_buildup`, `get_nse_intraday`, `get_bse_intraday`

**GTT:** `create_gtt_rule`, `modify_gtt_rule`, `cancel_gtt_rule`, `get_gtt_rule_details`, `get_gtt_rule_list`

**Calculator:** `estimate_margin`, `estimate_charges`

**User:** `get_profile`

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
- Package: https://www.npmjs.com/package/angel-one-mcp
