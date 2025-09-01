# Prompt Engineering Guidelines

This guide provides best practices for LLM prompt engineering when working with code in this repository. When implementing prompt-based features or interacting with LLMs in this project, follow these guidelines to ensure consistent and effective results.

## Use XML tags to structure your prompts

When your prompts involve multiple components like context, instructions, and examples, XML tags can be a game-changer. They help LLMs parse your prompts more accurately, leading to higher-quality outputs.

**XML tip**: Use tags like `<instructions>`, `<example>`, and `<formatting>` to clearly separate different parts of your prompt. This prevents LLMs from mixing up instructions with examples or context.

### Why use XML tags?

* **Clarity:** Clearly separate different parts of your prompt and ensure your prompt is well structured.
* **Accuracy:** Reduce errors caused by LLMs misinterpreting parts of your prompt.
* **Flexibility:** Easily find, add, remove, or modify parts of your prompt without rewriting everything.
* **Parseability:** Having LLMs use XML tags in their output makes it easier to extract specific parts of their response by post-processing.

> Note: While different LLMs may have varying levels of XML support, using semantic tag names that clearly describe their content ensures broad compatibility and maintainability.

## Tagging best practices

1. **Be consistent**: Use the same tag names throughout your prompts, and refer to those tag names when talking about the content (e.g, `Using the contract in <contract> tags...`).
2. **Nest tags**: You should nest tags `<outer><inner></inner></outer>` for hierarchical content.

**Power user tip**: Combine XML tags with other techniques like multishot prompting (`<examples>`) or chain of thought (`<thinking>`, `<answer>`). This creates super-structured, high-performance prompts.

### Examples

#### Example 1: Financial Report Generation

**Without XML tags:**
```
You're a financial analyst at AcmeCorp. Generate a Q2 financial report for our investors. Include sections on Revenue Growth, Profit Margins, and Cash Flow, like with this example from last year: {{Q1_REPORT}}. Use data points from this spreadsheet: {{SPREADSHEET_DATA}}. The report should be extremely concise, to the point, professional, and in list format. It should highlight both strengths and areas for improvement.
```

**With XML tags:**
```
You're a financial analyst at AcmeCorp. Generate a Q2 financial report for our investors.

AcmeCorp is a B2B SaaS company. Our investors value transparency and actionable insights.

Use this data for your report:
<data>{{SPREADSHEET_DATA}}</data>

<instructions>
1. Include sections: Revenue Growth, Profit Margins, Cash Flow.
2. Highlight strengths and areas for improvement.
</instructions>

Make your tone concise and professional. Follow this structure:
<formatting_example>{{Q1_REPORT}}</formatting_example>
```

The XML-tagged version produces more structured, focused output that follows the specified format more accurately.

#### Example 2: Legal Document Analysis

**Without XML tags:**
```
Analyze this software licensing agreement for potential risks and liabilities: {{CONTRACT}}. Focus on indemnification, limitation of liability, and IP ownership clauses. Also, note any unusual or concerning terms. Here's our standard contract for reference: {{STANDARD_CONTRACT}}. Give a summary of findings and recommendations for our legal team.
```

**With XML tags:**
```
Analyze this software licensing agreement for legal risks and liabilities.

We're a multinational enterprise considering this agreement for our core data infrastructure.

<agreement>
{{CONTRACT}}
</agreement>

This is our standard contract for reference:
<standard_contract>{{STANDARD_CONTRACT}}</standard_contract>

<instructions>
1. Analyze these clauses:
   - Indemnification
   - Limitation of liability
   - IP ownership

2. Note unusual or concerning terms.

3. Compare to our standard contract.

4. Summarize findings in <findings />.

5. List actionable recommendations in <recommendations />.
</instructions>
```

The XML-tagged version produces organized analysis with clear sections for findings and recommendations that legal teams can act on.

## Key Takeaways

- Use XML tags to structure complex prompts with multiple components
- Be consistent with tag naming throughout your prompts
- Nest tags for hierarchical content when appropriate
- Combine XML tags with other prompting techniques for best results
- Tag names should be descriptive and make sense for the content they contain

## Project-Specific Guidelines

When implementing prompt engineering within this project:

1. **Follow these XML tagging conventions** for all LLM interactions to maintain consistency across the codebase
2. **Document your prompts** with clear explanations of the expected input/output format
3. **Test prompts across different contexts** to ensure robustness
4. **Version control prompt templates** to track improvements and maintain consistency

These guidelines apply to all LLM integrations within the project, regardless of the specific model or provider being used.