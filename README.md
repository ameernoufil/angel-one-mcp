# Angel One MCP Server

[![npm](https://img.shields.io/npm/v/angel-one-mcp)](https://www.npmjs.com/package/angel-one-mcp)

TypeScript [Model Context Protocol](https://modelcontextprotocol.io) server for [Angel One SmartAPI](https://smartapi.angelone.in/).

Use it from Claude, Cursor, Copilot, or any MCP client to:
- place and manage orders
- read holdings, positions, and funds
- fetch market data, candles, OI, Greeks, and movers
- manage GTT rules
- estimate charges and margin

## Highlights

- Direct `fetch()` integration. No Angel One SDK dependency.
- Auto TOTP generation from your base32 secret.
- Lazy login with token refresh in API layer.
- Safety guard for trading mutations with soft and hard limits.
- stdio MCP server. Works well with `npx`.

## Quick Start

### Option A: Use with `npx` (recommended)

Add this to your MCP client config:

```json
{
  "mcpServers": {
    "angel-one": {
      "type": "stdio",
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
```

### Option B: Run from source

```bash
git clone https://github.com/ameernoufil/angel-one-mcp.git
cd angel-one-mcp
npm install
cp .env.example .env
npm run build
npm start
```

If running from source, point your MCP client to `build/index.js`.

## Environment Variables

Required:
- `ANGEL_API_KEY`
- `ANGEL_CLIENT_ID`
- `ANGEL_PASSWORD`
- `ANGEL_TOTP_SECRET`

Optional safety limits:
- `SOFT_MAX_ORDER_QTY` default `25`
- `HARD_MAX_ORDER_QTY` default `100`
- `SOFT_MAX_ORDER_VALUE` default `10000`
- `HARD_MAX_ORDER_VALUE` default `100000`

Example `.env`:

```env
ANGEL_API_KEY=your_smartapi_key
ANGEL_CLIENT_ID=your_client_id
ANGEL_PASSWORD=your_mpin
ANGEL_TOTP_SECRET=your_base32_totp_secret
```

## Safety Model

Trading mutations are guarded.

Soft limits block by default and can be overridden with `force: true`.
Hard limits cannot be bypassed without changing env vars and restarting the server.

Guarded operations include:
- `place_order`
- `modify_order`
- `create_gtt_rule`
- `modify_gtt_rule`
- `convert_position`

For MARKET orders, the server attempts LTP-based value checks before allowing the request.

## Tool Coverage

- **Auth:** login and logout
- **Portfolio:** holdings, positions, funds, conversion
- **Orders:** place, modify, cancel, book lookup, trade lookup
- **Market:** search, LTP, quotes, candles, OI, Greeks, movers, PCR
- **GTT:** create, modify, cancel, list, inspect
- **Calculator:** margin and brokerage estimates
- **User:** profile

For an agent-focused onboarding prompt, see [`docs/llm-setup.md`](docs/llm-setup.md).

## Development

Requirements:
- Node.js 18+

Commands:

```bash
npm install
npm run build
npm run lint
npm run lint:fix
npm run format
npm run dev
npm start
```

## Architecture Notes

- Entry point: `src/index.ts`
- API client and auth flow: `src/api.ts`
- Config and safety limits: `src/config.ts`
- Order guard: `src/guards.ts`
- Tool registration: `src/tools/index.ts`
- Tool implementations: `src/tools/*.ts`

## License

[MIT](LICENSE)
