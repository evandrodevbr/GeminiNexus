# User Guide

This document is a user-level guide for AI assistants working in this repository. It standardizes language, tool/script preferences, and development notes for the current tech stack.

## 💬 Communication Conventions

- **Language**: Use English consistently for conversation, TODOs, and code-related content (comments, UI copy, commit messages, PR descriptions, and similar artifacts).
- **Conclusion first**: Start with the core conclusion/summary, then provide details.
- **References**: When citing code, always provide full file paths (for example, `src/main.ts:42`).

## 💻 Runtime and Tooling

- **Runtime**: Node.js (Electron environment)
- **Node**: Recommended Node.js 20+
- **Package manager**: `npm` (this project includes `package-lock.json`; use npm only)
- **Build tools**: Electron Forge + Vite
- **Terminal**: Windows (PowerShell) / VSCode MCP tools can be used safely

## 🧩 Tech Stack Overview

- **Frontend**:
  - React 19, TypeScript
  - Tailwind CSS v4, `clsx`, `tailwind-merge`, `tailwindcss-animate`
  - Radix UI (Primitives), Lucide React (Icons), Simple Icons (`@icons-pack/react-simple-icons`)
  - `class-variance-authority` (CVA), `react-i18next` + `i18next`
  - TanStack Router (Routing), TanStack Query (State Management)
  - Components: Modular design under `src/components`
- **Backend (Electron Main/Server)**:
  - Electron (Main/Preload/Renderer architecture)
  - NestJS (internal proxy/gateway service, started by main process)
  - Better-SQLite3 (local database), Drizzle ORM / Raw SQL
  - ORPC (type-safe RPC)
  - gRPC (`@grpc/grpc-js`, `@grpc/proto-loader`)
  - Logging: `winston` + `winston-daily-rotate-file`
  - Zod (validation)
- **Testing**:
  - Vitest (unit/integration), Testing Library
  - Playwright (E2E)

## 📁 Directory Structure

```plaintext
.
├─ src/
│  ├─ actions/           # App actions and flow orchestration
│  ├─ assets/            # Static assets
│  ├─ components/        # React UI components (base components under ui/)
│  ├─ constants/         # Constants
│  ├─ hooks/             # Custom React hooks
│  ├─ ipc/               # Electron IPC logic (Database, Config, etc.)
│  ├─ layouts/           # Layout components
│  ├─ lib/               # Shared low-level utilities
│  ├─ localization/      # i18n translation resources
│  ├─ mocks/             # Mock data for tests and development
│  ├─ routes/            # TanStack Router route definitions
│  ├─ server/            # NestJS backend logic (Gateway/Proxy)
│  ├─ services/          # Service layer
│  ├─ styles/            # Global styles (Tailwind classes)
│  ├─ tests/             # Test code
│  ├─ types/             # TypeScript type definitions
│  ├─ utils/             # Utility functions
│  ├─ App.tsx            # React app entry
│  ├─ main.ts            # Electron main entry
│  ├─ preload.ts         # Electron preload script
│  └─ renderer.ts        # Electron renderer entry
├─ forge.config.ts       # Electron Forge config
└─ package.json
```

## 🧱 Component Architecture

- **Modular components**: Each component should have its own directory, with at least a `.tsx` file and optional styles/subcomponents.
- **Shared capabilities**: General helpers in `src/utils/`; low-level shared wrappers in `src/lib/`.
- **Service layer**: Centralize data access in `src/services/` or `src/ipc/`; frontend should consume IPC or RPC only.

## 📦 Common Scripts

Use `npm` for all commands:

- **Development (Dev)**:
  - `npm start` - Start Electron dev environment (Electron Forge)
  - `npm run lint` - Run ESLint checks
  - `npm run format` - Run Prettier check
  - `npm run format:write` - Auto-format with Prettier
  - `npm run type-check` - Run TypeScript type check

- **Build**:
  - `npm run package` - Package app (application bundle only)
  - `npm run make` - Build and generate distributable installers
  - `npm run publish` - Publish app

