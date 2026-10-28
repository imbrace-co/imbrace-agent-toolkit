---
name: imbrace-cli
description: Use the iMBrace CLI (@imbrace/cli, command `imbrace`) from a terminal, script or CI. Use when asked to install or log in to the iMBrace CLI, manage profiles, list or change data boards, AI agents, document AI, guardrails, orchestrators or workflows from the command line, or run `imbrace mcp` as a local MCP server.
---

# iMBrace CLI

`imbrace` calls the iMBrace gateway through `@imbrace/sdk`. Reference: https://engineer.imbrace.co/cli/commands/

## Install and sign in

```bash
npm install -g @imbrace/cli
imbrace --version
imbrace update            # self-update (v0.6.8+)
```

Prefer letting the developer sign in interactively in their own terminal: `imbrace login` asks for the method
(API key or email + password), profile and environment, and the key never appears in a command line.

For agents and CI, sign in without prompts. The CLI has no environment variable or stdin option for the key, so
pass it from a variable the developer set (never ask for it in the chat, never type the literal key):

```bash
imbrace login --api-key "$IMBRACE_API_KEY" --env sandbox      # env: stable | sandbox | develop
imbrace login --api-key "$IMBRACE_API_KEY" --profile work --env stable --org-id <orgId>
imbrace whoami --json
```

The expanded key is visible to other users of the machine in the process list while `login` runs; on shared
hosts use interactive `imbrace login` instead. The key is then stored in the profile, so later commands do not
need it.

- Profiles: `imbrace profile list|show|use|create|rename|delete`. Selection order: `--profile` flag >
  `IMBRACE_PROFILE` > active profile > `default`.
- Resource commands prompt for login when no credential exists. That prompt hangs a non-interactive shell, so
  always run `imbrace login --api-key ...` first.
- On 401, sign in again.

## Rules for running commands

- Add `--json` to every command whose output you read. Exceptions: `login`, `logout` and `export-csv` have no
  `--json` (`export-csv` writes CSV to `--out` or stdout), and `--id-only` on a `create` prints just the new id
  instead. `data-board create` without `--json` prompts for extra fields, so always pass it there.
- `delete` commands ask for confirmation. Pass `--yes` only after the developer has confirmed that exact deletion.
- Use `-h` on any command for its flags before guessing.

## Common commands

```bash
# Data boards (CRM)
imbrace data-board list --json
imbrace data-board create --name "Leads" --json
imbrace data-board create-field <boardId> --name Company --type ShortText --json
imbrace data-board create-item <boardId> --fields '[{"board_field_id":"<fieldId>","value":"Acme"}]' --json
imbrace data-board list-items --board-id <boardId> --limit 20 --json
imbrace data-board export-csv --board-id <boardId> --out ./board.csv

# AI agents
imbrace ai-agent list --json
imbrace ai-agent list-providers --json
imbrace ai-agent list-models --provider-id <providerId> --json
imbrace ai-agent get <agentId> --json

# Document AI
imbrace document-ai list --json
imbrace document-ai suggest-schema --url <fileUrl> --org-id <orgId> --json

# Workflows
imbrace workflow list --json
imbrace workflow create --name "New lead" --id-only
imbrace workflow piece list --search webhook --json
imbrace workflow node list <flowId> --json
imbrace workflow publish <flowId> --json
imbrace workflow run <flowId> --payload '{"email":"a@b.co"}' --sync --json
imbrace workflow runs --limit 10 --json
imbrace workflow run-detail <runId> --json
```

Workflows are a linked list of nodes from the trigger through `nextAction`; node edits go through flow operations
(`UPDATE_TRIGGER`, `ADD_ACTION`, `UPDATE_ACTION`, `DELETE_ACTION`, `LOCK_AND_PUBLISH`). `imbrace workflow node add-raw`
accepts a raw operation (`--op '<json>'` or `--op-file`).

## Local MCP server

```bash
imbrace mcp                                   # read-only tools
imbrace mcp --allow-write                     # + create / update
imbrace mcp --allow-write --allow-destructive # + delete
imbrace mcp --services dataBoard,workflow --profile work
```

Tools are named `<service>_<operationId>`, e.g. `dataBoard_listBoards`. For the hosted server instead, see `imbrace-mcp`.
