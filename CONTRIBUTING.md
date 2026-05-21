# Contributing

Thanks for contributing to Angel One MCP Server.

## Local Setup

```bash
git clone https://github.com/ameernoufil/angel-one-mcp.git
cd angel-one-mcp
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with valid Angel One credentials if you need to exercise authenticated flows.

## Day-to-Day Commands

```bash
npm run build
npm run lint
npm run lint:fix
npm run format
npm start
npm run dev
```

Before opening a PR, run at least:

```bash
npm run build
npm run lint
```

## Project Rules

- Use direct `fetch()` calls. Do not add Angel One SDK packages.
- Keep tool handlers thin. Put HTTP logic in `src/api.ts`.
- Keep shared validation and trade-safety logic in `src/guards.ts` or helpers.
- Preserve strict TypeScript.
- Use `@/` path aliases. Do not add relative imports from `.` or `..`.
- Avoid `any` and non-null assertions.
- Treat trading mutations as safety-sensitive changes.

## Adding or Changing a Tool

1. Add or update the API method in `src/api.ts`
2. Add or update types in `src/types.ts`
3. Add or update the tool handler in `src/tools/`
4. Register new tool groups in `src/tools/index.ts`
5. Run `npm run build`
6. Run `npm run lint`

## Pull Requests

1. Branch from `main`
2. Keep changes focused
3. Include docs updates when user-facing behavior changes
4. Ensure `npm run build` and `npm run lint` pass
5. Open PR with clear summary and testing notes

## Commit Messages

Use simple lower-case conventional commits.

Examples:
- `feat: add option greeks endpoint`
- `fix: validate gtt disclosed quantity`
- `docs: tighten project docs`

## Release Flow

npm publishing should happen from GitHub Actions, triggered by a version tag push.

Typical flow:

```bash
npm version patch
git push origin main --tags
```

Notes:
- `npm version patch` updates `package.json`, creates a commit, and creates a tag.
- Tag name must match package version, for example `v1.0.7`.
- README changes only reach npm after a new version is published.
- If release automation changes, verify `.github/workflows/publish.yml` still matches npm Trusted Publishing requirements.
