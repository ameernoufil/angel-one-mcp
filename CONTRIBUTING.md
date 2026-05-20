# Contributing

Thanks for your interest in contributing to the Angel One MCP Server!

## Development Setup

```bash
git clone https://github.com/ameernoufil/angel-one-mcp.git
cd angel-one-mcp
npm install
cp .env.example .env   # Fill in your credentials
npm run dev             # Watch mode
```

## Code Quality

This project uses ESLint, Prettier, and commitlint with Husky pre-commit hooks.

```bash
npm run lint       # Check for lint errors
npm run lint:fix   # Auto-fix lint errors
npm run format     # Format with Prettier
npm run build      # Type-check and compile
```

All checks run automatically on commit via Husky.

## Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/). Examples:

- `feat: add new market data tool`
- `fix: handle null response from order API`
- `docs: update setup instructions`

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` and `npm run lint` pass
4. Submit a PR with a clear description of the change

## Adding a New Tool

1. Add the API method to `src/api.ts`
2. Add types to `src/types.ts`
3. Create or update a tool file in `src/tools/`
4. Register it in `src/tools/index.ts` if it's a new file

## Project Principles

- **No Angel One SDK packages** — use direct `fetch()` calls
- **Minimal dependencies** — only add what's truly needed
- **Safety first** — all order-placing tools go through the guard in `src/guards.ts`