- **Testing**:
  - `npm test` - Run Vitest tests
  - `npm run test:watch` - Run Vitest in watch mode
  - `npm run test:unit` - Same as above for unit-focused runs
  - `npm run test:e2e` - Run Playwright E2E tests
  - `npm run test:all` - Run all tests

### Running a Single Test

- Unit test: `npm run test:unit path/to/test.test.ts`
- E2E test: `npm run test:e2e path/to/test.spec.ts`
- Type check: `npm run type-check`

## 🧪 Development Notes

- **Build**: Build stage may ignore TS/ESLint errors depending on project/CI configuration.
- **DevTools**: `code-inspector-plugin` is integrated; use `Shift + Click` on page elements to jump to source code.
- **React**: React Strict Mode is disabled.
- **NestJS**: Runs as an Electron child process; logs are visible in main-process console.

## Security and Data

- **Security**: Never commit secrets; use environment variables for sensitive config; validate all user input; encrypt sensitive data.
- **Database**: Use Better-SQLite3; encapsulate operations in services layer; always use prepared statements; test DB operations independently.
- **i18n**: Use `react-i18next`; keys should use kebab-case; translation files are stored in `src/localization/`.

## 📝 Conventions

- **File naming**:
  - Components: PascalCase (for example, `Button.tsx`)
  - Tools/config: camelCase or kebab-case
- **Import paths**: Use `@/` alias for `src/`.
- **Type safety**: Avoid `any`; enforce end-to-end type safety with Zod + TypeScript.
- **Utility methods**: Prefer `lodash-es` over native JavaScript utilities for array/object/string transformations to improve consistency and maintainability.
  - Use named imports (for example, `import { get, groupBy, uniqBy } from 'lodash-es'`), and avoid full-package imports.
- **Component design**:
  - Prefer Radix UI Primitives.
  - Use Tailwind utility classes; avoid CSS Modules unless necessary.
- **API communication**: Frontend should prioritize ORPC client or IPC for strong type inference.

### Naming Specifics

- **Functions/Variables**: camelCase (for example, `handleClick`, `isCurrent`)
- **Constants**: UPPER_SNAKE_CASE (for example, `LOCAL_STORAGE_KEYS`)
- **Files**:
  - Services: `ServiceName.service.ts`
  - Types: `type-name.ts`

### Import Organization

```typescript
// 1. React and core libraries
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// 2. External dependencies (alphabetical order)
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

// 3. Internal imports (using @ alias)
import { Account } from '@/types/account';
import { Card, CardContent } from '@/components/ui/card';
```

### Component Structure

```typescript
// 1. Imports
import React, { useState } from 'react';

// 2. Type definitions
interface ComponentProps { /* props */ }

// 3. Component implementation
export const Component: React.FC<ComponentProps> = ({ prop1 }) => {
  // 4. Hooks
  const { t } = useTranslation();
  // 5. Render
  return <div>{/* JSX */}</div>;
};
```

> Before commit, run `npm run lint` and `npm run format`.

## 📝 Terminal Output and References

- Prefer code blocks; avoid Markdown tables and Mermaid unless necessary.
- If tables are used, keep them left-aligned and check display consistency.

Example:

```plaintext
+------+---------+---------+
|  ID  |  Name   |  Role   |
+------+---------+---------+
|  1   |  Alice  |  Admin  |
|  2   |  Bob    |  User   |
+------+---------+---------+
```

### Reference Rules

- External resources: use full clickable links (issues, docs, API references).
- Source code location: use full file paths (optionally with line numbers).

Example:

```plaintext
- "resolveFilePath owns this logic"
- "VSCode has a known limitation in undo behavior"

References:
- resolveFilePath: src/utils/workspace.ts:40
- VSCode undo limitation: https://github.com/microsoft/vscode/issues/77190
```

## 🏷️ Markdown Writing

- Always specify a language for fenced code blocks; use `plaintext` if unsure.
- Keep one blank line after headings for readability.

## Line-Break Rule

`return` and similar statements should not share a line with other statements. Keep them on separate lines.

## 💭 Commenting Rules

