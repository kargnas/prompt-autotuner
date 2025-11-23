# auto-tuner

LLM 프롬프트를 자동으로 최적화하는 도구. 테스트 케이스(긍정/부정)를 등록하면, 전부 통과할 때까지 프롬프트를 반복 개선해준다.

![demo](https://github.com/kargnas/prompt-autotuner/raw/main/demo.png)

## 어떻게 동작하나

기본 아이디어는 단순하다. 프롬프트에 기대 입출력 예시들을 달아두고, LLM이 그걸 전부 통과할 때까지 스스로 프롬프트를 고친다.

1. **프롬프트 작성** - `{{variable}}` 형태로 변수를 넣으면 런타임에 치환됨
2. **테스트 케이스 등록**
   - *긍정(Positive)*: 이 입력에는 이 출력이 나와야 한다
   - *부정(Negative)*: 이 입력에는 이 출력이 나오면 안 된다
3. **자동 튜닝 실행** - 실패한 케이스를 분석해 프롬프트를 개선 → 다시 평가 → 반복
4. **저장** - 성공한 프롬프트를 로컬에 저장해서 나중에 불러올 수 있음

평가도 LLM이 한다. "의미가 맞는가"를 판단하기 때문에 완전 일치가 아니어도 통과 가능.

## 빠른 시작

의존성은 [pnpm](https://pnpm.io/)으로 관리한다.

```bash
git clone https://github.com/kargnas/prompt-autotuner
cd prompt-autotuner
pnpm install
```

OpenRouter API 키가 필요하다. [openrouter.ai](https://openrouter.ai)에서 발급.

```bash
export OPENROUTER_API_KEY=sk-or-...
pnpm dev
```

브라우저에서 `http://localhost:3000` 열면 끝.

## 구조

```
prompt-autotuner/
├── server/
│   └── index.ts        # Express 서버 - API 키는 여기서만 관리
├── services/
│   └── llmService.ts   # OpenRouter 호출 로직
├── components/         # React 컴포넌트들
├── App.tsx
└── vite.config.ts      # /api → localhost:3001 프록시
```

- 프론트엔드(React/Vite)는 `/api/chat`만 호출
- API 키는 서버사이드에서만 사용, 번들에 포함되지 않음

## 지원 모델

기본값은 `google/gemini-2.5-flash-preview`. OpenRouter에서 제공하는 모델이면 뭐든 쓸 수 있다.

```
google/gemini-2.5-pro-preview-05-06
google/gemini-2.5-flash-preview
openai/gpt-4.1
openai/gpt-4.1-mini
anthropic/claude-sonnet-4-5
anthropic/claude-haiku-3-5
```

생성용과 평가용 모델을 따로 설정할 수 있다. 빠른 생성 + 정확한 평가 조합이 효율적.

## 라이선스

MIT
