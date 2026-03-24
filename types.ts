export interface Variable {
  id: string;
  key: string;
  value: string;
}

export interface TestCase {
  id: string;
  type: 'positive' | 'negative';
  variables: Variable[];
  expectedOutput: string;
  detailedReason?: string; // e.g., "The output should be a single, concise sentence."
}

export interface EvaluationResult {
  pass: boolean;
  reasoning: string;
}

export interface TestCaseResult {
  testCase: TestCase;
  status: 'passed' | 'failed';
  actualOutput: string;
  previousActualOutput?: string; // To track changes between attempts
  evaluationReasoning?: string;
}

export interface RefinementAttempt {
  attempt: number;
  prompt: string;
  previousPrompt?: string; // To track changes between attempts
  refinementReasoning?: string; // The AI's reasoning for *this* attempt's prompt
  isSuccess: boolean;
  details: string; // e.g., "Passed 2/3 tests."
  testCaseResults: TestCaseResult[];
}

export interface RefinedPromptResult {
  newPrompt: string;
  reasoning: string;
}

export type SavedPromptSource = 'initialPrompt' | 'finalResult' | 'attempt' | 'legacy';

export interface SavedPrompt {
  id: string;
  prompt: string;
  savedAt: string; // ISO string date
  source: SavedPromptSource;
  sourceAttempt?: number;
  sourceLabel?: string;
  details?: string; // "Passed 3/3 tests"
  testCases: TestCase[];
}
