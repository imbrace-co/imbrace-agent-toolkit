---
name: imbrace-build-agents-workflows
description: Build end-to-end features on iMBrace with the SDK - create an AI agent and chat with it (streaming, sessions), create and publish a workflow and let an agent call it, attach a knowledge hub (RAG files) to an agent, and model CRM data boards with fields and items. Use when asked to build a chatbot, support bot, automation, webhook flow, knowledge base or CRM pipeline on iMBrace.
---

# Build AI agents, workflows, knowledge hubs and boards

Examples are TypeScript; Python uses the same calls in snake_case, mostly with dict bodies
(`client.agent.create_use_case({...})`, `use_case["assistant_id"]`). A few take arguments instead:
`boards.create(name, description)`, `boards.list_items(board_id, limit=20, skip=0)`,
`workflows.create_flow(display_name, project_id)`, `workflows.list_runs(flow_id=..., limit=10)`.
Full guide: https://engineer.imbrace.co/sdk/full-flow-guide/

Set up the client first (`imbrace-sdk` skill). Pass `organizationId` (Python `organization_id`): AI agent chat
and other chat-ai calls need it even with an API key. Build in **sandbox**, and before creating anything list what
exists so you do not create duplicates.

```ts
import { ImbraceClient } from "@imbrace/sdk";
const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
  organizationId: process.env.IMBRACE_ORGANIZATION_ID,
  env: "sandbox",
});
```

## 1. AI agent and chat

Create agents with `client.agent.createUseCase`, the call the dashboard and `imbrace ai-agent create` make. It
creates the agent, its web-chat channel and its card on the dashboard's **AgentIQ** page. Do not use
`client.chatAi.createAiAgent` (or `client.ai.createAiAgentApp`) to create an agent people will look for: it creates the agent without a card, so it chats over the API but never shows in the
dashboard, and the developer cannot find, open or edit it there.

```ts
const created = await client.agent.createUseCase({
  usecase: {
    title: "Support Bot",                   // the card's name; unique in the org
    short_description: "Tier-1 customer support",
    agent_type: "agent",
    demo_url: "",
  },
  assistant: {
    name: "Support Bot",
    workflow_name: "support_bot_v1",        // unique, a-z 0-9 _
    description: "Tier-1 customer support",
    instructions: "You are a helpful support agent. Be concise and friendly.",
    provider_id: "default",                 // the org's default chat provider (also the SDK default)
    model_id: "Default",                    // the org's default model
    agent_type: "agent",
    streaming: true,
  },
});
const useCase = (created.data ?? created) as { _id: string; assistant_id: string }; // the service answers { data }
const agentId = useCase.assistant_id;       // the agent's UUID, used by every later call
// useCase._id (uc_...) is the dashboard card; client.agent.deleteUseCase(useCase._id) deletes card and agent

import { randomUUID } from "node:crypto";
const sessionId = randomUUID();             // reuse to keep conversation history
for await (const text of client.aiAgent.streamChatText({
  assistant_id: agentId,
  id: sessionId,
  messages: [{ role: "user", content: "How do I reset my password?" }],
})) process.stdout.write(text);
```

- Without `id`, every call starts a new conversation.
- Other providers and models: `imbrace ai-agent list-providers` / `list-models`, or the SDK equivalents.
- `updateAiAgent(id, {...})`: pass only the fields that change; the SDK re-sends the rest from the current agent.
- Python: `use_case = client.agent.create_use_case({"usecase": {...}, "assistant": {...}})["data"]`, then
  `use_case["assistant_id"]`.
- The developer finds the agent in the dashboard under **AgentIQ** (sidebar: Actions → AgentIQ), by its title.
- An agent that exists over the API but not on AgentIQ was made without a card, and no call adds one afterwards.
  Create it again with `createUseCase` (copy its settings from `chatAi.getAiAgent(id)`), then delete the old one
  with `chatAi.deleteAiAgent(id)` once the developer agrees.

## 2. Workflow, and let the agent call it

TypeScript: `buildFlow` creates the flow, sets the trigger and adds the steps in one call. It fills in what the
raw flow-operation API rejects or silently breaks without: a `propertySettings` entry for every input key and the
placement of each step.

