<p align="center">
  <img src="docs/assets/logo.png" alt="Gemini Nexus" width="128" height="128" />
</p>

<h1 align="center">Gemini Nexus</h1>

<p align="center">
  <strong>🚀 Professional multi-account AI gateway for Google Gemini & Claude</strong>
</p>

<p align="center">
  English | <a href="README.pt-BR.md">Português</a> | <a href="README.zh-CN.md">中文</a> | <a href="README.es.md">Español</a>
</p>

<p align="center">
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/evandrodevbr/GeminiNexus?style=flat-square" alt="Release" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/evandrodevbr/GeminiNexus/total?style=flat-square&color=blue" alt="Downloads" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/evandrodevbr/GeminiNexus?style=flat-square" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/electron-latest-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
</p>

> [!IMPORTANT]
> **Windows Users:** If you see a **"Windows protected your PC"** (SmartScreen) warning during installation, click **"More info"** and then **"Run anyway"**. This is an expected security prompt for new, unsigned applications.

---

## 📖 Table of Contents

- [✨ Why Gemini Nexus?](#-why-gemini-nexus)
- [🎯 Features](#-features)
- [📸 Screenshots](#-screenshots)
- [⚡ Installation & Quick Start](#-installation--quick-start)
- [🛠️ Tech Stack](#️-tech-stack)
- [💻 Development](#-development)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Why Gemini Nexus?

When using AI-powered IDEs and coding tools, have you ever run into these problems?

- 😫 **Quota limits:** Single account quotas run out quickly, requiring frequent manual switching.
- 🔄 **Account management:** Managing multiple Google/Claude accounts is cumbersome.
- 📊 **Blind usage:** You don't know how much quota or how many tokens you've actually consumed.
- 🔌 **Integration issues:** You need a reliable local API proxy that speaks OpenAI/Anthropic protocols natively.
- 🔍 **Lack of transparency:** You can't see what's actually being sent or received by the proxy under the hood.

**Gemini Nexus** solves all of these issues. It's a professional Electron desktop application that acts as an intelligent gateway between your development tools and Google Gemini / Claude AI.

### Key Value Proposition

- ✅ **Unlimited Account Pool** — Add any number of Google Gemini & Claude accounts.
- ✅ **Smart Auto-Switching** — Automatically rotates to the next available account when quota is low or rate-limited.
- ✅ **Real-time Usage Analytics** — SaaS-grade dashboard with area charts, trend indicators, and model distribution.
- ✅ **Full Proxy Observability** — Live traffic monitor, request replay, and model capabilities inspector.
- ✅ **OpenAI & Anthropic Compatible** — Drop-in replacement proxy for Cursor, Windsurf, OpenCode, and any OpenAI-compatible tool.
- ✅ **Secure by Default** — AES-256-GCM encryption with OS-native credential management.

---

## 🎯 Features

<table>
  <tr>
    <td width="50%">
      <h3>☁️ Cloud Account Pool</h3>
      <ul>
        <li>Add unlimited Google Gemini / Claude accounts via OAuth</li>
        <li>Display avatar, email, status, and last used time</li>
        <li>Real-time status monitoring (Active, Rate Limited, Expired)</li>
        <li>Per-account proxy URL configuration</li>
        <li>Device identity profile management with history</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📊 Usage Analytics Dashboard</h3>
      <ul>
        <li>Real-time token consumption with 15s auto-refresh</li>
        <li>Area charts for daily/hourly prompt & completion tokens</li>
        <li>Trend indicators (% change vs previous period)</li>
        <li>Inline sparklines on stat cards</li>
        <li>Model distribution ranking with horizontal bar charts</li>
        <li>Prompt/Completion ratio visualization</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔌 Local API Proxy (Gateway)</h3>
      <ul>
        <li>OpenAI <code>/v1/chat/completions</code> compatible endpoint</li>
        <li>Anthropic <code>/v1/messages</code> compatible endpoint</li>
        <li>Full SSE streaming support (tested with Cursor, Windsurf, OpenCode)</li>
        <li>Model mapping (e.g. <code>claude-sonnet-4-6</code> → <code>gemini-3-flash</code>)</li>
        <li>Configurable port, timeout, and API key</li>
        <li>Model visibility control (show/hide specific models)</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔄 Intelligent Auto-Switching</h3>
      <ul>
        <li>Unlimited pool mode with smart backup selection</li>
        <li>Auto-switch when quota < 5% or rate-limited</li>
        <li>Background monitoring every 5 minutes</li>
        <li>Graceful fallback with status reason tracking</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔍 Proxy Observability (Advanced)</h3>
      <ul>
        <li><strong>Traffic Monitor</strong> — Live request/response log with latency, status, and model info</li>
        <li><strong>Request Replay</strong> — Replay any recorded request for debugging</li>
        <li><strong>Model Capabilities</strong> — Inspect vision, thinking, streaming, JSON mode support per model</li>
        <li><strong>Developer Tools</strong> — cURL & Python code generation, one-click copy</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔐 Security & Encryption</h3>
      <ul>
        <li>AES-256-GCM encryption for all sensitive data</li>
        <li>OS native credential manager integration (Keytar + SafeStorage)</li>
        <li>Auto migration of legacy plaintext data</li>
        <li>Encrypted token & quota storage per account</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚙️ Settings & Customization</h3>
      <ul>
        <li>Dark / Light / System theme support</li>
        <li>Multi-language: English & Português (Brasil)</li>
        <li>Per-account proxy URL override</li>
        <li>Model visibility toggles</li>
        <li>Log directory access</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🖥️ Desktop Experience</h3>
      <ul>
        <li>Native Electron app with system tray integration</li>
        <li>Collapsible sidebar with persistent state</li>
        <li>Responsive layouts across all views</li>
        <li>Status bar with live proxy and connection indicators</li>
        <li>Error boundaries with user-friendly fallbacks</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📸 Screenshots


<p align="center">
  <img src="docs/assets/main.png" alt="Main Dashboard" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/2usage.png" alt="Usage Analytics" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/3proxy.png" alt="Proxy Monitor" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/4routing.png" alt="Routing Config" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/5docs.png" alt="Documentation" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/6connections.png" alt="Active Connections" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/7config.png" alt="Settings Configuration" width="80%" />
</p>

---

## ⚡ Installation & Quick Start

### 📦 Download the App

You can download the latest pre-compiled binaries for Windows, macOS, and Linux from our [Releases page](https://github.com/evandrodevbr/GeminiNexus/releases). 

*(Refer to the warning at the top of this page if you are using Windows and encounter the SmartScreen prompt).*

### 🔌 Using with AI IDEs

Once the application is running and you have added at least one account, configure your preferred IDE (Cursor, Windsurf, OpenCode, etc.):

```plaintext
API Base URL:  http://localhost:10100/v1
API Key:       (copy this from the Proxy page in the app)
Model:         gemini-3-flash  (or any mapped model of your choice)
```

### 🛠️ Build from Source

#### Prerequisites

- **Node.js** v20 or higher
- **npm** (this project uses `package-lock.json`)

#### Steps

```bash
# Clone the repository
git clone https://github.com/evandrodevbr/GeminiNexus.git
cd GeminiNexus

# Install dependencies
npm install

# Start the application in development mode
npm start

# Build for production (e.g., Windows installer)
npm run make
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Core** | [Electron](https://www.electronjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Build** | [Vite](https://vitejs.dev/), [Electron Forge](https://www.electronforge.io/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **State** | [TanStack Query](https://tanstack.com/query/latest), [TanStack Router](https://tanstack.com/router/latest) |
| **Backend** | [NestJS](https://nestjs.com/) (internal gateway), [ORPC](https://orpc.unnoq.com/) (type-safe RPC) |
| **Database** | [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3), [Drizzle ORM](https://orm.drizzle.team/) |
| **Charts** | [Nivo](https://nivo.rocks/) (Line, Bar, Pie) |
| **i18n** | [react-i18next](https://react.i18next.com/) |
| **Testing** | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) |

---

## 💻 Development

```bash
# Start dev environment (Electron + Vite HMR)
npm start

# Run linting
npm run lint

# Type check
npm run type-check

# Format code
npm run format:write

# Run tests
npm test
```

### Project Structure

```plaintext
src/
├── actions/           # App actions and flow orchestration
├── components/        # React UI components
│   ├── proxy/         # Proxy page components (advanced tabs)
│   ├── usage/         # Usage analytics components (StatCard, ChartCard)
│   └── ui/            # Base UI primitives (Radix-based)
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

## ❓ FAQ

<details>
<summary><b>Q: "Windows protected your PC" (SmartScreen) warning during installation?</b></summary>

Yes, this is a common warning for new unsigned applications. Click **"More info"** and then **"Run anyway"**. See the warning at the top of the README for more details.
</details>

<details>
<summary><b>Q: The app won't start when building from source?</b></summary>

1. Make sure all dependencies are installed: `npm install`
2. Check if your Node.js version is >= 20.
3. Try deleting `node_modules` and reinstalling.
4. On Windows, ensure the WiX Toolset is available for `npm run make`.
</details>

<details>
<summary><b>Q: Account login failed?</b></summary>

1. Ensure your network connection is working.
2. Try clearing the app data and logging in again.
3. Check if the account is restricted by Google/Claude.
</details>

<details>
<summary><b>Q: My IDE can't connect to the proxy?</b></summary>

1. Make sure the proxy is actually running (look for the green indicator in the status bar).
2. Verify the port matches your IDE config (default is `10100`).
3. Copy the API key directly from the Proxy page and paste it into your IDE settings.
4. Check that at least one account is active in the Accounts page.
</details>

<details>
<summary><b>Q: Token counts are showing zero?</b></summary>

1. This was a known bug in earlier versions — please update to the latest release.
2. Token tracking now correctly handles streaming metadata and estimated counts.
3. Usage data refreshes every 15 seconds on the Usage Analytics page.
</details>

---

## 🤝 Contributing

Contributions are welcome! Please read `CONTRIBUTING.md` for details.

---

## 📄 License

This project uses a dual-license structure:

- **Original code** from [AntigravityManager](https://github.com/Draculabo/AntigravityManager) by [Draculabo](https://github.com/Draculabo): Licensed under [CC BY-NC-SA 4.0](LICENSE).
- **All new code, features, and architecture** by [evandrodevbr](https://github.com/evandrodevbr): Licensed under the [MIT License](LICENSE-MIT).

> 🔄 **Migration Notice:** This project is actively being migrated to a fully open-source license (MIT). As the remaining original code is progressively rewritten, the entire project will transition to MIT. We are committed to making Gemini Nexus 100% open-source.

---

## 🙏 Credits

This project was originally forked from [AntigravityManager](https://github.com/Draculabo/AntigravityManager) created by [Draculabo](https://github.com/Draculabo). The initial proxy concept and early Electron scaffolding were based on his work.

Since the fork, **the vast majority of the codebase has been rewritten, redesigned, and expanded** by [evandrodevbr](https://github.com/evandrodevbr), including but not limited to:

- Complete UI/UX redesign (navigation, accounts, usage analytics, proxy management)
- Usage Analytics dashboard with cost tracking, token averages, and OpenRouter integration
- Traffic monitor with per-request token/cost inspection
- Environment isolation (dev/prod), CI/CD pipeline, and test infrastructure
- IDE Quick Setup (OpenCode, Cursor, VS Code, Claude Code)
- Custom model pricing configuration
- All documentation and internationalization (EN, PT-BR, ES, ZH-CN)
