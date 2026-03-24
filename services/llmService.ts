import type { TestCase, EvaluationResult, RefinedPromptResult, Variable } from '../types';

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

async function callLLM(
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; json?: boolean } = {},
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const body: Record<string, unknown> = { model, messages };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.json) body.response_format = { type: 'json_object' };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error('Empty response from LLM');
  return content as string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs a given prompt and returns the text response.
 */
export async function runPrompt(
  prompt: string,
  model: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    return await callLLM(
      model,
      [{ role: 'user', content: prompt }],
      {},
      signal,
    );
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error('Error running prompt:', error);
    throw new Error('Failed to get a response from the AI model.', { cause: error });
  }
}

/**
 * Evaluates whether an actual output semantically matches (or avoids) the expected output.
 */
export async function evaluateOutput(
  actual: string,
  expected: string,
  type: 'positive' | 'negative',
  model: string,
  signal?: AbortSignal,
): Promise<EvaluationResult> {
  const isPositive = type === 'positive';

  const systemInstruction = isPositive
    ? `You are a pragmatic and lenient evaluator. Determine if an 'Actual Output' semantically matches the core intent of a 'Desired Output'. Minor phrasing differences are fine. Respond with valid JSON only: {"reasoning": "...", "pass": boolean}`
    : `You are a strict evaluator for negative test cases. Determine if an 'Actual Output' is semantically similar to a 'Forbidden Output'. The test PASSES only if the actual output is clearly DISTINCT from the forbidden output. Respond with valid JSON only: {"reasoning": "...", "pass": boolean}`;

  const userPrompt = isPositive
    ? `<DESIRED_OUTPUT>\n${expected}\n</DESIRED_OUTPUT>\n\n<ACTUAL_OUTPUT>\n${actual}\n</ACTUAL_OUTPUT>\n\nDoes the actual output match the desired output's intent? Provide reasoning and boolean pass status as JSON.`
    : `<FORBIDDEN_OUTPUT>\n${expected}\n</FORBIDDEN_OUTPUT>\n\n<ACTUAL_OUTPUT>\n${actual}\n</ACTUAL_OUTPUT>\n\nThis is a NEGATIVE test. Does the actual output successfully AVOID the forbidden output? pass=true means DISTINCT (PASS), pass=false means SIMILAR (FAIL). Respond as JSON.`;

  try {
    const raw = await callLLM(
      model,
      [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.1, json: true },
      signal,
    );

    const parsed = JSON.parse(raw);
    if (typeof parsed.pass === 'boolean' && typeof parsed.reasoning === 'string') {
      return parsed as EvaluationResult;
    }
    throw new Error('Malformed JSON from evaluator');
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error('Error during evaluation:', error);
    const pass = isPositive
      ? actual.trim() === expected.trim()
      : actual.trim() !== expected.trim();
    return {
      pass,
      reasoning: `AI evaluation failed; fell back to exact comparison. ${error.message}`,
    };
  }
}

/**
 * Generates diverse test cases based on an existing example.
 */
export async function diversifyTestCases(
  exampleCase: {
    variables: Record<string, string>;
    expectedOutput: string;
    detailedReason?: string;
  },
  direction: string,
  model: string,
  type: 'positive' | 'negative',
): Promise<{ variables: Record<string, string>; expectedOutput: string; detailedReason: string }[]> {
  const isNegative = type === 'negative';
  const variableKeys = Object.keys(exampleCase.variables);
  if (variableKeys.length === 0) {
    throw new Error('Cannot diversify a test case with no variables defined.');
  }

  const systemInstruction = isNegative
    ? `You are a creative test data generator specializing in finding failure points. Generate diverse NEGATIVE test cases. Respond with a JSON array only — no markdown, no code blocks.`
    : `You are a creative test data generator. Generate diverse POSITIVE test cases. Respond with a JSON array only — no markdown, no code blocks.`;

  const directionInstruction = direction.trim()
    ? `User hint: "${direction}". Incorporate this into your generation strategy.`
    : 'Consider edge cases: empty strings, longer text, different topics, different styles.';

  const exampleReasonText = exampleCase.detailedReason
    ? `\nRequirement: ${exampleCase.detailedReason}`
    : '';

  const userPrompt = isNegative
    ? `Based on this POSITIVE example, generate exactly 3 diverse NEGATIVE test cases.

Example Variables:
${JSON.stringify(exampleCase.variables, null, 2)}${exampleReasonText}
Example Desired Output:
${exampleCase.expectedOutput}

Generate 3 NEGATIVE test cases. ${directionInstruction}
Return a JSON array with objects: {variables: {...}, expectedOutput: "forbidden string", detailedReason: "why it should not appear"}`
    : `Based on this example, generate exactly 3 diverse POSITIVE test cases.

Example Variables:
${JSON.stringify(exampleCase.variables, null, 2)}${exampleReasonText}
Example Desired Output:
${exampleCase.expectedOutput}

Generate 3 POSITIVE test cases. ${directionInstruction}
Return a JSON array with objects: {variables: {...}, expectedOutput: "desired string", detailedReason: "what this tests"}`;

  try {
    const raw = await callLLM(
      model,
      [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      { json: true },
    );

    // Strip possible markdown fences
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) throw new Error('Expected JSON array');

    return parsed.filter(
      (tc: any) =>
        tc &&
        typeof tc.variables === 'object' &&
        tc.variables !== null &&
        Object.keys(tc.variables).length > 0 &&
        typeof tc.expectedOutput === 'string' &&
        tc.expectedOutput.trim() !== '',
    );
  } catch (error) {
    console.error('Error diversifying test cases:', error);
    throw new Error('Failed to generate diverse test cases from the AI model.', { cause: error });
  }
}

