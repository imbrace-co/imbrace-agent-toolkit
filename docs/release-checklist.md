# Release checklist

## Every release

0. **Check where MCP OAuth is live.** OAuth for `/mcp` rolls out environment by environment (dev, then sandbox,
   then production). In an environment that has it, an unauthenticated `POST /mcp` returns 401 with
   `WWW-Authenticate: Bearer resource_metadata=...`, `/.well-known/oauth-protected-resource/mcp` resolves, and DCR +
   consent (org picker, `imbrace.read/write/delete`) work. The plugin can be released before production has it: the
   skills work everywhere, and until then the plugin's `imbrace` server shows as failed on production and the README
   API-key method is the way to connect. The release job only warns about this. Do **not** submit to the Anthropic
   plugin directory or the Connectors Directory before production has OAuth.
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
      `/mcp` → `imbrace` → Authenticate → sign in, pick a production test org, grant read only →
      `claude mcp list` shows `plugin:imbrace-developer:imbrace ... Connected` →
      ask "Help me get started with iMBrace" and "List my iMBrace boards"; confirm a write tool is unavailable,
      then re-authenticate with write and confirm it appears.
- [ ] API-key fallback: `claude mcp add --transport http imbrace <sandbox url> --header "Authorization: Bearer $IMBRACE_API_KEY"`
      connects and is read-only without `?allowWrite=1`.
- [ ] Release `v0.2.0` (only after step 0 above holds in production).
- [ ] Link install instructions from engineer.imbrace.co (all locales).
- [ ] Optional: submit to Anthropic's plugin directory (`claude plugin validate --profile directory` already passes).

## OpenAI plugin directory (MCP + skills, ChatGPT)

Package: `dist/imbrace-openai-mcp-v<version>.zip` from `openai/mcp/`. One listing, one MCP URL (production
`https://app-gatewayv2.imbrace.co/mcp`); changing the URL later needs OpenAI support. Docs:
developers.openai.com/apps-sdk/deploy/submission, /apps-sdk/app-submission-guidelines, /plugins/deploy/submission-errors.

- [ ] Publisher: individual or business verification on the OpenAI organization (Settings → Organization → General);
      the listing shows that identity as developer. Submitter is owner or has Apps Management Write.
- [ ] platform.openai.com/plugins → Upload new or existing plugin → upload the ZIP → fix metadata / skills checks.
- [ ] MCP: connect the server → domain verification: put the token from the portal in the production gateway's
      `OPENAI_APPS_CHALLENGE` (served as plain text at `/.well-known/openai-apps-challenge`) → Verify → OAuth (DCR)
      → tool scan passes. Every tool already sets `readOnlyHint` / `destructiveHint` / `openWorldHint`.
- [ ] Review details (dashboard, not the ZIP): a production reviewer account that signs in with a password (no MFA,
      no email code), in an organization with sample data, `mcp_access` and a working chat model; demo video URL.
- [ ] Run the five positive and three negative test cases in `openai/mcp/plugin.json` in ChatGPT before submitting.
- [ ] Submit for review (attestations), answer feedback, then **Publish** (approval alone does not list it).
- [ ] Each update: bump the version (a new release must change it) and upload the new ZIP.

## OpenAI plugin directory (skills-only, not submitted)

The older skills-only package (`imbrace-openai-skills-only-*.zip`) stays buildable; it **cannot get MCP added
later**, so the MCP package above is the one to submit.
