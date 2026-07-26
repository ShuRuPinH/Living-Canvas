# Living Canvas MCP

Cursor talks to Living Canvas boards through this MCP server.

## Prerequisites

1. API is running (`docker compose up -d` or `npm run server`) on port **4000**.
2. You have a registered user (UI at http://localhost:3000 or `POST /api/auth/register`).

## Configure Cursor

`.cursor/mcp.json` points at `server/mcp/index.ts`. Set credentials in the environment (or replace placeholders in mcp.json):

```bash
export LIVING_CANVAS_EMAIL="you@example.com"
export LIVING_CANVAS_PASSWORD="your-password"
# optional:
# export LIVING_CANVAS_API_URL="http://localhost:4000"
# export LIVING_CANVAS_TOKEN="<jwt from login>"
```

Restart Cursor MCP / reload window after changing env.

## Tools

| Tool | Purpose |
|------|---------|
| `list_boards` | List your boards |
| `get_board` | Full board JSON |
| `export_architecture` | Compact nodes/edges for agents |
| `upsert_entity` | Create/update a knowledge node |
| `upsert_connection` | Create/update an edge |
| `create_board` | New empty board |

## Prompt

`update_board_from_requirements` — ТЗ → update board → propose repo structure.

## Example

```
По ТЗ обнови board <uuid>, потом предложи структуру репо.

ТЗ: …
```
