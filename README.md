## Reddit Mastermind

Reddit Mastermind is a **Reddit content calendar generator** that plans authentic, company‑specific Reddit conversations designed to drive upvotes, views, and inbound leads for real clients – without getting their accounts banned.

The system takes **company info, personas, subreddits, targeting queries, and posts per week** and produces a **week-level content calendar** (and subsequent weeks) using a multi‑layer engine:

- **Conversation Design** – structures posts/comments/replies into realistic “threads”
- **Authenticity Engine** – transforms AI‑perfect text into natural Reddit language
- **Quality Predictor** – scores each conversation along 5 dimensions
- **Timing Engine** – schedules posts/comments based on persona behavior
- **Safety Validator** – enforces frequency, realism, and anti‑spam constraints

This README is intentionally **detailed and comprehensive** so you can use it to:

- **Understand the product** at a product‑manager and senior‑engineer level
- **Evaluate candidates** on whether they truly grasp the assignment and codebase
- **Extend the system** safely without breaking the behavior or quality bar

---

## 1. Assignment Context & Story

### 1.1 The story

- **Maddie** is an agency owner running Reddit for clients.
- When she **creates posts and has her team reply from multiple accounts**, clients get significantly **more inbound**.
- Today:
  - She **hand‑builds a content calendar** in a spreadsheet every month.
  - Her assistant **logs into multiple Reddit accounts** to post and reply.
- The assignment: **design the planning algorithm** that automates this work.
  - You can assume **posting/commenting functions already exist**.
  - Your job is to design and implement the **planning engine + product surface**.

### 1.2 Required inputs

The system must accept at least:

- **Company info**
- **List of personas (2+)**
- **Subreddits**
- **ChatGPT-style queries / keywords to target**
- **Number of posts per week**

### 1.3 Required outputs

- **A content calendar for the week**, including:
  - Conversations (posts + comments + replies)
  - Schedule (when each item should be posted)
  - Quality & safety metadata
- **Ability to produce content calendars for subsequent weeks**
  - In this repo, this is exposed as an **API + UI button** rather than a cron.

### 1.4 Business goal

- Generate **posts and comments so good** they:
  - Drive **upvotes, views, and inbounds** for clients
  - Help clients go from **invisible** to having threads that:
    - Rank on Google
    - Get cited in **LLM answers** (e.g., ChatGPT)
- This implies:
  - Authentic, non‑spammy behavior
  - Company‑specific, domain‑relevant content
  - Safety and long‑term account health

### 1.5 What the reviewer cares about

- **Ownership** – Could we trust you to own this problem end‑to‑end?
- **Product mindset** – Is this something you’d be proud to ship to real clients?
- **Quality over speed** – It’s better to ship fewer, high‑quality features than a wide but shallow surface.
- **Testing and evaluation** – Are you proactively testing:
  - Different personas / subreddits / companies
  - Edge cases (overposting, repetitive content, awkward persona interplay)
  - Quality (e.g. “3/10 vs 9/10” conversations)

This repo is built to **directly satisfy** these requirements.

---

## 2. Tech Stack

- **App**: Next.js App Router, React, TypeScript
- **Data & Storage (ready)**: Supabase client wired, ready for persistence
- **Design**:
  - Tailwind CSS
  - shadcn-style UI components
  - Custom design tokens and micro‑interactions
- **AI / Algorithms**:
  - OpenAI client (mocked in tests so tests don’t call real APIs)
  - Internal multi‑layer algorithm stack under `src/core/algorithms`
- **Testing & QA**:
  - Jest (+ Testing Library where appropriate)
  - Algorithm-level tests (authenticity, quality, safety, timing, similarity)
  - CLI QA tools that hit the real API routes

---

## 3. Inputs & Outputs (Formal Contract)

### 3.1 Core input: `GenerationInput`

The main API contract uses a `GenerationInput` type (simplified here):

- **Company info**
  - Name
  - Product description
  - Value propositions
  - Keywords / Targeting details
- **Personas** (2+)
  - Persona id, name, role
  - Backstory
  - Vocabulary and communication style
  - Reddit behavior pattern (timing profile)
- **Subreddits**
  - Target subreddit list (e.g. `r/productivity`, `r/startups`)
- **Keywords / queries**
  - List of text queries / keywords to influence topics
- **Posts per week**
  - Number of conversations to generate in the target week
- **Optional context**
  - `weekNumber`
  - `previousWeeks` (for multi‑week planning)

All of these are strongly typed under `src/core/types`.

### 3.2 Core output: `WeekCalendar`

The `/api/generate` route returns a `WeekCalendar`, which includes:

- **weekNumber** – which week in the campaign (1, 2, 3, …)
- **conversations** – each is a **scheduled conversation**:
  - Post (with persona, subreddit, content, quality metadata, schedule)
  - Top-level comments
  - Replies (nested)
  - Timestamps for each event (from Timing Engine)