```ts
const projectId = await client.workflows.resolveProjectId(); // the org's workflow project; if it throws, ask for the project id
const flow = await client.workflows.buildFlow({
  displayName: "CRM update on new lead",
  projectId,
  trigger: {
    kind: "piece", displayName: "Webhook",
    pieceName: "@activepieces/piece-webhook", pieceVersion: "0.1.24",
    triggerName: "catch_webhook", input: { authType: "none" },
  },
  steps: [], // { kind: "piece" | "code" | "loop", ... }; find pieces with `imbrace workflow piece list`
});
await client.workflows.applyFlowOperation(flow.id, { type: "LOCK_AND_PUBLISH", request: {} });

await client.workflows.triggerFlow(flow.id, { email: "jane@example.com" });     // async
const { data: runs } = await client.workflows.listRuns({ flowId: flow.id, limit: 10 });

await client.chatAi.updateAiAgent(agentId, {
  workflow_function_call: [{ flow_id: flow.id, description: "Update CRM when a new lead arrives" }],
});
```

Python has no `build_flow`; send the operations yourself and give every input key a `propertySettings` entry:

```python
project_id = client.workflows.resolve_project_id()
flow = client.workflows.create_flow("CRM update on new lead", project_id)
trigger_input = {"authType": "none"}
client.workflows.apply_flow_operation(flow["id"], {
    "type": "UPDATE_TRIGGER",
    "request": {
        "name": "trigger", "type": "PIECE_TRIGGER", "valid": True, "displayName": "Webhook",
        "settings": {
            "pieceName": "@activepieces/piece-webhook", "pieceVersion": "0.1.24",
            "triggerName": "catch_webhook", "input": trigger_input,
            "propertySettings": {key: {"type": "MANUAL"} for key in trigger_input},
            "inputUiInfo": {}, "packageType": "REGISTRY", "pieceType": "OFFICIAL",
        },
    },
})
# Steps: {"type": "ADD_ACTION", "request": {"parentStep": "trigger", "stepLocationRelativeToParent": "AFTER",
#         "action": {...}}}, with propertySettings filled the same way for a PIECE action.
client.workflows.apply_flow_operation(flow["id"], {"type": "LOCK_AND_PUBLISH", "request": {}})
client.workflows.trigger_flow(flow["id"], {"email": "jane@example.com"})
runs = client.workflows.list_runs(flow_id=flow["id"], limit=10).get("data", [])
```

- `triggerFlowSync` only returns data when the flow ends with a **Return Response** action; otherwise it times out
  after about 30 s.
- A flow does nothing until it is published. Check `listRuns` after a trigger and report the run status.

## 3. Knowledge hub (files the agent can search)

```ts
import { readFile } from "node:fs/promises";

const folder = await client.boards.createFolder({
  name: "Product docs", parent_folder_id: "root",   // organization_id defaults to the caller's org
});
const orgId = folder.organization_id;              // filled in by createFolder
if (!orgId) throw new Error("folder has no organization_id");

const buffer = await readFile("faq.pdf");
const form = new FormData();
form.append("file", new Blob([buffer], { type: "application/pdf" }), "faq.pdf");
form.append("folder_id", folder._id);
form.append("organization_id", orgId);
await client.boards.uploadFile(form);

await client.chatAi.updateAiAgent(agentId, { folder_ids: [folder._id] });
```

## 4. CRM data board

Board and field records can carry their id as `_id` or `id`; read both.

```ts
import type { Board } from "@imbrace/sdk";
const idOf = (r: any): string => r._id ?? r.id;

const board = await client.boards.create({ name: "Sales Pipeline", description: "Active deals" });
const boardId = idOf(board);
await client.boards.createField(boardId, { name: "Company", type: "ShortText" });

// Every board gets an identifier field automatically; read it from the board
const full = (await client.boards.get(boardId)) as Board & { fields?: Array<Record<string, unknown>> };
const idField = full.fields?.find((f) => f.is_identifier);
if (!idField) throw new Error("board has no identifier field");
await client.boards.createItem(boardId, { fields: [{ board_field_id: idOf(idField), value: "Acme Corp" }] });

const { data: items } = await client.boards.listItems(boardId, { limit: 20, skip: 0 });
```

Agents can read a board too: `updateAiAgent(agentId, { board_ids: [boardId] })`.

## Finish

Run the feature end to end in sandbox: send a chat message, trigger the flow and read the run, list the items.
Show the developer the real output. Note any ids created so they can clean up, and confirm with them before
deleting anything.
