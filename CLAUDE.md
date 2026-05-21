# Angel One MCP Server

## Purpose

TypeScript MCP server that exposes Angel One SmartAPI as MCP tools for LLM clients.

## What belongs here

Keep this file short and action-focused. Put stable project guidance here:
- build/test commands
- architecture facts
- coding conventions
- safety rules
- common change workflow

Do **not** use this file for changelogs, release notes, marketing copy, or long setup docs.

## Key Commands

```bash
npm install
npm run build
npm run lint
npm run lint:fix
npm run format
npm start
npm run dev
```

Run `npm run build` after code changes. Run `npm run lint` before finishing.

## Architecture

- No Angel One SDK packages. Use direct `fetch()` calls to `https://apiconnect.angelone.in`.
- Entry point: `src/index.ts`
- Env + safety limits: `src/config.ts`
- API client, auth, token refresh: `src/api.ts`
- Order safety guard: `src/guards.ts`
- Shared types/errors: `src/types.ts`
- TOTP generation: `src/totp.ts`
- Tool registration barrel: `src/tools/index.ts`
- Tool groups live in `src/tools/`

## Core Behavior

- Server uses stdio transport via `@modelcontextprotocol/sdk`.
- Auth is lazy: first API call can trigger login.
- TOTP is generated from `ANGEL_TOTP_SECRET`.
- Token refresh is handled in API layer.
- Credentials stay in API/config layer. Tool layer should only receive `SafetyConfig` where needed.

## Coding Conventions

- TypeScript strict mode. Preserve strong typing.
- Use ESM imports/exports.
- Use `@/` path aliases. Do not add relative imports from `.` or `..`.
- Prefer `import type` for type-only imports.
- Do not use `any`.
- Do not use non-null assertions.
- Keep changes small and consistent with existing file patterns.
- Put shared validation/business logic in helpers or API/guard layers, not duplicated across tools.

## Tool Design Rules

- Register tools with `server.registerTool(...)`.
- Define or extend request/response types in `src/types.ts` when needed.
- Keep tool handlers thin: parse input, call API/helper, shape output.
- Put Angel endpoints and HTTP behavior in `src/api.ts`, not inside tool files.
- If adding a new tool group file, register it in `src/tools/index.ts`.

## Safety Rules

Treat trading mutations as high-risk changes.

- `place_order`, `modify_order`, `create_gtt_rule`, `modify_gtt_rule`, and `convert_position` must enforce guard checks.
- Soft limits are overrideable with `force: true`.
- Hard limits must never be bypassed in code.
- MARKET orders should enforce value limits using LTP when possible.
- Validate numeric inputs carefully. Keep regex/parse rules strict.
- Never leak credentials into tool responses, logs, or tool-layer params.

## Common Change Workflow

### Add or change an API capability

1. Update `src/api.ts`
2. Add/update types in `src/types.ts`
3. Add/update tool handler under `src/tools/`
4. Register tool if needed in `src/tools/index.ts`
5. Run `npm run build`
6. Run `npm run lint`

## References

- `README.md` for end-user setup and usage
- `CONTRIBUTING.md` for contributor workflow
