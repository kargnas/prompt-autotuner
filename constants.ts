
import type { Variable } from './types';

export const DEFAULT_GENERATION_MODEL = 'google/gemini-2.5-flash';
export const DEFAULT_EVALUATION_MODEL = 'google/gemini-2.5-pro';
export const AVAILABLE_MODELS = [
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-3-pro-preview',
  'google/gemini-3-flash-preview',
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-3-5',
];

export const NO_FEW_SHOT_RULE = `This is a strict **instruction-only refinement** strategy.
- **Primary Directive:** You MUST NOT add, create, or suggest few-shot examples (input/output pairs) to the prompt under any circumstances.
- **Your ONLY method for refinement is to improve the text-based instructions.** This includes clarifying directions, adding context, defining the desired output format, or adjusting the persona.
- **Confirmation:** Re-read your generated prompt. If it contains any examples of input and corresponding output, you have failed. The prompt must be purely instructional.
- **Do not add examples.** This rule is critical.`;

export const POSITIVE_FEW_SHOT_RULE = `This is a **positive few-shot refinement** strategy.
- **Primary Directive:** You are permitted to use the few-shot prompting technique by adding illustrative examples to the prompt.
- **Constraint:** When adding examples, you MUST ONLY use **positive examples** (correct input/output pairs that demonstrate the desired behavior).
- **Forbidden Action:** You MUST NOT use or create negative examples (anti-patterns) that show what to avoid. The examples should only showcase the correct pattern to follow.`;

export const PERMISSIVE_FEW_SHOT_RULE = `This is a **permissive few-shot refinement** strategy.
- **Primary Directive:** You are permitted to use the few-shot prompting technique by adding illustrative examples to the prompt.
- **Flexibility:** You MAY use both **positive examples** (patterns of what to do) and **negative examples** (anti-patterns of what to avoid).
- **Guideline:** Use your expert judgment to decide if including negative examples will be strategically beneficial for solving the user's specific problem. In many cases, positive examples are sufficient and more effective.`;


// The default behavior is to forbid few-shot examples.
export const DEFAULT_PROMPT_RULE = NO_FEW_SHOT_RULE;

export const DEFAULT_PROMPT = 'Extract the subject and main verb from the text: {{text}}';

export const getDefaultTestCases = () => [
    { 
        id: crypto.randomUUID(), 
        type: 'positive' as const,
        variables: [
            { id: crypto.randomUUID(), key: 'text', value: 'The quick brown fox jumps over the lazy dog.' }
        ] as Variable[], 
        expectedOutput: 'fox jumps',
        detailedReason: "The output should be short and contain only the subject and verb."
    },
    {
        id: crypto.randomUUID(),
        type: 'negative' as const,
        variables: [
            { id: crypto.randomUUID(), key: 'text', value: 'The quick brown fox jumps over the lazy dog.' }
        ] as Variable[],
        expectedOutput: 'fox jumped',
        detailedReason: "The verb tense should be present, not past."
    }
];

export const LOCAL_STORAGE_KEY = 'gemini-tuner-session-data';
export const SAVED_PROMPTS_LOCAL_STORAGE_KEY = 'gemini-tuner-saved-prompts';