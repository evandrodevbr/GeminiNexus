<p align="center">
  <img src="docs/assets/logo.png" alt="Gemini Nexus" width="128" height="128" />
</p>

<h1 align="center">Gemini Nexus</h1>

<p align="center">
  <strong>🚀 Professional multi-account manager for Google Gemini & Claude AI</strong>
</p>

<p align="center">
  English | <a href="README.pt-BR.md">Português (Brasil)</a>
</p>

<p align="center">
  <a href="https://github.com/Draculabo/GeminiNexus/actions/workflows/testing.yaml">
    <img src="https://github.com/Draculabo/GeminiNexus/actions/workflows/testing.yaml/badge.svg" alt="Tests" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/actions/workflows/lint.yaml">
    <img src="https://github.com/Draculabo/GeminiNexus/actions/workflows/lint.yaml/badge.svg" alt="Lint" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/Draculabo/GeminiNexus?style=flat-square" alt="Release" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/Draculabo/GeminiNexus/total?style=flat-square&color=blue" alt="Downloads" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Draculabo/GeminiNexus?style=flat-square" alt="License" />
  </a>
</p>

---

## 📖 Table of Contents

- [Why Gemini Nexus?](#-why-gemini-nexus)
- [Improvements over Base Project](#-improvements-over-base-project)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Tech Stack](#️-tech-stack)
- [Development](#-development)
- [Debugging Docs](#-debugging-docs)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Why Gemini Nexus?

When using your favorite IDEs, have you ever encountered these problems?

- 😫 Single account quota runs out quickly, requiring frequent manual switching
- 🔄 Managing multiple Google/Claude accounts is cumbersome
- 📊 Don't know how much quota is left on the current account
- ⏰ Worried about missing quota reset times
- 🔌 Need a reliable local API proxy for development tools

**Gemini Nexus** is here to solve these problems! It's a professional Electron desktop app that helps you:

- ✅ **Unlimited Account Pool** - Add any number of Google Gemini / Claude accounts
- ✅ **Smart Auto-Switching** - Automatically switch to the next available account when quota is low or rate-limited
- ✅ **Real-time Monitoring** - Visualize quota usage for all accounts
- ✅ **Local API Proxy** - Built-in OpenAI/Anthropic compatible proxy server
- ✅ **Secure Encryption** - AES-256-GCM encryption for sensitive data

---

## 🌟 Improvements over Base Project

This project contains significant development improvements, bug fixes, and configuration enhancements compared to the original base project. 

Key improvements include:
- **Enhanced API Management UI:** Implemented dynamic model selectors and "Copy API Name" features to streamline integration with other tools.
- **Robust SSE Streaming:** Fixed critical Server-Sent Events (SSE) streaming bugs in the `/v1/chat/completions` proxy endpoint to perfectly support IDEs like Cursor, OpenCode, and Windsurf.
- **Rebranding and Localization:** Complete rebranding to Gemini Nexus with improved Portuguese (Brazil) localization and English defaults.
- **Agentic Capabilities:** Integration of advanced AI developer agents and skill frameworks (GSD, AutoResearch, Superpowers) directly into the project ecosystem for rapid autonomous development.
- **Build & Dev Env:** Better cross-platform build configurations, updated schemas, and automated toolchain processes.

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
      </ul>
    </td>
    <td width="50%">
      <h3>📊 Real-time Quota Monitoring</h3>
      <ul>
        <li>Multi-model support: gemini-pro, claude-3-5-sonnet, etc.</li>
        <li>Visual progress bars with color indicators</li>
        <li>Auto & manual refresh capabilities</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔄 Intelligent Auto-Switching</h3>
      <ul>
        <li>Unlimited pool mode with smart backup selection</li>
        <li>Auto-switch when quota < 5% or rate-limited</li>
        <li>Background monitoring every 5 minutes</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔐 Security First</h3>
      <ul>
        <li>AES-256-GCM encryption for sensitive data</li>
        <li>OS native credential manager integration</li>
        <li>Auto migration of legacy plaintext data</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔌 Local API Proxy</h3>
      <ul>
        <li>OpenAI & Anthropic API compatible</li>
        <li>Configurable port and request timeout</li>
        <li>Model mapping (e.g. Claude → Gemini)</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🛠️ Developer Tools</h3>
      <ul>
        <li>Built-in cURL & Python code generation</li>
        <li>Visual service status monitoring</li>
        <li>One-click API Key regeneration</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📸 Screenshots

<p align="center">
  <img src="docs/assets/screenshot-main.png" alt="Main Interface" width="80%" />
</p>

---

## ⚡ Quick Start

### Build from Source

#### Prerequisites

- Node.js v18 or higher
- npm or pnpm

#### Steps

```bash
# Clone the repository
git clone https://github.com/Draculabo/GeminiNexus.git
cd GeminiNexus

# Install dependencies
npm install

# Start development
npm start

# Build for production
npm run make
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Core** | [Electron](https://www.electronjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [TailwindCSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) |
| **State** | [TanStack Query](https://tanstack.com/query/latest) |
| **Database** | [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) |

---

## ❓ FAQ

<details>
<summary><b>Q: The app won't start?</b></summary>

Please check:
1. Make sure all dependencies are installed: `npm install`
2. Check if Node.js version is >= 18
3. Try deleting `node_modules` and reinstalling

</details>

<details>
<summary><b>Q: Account login failed?</b></summary>

1. Ensure network connection is working
2. Try clearing app data and logging in again
3. Check if the account is restricted by Google/Claude

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