- **averageQuality** – average quality score across conversations
- **safetyReport** – Safety Validator result for the calendar
- **metadata**:
  - `generatedAt`
  - `totalConversations`
  - `subredditDistribution` (how many posts per subreddit)
  - `personaUsage` (how often each persona appears)

This is the **planning output** that other systems (posting bots, dashboards) can consume.

---

## 4. Algorithm Architecture (6‑Layer System)

All core logic lives under `src/core/algorithms`.

### 4.1 Layer 1 – Data & Types

- **Location**: `src/core/types`, `src/core/data/**`
- **Responsibility**:
  - Strongly typed models for `CompanyContext`, `Persona`, `SubredditContext`,
    `ConversationThread`, `QualityScore`, `SafetyReport`, `WeekCalendar`, etc.
  - Static data:
    - Persona library, timing patterns
    - Subreddit profiles
    - Prompt examples and Reddit writing patterns

This layer makes everything **explicit and type‑safe**, which is important for both engine quality and long‑term maintainability.

### 4.2 Layer 2 – Conversation Designer

- **Location**: `src/core/algorithms/conversation/**`
- **Key responsibilities**:
  - Define **arc templates** (e.g. Discovery, Comparison, Problem‑Solver) that specify:
    - Post tone and structure
    - Comment purposes (empathy, advice, tool mention, etc.)
    - Reply roles (OP vs commenters)
  - Map **personas to roles**:
    - Choose which persona posts
    - Which personas reply, and how often
  - Build **prompts** for the underlying LLM (conceptually – tests mock the LLM):
    - Persona backstory and vocabulary
    - Subreddit norms (tone, formality)
    - Specific task and framing

This layer ensures that conversations feel like **real threads**, not flat one‑shot posts.

### 4.3 Layer 3 – Authenticity Engine

- **Location**: `src/core/algorithms/authenticity/engine.ts`
- **Goal**: Turn “AI‑perfect” text into something that feels like Reddit:
  - Imperfect, varied, and persona‑consistent
  - Aligned with subreddit culture (casual vs professional)

Key behaviors:

- **Subreddit calibration**
  - Professional subs: fewer casual markers, more formality and detail
  - Casual subs: more slang, imperfections, conversational style
- **Human imperfections**
  - Lowercase “i”
  - Occasional missing punctuation
  - Common typos and informal contractions
- **Personality markers**
  - Persona‑specific phrases and vocab (e.g., “honestly”, “ngl”, “framework”)
- **Reddit culture markers**
  - “lol”, “lmao”, “tbh”, “ngl”, trailing `...`, emphatic caps, etc.
- **Structure breaking**
  - Breaks perfect bullet/numbered lists into more natural prose
  - Inserts asides and small digressions

There is a dedicated test suite to ensure:

- Transformations **sometimes change** the text
- They **preserve meaning**
- They’re **calibrated by subreddit** and persona

### 4.4 Layer 4 – Quality Predictor

- **Location**: `src/core/algorithms/quality/predictor.ts`
- **Goal**: Score each conversation on a **0–100** scale across 5 dimensions:

- **Subreddit Relevance (0–20)**  
  Is the content on‑topic and aligned with subreddit norms?

- **Problem Specificity (0–20)**  
  Does the post express a concrete, relatable problem with real details?

- **Authenticity (0–25)**  
  Does it avoid obvious AI patterns and feel like a real human wrote it?

- **Value‑First Behavior (0–20)**  
  Is the product mention delayed, subtle, and value‑oriented?

- **Engagement Design (0–15)**  
  Does the thread invite real conversation (questions, multiple perspectives)?

Outputs:

- `overall` score (0–100)
- Dimension breakdown
- `grade` (excellent / good / fair / poor)
- Structured `issues` and `strengths` for UI to render

This makes it possible to say: **“This is a 3/10 vs 9/10 calendar”** in a repeatable way.

### 4.5 Layer 5 – Timing Engine

- **Location**: `src/core/algorithms/timing/**`
- **Goal**: Generate **realistic schedules** for posts, comments, and replies.

Main concepts:

- **PersonaTiming profiles**
  - Active windows (e.g. 8–11, 13–17)
  - Peak hours
  - Weekend behavior
  - Typical response delay ranges
- **Post scheduling**
  - Distributes posts across the week
  - Uses persona’s active windows and peaks
  - Avoids clustering and overly regular patterns
- **Comment / reply timing**
  - Uses arc timing ranges (e.g. first comment 15–45 minutes later)
  - Ensures comments aren’t instant and follow human‑like delays

The result is a chronological list of events that **feels like real human activity**.

### 4.6 Layer 6 – Safety Validator

