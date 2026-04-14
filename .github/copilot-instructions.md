# GitHub Copilot Instructions for IDS AI Skeleton

---
**Version**: 3.1.0 | **Updated**: 2026-02-17
---

## ⚡ CONTEXT LOADING PROTOCOL

Only `.github/copilot-instructions.md` is auto-loaded. All other files must be explicitly read.

**For every coding task — load in this order:**
1. `docs/standards/coding-standards-core.md` — always, before writing any code
2. `docs/standards/coding-standards-backend.md` — additionally for backend work (`apps/astra-apis/**`)
3. `docs/standards/coding-standards-frontend.md` — additionally for frontend work (`apps/client-web/**`)
4. `docs/standards/ravendb-document-design.md` — additionally for RavenDB entities, indexes, queries, or document schema changes

**For planning / new features — also load:**
- `.ai-workflow/.agent.md` — behavior and decision framework
- `.ai-workflow/.ai-project-architecture.md` — folder structure and non-obvious architectural facts

**Load standards BEFORE reading any project source files** — they inform how you analyze code.

---

## �🚨 CRITICAL REQUIREMENT: IMPLEMENTATION PLANNING FIRST 🚨

**⚠️ STOP AND CREATE A PLAN BEFORE ANY CODE CHANGES FOR:**

### Mandatory Planning Triggers (CHECK THESE FIRST):
- Changes affecting **2 or more files or classes**
- **Any database/RavenDB changes** (schema, migrations, queries)
- **New features** or significant modifications to existing features
- Changes to **business logic, handlers, or services**
- **Authentication, authorization, or security-related** changes
- Changes with **potential breaking impacts** or side effects
- **API endpoint changes** (adding, modifying, removing)
- **Component architecture changes** (React components, pages, routing)
- **Performance optimization** work affecting multiple areas
- **State management or data flow** changes
- **Any work where scope or approach is unclear**
- **Complex bug fixes** requiring changes across multiple layers

### 🛑 MANDATORY PLAN-FIRST WORKFLOW:
0. ✅ **LOAD CONTEXT FIRST** (in parallel):
   - `docs/standards/coding-standards-core.md` (always when writing code)
   - `docs/standards/coding-standards-backend.md` (backend work)
   - `docs/standards/coding-standards-frontend.md` (frontend work)
   - `docs/standards/ravendb-document-design.md` (RavenDB entities, indexes, queries)
   - `.ai-workflow/.agent.md` (always — behavior framework)
   - `.ai-workflow/.ai-project-architecture.md` (if adding features)
1. ✅ **FIRST**: Analyze if request matches ANY trigger above
2. ✅ **CHECK FOR EXISTING PLAN**: Look in `.ai-plan/` folder
   - **IF PLAN EXISTS**: Read it, then **present it to the user and ask for approval** (see step 4)
   - **IF NO PLAN**: Create one (see step 3)
3. ✅ **CREATE PLAN** in `.ai-plan/` folder using **`.ai-workflow/.ai-plan-template.md`** template:
   - Detailed list of files/classes/methods affected
   - **High-level code snippets (MANDATORY)**: Show key signatures, class structures, and logic flow
   - High-level architecture overview
   - Impact assessment (breaking changes, dependencies, tests)
   - Step-by-step execution plan
   - **❓ UNRESOLVED QUESTIONS (MANDATORY)**: List specific questions or state "None - all requirements are clear"
4. ✅ **PRESENT PLAN AND ASK FOR APPROVAL**: Show the plan summary and explicitly ask:
   - "Should I proceed with implementation?" or "May I go ahead?"
5. ✅ **WAIT**: DO NOT write code until explicit approval ("go ahead", "proceed", "implement", "looks good")
6. ✅ **IF USER ANSWERS QUESTIONS OR PROVIDES CLARIFICATIONS**:
   - **UPDATE** the plan document with the new information
   - **SHOW** the user the updated plan sections
   - **EXPLICITLY ASK**: "I've updated the plan with your clarifications. Should I proceed with implementation?"
   - **WAIT FOR EXPLICIT APPROVAL WORDS** — answering questions is NOT approval to implement
