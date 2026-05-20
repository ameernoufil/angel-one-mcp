# Angel One MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes [Angel One SmartAPI](https://smartapi.angelone.in/) as tools for LLM clients like Claude Desktop, Claude Code, and other MCP-compatible apps.

Trade stocks, track portfolios, analyze markets, and manage orders — all through natural language.

## Features

- **30+ tools** covering orders, portfolio, market data, GTT rules, and more
- **Auto TOTP** — generates login codes automatically, no manual entry
- **Lazy authentication** — logs in on first API call, refreshes tokens proactively
- **Safety guards** — two-tier soft/hard limits on order quantity and value to prevent fat-finger trades
- **Zero SDK dependency** — direct `fetch()` calls to Angel One REST API

---

## Quick Start

> Copy the prompt below and paste it into your AI agent. It will handle the rest.

```
Install and configure the Angel One MCP server by following the instructions here:
https://raw.githubusercontent.com/ameernoufil/angel-one-mcp/main/docs/llm-setup.md
```

---

## Manual Setup

### Prerequisites

- Node.js 18+ (use `nvm use` if you have [nvm](https://github.com/nvm-sh/nvm))
- Angel One trading account
- SmartAPI key from [smartapi.angelone.in](https://smartapi.angelone.in/)
- TOTP authenticator set up on your Angel One account

### 1. Get your credentials

1. Log in to [SmartAPI portal](https://smartapi.angelone.in/)
2. Create an app to get your **API Key**
3. Note your **Client ID** (trading account code)
4. Set up TOTP and save the **Base32 secret** (shown during TOTP setup, not the QR code)

### 2. Install and configure

```bash
git clone https://github.com/ameernoufil/angel-one-mcp.git
cd angel-one-mcp
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
ANGEL_API_KEY=your_smartapi_key
ANGEL_CLIENT_ID=your_client_id
ANGEL_PASSWORD=your_mpin
ANGEL_TOTP_SECRET=your_base32_totp_secret
```

### 3. Build and run

```bash
npm run build
npm start
```

### 4. Add to your MCP client

Add to your MCP client config (e.g. Claude Desktop, Claude Code, Cursor):

```json
{
  "mcpServers": {
    "angel-one": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/angel-one-mcp/build/index.js"],
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

Or if using `.env`, omit the `env` block — the server loads `.env` automatically.

### Safety Limits Configuration

**Soft limits** (bypassable with `force: true`):

| Limit | Default | Env Var |
|-------|---------|---------|
| Max order quantity | 25 | `SOFT_MAX_ORDER_QTY` |
| Max order value | ₹10,000 | `SOFT_MAX_ORDER_VALUE` |

**Hard limits** (env var change + restart):

| Limit | Default | Env Var |
|-------|---------|---------|
| Max order quantity | 100 | `HARD_MAX_ORDER_QTY` |
| Max order value | ₹1,00,000 | `HARD_MAX_ORDER_VALUE` |

### Development

```bash
npm run dev        # Watch mode
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
npm run format     # Prettier
```

## License

[MIT](LICENSE)
