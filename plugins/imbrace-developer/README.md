# iMBrace Developer plugin

Teaches your coding agent how to build on [iMBrace](https://engineer.imbrace.co), the customer-engagement platform
for CRM data boards, conversations, AI agents, workflows and knowledge hubs. Optionally connects the iMBrace hosted
MCP server so the agent can read (and, if you allow it, change) your iMBrace data.

## Install (Claude Code)

```bash
claude plugin marketplace add imbrace-co/imbrace-agent-toolkit
claude plugin install imbrace-developer@imbrace-developer-tools
```

Inside a session: `/plugin marketplace add imbrace-co/imbrace-agent-toolkit`, then
`/plugin install imbrace-developer@imbrace-developer-tools`.

## Skills

| Skill | Use it for |
|---|---|
| `imbrace-get-started` | First use: pick an environment, get an API key safely, make one verified call |
| `imbrace-sdk` | TypeScript `@imbrace/sdk` and Python `imbrace`: client setup, namespaces, errors |
| `imbrace-mcp` | Connect the hosted MCP server in any client; OAuth sign-in, API key fallback |
| `imbrace-cli` | Install, sign in and script the `imbrace` CLI; run `imbrace mcp` locally |
| `imbrace-build-agents-workflows` | AI agent + streaming chat, workflows, knowledge hubs, CRM boards end to end |
| `imbrace-vibe-code` | Build, deploy and host a full app on iMBrace (follows https://engineer.imbrace.co/skill.md) |

Skills load on their own when your request matches, for example *"Help me get started with iMBrace"*.

## MCP server (Claude Code)

The plugin adds the hosted iMBrace MCP server as `imbrace`, with no credential stored in the plugin.

The one setting, **iMBrace MCP URL**, defaults to production `https://app-gatewayv2.imbrace.co/mcp`. Change it
with `/plugin` → iMBrace Developer to use another environment (see [Other environments](#other-environments)). If
you never changed it, a plugin update moves you to the new default.
`?services=` and `?tags=` on the URL narrow the tools that are listed and can be called. Access control is
separate: OAuth scopes (below), or `allowWrite` / `allowDestructive` with an API key.

### OAuth sign-in (where the gateway has it enabled)

OAuth for `/mcp` is rolling out environment by environment, and on-premise gateways may not have it. Where it is
enabled:

1. Run `/mcp`, select `imbrace` and choose **Authenticate**.
2. Sign in to iMBrace in the browser. On the consent screen pick the **organization** and the **access** to grant:
   read (`imbrace.read`, always), create/update (`imbrace.write`), delete (`imbrace.delete`).
3. Back in Claude Code the tools appear. To switch organization or access, use `/mcp` → `imbrace`
   → clear authentication, then Authenticate again. Write and delete come from these scopes, not from the URL.

Where the gateway does not have OAuth enabled yet, `/mcp` shows the plugin's `imbrace` server as failed (sign-in
cannot start: client registration returns 404). Use the API-key method below instead; the skills work either way.

### API key (gateways without OAuth, CI, clients without OAuth)

Add the server yourself with an org key (`api_...`, from the iMBrace Portal, **GovernCore → Generate External
Token**) read from an environment variable, and disable the plugin's `imbrace` server or the plugin if you do not
want two entries:

```bash
claude mcp add --transport http imbrace https://app-gatewayv2.imbrace.co/mcp \
  --header "Authorization: Bearer $IMBRACE_API_KEY"
```

API-key connections are read-only unless the URL has `?allowWrite=1` (or `?allowDestructive=1` for deletes);
`?services=` and `?tags=` narrow the available tools on top of that.
Never paste the key into the chat or commit it.

## Other environments

| Environment | MCP URL |
|---|---|
| production (default) | `https://app-gatewayv2.imbrace.co/mcp` |
| sandbox | `https://app-gateway.sandbox.imbrace.co/mcp` |
| on-premise | `https://<your gateway>/mcp` |

Each environment has its own accounts, organizations and API keys: sign in (or create the key) in the environment
you connect to. OAuth is enabled environment by environment and on-premise gateways may not have it. To check one,
open `<gateway>/.well-known/oauth-protected-resource/mcp`: JSON means OAuth is on, 404 means use an API key.

- **One environment instead of production:** set the plugin's MCP URL (`/plugin` → iMBrace Developer), then `/mcp`
  → `imbrace` → Authenticate.
- **Several environments side by side:** keep the plugin's server on one and add the others under their own names,
  each signed in separately:

  ```bash
  claude mcp add --transport http imbrace-sandbox https://app-gateway.sandbox.imbrace.co/mcp
  claude mcp add --transport http imbrace-onprem https://<your gateway>/mcp
  ```

  Then `/mcp` → each server → Authenticate (or add `--header "Authorization: Bearer $IMBRACE_SANDBOX_API_KEY"` on a
  gateway without OAuth, one key variable per environment). Tools show up per server
  (`mcp__imbrace-sandbox__listBoards`), so say which environment you mean when you ask.

## Claude (web, desktop and mobile): custom connector

Without Claude Code, connect iMBrace to Claude as a **custom connector**. This needs a gateway with OAuth enabled;
custom connectors cannot send an API key.

1. In Claude, open **Settings → Connectors** and choose **Add custom connector**. On a Team or Enterprise plan an
   Owner adds it first under the organization's connector settings; members then connect it from their own
   settings.
2. Name it after the environment, for example `iMBrace` or `iMBrace (sandbox)`, and paste the MCP URL from the
   table above. Leave the advanced OAuth client ID and secret empty: Claude registers itself with iMBrace.
3. Choose **Connect**, sign in to iMBrace, and on the consent screen pick the organization and the access (read,
   write, delete).
4. In a chat, turn the connector on from the tools menu, then ask, for example, *"List my iMBrace boards"*.

Notes:

- One connector per environment and organization. To switch organization or access, disconnect the connector and
  connect it again.
- Claude reaches the gateway from Anthropic's cloud, not from your computer, so the gateway must be reachable from
  the internet. An on-premise gateway behind a VPN or firewall works only from Claude Code (or another local
  client) on a machine that can reach it.
- A connector added on claude.ai is also available in Claude Desktop and the mobile apps.

## Privacy

The MCP server is operated by iMBrace Limited. Calls run as the iMBrace user and organization you sign in with
(or with your API key) and are subject to the [iMBrace privacy policy](https://www.imbrace.co/privacy-policy/) and
[terms](https://www.imbrace.co/terms-and-conditions/). The skills themselves send nothing anywhere.

## Support

Issues: https://github.com/imbrace-co/imbrace-agent-toolkit/issues · Docs: https://engineer.imbrace.co