- Required comment scenarios: complex business logic/algorithms, non-obvious behaviors, important design tradeoffs, and key reference links.
- Principles:
  - Explain **why**, not **what**, and not changelog history.
  - Update comments whenever related code changes.
  - Prefer JSDoc; for complex functions, start with high-level overview, then annotate key steps (1, 2, 3...).
  - Keep spacing between English and Chinese words if both appear for readability; do not comment deleted legacy code.

Quality self-check: six months later, what useful context does a new teammate gain from this comment? If the answer is "none", remove it.

Example:

```typescript
/**
 * Handle payment request with multi-step validation.
 */
function processPayment(request: PaymentRequest) {
  // 1. Input validation
  // 2. Risk evaluation (low/medium/high paths)
  // 3. Gateway call
  // 4. User notification
}

export enum BudgetType {
  Free = 'free',
  /** ✅ Prefer JSDoc over end-of-line comments */
  Package = 'package',
}
```

## 🛠️ Development Guide

### General Principles

- Prioritize stability and maintainability before optimization.
- For uncertainty, state assumptions/tradeoffs/validation approach clearly, then implement.
- Trust agreed preconditions; avoid excessive defensive coding against guaranteed invariants.
- Refactor legacy code conservatively; use modern approaches for new features where appropriate.
- Avoid premature optimization: implement simple and direct first; optimize only when justified.
- Always use braces for control flow (`if`, `while`, and similar statements).

### Error Handling

```typescript
// Use try-catch for async operations
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to complete operation');
}

// Use proper error typing
if (error instanceof Error) {
  /* handle Error instance */
}
```

### New Feature Implementation

- Code should be clear, readable, reusable, efficient, and testable.
- Prefer mature and reliable modern APIs.

### Refactoring and Bug Fixing

- Prefer incremental changes; align scope first before large refactors.
- Preserve existing structure and style; avoid over-abstraction risk.

### Development Lifecycle Checklist

Exploration / planning:

- \[ ] Fully understand requirements; break down into 3-6 steps
- \[ ] Review documentation and existing solutions first
- \[ ] Validate ideas by reading actual code
- \[ ] Build a TODO list

Implementation / refactor / fix:

- [ ] Review related templates and surrounding code; follow existing patterns
- [ ] Fail fast on invalid inputs/states
- [ ] Improve frontend interaction and UX within constraints

Acceptance / validation:

- \[ ] Validate implementation through tests or temporary scripts
- \[ ] After multiple incremental edits, evaluate whether changes should be consolidated
- \[ ] Run quality checks
- \[ ] Update related docs

Summary / output:

- \[ ] Verify output formatting requirements
- \[ ] List deviations from plan and key decisions for human review
- \[ ] Provide optimization suggestions
- \[ ] Include full references at the end

## 🔍 Code Quality and Lint

- Use descriptive variable names (`mutationObserver`, `button`, `element`) and avoid `mo`, `btn`, `el`.
- Check for missing critical comments and keep comment language consistent.
- Use VSCode MCP diagnostics for TS/ESLint issues and fix key findings.
- If tests are added/updated, run and fix them before submission.

## ⛔ Operations Requiring Explicit Confirmation

- Running destructive commands
- Executing `git commit` or `git push`
- Creating new test files (maintainer review required first)

## 🔧 Tool Preferences and Commands

Packages and scripts:

- `npm install` (or `npm i`)

Shell:

- Run commands in repository root.
- Quote file paths when appropriate.

Web search:

- Use `WebSearch` for latest information; use `mcp__SearXNG__search` when needed.

Documentation/usage lookup:

- Use `context7` for latest dependency usage.

## 🚨 Local Quality Checks (Optional Flow)

After a set of changes, run these three checks in parallel instead of full lint immediately:

```plaintext
Task(subagent_type: "quick-code-review", description: "Code review", prompt: "[change description]")
Task(subagent_type: "diagnostics", description: "Diagnostics", prompt: "[same as above]")
Task(subagent_type: "run-related-tests", description: "Run tests", prompt: "[same as above]")
```

`change description` example:

```plaintext
- Modified files: list of relative paths
- Context: requirement/business background
```

Flow: initial check -> fix key issues -> re-check -> iterate until key issues are resolved.

Note: these tools are read-only analyzers; you still need to apply fixes manually. Pass precise file paths, not broad directories.
