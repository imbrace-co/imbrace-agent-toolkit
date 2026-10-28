# Release checklist

## Every release

0. **MCP OAuth must be live** in every environment the plugin points at (production
   `https://app-gatewayv2.imbrace.co/mcp`, and sandbox for testing): an unauthenticated `POST /mcp` returns 401 with
   `WWW-Authenticate: Bearer resource_metadata=...`, `/.well-known/oauth-protected-resource/mcp` resolves, and DCR +
   consent (org picker, `imbrace.read/write/delete`) work. From 0.2.0 the plugin has no API-key setting, so without
   OAuth its MCP server cannot connect. Do not publish 0.2.0+ before this is true.
1. Bump `version` in `plugins/imbrace-developer/.claude-plugin/plugin.json`, `openai/codex-plugin.json` and
   `.claude-plugin/marketplace.json` (`metadata.version`); add a `CHANGELOG.md` entry.
2. `claude plugin validate .` and `claude plugin validate ./plugins/imbrace-developer --strict --profile directory`.
3. `node scripts/package.mjs` (fails on version mismatch, listing limits, skill frontmatter, vendor wording).
4. Tag `vX.Y.Z` (must equal `plugin.json` version) and push: CI validates and builds; the tag-only release job
   checks the version and attaches both zips to the GitHub release, with that version's CHANGELOG section as notes.

## Claude Code marketplace (first release)

- [ ] Create public repo `imbrace-co/imbrace-agent-toolkit`; push `main`.
- [ ] Topics: `claude-code`, `claude-code-plugin`, `mcp`, `agent-skills`, `imbrace`, `sdk`.
- [ ] Clean-machine test:
      `claude plugin marketplace add imbrace-co/imbrace-agent-toolkit` →
      `claude plugin install imbrace-developer@imbrace-developer-tools` →
      `/plugin` → iMBrace Developer → set the MCP URL to `https://app-gateway.sandbox.imbrace.co/mcp` →
      `/mcp` → `imbrace` → Authenticate → sign in, pick a sandbox org, grant read only →
      `claude mcp list` shows `plugin:imbrace-developer:imbrace ... Connected` →
      ask "Help me get started with iMBrace" and "List my iMBrace boards"; confirm a write tool is unavailable,
      then re-authenticate with write and confirm it appears.
- [ ] API-key fallback: `claude mcp add --transport http imbrace <sandbox url> --header "Authorization: Bearer $IMBRACE_API_KEY"`
      connects and is read-only without `?allowWrite=1`.
- [ ] Release `v0.2.0` (only after step 0 above holds in production).
- [ ] Link install instructions from engineer.imbrace.co (all locales).
- [ ] Optional: submit to Anthropic's plugin directory (`claude plugin validate --profile directory` already passes).

## OpenAI plugin directory (skills-only)

Decision to confirm: a skills-only plugin **cannot get MCP added later**. A future MCP plugin uses the gateway's
OAuth 2.1 (ChatGPT as a pre-registered confidential client) and will be a separate listing.

- [ ] Publisher: verified business identity on the OpenAI org; submitter is owner or has Apps Management Write.
- [ ] platform.openai.com/plugins → Create plugin → **Skills only** → upload
      `dist/imbrace-openai-skills-only-v0.2.0.zip`.
- [ ] Check `interface.category` against the dashboard list (currently "Developer Tools"); fix scan results.
- [ ] Test in Codex and ChatGPT with a clean account: the three default prompts, plus one request that should
      **not** trigger a skill (e.g. "What is the weather?").
- [ ] Submit, answer review feedback, then **Publish** (approval alone does not list it).
- [ ] Put the listing URL in `README.md` and on engineer.imbrace.co.
