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
  <a href="https://github.com/Draculabo/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/Draculabo/GeminiNexus?style=flat-square" alt="Release" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/Draculabo/GeminiNexus/total?style=flat-square&color=blue" alt="Downloads" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Draculabo/GeminiNexus?style=flat-square" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/electron-latest-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
</p>

---

## 📖 Table of Contents

- [Why Gemini Nexus?](#-why-gemini-nexus)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Tech Stack](#️-tech-stack)
- [Development](#-development)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Why Gemini Nexus?

When using AI-powered IDEs and coding tools, have you ever run into these problems?

- 😫 Single account quota runs out quickly, requiring frequent manual switching
- 🔄 Managing multiple Google/Claude accounts is cumbersome
- 📊 Don't know how much quota or tokens you've consumed
- 🔌 Need a reliable local API proxy that speaks OpenAI/Anthropic protocols
- 🔍 Can't see what's actually being sent/received by the proxy

**Gemini Nexus** solves all of these. It's a professional Electron desktop application that acts as an intelligent gateway between your development tools and Google Gemini / Claude AI:

- ✅ **Unlimited Account Pool** — Add any number of Google Gemini & Claude accounts
- ✅ **Smart Auto-Switching** — Automatically rotates to the next available account when quota is low or rate-limited
- ✅ **Real-time Usage Analytics** — SaaS-grade dashboard with area charts, trend indicators, and model distribution
- ✅ **Full Proxy Observability** — Live traffic monitor, request replay, and model capabilities inspector
- ✅ **OpenAI & Anthropic Compatible** — Drop-in replacement proxy for Cursor, Windsurf, OpenCode, and any OpenAI-compatible tool
- ✅ **Secure by Default** — AES-256-GCM encryption with OS-native credential management

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
  <img src="docs/assets/main.png" alt="Main" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/2usage.png" alt="Usage" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/3proxy.png" alt="Proxy" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/4routing.png" alt="Routing" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/5docs.png" alt="Docs" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/6connections.png" alt="Connections" width="80%" />
</p>
<p align="center">
  <img src="docs/assets/7config.png" alt="Config" width="80%" />
</p>

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** v20 or higher
- **npm** (this project uses `package-lock.json`)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Draculabo/GeminiNexus.git
cd GeminiNexus

# Install dependencies
npm install

# Start development
npm start

# Build for production (Windows installer)
npm run make
```

### Using with AI IDEs

Once the proxy is running, configure your IDE:

```plaintext
# In Cursor / Windsurf / OpenCode settings:
API Base URL:  http://localhost:10100/v1
API Key:       (copy from the Proxy page in the app)
Model:         gemini-3-flash  (or any mapped model)
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
<summary><b>Q: The app won't start?</b></summary>

1. Make sure all dependencies are installed: `npm install`
2. Check if Node.js version is >= 20
3. Try deleting `node_modules` and reinstalling
4. On Windows, ensure the WiX Toolset is available for `npm run make`

</details>

<details>
<summary><b>Q: Account login failed?</b></summary>

1. Ensure network connection is working
2. Try clearing app data and logging in again
3. Check if the account is restricted by Google/Claude

</details>

<details>
<summary><b>Q: IDE can't connect to the proxy?</b></summary>

1. Make sure the proxy is running (green indicator in the status bar)
2. Verify the port matches your IDE config (default: `10100`)
3. Copy the API key from the Proxy page and paste it in your IDE settings
4. Check that at least one account is active in the Accounts page

</details>

<details>
<summary><b>Q: Token counts show zero?</b></summary>

1. This was a known bug in earlier versions — update to the latest version
2. Token tracking now correctly handles streaming metadata and estimated counts
3. Usage data refreshes every 15 seconds on the Usage Analytics page

</details>

---

## 🤝 Contributing

Contributions are welcome! Please read `CONTRIBUTING.md` for details.

---

## 📄 License

[CC BY-NC-SA 4.0](LICENSE)

---

## ⚠️ Disclaimer

> [!WARNING]
> **For Educational Purposes Only**
>
> This project is intended solely for educational and research purposes. It is provided "as-is" without any warranty. **Commercial use is strictly prohibited.**
>
> By using this software, you agree that you will not use it for any commercial purposes, and you are solely responsible for ensuring your use complies with all applicable laws and regulations. The authors and contributors are not responsible for any misuse or damages arising from the use of this software.

---

## 🙏 Credits

**Gemini Nexus** is a significantly enhanced and expanded version of the original project [AntigravityManager](https://github.com/Draculabo/AntigravityManager) created by [Draculabo](https://github.com/Draculabo). All fundamental architecture and design were made by the original author.
