---
name: imbrace-mcp
description: Connect an AI agent or coding tool to the iMBrace hosted MCP server and use its tools safely. Use when asked to connect iMBrace over MCP, set up iMBrace tools in Claude Code, Codex, Cursor, Claude Desktop or another MCP client, sign in to iMBrace over OAuth, enable write or delete access, or when an iMBrace MCP tool call fails or is missing.
---

# iMBrace MCP server

The iMBrace gateway hosts a Model Context Protocol server at `<gateway>/mcp` (streamable HTTP). Nothing to install.
Every tool call is replayed through the normal API as the signed-in user, so organization scope, role permissions
and licences apply. Reference: https://engineer.imbrace.co/mcp/overview/

| Environment | MCP URL |
|---|---|
| stable (production) | `https://app-gatewayv2.imbrace.co/mcp` |
| sandbox | `https://app-gateway.sandbox.imbrace.co/mcp` |
| on-premise | `https://<their gateway>/mcp` |

## How sign-in works

Two methods, one per connection:

- **OAuth 2.1**, where the gateway has it enabled. It is rolling out environment by environment and on-premise
  gateways may not have it. Check before recommending it: `GET <gateway>/.well-known/oauth-protected-resource/mcp`
  returns JSON when OAuth is on, and 404 when it is off. If it is off, use the API key method.
- **API key** (`Authorization: Bearer api_...`): works on every gateway; also for CI and clients without OAuth.

With OAuth, a client that connects with only the URL gets a 401 that points it to the iMBrace sign-in. The developer signs in in the browser, then on the consent screen picks:

- **the organization** the connection works in (one per connection; sign in again to switch), and
- **the access**: `imbrace.read` (always), `imbrace.write` (create and update tools), `imbrace.delete` (delete
  tools, implies write). They can untick write and delete.

The client stores and refreshes the token itself. No key is copied anywhere.

## Connect

Ask which environment and client they use, then give the steps. The developer runs the command or edits the file
themselves. The OAuth steps below apply only where the gateway has OAuth enabled; otherwise go straight to the
API key fallback.

- **Claude Code**: if the developer uses the iMBrace Claude Code plugin, the `imbrace` server is already added.
  Run `/mcp`, select `imbrace`, choose **Authenticate**, sign in and pick the organization and access. The URL is
  the plugin's setting (`/plugin` → iMBrace Developer). If `/mcp` shows the server as failed (client registration
  404), OAuth is not enabled on that gateway: disable the plugin's server and add one with an API key (below).
  Without the plugin (OAuth gateways): `claude mcp add --transport http imbrace https://app-gatewayv2.imbrace.co/mcp`,
  then `/mcp` → Authenticate.
- **Claude Desktop**: Settings → Connectors → add a custom connector with the MCP URL, then sign in.
- **Codex CLI**, in `~/.codex/config.toml`:
  ```toml
  [mcp_servers.imbrace]
  url = "https://app-gatewayv2.imbrace.co/mcp"
  ```
  then `codex mcp login imbrace` on versions with MCP OAuth support.
- **Cursor**, in `.cursor/mcp.json` or `~/.cursor/mcp.json`:
  `{"mcpServers":{"imbrace":{"url":"https://app-gatewayv2.imbrace.co/mcp"}}}`; Cursor then offers to sign in
  to the server.
- **Clients with stdio only**: bridge with `npx -y mcp-remote https://app-gatewayv2.imbrace.co/mcp`, which opens
  the browser sign-in.
- **No URL at all**: the CLI runs a local stdio server from a saved profile: `imbrace mcp` (see `imbrace-cli`).

Then test with a read: "List my iMBrace boards" should call a tool such as `listBoards`.

### Fallback: API key

Use it where the gateway has no OAuth yet, for CI, headless machines, or a client without OAuth. Org key `api_...` from the iMBrace Portal:
**GovernCore → Generate External Token**. The developer puts it in an environment variable (`IMBRACE_API_KEY`)
themselves. Never ask for the key in the chat, never print it, and never write it into a file that gets committed.

- Claude Code: `claude mcp add --transport http imbrace https://app-gatewayv2.imbrace.co/mcp --header "Authorization: Bearer $IMBRACE_API_KEY"`
- Codex CLI: add `bearer_token_env_var = "IMBRACE_API_KEY"` under `[mcp_servers.imbrace]`.
- Cursor: `"headers": {"Authorization": "Bearer ${env:IMBRACE_API_KEY}"}` in the server entry.
- stdio bridge: `npx -y mcp-remote <url> --header "Authorization: Bearer $IMBRACE_API_KEY"`.

A static `Authorization` header turns off the client's OAuth flow, and an empty key is rejected with 401, so
use one method per connection.

## Access

With **OAuth**, write and delete access come from the scopes granted on the consent screen. To change them, clear
the client's authentication for the server and sign in again.

With an **API key**, the connection is read-only unless the URL says otherwise:

| Parameter | Effect |
|---|---|
| `?allowWrite=1` | also create and update (API key only) |
| `?allowDestructive=1` | also delete, implies write (API key only) |
| `?services=dataBoard,workflow` | only tools of these services (`dataBoard`, `channel`, `platform`, `marketplace`, `workflow`) |
| `?tags=boards,records` | only tools with these topics |

`services` and `tags` narrow the available tools for either sign-in method: other tools are neither listed nor
callable. They are a filter, not access control; access comes from the OAuth scopes or, with an API key, from
`allowWrite` / `allowDestructive`. Recommend the narrowest access that does the
job, and sandbox before production.

## Using the tools

- Before any create, update or delete, say exactly what will change and get the developer's confirmation.
  Prefer sandbox for experiments.
- A "tool not enabled" error or a missing write/delete tool means the grant lacks `imbrace.write` /
  `imbrace.delete` (OAuth), the URL lacks `allowWrite` / `allowDestructive` (API key), or the `services` / `tags`
  filter on the URL excludes it. Explain what is needed; do not work around it.
- 401: not signed in, the sign-in expired, or the key is wrong, expired or from another environment. 403: the
  user's role in that organization lacks permission.
- Clients that read OpenAPI tool specs instead of MCP can use `GET <gateway>/agent-tools/openapi.json` with an
  API key header and the same filters.