/**
 * Refines a prompt based on test case failures.
 */
export async function refinePrompt(
  guide: string,
  promptToRefine: string,
  initialPrompt: string,
  testCases: (Omit<TestCase, 'variables'> & { variables: Record<string, string> })[],
  failedTestIndex: number,
  failedOutput: string,
  attemptHistory: string,
  negativePromptRule: string,
  refinementDirection: string,
  model: string,
  signal?: AbortSignal,
): Promise<RefinedPromptResult> {
  const systemInstruction = `You are an expert prompt engineer. Refine the user's prompt to pass all test cases. Follow all rules strictly.

<RULES>
  <RULE_PRESERVE_VARIABLES>Preserve all {{variable}} placeholders.</RULE_PRESERVE_VARIABLES>
  <RULE_PRESERVE_INTENT>Respect the original intent from the INITIAL_PROMPT.</RULE_PRESERVE_INTENT>
  <RULE_REFINEMENT_STRATEGY>${negativePromptRule}</RULE_REFINEMENT_STRATEGY>
  <RULE_OUTPUT_FORMAT>Respond with valid JSON only: {"reasoning": "...", "newPrompt": "..."}</RULE_OUTPUT_FORMAT>
</RULES>`;

  const failingCase = testCases[failedTestIndex];
  const testCasesSummary = testCases
    .map((tc, i) => {
      const status = i === failedTestIndex ? '(FAILED)' : '(PASSED)';
      const typeLabel = tc.type === 'positive' ? 'Positive' : 'Negative';
      const outputLabel = tc.type === 'positive' ? 'Desired Output' : 'Forbidden Output';
      const reasonText = tc.detailedReason ? `\nRequirement: ${tc.detailedReason}` : '';
      return `--- Test Case #${i + 1} (${typeLabel}) ${status}\nVariables: ${JSON.stringify(tc.variables, null, 2)}${reasonText}\n${outputLabel}: ${tc.expectedOutput} ---`;
    })
    .join('\n');

  const failedDetail =
    failingCase.type === 'positive'
      ? `Failed on Positive Test Case #${failedTestIndex + 1}.\nInput: ${JSON.stringify(failingCase.variables, null, 2)}\nGenerated (wrong): ${failedOutput}\nDesired: ${failingCase.expectedOutput}`
      : `Failed on Negative Test Case #${failedTestIndex + 1}.\nInput: ${JSON.stringify(failingCase.variables, null, 2)}\nGenerated (should NOT match): ${failedOutput}\nForbidden: ${failingCase.expectedOutput}`;

  const userPrompt = `<PROMPT_ENGINEERING_GUIDE>${guide}</PROMPT_ENGINEERING_GUIDE>

<USER_REFINEMENT_GUIDANCE>${refinementDirection || 'No specific guidance.'}</USER_REFINEMENT_GUIDANCE>
<ATTEMPT_HISTORY>${attemptHistory || 'First attempt.'}</ATTEMPT_HISTORY>
<INITIAL_PROMPT>${initialPrompt}</INITIAL_PROMPT>
<CURRENT_PROMPT_TO_REFINE>${promptToRefine}</CURRENT_PROMPT_TO_REFINE>
<ALL_TEST_CASES>${testCasesSummary}</ALL_TEST_CASES>
<FAILED_CASE_DETAILS>${failedDetail}</FAILED_CASE_DETAILS>`;

  try {
    const raw = await callLLM(
      model,
      [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, json: true },
      signal,
    );

    const parsed = JSON.parse(raw);
    if (typeof parsed.newPrompt === 'string' && typeof parsed.reasoning === 'string') {
      return parsed as RefinedPromptResult;
    }
    throw new Error('Malformed JSON from refiner');
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error('Error refining prompt:', error);
    throw new Error('Failed to get a refined prompt from the AI model.', { cause: error });
  }
}
