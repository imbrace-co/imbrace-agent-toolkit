# Changelog

## 0.3.0

- The **iMBrace MCP URL** setting now defaults to production (`https://app-gatewayv2.imbrace.co/mcp`), which has
  OAuth sign-in. If you never changed the setting, this update moves you from the dev gateway to production: run
  `/mcp` → `imbrace` → Authenticate again.
- Plugin README and `imbrace-mcp` skill: other environments (sandbox, on-premise), how to check whether a gateway
  has OAuth, and how to connect several environments side by side in Claude Code (one named server per
  environment, each signed in separately).
- Plugin README and `imbrace-mcp` skill: connect Claude on the web, desktop and mobile with a **custom connector**
  (OAuth gateways only; one connector per environment and organization; the gateway must be reachable from the
  internet).
- `imbrace-mcp` skill: how to use the AI agent tools (`listAgents`, `askAgent`) and the approval step
  (`input-required` → ask the developer → `respondToAgentApproval`); `aiAgent` added to the `services` filter.
- `imbrace-mcp` skill: long answers — `listFlows` / `listPieces` are summaries, and an answer cut to fit carries
  `_truncated: {returned, total}`; narrow with filters or paging instead of repeating the call.

## 0.2.0

- New `imbrace-vibe-code` skill: points the agent to https://engineer.imbrace.co/skill.md (kept current with the
  `imbrace-vibe-code-v2` CLI) for building and hosting apps on iMBrace.
- Claude Code MCP is now OAuth-first: `.mcp.json` declares the hosted server by URL only. This removes the
  `Authorization` header that was sent with an empty key when no API key was set. Where the gateway has OAuth
  enabled, Claude Code runs the sign-in (`/mcp` → `imbrace` → Authenticate) and the organization and access
  (`imbrace.read` / `imbrace.write` / `imbrace.delete`) are chosen on the consent screen. The server only connects
  once OAuth is live on that gateway; until then (and on on-premise gateways without it) use the API-key method.
- Removed the `api_key` plugin setting. API keys still work through a manual
  `claude mcp add --transport http imbrace <url> --header "Authorization: Bearer $IMBRACE_API_KEY"` (documented
  in the plugin README and the `imbrace-mcp` skill).
- `imbrace-mcp`: connect steps for Claude Code, Claude Desktop, Codex, Cursor and `mcp-remote`; OAuth only where
  the gateway has it enabled (with a discovery check), API key otherwise; scopes vs `?allowWrite` /
  `?allowDestructive`; `?services` / `?tags` narrow the tools that can be listed and called, they are not access
  control. Client-neutral wording for the plugin case.
- `imbrace-sdk`, `imbrace-build-agents-workflows`, `imbrace-get-started`: checked against the SDK source. Retired
  `aiAgent` embedding methods replaced by `client.ai`; accurate error and retry rules; OTP sign-in methods;
  `createAiAgent` default provider, partial `updateAiAgent`, `createFolder` fields; Python signatures that differ.
- `imbrace-build-agents-workflows`: board, field and item ids read as `_id` or `id` (the `Board` type has only
  `id`); TypeScript workflow uses `workflows.buildFlow`, Python fills `propertySettings` per input key; knowledge-hub
  upload uses the folder's `organization_id`; client setup passes `organizationId`. All TypeScript snippets
  type-check against the SDK source with `tsc --strict`.
- `imbrace-sdk`: `organizationId` is recommended and required for chat-ai, AI agent chat and document AI, also with
  an API key; `streamChatText` errors corrected (non-OK response → `AuthError` / `ApiError`).
- `imbrace-get-started`: client setup passes the organization id.
- `imbrace-cli`: interactive `imbrace login` preferred, process-list caveat for `--api-key`, `--json` exceptions.
- Packaging: the marketplace zip is built from an allowlist of top-level paths and skips hidden files such as
  `.env`; zip entries carry a valid fixed date (1980-01-01).
- Plugin README: in-session install is `/plugin marketplace add` then `/plugin install imbrace-developer@imbrace-developer-tools`.
- Package script: the `api_` key scan also covers the READMEs, `plugin.json`, `codex-plugin.json` and `.mcp.json`.
- CI: Claude Code pinned for validation (2.1.311); read-only by default; the release job runs only on `v*` tags,
  checks the tag against `plugin.json`, uses only that version's CHANGELOG section as release notes, and warns
  when the production gateway does not serve the MCP OAuth metadata yet.
- `imbrace-mcp`: explains 402 `plan_feature_unavailable` (the organization's plan does not include MCP access) and
  how to resolve it.
- MCP OAuth rolls out environment by environment. Until a gateway has it, the plugin's `imbrace` server shows as
  failed there and the API-key method in the plugin README is the way to connect; the skills work either way.
- The **iMBrace MCP URL** setting now defaults to the dev gateway (`https://app-gateway.dev.imbrace.co/mcp`), the
  first environment with OAuth. Production becomes the default again in a later release, once it has OAuth.

## 0.1.1

- First public release of the `imbrace-developer` plugin and the `imbrace-developer-tools` marketplace.
- Skills: `imbrace-get-started`, `imbrace-sdk`, `imbrace-mcp`, `imbrace-cli`, `imbrace-build-agents-workflows`.
- Claude Code: hosted iMBrace MCP server, configured with an optional API key (secure storage) and MCP URL.
- OpenAI: skills-only package for the plugin directory.
