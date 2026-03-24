# AI Agent Rules — prompt-autotuner

## Project Overview
- **Name**: prompt-autotuner (npm: `prompt-autotuner`)
- **Purpose**: Automated LLM prompt refinement via test-case-driven eval-refine loops. Treats prompts like code with tests — register positive/negative test cases, then an LLM runs eval-refine until all pass.
- **Stack**: React 19 + TypeScript + Vite 6 + Express 4 + Tailwind CSS (CDN) + Ink 6 (CLI)
- **Package Manager**: pnpm (always use `pnpm`, never npm or yarn)
- **License**: MIT
- **Repository**: `kargnas/prompt-autotuner`
- **Default Language**: English (UI has i18n for en/ko via `translations.ts`)

## Development Environment

### Prerequisites
- Node.js ≥ 18 (LTS)
- pnpm ≥ 9
- OpenRouter API key (https://openrouter.ai)

### Quick Start
```bash
cp -n .env.ai-ready .env
# Set OPENROUTER_API_KEY in .env
pnpm install
pnpm dev          # Vite :3000 + Express :3001
```

### Scripts
| Command | Description |
|---|---|
| `pnpm dev` | Start both Vite dev server (:3000) and Express API (:3001) via concurrently |
| `pnpm dev:client` | Vite dev server only |
| `pnpm dev:server` | Express API server only (needs `OPENROUTER_API_KEY`) |
| `pnpm build` | Production build via Vite |
| `pnpm start` | Run CLI entry point (`bin/autotuner.js`) |
| `pnpm release:version <patch\|minor\|major>` | Bump `package.json` version for the automated release flow |

### Build & Verify
- **Type check**: `pnpm exec tsc --noEmit` — must pass with 0 errors
- **Lint**: `pnpm exec eslint .` — warnings acceptable, errors must be fixed
- **Build**: `pnpm build` — must exit 0
- **GitHub Actions CI matrix**: lint/build runs on Node.js `20`, `22`, `24`, and `latest`

### Configuration System

All configuration follows a unified priority chain: **`.env` → `~/.autotuner/config.yaml` → defaults**

| `.env` Variable | `config.yaml` Key | Required | Default | Description |
|---|---|---|---|---|
| `OPENROUTER_API_KEY` | `openrouterApiKey` | Yes | — | OpenRouter API key for LLM proxy |
| `PORT` | `port` | No | `3000` | Static/proxy server port (CLI mode). If omitted, auto-finds a free port on conflict |
| `API_PORT` | `apiPort` | No | `3001` | Express API server port. If omitted, auto-finds a free port on conflict |
| `AUTOTUNER_DIR` | — | No | `~/.autotuner` | Data directory for config and saved prompts |
| `STORAGE_BACKEND` | `storageBackend` | No | `file` | Saved prompts backend: `file` or `localstorage` |

**Example `~/.autotuner/config.yaml`** (for npx users without a local `.env`):
```yaml
openrouterApiKey: sk-or-...
storageBackend: file
```

**Storage backends:**
- `file` (default) — each saved prompt is a YAML file under `~/.autotuner/saved-prompts/{id}.yaml`. Persists across browsers/machines.
- `localstorage` — browser localStorage only. Falls back automatically if the file API is unreachable.

**Migration:** Legacy `~/.autotuner/config.json` is auto-migrated to `config.yaml` on first load. Legacy `saved-prompts.json` single file is auto-migrated to the `saved-prompts/` directory. localStorage saved prompts are auto-migrated to file storage on first load.

> See `README.ai-ready.md` for AI agent-specific setup guide and Codex Cloud instructions.

### Release Automation
- `release-bump.yml` runs on every push to `main`, verifies the repo, patch-bumps `package.json`, commits `chore: release vX.Y.Z [skip ci]`, pushes tag `vX.Y.Z`, then invokes the publish workflow with that exact tag
- `publish-release.yml` is a reusable/manual workflow that checks out a supplied tag, creates a GitHub Release entry for that tag, then publishes `prompt-autotuner` to npm
- Required GitHub repository secret: `NPM_TOKEN`
- Optional GitHub repository secret: `RELEASE_PAT` when protected branch rules block `GITHUB_TOKEN` from pushing the release commit/tag back to `main`; the publish step itself no longer relies on tag-push events firing

## Codebase Structure

Run `tree -I 'node_modules|dist|.git' --dirsfirst` to see the full structure.

```
prompt-autotuner/
├── .github/workflows/    # CI + automated release workflows
│   ├── ci.yml            # Typecheck/lint/build on PRs and main
│   ├── release-bump.yml  # On main push: verify, bump patch version, push tag
│   └── publish-release.yml # On tag push: npm publish + GitHub Release
├── bin/                  # CLI entry points (npx prompt-autotuner)
│   ├── autotuner.js      # Main CLI: resolves API key → builds → starts servers
│   └── setup.tsx         # Ink-based interactive API key prompt
├── components/           # React UI components (Tailwind CSS via CDN)
│   ├── icons/            # SVG icon components (Heroicons-style)
│   ├── Header.tsx        # App header with settings/reset/language controls
│   ├── PromptInputForm.tsx  # Main input: prompt, test cases, model selection
│   ├── RefinementDisplay.tsx # Refinement attempt history viewer
│   ├── SavedPromptsPanel.tsx # Saved prompts CRUD panel
│   ├── SettingsModal.tsx     # Prompt guide and few-shot strategy settings
│   ├── MobileNav.tsx         # Bottom nav for mobile (setup/process/result/saved)
│   ├── CodeBlock.tsx         # Syntax-highlighted code block with copy
│   └── Loader.tsx            # Loading spinner
├── docs/                 # Reference documents embedded in contentService.ts
├── scripts/
│   └── bump-version.mjs  # Shared semver bump script used by GitHub Actions
├── server/
│   ├── index.ts          # Express API — LLM proxy + saved prompts storage API
│   ├── config.ts         # Unified config loader (.env → config.yaml → defaults)
│   └── storage.ts        # File-based saved prompts CRUD (~/.autotuner/saved-prompts/{id}.yaml)
├── services/
│   ├── llmService.ts     # Core: runPrompt, evaluateOutput, diversifyTestCases, refinePrompt
│   ├── contentService.ts # Prompt engineering guides (embedded as string constants)
│   └── storageService.ts # Frontend storage abstraction (file API → localStorage fallback)
├── App.tsx               # Root component — session state, eval-refine orchestration
├── constants.ts          # Model list, default prompts, localStorage keys
├── translations.ts       # i18n strings (en/ko)
├── types.ts              # TypeScript interfaces (TestCase, RefinementAttempt, etc.)
├── index.tsx             # React DOM entry point
├── index.html            # HTML shell (Tailwind CDN, Vite entry)
├── vite.config.ts        # Vite config: React plugin, /api proxy to :3001
└── tsconfig.json         # TypeScript config: ES2022, bundler resolution, JSX
```

### Key Architecture Decisions
- **Separate generation and evaluation models**: A fast model generates output; a more capable model evaluates it. Both configurable via UI.
- **Server-side API key**: Express on :3001 holds the OpenRouter key. Vite proxies `/api/*` to it. Key never enters the frontend bundle.
- **LLM-based semantic evaluation**: No string matching. The evaluator judges semantic equivalence and produces reasoning traces that drive refinement.
- **No database**: Saved prompts stored in `~/.autotuner/saved-prompts/{id}.yaml` (file) with localStorage fallback. Session data still in localStorage.
- **Tailwind via CDN**: `index.html` loads Tailwind from CDN script tag, not as a build dependency.

## Coding Rules

### Code Quality: Always verify before commit
- Run `git status` after completing work — ensure no unnecessary files or debug code remain
- Run `pnpm exec tsc --noEmit` and `pnpm build` before every commit
- Write human-readable code. Use descriptive variable names. Comment only the "why", not the "what".
- Delete dead code confidently — git preserves history

### TypeScript
- **Never** use `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress type errors
- Follow existing patterns: interfaces in `types.ts`, constants in `constants.ts`
- The project uses `moduleResolution: "bundler"` and `jsx: "react-jsx"` — respect these settings
- Path alias `@/*` maps to project root

### React Patterns
- Functional components only (`React.FC`)
- State management via `useState` + `useCallback` — no external state library
- localStorage for persistence (keys defined in `constants.ts`)
- `AbortController` for cancellable async operations
- Components receive translations via `language` prop → `translations[language]`

### Styling
- Tailwind CSS via CDN (`index.html` script tag) — not a build dependency
- Utility-first classes directly on elements, no separate CSS files
- Responsive: `md:` breakpoint for desktop, mobile-first layout with `MobileNav`

### API & Service Layer
- All LLM calls go through `services/llmService.ts` → `callLLM()` → `/api/chat` → Express → OpenRouter
- Express server (`server/index.ts`) is a thin proxy for LLM calls + CRUD API for saved prompts storage
- Model names follow OpenRouter format: `provider/model-name` (e.g. `google/gemini-2.5-flash`)
- JSON responses expected from LLM calls use `response_format: { type: 'json_object' }`

### i18n
- All user-facing strings live in `translations.ts` (English + Korean)
- Browser language auto-detected on mount, toggleable via header
- Use template pattern `{{variable}}` for interpolation in translation strings

### Git Conventions
- Commit messages: Conventional Commits format, English, lowercase description
- Types: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Single-purpose commits — one logical change per commit

## Restrictions
- **Never** commit `.env` or API keys
- **Never** add new npm dependencies without explicit request — this project deliberately has minimal deps
- **Never** change the Tailwind CDN approach to a build-time setup without discussion
- **Never** modify `bin/autotuner.js` CLI behavior without understanding the npm publish flow
- **Never** move LLM API key handling to the frontend — it must stay server-side

## Mandatory Practices
- **Always** update `translations.ts` when adding user-facing text (both `en` and `ko`)
- **Always** add new interfaces to `types.ts` when introducing new data structures
- **Always** use `signal?: AbortSignal` parameter for any new async LLM operation
- **Always** run `pnpm build` to verify changes compile cleanly before marking work done
- **Always** update this AGENTS.md when completing a task that changes project structure, conventions, or tooling