- **Location**: `src/core/algorithms/safety/validator.ts`
- **Goal**: Enforce rules that protect client accounts and avoid spam patterns.

Checks include:

- **Account readiness** (mocked data for assignment)
  - Minimum account age, karma, prior activity
- **Frequency limits**
  - Max posts per subreddit per week/day
  - Max posts per persona per week
  - Product mention frequency limits
- **Timing realism**
  - No instant back‑to‑back from the same persona
  - Sufficient variance between events
- **Collusion detection**
  - Detect suspicious co‑posting patterns across personas
- **Content similarity**
  - Detect repetitive posts/comments across the calendar

Output is a `SafetyReport` with:

- `passed` flag
- `overallRisk` (`low`, `medium`, `high`, `critical`)
- Detailed `checks`, `violations`, `warnings`, and `recommendations`

---

## 5. Orchestration & API Layer

### 5.1 `/api/generate`

- **Route**: `src/app/api/generate/route.ts`
- **Responsibility**:
  - Validate and parse `GenerationInput`
  - For each requested post:
    - Select arc type and subreddit
    - Call Conversation Designer to generate a base conversation
    - Run Authenticity Engine on post/comments/replies
    - Run Quality Predictor
    - Optionally re‑generate (up to a limit) if below quality threshold
  - Run Timing Engine to schedule conversations
  - Run Safety Validator on the full schedule
  - Return a `WeekCalendar`

### 5.2 `/api/validate`

- **Route**: `src/app/api/validate/route.ts`
- **Responsibility**:
  - Accept conversations (e.g., after edits)
  - Re‑run safety validation
  - Return an updated `SafetyReport`

### 5.3 `/api/regenerate`

- **Route**: `src/app/api/regenerate/route.ts`
- **Responsibility**:
  - Regenerate specific conversations or a subset with updated constraints
  - Useful in a review/approval workflow

---

## 6. UI & User Flows

### 6.1 Marketing site

- **Route group**: `src/app/(marketing)`
- **Purpose**:
  - Explain the value proposition
  - Show before/after authenticity differences
  - Funnel users into the workspace

### 6.2 Workspace (core product)

- **Route**: `src/app/(platform)/workspace/page.tsx`
- **Main pieces** (via `src/modules/workspace`):

- **Setup Panel**
  - Enter company info, value props, keywords
  - Select personas and subreddits
  - Choose posts per week and quality threshold
  - Demo mode using SlideForge data
  - “Clear All Data & Start Fresh” to reset local state

- **Thread Panel**
  - Shows generated conversations
  - Quality and safety chips for each conversation
  - Ability to inspect posts, comments, and replies

- **Overlays / Export**
  - `ExportDialog` for exporting the calendar
  - Shared components (badges, tooltips, dialogs) from `src/shared/components`

The UI is designed to be something you could put in front of **real agency users**.

---

## 7. Running the App Locally

### 7.1 Install dependencies

```bash
npm install
```

### 7.2 Start the dev server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

- **Marketing site**: `/(marketing)`
- **Workspace (core product)**: `/(platform)/workspace`

---

## 8. Environment Configuration

Create a `.env.local` in the project root for any required keys (OpenAI/Gemini if wired in your environment):

