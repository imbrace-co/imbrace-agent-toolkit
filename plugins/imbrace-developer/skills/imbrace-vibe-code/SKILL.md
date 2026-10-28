---
name: imbrace-vibe-code
description: Build, deploy and host a full app on iMBrace (vibe code) - scaffold a React/Vite + Hono app or Python/Node/Go functions, sign in to iMBrace, and deploy to the iMBrace cluster at <app>.vibe.<env>.imbrace.co. Use when asked to build an app ON iMBrace, "vibe code" on iMBrace, deploy to iMBrace or Fission, or when an iMBrace app deploy/build/route fails.
---

# Build and host an app on iMBrace (vibe code)

The instructions for this live at **https://engineer.imbrace.co/skill.md**. They are maintained with the
`imbrace-vibe-code-v2` CLI and updated whenever it changes, so always use the current version:

1. Fetch https://engineer.imbrace.co/skill.md and read it in full before doing anything else.
2. Follow it exactly. In particular, ask the developer for the app name and which iMBrace they use (develop,
   sandbox, cloud or on-premise) before creating, installing or signing in to anything, and never ask for an API
   key or password: the sign-in is a browser link.
3. If the page cannot be fetched, tell the developer and stop; do not improvise the deploy steps from memory.

This skill is for apps that **run on iMBrace**. To call iMBrace from the developer's own app or backend, use
`imbrace-sdk` (and `imbrace-build-agents-workflows`); for the MCP server use `imbrace-mcp`.
