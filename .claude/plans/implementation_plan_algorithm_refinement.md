# Implementation Plan: specific-content-algorithm-refinement

## Objective
Refine the content generation algorithms to produce "perfect", authentic, and 100% Reddit-like content that is strictly based on the client's input validation, removing reliance on hardcoded topics or generic fallbacks.

## Principles
- **Authenticity First**: Content must feel human, imperfect, and fitting for Reddit.
- **Strict Adherence to Input**: Every piece of content must derive directly from the user's provided company data.
- **Minimal Complexity**: use existing infrastructure (GPT-4) without adding new heavy services.
- **No Over-Engineering**: Refine existing prompts and flows rather than rewriting the entire engine.

## Priority Improvements

### 1. Simplify & Naturalize Prompts (Priority: High)
**Problem**: Current prompts are 264 lines long with rigid instructions on imperfections (e.g., "use lowercase i"), which paradoxically makes the AI sound robotic or trying too hard.
**Solution**:
- Reduce prompt length by ~40%.
- Replace explicit "imperfection rules" with "persona adoption" instructions (let the persona drive the style).
- Focus on *intent* rather than *syntax*.

### 2. Dynamic Example Adaptation (Priority: High)
**Problem**: examples are now generic ("working on a project"), which is better than "slides", but still vague.
**Solution**:
- Implement a `adaptExamplesToDomain(examples, company)` function.
- Before sending examples to the LLM, do a lightweight replacement of generic terms with domain terms (e.g., replace "project" with "campaign" for marketing tools, or "codebase" for dev tools) or inject a specialized system instruction to "translate" the generic examples to the specific domain.

### 3. Intelligent Activity Extraction (Priority: Critical)
**Problem**: `generateActivitiesFromCompany` uses simple keyword matching (e.g., if "ecommerce" in string -> add "checking sales"). If a company is unique, it falls back to very generic activities.
**Solution**:
- Use a lightweight LLM call (GPT-4o-mini) to extract 5-10 specific, realistic daily activities, frustrations, and goals based on the company description *once* during setup.
- Cache these in the company context so generation is fast.

### 4. Expand Conversation Arcs (Priority: Medium)
**Problem**: Only 3 arc templates exist (Discovery, Comparison, ProblemSolver).
**Solution**:
- Add 3 new distinct Reddit archetypes:
  - **"The Vent"**: Complaining about a manual process (that the product solves).
  - **"The Update"**: Sharing a "win" achieved using the product (subtly).
  - **"The Skeptic"**: A discussion debating if tool X is worth it (with the answer being natural).

### 5. Company Relevance Validator (Priority: High)
**Problem**: The quality scorer checks if it sounds like Reddit, but not if it's accurate to the specific company.
**Solution**:
- Update the `evaluateQuality` prompt to strictly penalize generic content.
- Add a check: "Does this post contain specific terminology related to [Product Name]?"

### 6. Clean Final Hardcoded References (Priority: Low)
**Problem**: A few lines in `prompt-builder.ts` still reference "presentation" specific logic or "slides".
**Solution**:
- Grep and remove/replace any remaining hardcoded strings in the prompt construction logic.

## Execution Strategy
1. **Step 1**: Implement "Intelligent Activity Extraction" (Item 3) first, as this feeds the rest.
2. **Step 2**: Refine the prompts (Item 1 & 6) to use these new activities.
3. **Step 3**: validation test with `test-shopmetrics.js`.
4. **Step 4**: Implement the Validator update (Item 5).
5. **Step 5**: (Optional) Add new Arcs if quality isn't "perfect" yet.
