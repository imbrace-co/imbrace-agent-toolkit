# iMBrace Agent Toolkit

Official iMBrace plugins for AI coding agents. Install once, and your agent knows how to build on
[iMBrace](https://engineer.imbrace.co): the TypeScript/Python SDK, the hosted MCP server, the CLI, AI agents,
workflows, knowledge hubs and CRM boards.

## Claude Code

Requires Claude Code 2.1.275 or later.

```bash
claude plugin marketplace add imbrace-co/imbrace-agent-toolkit
claude plugin install imbrace-developer@imbrace-developer-tools
```

Or inside a session: `/plugin marketplace add imbrace-co/imbrace-agent-toolkit`, then
`/plugin install imbrace-developer@imbrace-developer-tools`.

The plugin adds the hosted iMBrace MCP server (production by default), with no API key stored in the plugin. Run
`/mcp`, select `imbrace`, choose **Authenticate**, sign in and pick the organization and access. On a gateway
without OAuth (on-premise gateways may not have it), and for CI, connect with an API key as described in
[the plugin README](plugins/imbrace-developer/README.md). The skills work either way.

Sandbox, on-premise or several environments at once: see
[Other environments](plugins/imbrace-developer/README.md#other-environments). Using Claude on the web, desktop or
mobile instead of Claude Code: add iMBrace as a
[custom connector](plugins/imbrace-developer/README.md#claude-web-desktop-and-mobile-custom-connector).

**First use:** start a new session and ask *"Help me get started with iMBrace"*.

Update: `claude plugin marketplace update imbrace-developer-tools`. Remove: `claude plugin uninstall imbrace-developer`.

## ChatGPT and Codex

The same skills are packaged for the OpenAI plugin directory as **iMBrace Developer** (listing coming later; the
link will be added here).

## What's inside

```
.claude-plugin/marketplace.json      marketplace "imbrace-developer-tools"
plugins/imbrace-developer/
  .claude-plugin/plugin.json         plugin manifest (version, MCP URL setting)
  .mcp.json                          hosted iMBrace MCP server (OAuth)
  skills/<name>/SKILL.md             six skills
openai/codex-plugin.json             OpenAI / Codex listing manifest
scripts/package.mjs                  builds dist/*.zip and checks limits
docs/                                release and submission checklists
```

## Develop

```bash
claude plugin validate .                          # marketplace
claude plugin validate ./plugins/imbrace-developer --strict --profile directory
claude --plugin-dir ./plugins/imbrace-developer   # try local changes
node scripts/package.mjs                          # build both release zips into dist/
```

Bump `version` in `plugins/imbrace-developer/.claude-plugin/plugin.json`, `openai/codex-plugin.json` and
`.claude-plugin/marketplace.json` together; the package script refuses mismatches. Write skill text without
naming a specific model vendor (say "the agent"), so the same skills ship to every platform.

## License

MIT © iMBrace Limited
