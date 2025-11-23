# auto-tuner

프롬프트 엔지니어링은 생각보다 훨씬 지루한 작업이다. 프롬프트를 바꾸고, 실행해보고, 출력이 이상하면 다시 고치는 루프를 손으로 반복하게 된다. auto-tuner는 이 루프를 자동화한다. 테스트 케이스 몇 개만 등록하면, LLM이 직접 프롬프트를 분석하고 수정하면서 모든 케이스를 통과할 때까지 반복한다.

![demo](demo.png)

## How it works

핵심 아이디어는 LLM을 평가자이자 편집자로 동시에 쓰는 것이다.

1. 프롬프트를 작성한다. 변수는 `{{variable}}` 형태로 쓴다.
2. 테스트 케이스를 등록한다. 긍정(이 입력에는 이 출력이 나와야 한다)과 부정(이 출력은 나오면 안 된다) 두 가지를 모두 쓸 수 있다.
3. 실행하면 각 케이스마다 프롬프트를 적용하고, 평가 LLM이 결과를 판정한다.
4. 실패한 케이스가 있으면 refinement LLM이 실패 이유를 분석해 프롬프트를 수정하고, 다시 평가한다.
5. 전부 통과하거나 최대 시도 횟수에 도달하면 멈춘다.

평가는 의미론적으로 이뤄진다. "정확히 같은 문자열인가"가 아니라 "의도가 맞는가"를 LLM이 판단하기 때문에, 약간의 표현 차이는 통과된다. 실패 이유도 자연어로 설명해준다.

## Quick start

[pnpm](https://pnpm.io/)과 [OpenRouter](https://openrouter.ai) API 키가 필요하다.

```bash
git clone https://github.com/kargnas/prompt-autotuner
cd prompt-autotuner
pnpm install
export OPENROUTER_API_KEY=sk-or-...
pnpm dev
```

`http://localhost:3000`을 열면 된다.

## Project structure

```
prompt-autotuner/
├── server/
│   └── index.ts          # Express API 서버. API 키는 여기서만 처리한다
├── services/
│   ├── llmService.ts     # runPrompt / evaluateOutput / diversifyTestCases / refinePrompt
│   └── contentService.ts
├── components/           # React 컴포넌트
├── docs/                 # 프롬프트 엔지니어링 가이드 (XML, 전략 등)
├── App.tsx
├── types.ts
└── vite.config.ts        # /api/* → localhost:3001 프록시
```

## Design choices

**생성과 평가를 다른 모델로 분리한다.** 빠른 모델로 출력을 생성하고, 더 정확한 모델로 평가하는 게 비용 대비 품질이 좋다. 설정에서 두 모델을 독립적으로 지정할 수 있다.

**API 키는 서버에서만 관리한다.** 프론트엔드는 `/api/chat`만 호출하고 키를 직접 다루지 않는다. Vite dev 서버가 요청을 Express(포트 3001)로 프록시한다. 번들에 키가 포함되는 구조는 피했다.

**평가를 LLM에게 맡긴다.** 자연어 출력을 문자열 비교로 판정하면 false negative가 너무 많다. LLM 평가자는 의미론적 동치를 이해하고, 왜 통과/실패인지 설명도 해준다. 이 reasoning 로그가 refinement 단계에서 핵심 입력이 된다.

**테스트 케이스 자동 다양화.** 케이스 하나를 기반으로 LLM이 비슷한 변형을 자동 생성한다. 엣지 케이스를 손으로 하나씩 쓰는 수고를 줄이기 위해서다.

**OpenRouter를 쓴다.** 단일 API 키로 GPT, Claude, Gemini 등 다양한 모델을 교체해가며 쓸 수 있다. 어떤 모델이 특정 프롬프트에 더 잘 맞는지 직접 비교할 수 있다.

## License

MIT
