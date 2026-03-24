# AI Agentic Coding Setup — prompt-autotuner

> **What is this?** A ready-to-use guide for setting up this project inside AI coding agents
> (Claude Code, Codex, Cursor, etc.). One secret, zero external services.

```
┌──────────────────────────────────────────────────────┐
│              prompt-autotuner                         │
│                                                      │
│   ┌─────────┐     ┌─────────┐     ┌──────────────┐  │
│   │  Vite   │────▶│ Express │────▶│  OpenRouter   │  │
│   │ :3000   │     │ :3001   │     │  (external)   │  │
│   └─────────┘     └─────────┘     └──────────────┘  │
│    React UI        API proxy       LLM gateway       │
│                                                      │
│   No database. No cache. No Docker.                  │
│   Just Node.js + one API key.                        │
└──────────────────────────────────────────────────────┘
```

## Prerequisites

| Requirement      | Version  | Notes                           |
|------------------|----------|---------------------------------|
| Node.js          | ≥ 18     | LTS recommended                 |
| pnpm             | ≥ 9      | `npm i -g pnpm` if missing      |
| OpenRouter key   | —        | https://openrouter.ai           |

## Quick Setup (Local / AI Agent)

```bash
# 1. Copy env file (skip if .env already exists)
cp -n .env.ai-ready .env

# 2. Set your API key (or set via agent secrets)
# echo "OPENROUTER_API_KEY=sk-or-..." >> .env
# OR export OPENROUTER_API_KEY=sk-or-...

# 3. Install dependencies
pnpm install

# 4. Start dev server (frontend + API)
pnpm dev
# → http://localhost:3000
```

## Codex Cloud Setup (Ubuntu 24.04)

### Startup Script (network-enabled)

```bash
#!/bin/bash
# Codex Cloud — prompt-autotuner setup

# Install pnpm if not present
command -v pnpm >/dev/null || npm install -g pnpm

# Install dependencies
pnpm install

# Copy env template if .env doesn't exist
cp -n .env.ai-ready .env

# Build frontend (for production-like testing)
pnpm build
```

### Maintain Script (after branch checkout)

```bash
#!/bin/bash
# Codex Cloud — post-checkout maintenance

pnpm install
pnpm build
```

### Environment Secrets

Set in your Codex environment:

| Variable             | Required | Description                    |
|----------------------|----------|--------------------------------|
| `OPENROUTER_API_KEY` | ✅ Yes   | OpenRouter API key for LLM calls |

## Scripts Reference

| Command          | Description                                |
|------------------|--------------------------------------------|
| `pnpm dev`       | Start Vite + Express dev servers           |
| `pnpm build`     | Build frontend for production              |
| `pnpm dev:client`| Vite dev server only (no API)              |
| `pnpm dev:server`| Express API server only                    |
| `pnpm start`     | Run the CLI (`bin/autotuner.js`)           |

## Architecture Note

This project has **zero external service dependencies** beyond the OpenRouter API:

- **No database** — session data lives in browser `localStorage`
- **No cache layer** — all requests are pass-through to OpenRouter
- **No Docker required** — pure Node.js application
- **No build-time secrets** — API key only needed at runtime by Express server

This makes it ideal for AI agent environments where installing system-level services is impractical.
