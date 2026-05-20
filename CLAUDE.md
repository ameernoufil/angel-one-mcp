# Angel One MCP Server

TypeScript MCP server exposing Angel One SmartAPI as tools for LLM clients.

## Architecture

- **Direct API calls** via native `fetch()` — no Angel One SDK packages
- **MCP SDK** (`@modelcontextprotocol/sdk`) with stdio transport
- **Auto TOTP** generation from base32 secret via `otpauth`
- **Lazy auth** — first API call triggers login automatically
- **Token refresh** — proactive refresh before 24hr expiry, 401 retry fallback

## Project Structure

```
docs/
└── llm-setup.md        # LLM-readable setup instructions (linked from README)
src/
├── index.ts            # Entry: McpServer + StdioServerTransport
├── config.ts           # Env var loading — exports Credentials, SafetyConfig, Config
├── api.ts              # AngelOneAPI class — all fetch calls, auth, token management
├── guards.ts           # Two-tier order quantity/value safety guards (uses SafetyConfig only)
├── types.ts            # Interfaces, error types
├── totp.ts             # TOTP generation
└── tools/
    ├── index.ts        # registerAllTools() barrel — receives SafetyConfig, not credentials
    ├── auth.ts         # login, logout
    ├── user.ts         # get_profile
    ├── portfolio.ts    # get_holdings, get_positions, get_funds, get_all_holdings, convert_position
    ├── orders.ts       # place_order, modify_order, cancel_order, get_order_book, get_trade_book, get_order_details
    ├── market.ts       # get_ltp, search_scrip, get_candle_data, get_market_quote, get_oi_data, get_option_greeks, get_gainers_losers, get_put_call_ratio, get_oi_buildup, get_nse_intraday, get_bse_intraday
    ├── gtt.ts          # create_gtt_rule, modify_gtt_rule, cancel_gtt_rule, get_gtt_rule_details, get_gtt_rule_list
    └── calculator.ts   # estimate_margin, estimate_charges
CONTRIBUTING.md         # Contributor guide
.nvmrc                  # Node version for nvm users
```

## Commands

```bash
npm run build    # Compile TypeScript
npm start        # Run MCP server (stdio)
npm run dev      # Watch mode
```

## Using via npx (Recommended)

Install and run directly from npm without cloning:

```bash
npx -y angel-one-mcp
```

Or add to your MCP client config (Claude Desktop, Claude Code, etc.):

```json
{
  "mcpServers": {
    "angel-one": {
      "command": "npx",
      "args": ["-y", "angel-one-mcp"],
      "env": {
        "ANGEL_API_KEY": "your_key",
        "ANGEL_CLIENT_ID": "your_id",
        "ANGEL_PASSWORD": "your_password",
        "ANGEL_TOTP_SECRET": "your_secret"
      }
    }
  }
}
```

Environment variables are required in `.env` or process environment.

## Publishing

Publishing is automated via GitHub Actions with npm Trusted Publishing (OIDC). Push a SemVer tag to trigger:

```bash
git tag v1.0.5
git push origin v1.0.5
```

No manual `npm publish` or `NPM_TOKEN` needed.

See `.github/workflows/publish.yml` for workflow details.

## Environment Variables

Required in `.env` or process environment:
- `ANGEL_API_KEY` — SmartAPI key from smartapi.angelone.in
- `ANGEL_CLIENT_ID` — Trading account client code
- `ANGEL_PASSWORD` — Account MPIN/password
- `ANGEL_TOTP_SECRET` — Base32 secret from TOTP authenticator setup

## Safety Limits

Two-tier order guard on all destructive tools (place_order, modify_order, create_gtt_rule, modify_gtt_rule, convert_position):

- MARKET orders auto-fetch LTP to enforce value limits (blocks if LTP unavailable unless `force: true`)
- Numeric inputs (quantity, price) validated with regex — no hex/scientific notation
- `disclosedqty` validated against `qty` in GTT tools
- Credentials (`Config`) never passed to tool layer — only `SafetyConfig` (limits)

**Soft limits** (bypassable with `force: true` param):
- `SOFT_MAX_ORDER_QTY` — default 25
- `SOFT_MAX_ORDER_VALUE` — default 10000 (₹10K)

**Hard limits** (env var change + restart only):
- `HARD_MAX_ORDER_QTY` — default 100
- `HARD_MAX_ORDER_VALUE` — default 100000 (₹1L)

Soft limits must be ≤ hard limits (validated at startup).

## API Base URL

`https://apiconnect.angelone.in`

## Adding New Tools

1. Add API method to `src/api.ts`
2. Add types to `src/types.ts`
3. Create or update tool file in `src/tools/`
4. Register in `src/tools/index.ts` if new file

## License

MIT