7. ✅ **AFTER EXPLICIT APPROVAL - UPDATE PLAN STATUS (MANDATORY)**:
   - **UPDATE** the plan file Status from "Draft" to "In Progress"
   - **NOW** create task list and begin implementation
   - **MARK** checklist steps as complete as you progress
8. ✅ **IF DURING IMPLEMENTATION YOU DISCOVER ADDITIONAL REQUIRED COMPONENTS**:
   - **STOP** — do not continue implementing
   - **UPDATE THE PLAN** to include the new scope (keep status as "In Progress")
   - **GET NEW APPROVAL** — original approval doesn't cover expanded scope
9. ✅ **IF USER REQUESTS ADDITIONAL CHANGES DURING/AFTER IMPLEMENTATION**:
   - **ANALYZE** if the new request matches planning triggers
   - **IF YES**: Update plan, show changes, **WAIT FOR APPROVAL AGAIN**
   - **IF NO** (trivial change): Proceed
10. ✅ **WHEN ALL IMPLEMENTATION IS COMPLETE**:
   - **UPDATE** the plan Status to "Completed"

### 🔄 POST-IMPLEMENTATION REQUESTS

When the user reports a bug, error, or requests changes **after implementation is complete**:

1. ✅ **TREAT AS A NEW REQUEST** — re-apply ALL planning triggers above
2. ✅ **Re-read** `.ai-workflow/.agent.md` to reset your behavioral context
3. ✅ **Evaluate** if the fix matches ANY mandatory planning trigger
4. ✅ **If yes** → Create a new plan (can be a mini-plan), get approval, then implement or delegate
5. ✅ **If trivially small** (single-line fix, typo, config value) → Fix directly
6. ❌ **NEVER** jump straight into multi-file fixes without a plan, regardless of conversation length
7. ❌ **Do NOT let conversation momentum bypass the planning workflow**


### 🛑 EXISTING PLANS ARE NOT PRE-APPROVED
- Finding a plan file in `.ai-plan/` does **NOT** mean it's approved for implementation
- A plan status field saying "Approved" from a previous session does **NOT** carry over
- You **MUST** present the plan summary and ask for approval in **THIS** conversation
- Only explicit approval words from the user in **THIS** conversation authorize implementation

### 📂 MULTIPLE PLANS IN `.ai-plan/`
- If multiple plan files exist, **ask the user which plan** this conversation is about
- When presenting a plan, reference the **exact filename** (e.g., "Plan: `.ai-plan/work-order-module.md`")
- Approval applies only to the **explicitly named plan** — not all plans in the folder

---

## 🔍 REFERENCE IMPLEMENTATION ANALYSIS

**When user says "check [X] for reference" or "like [Y]" or "similar to [Z]":**

1. **MANDATORY: Analyze the COMPLETE reference implementation across ALL layers**:
   - [ ] Business Logic layer (handlers, services)
   - [ ] Web/UI layer (components, pages, buttons)
   - [ ] Data layer (entities, repositories, queries)
   - [ ] Integration points (dependency injection, API endpoints)

2. **Document your findings** in the plan:
   ```markdown
   ## Reference Analysis: [Referenced Feature]
   
   **Layers Found:**
   - Business Logic: [handler/service files and their purpose]
   - UI Components: [React component files (.tsx), buttons, user interactions]
   - Data Access: [if applicable]
   - Integration: [DI registration, API endpoints]
   
   **Pattern to Follow:** [High-level description of complete pattern]
   ```

3. **Scope Determination**: Explicitly state which layers your plan includes:
   ```markdown
   ## Implementation Scope
   
   **Layers Being Modified:**
   - ✅ Business Logic: [reason]
   - ✅ UI Layer: [reason]
   - ❌ Data Layer: [not needed because...]
   
   **Why this is complete:** [Explain how user will access/use this feature]
   ```

4. **If unsure whether to include a layer**, add to Unresolved Questions.

---

## 📍 IMPLEMENTATION STATE TRACKING

Mentally track the workflow state at all times:

- **PLANNING**: Creating plan document
- **AWAITING_APPROVAL**: Plan presented, waiting for "go ahead"
- **CLARIFYING**: User answered questions, plan updated, need NEW approval
- **APPROVED**: User said "go ahead/proceed/looks good" — NOW you can implement
- **IMPLEMENTING**: Actively creating/editing files

