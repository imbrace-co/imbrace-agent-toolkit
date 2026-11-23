---
name: imbrace-sdk
description: Write code with the official iMBrace SDKs, @imbrace/sdk (TypeScript) and imbrace (Python). Use when code imports @imbrace/sdk or imbrace, or when asked to call the iMBrace API, initialize ImbraceClient, choose between an API key and an access token, handle iMBrace errors, or find the right SDK resource or method.
---

# iMBrace SDK (TypeScript and Python)

Both SDKs wrap the same gateway API with the same namespaces, auth model and retry rules.
Reference: https://engineer.imbrace.co/sdk/overview/

## Install

| | Package | Runtime |
|---|---|---|
| TypeScript | `npm install @imbrace/sdk` | Node 18+ or a browser with `fetch` |
| Python | `pip install imbrace` | Python 3.9+; `AsyncImbraceClient` for async stacks |

## Create the client once and reuse it

```ts
import { ImbraceClient } from "@imbrace/sdk";

// Server-side integration: org API key
const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
  organizationId: process.env.IMBRACE_ORGANIZATION_ID, // recommended; required for chat-ai, AI agent chat, document AI
  env: "stable", // "stable" (default) | "sandbox" | "develop"
});

// App where each user signs in: their acc_... access token (OTP login, see below)
const userClient = new ImbraceClient({ accessToken: token, env: "stable" });
```

```python
import os
from imbrace import ImbraceClient

with ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    organization_id=os.environ.get("IMBRACE_ORGANIZATION_ID"),
    env="stable",
) as client:
    me = client.platform.get_me()
```

- **`organizationId` / `organization_id`**: recommended. Some services need it even with an API key, because
  the gateway does not add the organization for every route: chat-ai (create and manage AI agents), AI agent chat
  (`streamChat`, `streamChatText`) and document AI. Ask the developer for it (iMBrace Portal) and keep it in
  `IMBRACE_ORGANIZATION_ID`. Python with an API key puts it in request bodies (for example `stream_chat`) but does
  not send it as an `x-organization-id` header.

- Override the gateway with `baseUrl` (TS) / `base_url` (Python) for an on-premise iMBrace.
- **Never** put an API key in browser code. Browser apps use an access token, or call your own backend.
- Credentials come from environment variables the developer sets; the SDK does not read them by itself.

## Naming

Mostly the same namespaces in both languages, language-style method names:
`client.aiAgent.streamChat()` (TS) ↔ `client.ai_agent.stream_chat()` (Python).

| Namespace (TS / Python) | Use for |
|---|---|
| `boards` | CRM data boards: boards, fields, items, search, CSV; knowledge-hub folders and files |
| `agent` | **create** AI agents: `createUseCase` makes the agent and its AgentIQ dashboard card (`createAiAgent` makes no card, so the agent never shows in the dashboard); list / delete them with `listUseCases`, `deleteUseCase` |
| `chatAi` / `chat_ai` | read and update AI agents by their UUID (`getAiAgent`, `updateAiAgent`), orchestrators |
| `aiAgent` / `ai_agent` | chat with an AI agent (`streamChat`, `streamChatText`), sub-agent chat, chat history, traces |
| `ai` | OpenAI-compatible completions (`complete`, `stream`) and embeddings (`embed`); RAG files (`listRagFiles`, `uploadRagFile`); guardrails; LLM providers (`listProviders`) |
| `workflows` | flows, triggers, runs |
| `documentAi` / `document_ai` | parse and extract data from documents |
| `contacts`, `conversations`, `messages`, `channel`, `campaign`, `outbound` | contacts and messaging |
| `platform`, `organizations`, `teams` | users, orgs, teams (`platform.getMe()`) |
| `auth` | password and SSO sign-in (`signIn`, `signinSSO`), `getThirdPartyToken` (create an API key) |
| `fileService`, `marketplace`, `templates`, `schedule` | uploads, marketplace, templates, scheduling |

User OTP sign-in lives on the client itself: `client.requestOtp(email)` → `client.loginWithOtp(email, otp)` →
`client.selectOrganization(orgId)` (Python: `request_otp`, `login_with_otp`, `select_organization`).

The old `aiAgent` / `ai_agent` embedding methods (`processEmbedding`, `listEmbeddingFiles`, `getEmbeddingFile`,
`deleteEmbeddingFile`, ...) are retired and throw without calling the server. Use `client.ai.embed()` for vectors
and the `client.ai` RAG-file methods for files an agent searches.

**TypeScript only:** `client.api.<service>.<operation>()` is a generated surface of every agent-tools operation
(services `dataBoard`, `channel`, `platform`, `marketplace`, `workflow`). Use it when no hand-written method
exists, instead of hand-rolling `fetch`. Most return `unknown`, so pass a type: `client.api.dataBoard.listBoards<{ data: Board[] }>()`.

## Response shapes

- Most TypeScript list calls return `{ data: [...] }`; destructure `const { data } = await client.boards.list()`.
  A few return a plain array (`chatAi.listAiAgents()`, `ai.listProviders()`); check the method's return type.
- Python returns plain dicts: `client.boards.list().get("data", [])`. Ids can be `_id` or `id`; read both.

## Errors and retries

HTTP and network failures raise subclasses of `ImbraceError`:

| Error | When | What to do |
|---|---|---|
| `AuthError` | 401 / 403 | Never retried. Fix the credential, its environment, or permissions |
| `ApiError` | other 4xx / 5xx (`statusCode` / `status_code`) | 4xx: fix the request. See retries below for 5xx |
| `NetworkError` | timeout, DNS, connection refused | Check the gateway URL and network |

Streaming chat (`streamChatText`, Python `stream_chat_text`): a non-OK response raises `AuthError` or `ApiError`
before the first chunk, like any other call; an error event inside the stream (for example an invalid model)
raises `ImbraceError`; a connection dropped while the stream is being read surfaces as the runtime's own error,
not an `ImbraceError`. Some helpers, such as `workflows.resolveProjectId`, also throw a plain `Error`. Always end
error handling with a rethrow, as below.

Retries are built in (up to 3, exponential backoff): 429 and 503 for every method; other 5xx, timeouts and network
errors only for `GET`, `HEAD`, `OPTIONS`, `PUT` and `DELETE`. `POST` and `PATCH` are not repeated after a 5xx or a
timeout, because the server may already have applied them. Do not wrap SDK calls in your own retry loop; after a
failed create, check whether the record exists before trying again.

```ts
import { AuthError, ApiError } from "@imbrace/sdk";
try { await client.boards.list(); }
catch (e) {
  if (e instanceof AuthError) { /* bad or expired credential */ }
  else if (e instanceof ApiError) console.error(e.statusCode, e.message);
  else throw e;
}
```

## Before you finish

- Run the code against the developer's chosen environment (sandbox for experiments) and show the real output.
- Check that no credential is hard-coded or logged.
- For AI agents, workflows, knowledge hubs and boards end-to-end, use the `imbrace-build-agents-workflows` skill.
