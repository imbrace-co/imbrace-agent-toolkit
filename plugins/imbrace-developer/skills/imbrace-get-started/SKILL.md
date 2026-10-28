---
name: imbrace-get-started
description: First-use onboarding for the iMBrace platform. Use when a developer asks to get started with iMBrace, connect to iMBrace, get an iMBrace API key, pick an environment (stable, sandbox, develop, on-premise), or decide between the iMBrace SDK, hosted MCP server, CLI and vibe-code app hosting. Ends with one verified API call.
---

# Get started with iMBrace

iMBrace is a customer-engagement platform: CRM data boards, conversations and channels, AI agents, workflows
and knowledge hubs. Everything goes through one **gateway** per environment. Docs: https://engineer.imbrace.co

## 1. Ask before doing anything

Ask the developer, in one message, and wait for the answers:

1. **Which environment?** Do not pick one yourself.

   | Environment | Gateway | Use when |
   |---|---|---|
   | `stable` | `https://app-gatewayv2.imbrace.co` | production |
   | `sandbox` | `https://app-gateway.sandbox.imbrace.co` | integration testing |
   | `develop` | `https://app-gateway.dev.imbrace.co` | iMBrace internal only (needs VPN) |
   | on-premise | ask for their gateway address | company's own iMBrace |

2. **What are they building?** Use it to pick a path:

   | Goal | Path | Skill |
   |---|---|---|
   | Code in their own app or backend (TypeScript / Python) | SDK `@imbrace/sdk` / `imbrace` | `imbrace-sdk` |
   | Let an AI agent read or change their iMBrace data | hosted MCP server | `imbrace-mcp` |
   | Scripts, CI, terminal automation | CLI `@imbrace/cli` | `imbrace-cli` |
   | AI agents, workflows, knowledge hubs, CRM boards | SDK or CLI | `imbrace-build-agents-workflows` |
   | Build and host a full app on iMBrace (vibe code) | https://engineer.imbrace.co/skill.md | `imbrace-vibe-code` |

## 2. Get a credential

- **API key** (`api_...`, org-level): iMBrace Portal → **GovernCore → Generate External Token** → Generate Token.
  It is shown only once. Use it for backends, scripts and CI.
- **Access token** (`acc_...`, per user): from OTP login (`client.requestOtp` → `client.loginWithOtp` →
  `client.selectOrganization`). Use it when each end-user signs in to an app you build.
- **MCP only**: where the gateway has OAuth enabled (rolling out; on-premise gateways may not have it), the hosted
  MCP server also accepts a browser sign-in with no key at all; otherwise use the API key (see
  `imbrace-mcp`).

Rules for credentials:
- Ask the developer to put the key in an environment variable or `.env` file themselves (for example
  `IMBRACE_API_KEY=api_...`, plus `IMBRACE_ORGANIZATION_ID=<org id>`, which AI agents and document AI need).
  Never ask them to paste it into the chat, never print it, never commit it.
- Add `.env` to `.gitignore` before writing one.
- The SDK does not read environment variables by itself: load them (dotenv or the framework) and pass them in.

## 3. Prove it works with one call

TypeScript (Node 18+):

```bash
npm install @imbrace/sdk dotenv
```

```js
// check.mjs (ES module), run with: node check.mjs
import "dotenv/config";
import { ImbraceClient } from "@imbrace/sdk";

const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
  organizationId: process.env.IMBRACE_ORGANIZATION_ID, // needed later for AI agents and document AI
  env: "sandbox",
});
const { data: boards } = await client.boards.list();
console.log(`Connected. ${boards.length} board(s).`);
```

Python (3.9+):

```bash
pip install imbrace python-dotenv
```

```python
import os
from dotenv import load_dotenv
from imbrace import ImbraceClient

load_dotenv()
with ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    organization_id=os.environ.get("IMBRACE_ORGANIZATION_ID"),
    env="sandbox",
) as client:
    boards = client.boards.list()
    print(f"Connected. {len(boards.get('data', []))} board(s).")
```

Use the environment the developer chose (`env="stable"` is the default). An empty list is fine: it means no
boards yet. A 401/403 means a wrong, expired or wrong-environment key.

## 4. Next step

Tell the developer what worked, then continue with the skill for their path (table in step 1).