```bash
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- In this repo, **tests mock** the LLM calls so you can run `npm test` without a real API key.
- For actual generation in development, you’d configure the appropriate LLM key and wire it in the `openai-client` or equivalent.

---

## 9. Testing & QA

### 9.1 Jest test suite

Run the Jest tests:

```bash
npm test
# or
npm run test:watch
# or
npm run test:coverage
```

The suite focuses on:

- **Core algorithms** – under `src/core/algorithms/**`
  - Authenticity Engine behavior
  - Quality Predictor dimensions
  - Safety Validator rules
  - Timing Engine scheduling utilities
- **Data & utils** – under `src/shared/lib/utils/**`
  - Text similarity and repeated‑phrase detection
  - Style variance calculations
- **End‑to‑end contracts** – under `src/__tests__/e2e/**`
  - Validation that `GenerationInput` and `WeekCalendar` behave as designed
  - Week progression, multi‑week context, and safety/quality presence

These tests ensure the **planning algorithm is stable and predictable**.

### 9.2 API QA scripts

These scripts hit the **real Next.js API**. Make sure `npm run dev` (or `npm start` with a build) is running on port `3000`.

- **Comprehensive API scenarios**:

  ```bash
  npm run test:api
  ```

  What it does:

  - Sends multiple scenario payloads to `/api/generate` (different companies/personas/subreddits)
  - Writes JSON results to `test-results/` (if you choose to persist outputs)

These scripts are how you **manually probe** the system for edge cases:

- Over‑ or under‑posting per subreddit
- Repetitive phrases across conversations
- Domain drift (wrong domain, e.g. slide content for an HR tool)

---

## 10. Project Structure (High Level)

- **`src/app`** – Next.js app routes:
  - `/(marketing)` – marketing pages
  - `/(platform)/workspace` – main product workspace
  - `/api/generate` – main generation endpoint (planning algorithm output)
  - `/api/regenerate` – regenerate subsets
  - `/api/validate` – safety validator endpoint

- **`src/core`** – domain logic and algorithms:
  - `algorithms/` – authenticity, quality, timing, safety, orchestration
  - `data/` – personas, subreddit profiles, prompts, demo companies
  - `types/` – all shared domain types
  - `errors/`, `config/`, `validation/` – supporting infrastructure

- **`src/modules`** – feature modules:
  - `landing/` – marketing UI sections and hero
  - `workspace/` – setup panels, thread views, export overlays

- **`src/shared`** – shared libraries and components:
  - `components/ui/` – shadcn‑style UI primitives (buttons, dialogs, inputs, etc.)
  - `lib/api/openai-client.ts` – LLM client wrapper (mocked in tests)
  - `lib/utils/` – text similarity, UI helpers, toasts, etc.
  - `styles/` – design tokens and animation helpers

- **Root QA tools**:
  - `test-api.js` – scenario‑based API testing
  - `test-data/` – JSON fixtures for API scenarios

---

## 11. How to Evaluate the Calendar (3/10 vs 9/10)

When reviewing output (either as a candidate or reviewer), focus on:

- **1. Authenticity**
  - Does the language feel like real Reddit, or like a polished blog post?
  - Are there small imperfections and personality markers?
- **2. Problem framing**
  - Is each post about a **specific, believable problem**?
  - Are there concrete details (time spent, metrics, deadlines, context)?
- **3. Value‑first product behavior**
  - Are product mentions **delayed and subtle**, not salesy?
  - Do comments provide real advice even if no product is mentioned?
- **4. Variety**
  - Are conversations meaningfully different across the week?
  - Do personas sound and behave differently from each other?
- **5. Safety**
  - Is there any obvious overposting in a single subreddit?
  - Are timing intervals and persona interactions believable?

Use the **Quality Predictor** output and **Safety Report** as a structured lens, but also trust your own product sense.

---

## 12. Assignment Mapping Checklist

This section maps the original assignment bullets to implementation.

- **Inputs**
  - **Company info** – `CompanyContext` + workspace setup form
  - **2+ personas** – Persona library + selection in workspace
  - **Subreddits** – Subreddit profiles + selection in workspace
  - **ChatGPT queries to target** – Keywords / queries passed into the generator
  - **Number of posts per week** – `postsPerWeek` in `GenerationInput`

- **Outputs**
  - **Content calendar for the week** – `WeekCalendar` from `/api/generate`
  - **Subsequent weeks** – `weekNumber` + `previousWeeks` context and ability to call the endpoint for Week 2, 3, etc. (triggered by a button instead of cron)

- **Business goal**
  - **Drive upvotes/views/inbounds** – Achieved via:
    - Authenticity Engine
    - Quality Predictor prioritizing engagement design & value‑first behavior
    - Subreddit‑aware prompts and behavior
  - **Long‑term visibility (Google/LLMs)** – Focus on high‑quality, realistic threads that could be naturally linked and surfaced over time.

- **Quality**
  - **Natural conversation** – Multi‑persona threads with empathy, advice, and back‑and‑forth dynamics
  - **Real vs manufactured** – Intentional imperfections, persona consistency, and subreddit calibration

- **Testing**
  - **Proactive testing** – Jest algorithm tests + API QA scripts
  - **Vary personas/subreddits/companies** – Multiple scenarios and test data sets
  - **Catch edge cases (overposting, overlap, awkward personas)** – Safety Validator + similarity checks
  - **Quality evaluation** – Quality Predictor + manual checks described above

If you’re reviewing a candidate, this checklist is a good way to see whether they can:

- Read and understand a complex, layered system
- Reason about authenticity, safety, and quality
- Extend or modify the planning algorithm without breaking its guarantees

---

## 13. Working on This Project

- **Code style**
  - TypeScript, strict types wherever practical
  - Clear separation between **core algorithms** and **UI**
  - Short, focused functions with JSDoc where behavior is non‑obvious
- **When adding features**
  - Update `GenerationInput` / `WeekCalendar` types as needed
  - Add or extend tests in the relevant algorithm area
  - Consider how the change affects:
    - Authenticity
    - Quality scoring
    - Safety rules
    - Timing realism
- **When evaluating changes**
  - Run `npm test` for algorithm regressions
  - Run `npm run test:api` and inspect results for sanity
  - Manually use the workspace UI with multiple companies/personas/subreddits

Treat this as a **real client‑facing product**, not just an assignment demo. The entire structure is designed so a senior engineer could confidently take full ownership and evolve it over time.
