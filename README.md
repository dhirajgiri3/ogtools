# Reddit Mastermind

> **AI-Powered Reddit Content Calendar Generator**  
> Plan authentic, company-specific Reddit conversations designed to drive upvotes, views, and inbound leads – without getting accounts banned.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Assignment Context](#assignment-context)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing & QA](#testing--qa)
- [Project Structure](#project-structure)
- [Evaluation Guide](#evaluation-guide)
- [Development Guidelines](#development-guidelines)

---

## 🎯 Overview

Reddit Mastermind is a **production-grade Reddit content calendar generator** that automates the planning of authentic, multi-persona Reddit conversations for businesses and agencies.

### The Problem

Marketing agencies manually create Reddit content calendars in spreadsheets, then log into multiple accounts to post and reply. This is:
- **Time-consuming** – Hours spent planning and executing each week
- **Error-prone** – Easy to overpost, sound spammy, or get accounts banned
- **Unscalable** – Can't serve multiple clients without massive overhead

### The Solution

Reddit Mastermind uses a **6-layer AI planning engine** to automatically generate:
- ✅ **Authentic conversations** that sound like real humans, not AI
- ✅ **Multi-persona threads** with realistic timing and interactions
- ✅ **Quality-scored content** with predictable engagement potential
- ✅ **Safety-validated calendars** that protect account health
- ✅ **Week-by-week schedules** with chronological event timelines

---

## ✨ Key Features

### 🧠 **Intelligent Conversation Design**
- **Arc Templates**: Discovery, Comparison, Problem-Solver, and more
- **Multi-persona orchestration**: Realistic interactions between 2+ personas
- **Subreddit-aware prompts**: Adapts to community norms and culture

### 🎭 **Authenticity Engine**
- **Subreddit calibration**: Professional vs. casual tone matching
- **Human imperfections**: Typos, informal contractions, lowercase "i"
- **Reddit culture markers**: "lol", "tbh", "ngl", trailing dots, emphatic caps
- **Personality injection**: Persona-specific vocabulary and speech patterns

### 📊 **Quality Prediction (0-100 Score)**
Five-dimensional scoring system:
1. **Subreddit Relevance** (0-20) – On-topic and community-aligned
2. **Problem Specificity** (0-20) – Concrete, relatable details
3. **Authenticity** (0-25) – Avoids AI patterns, feels human
4. **Value-First Behavior** (0-20) – Subtle, delayed product mentions
5. **Engagement Design** (0-15) – Invites real conversation

### ⏰ **Realistic Timing Engine**
- **Persona timing profiles**: Active windows, peak hours, weekend behavior
- **Human-like delays**: Comments 15-45 min after posts, not instant
- **Distribution algorithms**: Avoids clustering and regular patterns

### 🛡️ **Safety Validation**
- **Frequency limits**: Max posts per subreddit/persona/week
- **Timing realism**: No instant back-to-back activity
- **Collusion detection**: Identifies suspicious co-posting patterns
- **Content similarity checks**: Prevents repetitive posts

### 🎨 **Premium UI/UX**
- **Modern design system**: Glassmorphism, gradients, micro-animations
- **Responsive workspace**: Mobile, tablet, and desktop optimized
- **Real-time generation**: Live progress tracking and status updates
- **Export functionality**: JSON, CSV, and formatted calendar exports
- **Demo mode**: Pre-loaded SlideForge example data

---

## 📖 Assignment Context

### The Story

**Maddie** is an agency owner running Reddit marketing for clients. When she creates posts and has her team reply from multiple accounts, clients get significantly more inbound leads.

**Today's workflow:**
1. Hand-build content calendar in spreadsheet (hours per week)
2. Assistant logs into multiple Reddit accounts
3. Manually post and reply following the calendar
4. Hope nothing gets flagged as spam

**The Assignment:**
Design and implement the **planning algorithm** that automates this work. Assume posting/commenting functions exist – focus on the **planning engine + product surface**.

### Required Inputs
- ✅ Company information (name, product, value props, keywords)
- ✅ List of personas (2+) with backstories and communication styles
- ✅ Target subreddits (e.g., r/productivity, r/startups)
- ✅ ChatGPT-style queries/keywords to target
- ✅ Number of posts per week

### Required Outputs
- ✅ Content calendar for the week (conversations + schedule + metadata)
- ✅ Ability to generate subsequent weeks (Week 2, 3, 4...)
- ✅ Quality and safety reports for each calendar

### Business Goals
- 🎯 Drive **upvotes, views, and inbound leads**
- 🎯 Help clients rank on **Google** and get cited in **LLM answers**
- 🎯 Maintain **long-term account health** (no bans)
- 🎯 Generate **authentic, non-spammy** content

### Evaluation Criteria
- **Ownership**: Could we trust you to own this end-to-end?
- **Product mindset**: Would you be proud to ship this to real clients?
- **Quality over speed**: Better to ship fewer high-quality features
- **Testing rigor**: Proactive testing of edge cases and quality

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14** – App Router, React Server Components
- **TypeScript** – Strict typing throughout
- **React 18** – Modern hooks and patterns

### Styling & UI
- **Tailwind CSS** – Utility-first styling
- **shadcn/ui** – High-quality component primitives
- **Framer Motion** – Smooth animations and transitions
- **Custom design tokens** – Consistent spacing, colors, typography

### AI & Algorithms
- **OpenAI API** – GPT-4 for content generation (mocked in tests)
- **Custom algorithm stack** – 6-layer planning engine
- **Prompt engineering** – Subreddit-aware, persona-driven prompts

### Data & Storage
- **Supabase** – Client wired and ready for persistence
- **Local state management** – React hooks + context
- **Type-safe contracts** – Zod validation schemas

### Testing & QA
- **Jest** – Unit and integration tests
- **Testing Library** – Component testing
- **Custom QA scripts** – API scenario testing
- **Coverage reporting** – Comprehensive test coverage

---

## 🏗️ Architecture

### 6-Layer Planning Engine

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (/api/*)                   │
│  /generate  |  /regenerate  |  /validate                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Orchestration & Workflow Logic             │
│  Input validation → Generation loop → Scheduling        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Layer 6: Safety Validator              │
│  Frequency limits | Timing realism | Collusion detection│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Layer 5: Timing Engine                 │
│  Persona schedules | Human-like delays | Distribution   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Layer 4: Quality Predictor              │
│  5-dimension scoring | Grade assignment | Issue detection│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Layer 3: Authenticity Engine             │
│  Subreddit calibration | Imperfections | Reddit markers │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Layer 2: Conversation Designer             │
│  Arc templates | Persona mapping | Prompt building      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Layer 1: Data & Types                   │
│  Type definitions | Persona library | Subreddit profiles│
└─────────────────────────────────────────────────────────┘
```

### Layer Details

#### **Layer 1: Data & Types**
- **Location**: `src/core/types`, `src/core/data/**`
- **Purpose**: Type-safe contracts and static data
- **Key files**:
  - `persona-library.ts` – 20+ pre-built personas
  - `subreddit-profiles.ts` – 30+ subreddit configurations
  - `types/index.ts` – All domain models

#### **Layer 2: Conversation Designer**
- **Location**: `src/core/algorithms/conversation/**`
- **Purpose**: Structure realistic multi-persona threads
- **Features**:
  - Arc templates (Discovery, Comparison, Problem-Solver, etc.)
  - Persona-to-role mapping
  - Subreddit-aware prompt construction

#### **Layer 3: Authenticity Engine**
- **Location**: `src/core/algorithms/authenticity/engine.ts`
- **Purpose**: Transform AI-perfect text into natural Reddit language
- **Transformations**:
  - Subreddit calibration (professional vs. casual)
  - Human imperfections (typos, informal contractions)
  - Reddit culture markers ("lol", "tbh", "ngl", etc.)
  - Personality injection (persona-specific vocab)

#### **Layer 4: Quality Predictor**
- **Location**: `src/core/algorithms/quality/predictor.ts`
- **Purpose**: Score conversations on 0-100 scale
- **Dimensions**:
  1. Subreddit Relevance (0-20)
  2. Problem Specificity (0-20)
  3. Authenticity (0-25)
  4. Value-First Behavior (0-20)
  5. Engagement Design (0-15)

#### **Layer 5: Timing Engine**
- **Location**: `src/core/algorithms/timing/**`
- **Purpose**: Generate realistic schedules
- **Features**:
  - Persona timing profiles (active windows, peaks)
  - Human-like delays (15-45 min for first comment)
  - Distribution algorithms (avoid clustering)

#### **Layer 6: Safety Validator**
- **Location**: `src/core/algorithms/safety/validator.ts`
- **Purpose**: Enforce anti-spam rules
- **Checks**:
  - Frequency limits (max posts per subreddit/persona/week)
  - Timing realism (no instant back-to-back)
  - Collusion detection (suspicious co-posting)
  - Content similarity (repetitive posts)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **OpenAI API key** (for production use)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd reddit-mastermind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
```

### Environment Configuration

Create `.env.local` in the project root:

```bash
# Required for production content generation
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Tests mock the LLM calls, so you can run `npm test` without an API key.

### Development Server

```bash
# Start the development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

---

## 📡 API Documentation

### `POST /api/generate`

Generate a content calendar for a specific week.

**Request Body:**
```typescript
{
  company: {
    name: string;
    product: string;
    valuePropositions: string[];
    keywords: string[];
  };
  personas: Persona[];  // 2+ personas
  subreddits: string[];  // e.g., ["r/productivity", "r/startups"]
  keywords: string[];  // Targeting queries
  postsPerWeek: number;  // e.g., 5
  weekNumber?: number;  // Default: 1
  previousWeeks?: WeekCalendar[];  // For multi-week context
  qualityThreshold?: number;  // 0-100, default: 60
}
```

**Response:**
```typescript
{
  weekNumber: number;
  conversations: ConversationThread[];
  averageQuality: number;
  safetyReport: SafetyReport;
  metadata: {
    generatedAt: string;
    totalConversations: number;
    subredditDistribution: Record<string, number>;
    personaUsage: Record<string, number>;
  };
}
```

### `POST /api/regenerate`

Regenerate specific conversations with updated constraints.

**Request Body:**
```typescript
{
  conversationIds: string[];
  input: GenerationInput;
  qualityThreshold?: number;
}
```

### `POST /api/validate`

Re-run safety validation on edited conversations.

**Request Body:**
```typescript
{
  conversations: ConversationThread[];
  personas: Persona[];
}
```

**Response:**
```typescript
{
  safetyReport: SafetyReport;
}
```

---

## 🧪 Testing & QA

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Watch mode (recommended during development)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ Authenticity Engine transformations
- ✅ Quality Predictor scoring logic
- ✅ Safety Validator rules
- ✅ Timing Engine scheduling
- ✅ Text similarity and variance calculations
- ✅ End-to-end API contracts

### API Scenario Testing

```bash
# Start dev server first
npm run dev

# In another terminal, run API tests
npm run test:api
```

**What it tests:**
- Multiple company types (SaaS, DTC, B2B)
- Different persona combinations
- Various subreddit targets
- Edge cases (overposting, repetition, quality thresholds)

**Output:**
- JSON results in `test-results/` directory
- Console logs with quality and safety analysis

---

## 📁 Project Structure

```
reddit-mastermind/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Marketing pages
│   │   │   └── page.tsx              # Landing page
│   │   ├── (platform)/               # Authenticated platform
│   │   │   └── workspace/            # Main workspace
│   │   │       └── page.tsx          # Calendar generation UI
│   │   └── api/                      # API routes
│   │       ├── generate/             # Main generation endpoint
│   │       ├── regenerate/           # Regenerate conversations
│   │       └── validate/             # Safety validation
│   │
│   ├── core/                         # Domain logic & algorithms
│   │   ├── algorithms/               # 6-layer planning engine
│   │   │   ├── authenticity/         # Layer 3: Authenticity Engine
│   │   │   ├── conversation/         # Layer 2: Conversation Designer
│   │   │   ├── quality/              # Layer 4: Quality Predictor
│   │   │   ├── safety/               # Layer 6: Safety Validator
│   │   │   ├── timing/               # Layer 5: Timing Engine
│   │   │   └── orchestration/        # Workflow orchestration
│   │   ├── data/                     # Static data & libraries
│   │   │   ├── personas/             # Persona library (20+ personas)
│   │   │   ├── subreddits/           # Subreddit profiles (30+)
│   │   │   ├── prompts/              # Prompt templates
│   │   │   └── demo/                 # Demo company data
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── validation/               # Zod schemas
│   │   ├── config/                   # Configuration constants
│   │   └── errors/                   # Custom error classes
│   │
│   ├── modules/                      # Feature modules
│   │   ├── landing/                  # Marketing site components
│   │   │   └── components/           # Hero, features, etc.
│   │   └── workspace/                # Workspace feature
│   │       ├── components/           # Setup panel, calendar, threads
│   │       └── lib/                  # Workspace utilities
│   │
│   └── shared/                       # Shared libraries & components
│       ├── components/ui/            # shadcn/ui primitives
│       ├── lib/                      # Utilities
│       │   ├── api/                  # API clients (OpenAI, etc.)
│       │   └── utils/                # Text similarity, helpers
│       └── styles/                   # Design tokens, animations
│
├── test-data/                        # API test scenarios
├── test-results/                     # API test outputs
├── test-api.js                       # API QA script
└── README.md                         # This file
```

---

## 📊 Evaluation Guide

### How to Evaluate a Calendar (3/10 vs 9/10)

When reviewing generated content, focus on these dimensions:

#### **1. Authenticity (Does it feel human?)**
- ❌ **Bad**: "I would recommend utilizing this productivity tool for optimal workflow management."
- ✅ **Good**: "honestly i've been using this for a few weeks and it's been pretty solid for keeping track of stuff"

**Check for:**
- Small imperfections (typos, informal contractions)
- Personality markers (persona-specific vocab)
- Reddit culture ("lol", "tbh", "ngl", etc.)
- Natural flow (not overly structured)

#### **2. Problem Specificity (Is it concrete?)**
- ❌ **Bad**: "I need a better way to manage my tasks."
- ✅ **Good**: "i'm drowning in like 3 different spreadsheets for client work and keep missing deadlines... spent 2 hours yesterday just figuring out what i was supposed to do"

**Check for:**
- Concrete details (time spent, metrics, deadlines)
- Relatable context (specific pain points)
- Real-world scenarios (not generic)

#### **3. Value-First Behavior (Is it subtle?)**
- ❌ **Bad**: "You should try [Product]! It's the best solution for this."
- ✅ **Good**: "i ended up trying a few different things... one that worked for me was [product] but honestly the key was just having everything in one place"

**Check for:**
- Delayed product mentions (not in first comment)
- Casual, non-salesy tone
- Value-oriented framing (how it helped, not features)

#### **4. Variety (Are conversations different?)**
- ❌ **Bad**: All posts start with "I'm struggling with..." and mention product in comment 2
- ✅ **Good**: Mix of discovery questions, comparison posts, problem-solving threads

**Check for:**
- Different arc templates used
- Varied conversation structures
- Distinct persona voices

#### **5. Safety (Is it sustainable?)**
- ❌ **Bad**: 5 posts in r/productivity in one day, all from same persona
- ✅ **Good**: Distributed across subreddits, realistic timing, varied personas

**Check for:**
- No overposting in single subreddit
- Realistic timing intervals (not instant replies)
- Believable persona interactions

### Quality Score Interpretation

| Score | Grade | Interpretation |
|-------|-------|----------------|
| 80-100 | Excellent | Ship immediately, high engagement potential |
| 60-79 | Good | Solid quality, minor tweaks may improve |
| 40-59 | Fair | Needs revision, some obvious issues |
| 0-39 | Poor | Major problems, regenerate recommended |

### Safety Risk Levels

| Risk | Interpretation | Action |
|------|----------------|--------|
| Low | Safe to execute, no red flags | Proceed |
| Medium | Minor concerns, monitor closely | Review warnings |
| High | Significant issues, revise before posting | Fix violations |
| Critical | Do not post, account ban risk | Regenerate |

---

## 💻 Development Guidelines

### Code Style

- **TypeScript**: Strict typing throughout, no `any` unless absolutely necessary
- **Separation of concerns**: Core algorithms separate from UI
- **Function size**: Short, focused functions (< 50 lines ideal)
- **Documentation**: JSDoc for non-obvious behavior

### Adding Features

When extending the system:

1. **Update types** in `src/core/types` if needed
2. **Add tests** in the relevant algorithm area
3. **Consider impact** on:
   - Authenticity (will it sound natural?)
   - Quality scoring (does it improve engagement?)
   - Safety rules (does it introduce spam risk?)
   - Timing realism (does it feel human?)

### Testing Changes

Before committing:

```bash
# 1. Run unit tests
npm test

# 2. Run API scenario tests
npm run test:api

# 3. Manual UI testing
npm run dev
# Test with multiple companies/personas/subreddits in workspace
```

### Commit Guidelines

- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- **Descriptive messages**: Explain the "why", not just the "what"
- **Atomic commits**: One logical change per commit

---

## 🎓 Assignment Mapping Checklist

This section maps the original assignment requirements to implementation:

### ✅ Required Inputs
- [x] **Company info** → `CompanyContext` type + workspace setup form
- [x] **2+ personas** → Persona library (20+) + selection UI
- [x] **Subreddits** → Subreddit profiles (30+) + multi-select
- [x] **ChatGPT queries** → Keywords/queries in `GenerationInput`
- [x] **Posts per week** → `postsPerWeek` parameter

### ✅ Required Outputs
- [x] **Content calendar for the week** → `WeekCalendar` from `/api/generate`
- [x] **Subsequent weeks** → `weekNumber` + `previousWeeks` context
- [x] **Schedule** → Timing Engine generates chronological events
- [x] **Quality metadata** → Quality Predictor scores each conversation
- [x] **Safety metadata** → Safety Validator produces detailed reports

### ✅ Business Goals
- [x] **Drive upvotes/views/inbounds** → Authenticity + Quality engines
- [x] **Rank on Google/LLMs** → High-quality, linkable threads
- [x] **Long-term account health** → Safety Validator enforces limits
- [x] **Authentic, non-spammy** → Multi-layer authenticity transformations

### ✅ Quality & Testing
- [x] **Natural conversation** → Multi-persona threads with realistic dynamics
- [x] **Real vs manufactured** → Intentional imperfections, persona consistency
- [x] **Proactive testing** → Jest tests + API QA scripts
- [x] **Vary inputs** → Multiple test scenarios (SaaS, DTC, B2B, etc.)
- [x] **Catch edge cases** → Safety checks + similarity detection
- [x] **Quality evaluation** → 5-dimension scoring + manual review guide

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

This is an assignment project, but if you'd like to extend it:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Review the [Evaluation Guide](#evaluation-guide)
- Check the [API Documentation](#api-documentation)

---

**Built with ❤️ for agencies and marketers who want to scale Reddit marketing without sacrificing authenticity.**
