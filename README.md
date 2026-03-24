# autotuner

<img width="2048" height="1143" alt="autotuner screenshot" src="https://github.com/user-attachments/assets/83d5ee96-fad4-4a41-b781-4fbaea4d82fb" />

Treat prompts like code with tests. Register positive test cases ("given this input, I want this output") and negative ones ("this output must not appear"), then let an LLM run the eval-refine loop until everything passes. Evaluation is semantic, not string-matching — the model judges whether the intent was met and explains why.

A well-tuned prompt can turn a task that seemed to require Gemini Pro into one that works fine with Gemini Flash Lite — **20x cheaper on input, 30x cheaper on output**.

## Features

- **Automatic eval-refine loop** — run prompt, evaluate output, refine, repeat until all test cases pass
- **Semantic evaluation** — LLM judges intent match, not string equality. Produces reasoning traces that drive refinement
- **Positive & negative test cases** — define what should appear *and* what must not
- **Test case diversification** — given one example, the model generates edge-case variations automatically
- **Dual model architecture** — fast model generates, capable model evaluates. Both independently configurable
- **OpenRouter multi-model** — one API key covers GPT, Claude, Gemini, and others
- **Configurable few-shot strategy** — forbid, positive-only, or permissive few-shot in refinements
- **Session persistence** — prompts and test cases survive page reloads via localStorage
- **Prompt library** — save, load, and manage refined prompts
- **i18n** — English and Korean UI

## Quick start

Requires an [OpenRouter](https://openrouter.ai) API key.

**Option 1 — npx (no install)**

```bash
export OPENROUTER_API_KEY=sk-or-...
npx prompt-autotuner
```

Opens at `http://localhost:3000`.

**Option 2 — dev mode (with hot reload)**

```bash
git clone https://github.com/kargnas/prompt-autotuner
cd prompt-autotuner
cp -n .env.example .env     # For human devs (.env.ai-ready for AI agents)
# Set OPENROUTER_API_KEY in .env
pnpm install
pnpm dev
```

> 🤖 **AI agent?** Use `.env.ai-ready` instead — see [`README.ai-ready.md`](README.ai-ready.md) for Codex Cloud and agentic coding setup.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS (CDN) |
| Build | Vite 6 |
| API proxy | Express 4 (holds API key server-side) |
| CLI | Ink 6 (interactive API key setup) |
| LLM gateway | OpenRouter |
| State | Browser localStorage (no database) |

## How it works

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  React UI   │────▶│   Express   │────▶│  OpenRouter   │
│  (Vite)     │     │   (/api)    │     │  LLM gateway  │
└─────────────┘     └─────────────┘     └──────────────┘
```

Three files do most of the work:

- **`services/llmService.ts`** — core agent loop: `runPrompt`, `evaluateOutput`, `diversifyTestCases`, `refinePrompt`
- **`server/index.ts`** — Express proxy. Holds the OpenRouter key; frontend calls `/api/chat` only
- **`App.tsx`** — session state, test case management, and eval-refine orchestration

## Project structure

```
bin/              CLI entry points (npx prompt-autotuner)
components/       React UI components (Tailwind utility classes)
  icons/          SVG icon components
docs/             Prompt engineering reference guides
server/           Express API proxy
services/         LLM service layer + content service
```

Standard files follow Vite + React conventions. Run `tree -I 'node_modules|dist|.git'` for the full picture.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite (:3000) + Express (:3001) |
| `pnpm build` | Production build |
| `pnpm dev:client` | Vite only |
| `pnpm dev:server` | Express only |
| `pnpm start` | CLI (`bin/autotuner.js`) |

## Verification

```bash
pnpm exec tsc --noEmit    # Type check — must pass
pnpm exec eslint .        # Lint
pnpm build          # Build — must exit 0
```

## Design decisions

- **Separate generation and evaluation models** — fast model generates, capable model evaluates. Better cost-to-quality than same model for both.
- **LLM-based evaluation** — string matching produces too many false negatives. The evaluator's reasoning trace drives refinement.
- **Key stays server-side** — Vite proxies `/api/*` to Express on :3001. Nothing sensitive in the frontend bundle.
- **Tailwind via CDN** — zero build-time CSS dependency. Just works.
- **No database** — localStorage is sufficient for a single-user prompt tuning tool.

## Contributing

```bash
git clone https://github.com/kargnas/prompt-autotuner
git checkout -b your-feature
# Make changes
pnpm build          # Verify
git commit           # Conventional Commits: feat: / fix: / chore: / docs:
```

PRs preferred over direct commits to main.

## Useful links

- [OpenRouter docs](https://openrouter.ai/docs)
- [Vite docs](https://vite.dev)
- [Ink (CLI framework)](https://github.com/vadimdemedes/ink)

---

*한국어 설명*

LLM 앱을 만들다 보면 프롬프트를 손으로 고치고, 실행해보고, 또 고치는 작업을 계속 반복하게 됩니다. autotuner는 그 과정을 자동으로 해주는 도구입니다. 긍정/부정 테스트 케이스를 정의하면, LLM이 평가-수정 루프를 전부 통과할 때까지 돌립니다. 평가는 문자열 비교가 아니라 의미 판단이므로, 표현이 다르더라도 의도가 맞으면 통과합니다.

---

| | |
|:---:|:---:|
| ![demo](demo.png) | <img width="2048" height="1143" alt="autotuner result view" src="https://github.com/user-attachments/assets/2f02c0f5-fe23-45cb-bf19-915c5d798d87" /> |

## License

MIT
