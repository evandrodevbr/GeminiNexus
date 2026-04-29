# Contributing to Gemini Nexus

Thank you for considering contributing to Gemini Nexus! 🎉

Whether it's a bug report, feature suggestion, documentation improvement, or code contribution — all help is welcome.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Making Changes](#-making-changes)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Code Style](#-code-style)
- [Reporting Issues](#-reporting-issues)

---

## 📜 Code of Conduct

This project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🚀 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/GeminiNexus.git
   cd GeminiNexus
   ```

3. **Add the upstream remote**:

   ```bash
   git remote add upstream https://github.com/evandrodevbr/GeminiNexus.git
   ```

---

## 💻 Development Setup

### Prerequisites

- **Node.js** v20 or higher
- **npm** (this project uses `package-lock.json`)
- **Git**

### Installation

```bash
# Install dependencies
npm install

# Start the app in development mode
npm start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the app in development mode (Electron + Vite HMR) |
| `npm run lint` | Run ESLint |
| `npm run format` | Check formatting with Prettier |
| `npm run format:write` | Auto-format code with Prettier |
| `npm run type-check` | Run TypeScript type check |
| `npm test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run test:all` | Run all tests (unit + E2E) |
| `npm run make` | Build production installers |

### Project Structure

```plaintext
src/
├── components/        # React UI components (Radix-based primitives in ui/)
├── hooks/             # Custom React hooks
├── ipc/               # Electron IPC + database handlers
├── layouts/           # Layout components (MainLayout + sidebar)
├── localization/      # i18n translation resources
├── routes/            # TanStack Router pages (index, usage, proxy, settings)
├── server/            # NestJS backend (proxy gateway service)
├── services/          # Service layer
├── types/             # TypeScript type definitions + Zod schemas
└── utils/             # Utility functions
```

---

## ✏️ Making Changes

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**, then commit:

   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

3. **Keep your branch up to date**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/). Commits are analyzed by `semantic-release` to automatically determine version bumps and generate changelogs.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Release |
|------|-------------|---------|
| `feat` | A new feature | **minor** |
| `fix` | A bug fix | **patch** |
| `perf` | Performance improvement | **patch** |
| `refactor` | Code change (no bug fix or feature) | **patch** |
| `docs` | Documentation only | no release |
| `style` | Formatting, whitespace | no release |
| `test` | Adding or fixing tests | no release |
| `chore` | Build process, tooling | no release |
| `ci` | CI/CD changes | no release |

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or `!` after the type to trigger a **major** release:

```
feat!: remove legacy plaintext storage

BREAKING CHANGE: all accounts must re-authenticate after upgrade.
```

### Examples

```
feat(proxy): add Anthropic /v1/messages endpoint
fix(usage): handle SQL SUM(null) in empty date ranges
docs(readme): add Chinese and Spanish translations
ci: normalize Node.js to v20 across all workflows
```

---

## 🔄 Pull Request Process

### Before Opening a PR

1. Run the quality checks:

   ```bash
   npm run lint
   npm run format:write
   npm run type-check
   npm test
   ```

2. Update documentation if you changed functionality
3. Add tests for new features

### PR Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented hard-to-understand areas
- [ ] I have updated related documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix or feature works
- [ ] All existing tests pass locally

### Review Process

- PRs require at least one maintainer approval
- CI must pass (lint, type-check, unit tests)
- Squash-merge is preferred for clean history

---

## 🎨 Code Style

### TypeScript

- Use TypeScript for all new code — avoid `any`
- Use Zod for runtime validation
- Prefer `lodash-es` named imports over native utilities
- Use `@/` alias for `src/` imports

### React Components

- Functional components with hooks only
- Use Radix UI primitives for accessible components
- TypeScript interfaces for props
- Follow existing component structure (`components/ComponentName.tsx`)

### Styling

- Tailwind CSS v4 utility classes
- Use `clsx` + `tailwind-merge` for conditional classes
- Follow the Gemini Nexus design tokens (`rounded-xl`, `border-white/[0.06]`)

### Import Order

```typescript
// 1. React and core libraries
import React, { useEffect } from 'react';

// 2. External dependencies (alphabetical)
import { useTranslation } from 'react-i18next';

// 3. Internal imports (using @ alias)
import { Card } from '@/components/ui/card';
```

---

## 🐛 Reporting Issues

### Bug Reports

[Create a bug report](https://github.com/evandrodevbr/GeminiNexus/issues/new?labels=bug&template=bug_report.md) with:

- Clear title describing the issue
- Steps to reproduce the behavior
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, app version, Node.js version)

### Feature Requests

[Suggest a feature](https://github.com/evandrodevbr/GeminiNexus/issues/new?labels=enhancement&template=feature_request.md) with:

- Clear description of the feature
- Use case — why is this needed?
- Possible implementation ideas (optional)

---

## 🙏 Thank You

Your contributions make Gemini Nexus better for everyone. Thank you for your time!

If you have questions, feel free to [open a discussion](https://github.com/evandrodevbr/GeminiNexus/discussions) or reach out to the maintainers.