### State Transitions:
- PLANNING → AWAITING_APPROVAL (plan created or existing plan found → present and ask)
- AWAITING_APPROVAL → CLARIFYING (user answers questions without approval words)
- CLARIFYING → AWAITING_APPROVAL (plan updated, ask again)
- AWAITING_APPROVAL → APPROVED (user says "go ahead")
- APPROVED → IMPLEMENTING (start using implementation tools)

### ⚠️ Critical Rule:
**Can ONLY enter IMPLEMENTING state from APPROVED state.**

---

## 📋 RECOGNIZING CLARIFICATIONS vs APPROVAL

### These phrases indicate CLARIFICATION (NOT approval):
- "yes, but..." / "yes, and..."
- **"yes" followed by ANY additional requirements, specifications, or details**
- "we should use..." / "make sure..." / "instead of X, use Y"
- Technical specifications or requirements
- Questions about the implementation
- "also..." / "additionally..."
- Any response that includes new requirements or changes

### These phrases indicate APPROVAL (can proceed):
- "go ahead" / "proceed" / "implement"
- "looks good" / "sounds good"
- "yes" **ONLY** as a standalone response with **ZERO** additional requirements
- "do it" / "let's do it"

### ⚠️ Critical Rule for "Yes":
If the user says "yes" but **continues talking** with specifications, requirements, or details — **THAT IS A CLARIFICATION**, not approval.

---

## 🔒 PRE-IMPLEMENTATION CHECKLIST

**Before using `create_file`, `replace_string_in_file`, `multi_replace_string_in_file`:**

- [ ] Have I created a plan? (if required by triggers)
- [ ] Have I **presented the plan to the user** in THIS conversation?
- [ ] Did user provide explicit approval words in THIS conversation?
- [ ] Have I **updated the plan Status to "In Progress"** after receiving approval?
- [ ] If user said "yes", did they provide ANYTHING else after it? → That's a CLARIFICATION
- [ ] Is the most recent user message ONLY answering questions? → DO NOT PROCEED
- [ ] Has the plan been updated since last approval? → GET NEW APPROVAL
- [ ] Am I in APPROVED state? → If NO, STOP

### ✅ Direct Implementation OK For (NO PLAN NEEDED):
- Simple CSS/styling (color, size, spacing only)
- Single-line text/string literal changes
- Typo fixes, formatting, comments
- Single-method variable renames (obvious scope)
- Trivial single-location changes with no side effects

### 🚫 User-Provided Code ≠ Approval
If the user provides detailed code examples: still create a plan, show impact, wait for approval. User-provided code is a suggestion, not approval to implement.

---

## Context Files

| File | When to Load |
|---|---|
| `docs/standards/coding-standards-core.md` | **Always** when writing code |
| `docs/standards/coding-standards-backend.md` | Backend work (`apps/astra-apis/**`) |
| `docs/standards/coding-standards-frontend.md` | Frontend work (`apps/client-web/**`) |
| `docs/standards/ravendb-document-design.md` | RavenDB entities, indexes, queries, document schema |
| `.ai-workflow/.agent.md` | Planning, any implementation |
| `docs/architecture/web-client-architecture.md` | Frontend work — feature modules, forms, routing, auth flow |
| `.ai-workflow/.ai-project-architecture.md` | Adding features, unfamiliar with structure |
| `.ai-workflow/.ai-plan-template.md` | Creating implementation plans |

<!-- intent-skills:start -->
## Agent Skills

When working in these areas, load the linked skill file into context for detailed guidance:

| Task / Code Area | Skill |
|---|---|
| Routes, loaders, actions, forms, navigation, pending UI, error boundaries | `.github/skills/react-router-framework-mode/SKILL.md` |
| Data fetching hooks, query configuration, cache invalidation | `.github/skills/tanstack-query/SKILL.md` |
| Optimistic updates, post-mutation cache sync | `.github/skills/tanstack-query/references/mutations.md` |
| Query key design, hierarchical invalidation | `.github/skills/tanstack-query/references/query-keys.md` |
<!-- intent-skills:end -->
