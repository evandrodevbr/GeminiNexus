<p align="center">
  <img src="docs/assets/logo.png" alt="Gemini Nexus" width="128" height="128" />
</p>

<h1 align="center">Gemini Nexus</h1>

<p align="center">
  <strong>🚀 专业的多账户 AI 网关，支持 Google Gemini 和 Claude</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.pt-BR.md">Português</a> | 中文 | <a href="README.es.md">Español</a>
</p>

<p align="center">
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/evandrodevbr/GeminiNexus?style=flat-square" alt="版本" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/evandrodevbr/GeminiNexus/total?style=flat-square&color=blue" alt="下载量" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/evandrodevbr/GeminiNexus?style=flat-square" alt="许可证" />
  </a>
  <img src="https://img.shields.io/badge/平台-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square" alt="平台" />
</p>

---

## ✨ 为什么选择 Gemini Nexus？

- 😫 单个账户配额很快用完，需要频繁手动切换
- 🔄 管理多个 Google/Claude 账户非常繁琐
- 📊 不知道已经消耗了多少 Token 或还剩多少配额
- 🔌 需要一个可靠的本地 API 代理，支持 OpenAI/Anthropic 协议

**Gemini Nexus** 解决所有这些问题。它是一个专业的 Electron 桌面应用，作为你的开发工具和 Google Gemini / Claude AI 之间的智能网关：

- ✅ **无限账户池** — 添加任意数量的 Google Gemini 和 Claude 账户
- ✅ **智能自动切换** — 当配额不足或被限速时自动轮换到下一个可用账户
- ✅ **实时使用分析** — SaaS 级仪表板，配备面积图、趋势指标和模型分布
- ✅ **完整的代理可观测性** — 实时流量监控、请求重放和模型能力检查器
- ✅ **兼容 OpenAI 和 Anthropic** — 即插即用的代理，支持 Cursor、Windsurf、OpenCode
- ✅ **默认安全** — AES-256-GCM 加密，配合操作系统原生凭证管理

---

## 🎯 功能特性

<table>
  <tr>
    <td width="50%">
      <h3>☁️ 云端账户池</h3>
      <ul>
        <li>通过 OAuth 添加无限量的 Google Gemini / Claude 账户</li>
        <li>显示头像、邮箱、状态和最后使用时间</li>
        <li>实时状态监控（活跃、限速、过期）</li>
        <li>每个账户可独立配置代理 URL</li>
        <li>设备身份档案管理及历史记录</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📊 使用分析仪表板</h3>
      <ul>
        <li>实时 Token 消耗，每 15 秒自动刷新</li>
        <li>面积图展示每日/每小时的 Prompt 和 Completion Token</li>
        <li>趋势指标（与上一周期相比的百分比变化）</li>
        <li>统计卡片内嵌迷你折线图（Sparklines）</li>
        <li>水平柱状图展示模型分布排名</li>
        <li>Prompt/Completion 比例可视化</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔌 本地 API 代理（网关）</h3>
      <ul>
        <li>兼容 OpenAI <code>/v1/chat/completions</code></li>
        <li>兼容 Anthropic <code>/v1/messages</code></li>
        <li>完整的 SSE 流式传输支持</li>
        <li>模型映射（如 <code>claude-sonnet-4-6</code> → <code>gemini-3-flash</code>）</li>
        <li>可配置端口、超时时间和 API 密钥</li>
        <li>模型可见性控制</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔄 智能自动切换</h3>
      <ul>
        <li>无限池模式，智能备份选择</li>
        <li>配额低于 5% 或被限速时自动切换</li>
        <li>每 5 分钟后台监控</li>
        <li>优雅降级，带状态原因追踪</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔍 代理可观测性（高级）</h3>
      <ul>
        <li><strong>流量监控</strong> — 实时请求/响应日志</li>
        <li><strong>请求重放</strong> — 重放任意请求进行调试</li>
        <li><strong>模型能力</strong> — 检查视觉、思考、流式、JSON 模式</li>
        <li><strong>开发者工具</strong> — cURL 和 Python 代码生成</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔐 安全与加密</h3>
      <ul>
        <li>所有敏感数据采用 AES-256-GCM 加密</li>
        <li>集成操作系统原生凭证管理器</li>
        <li>自动迁移旧版明文数据</li>
        <li>每个账户的 Token 和配额均加密存储</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚙️ 设置与自定义</h3>
      <ul>
        <li>深色 / 浅色 / 跟随系统主题</li>
        <li>多语言：English & Português (Brasil)</li>
        <li>模型可见性开关</li>
        <li>日志目录访问</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🖥️ 桌面体验</h3>
      <ul>
        <li>原生 Electron 应用，系统托盘集成</li>
        <li>可折叠侧边栏，状态持久化</li>
        <li>响应式布局</li>
        <li>状态栏实时显示代理和连接指标</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📸 截图

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

## ⚡ 快速开始

### 前置要求

- **Node.js** v20 或更高版本
- **npm**

### 从源码构建

```bash
git clone https://github.com/evandrodevbr/GeminiNexus.git
cd GeminiNexus
npm install
npm start

# 构建生产版本
npm run make
```

### 配合 AI IDE 使用

```plaintext
API Base URL:  http://localhost:10100/v1
API Key:       （从应用的 Proxy 页面复制）
Model:         gemini-3-flash
```

---

## 🛠️ 技术栈

| 分类       | 技术                                    |
| ---------- | --------------------------------------- |
| **核心**   | Electron, React 19, TypeScript          |
| **构建**   | Vite, Electron Forge                    |
| **样式**   | Tailwind CSS v4, Radix UI, Lucide Icons |
| **状态**   | TanStack Query, TanStack Router         |
| **后端**   | NestJS (内部网关), ORPC (类型安全 RPC)  |
| **数据库** | Better-SQLite3, Drizzle ORM             |
| **图表**   | Nivo (Line, Bar, Pie)                   |
| **测试**   | Vitest, Playwright                      |

---

## ❓ 常见问题

<details>
<summary><b>问：应用无法启动？</b></summary>

1. 确保依赖已安装：`npm install`
2. Node.js 版本 >= 20
3. 尝试删除 `node_modules` 并重新安装

</details>

<details>
<summary><b>问：IDE 无法连接代理？</b></summary>

1. 确保代理正在运行（状态栏绿色指示器）
2. 确认端口一致（默认 `10100`）
3. 从 Proxy 页面复制 API 密钥
4. 确保至少有一个账户处于活跃状态

</details>

---

## 📄 许可证

[CC BY-NC-SA 4.0](LICENSE)

---

## ⚠️ 免责声明

> [!WARNING]
> **仅供教育目的**
>
> 本项目仅供教育和研究目的使用。按"原样"提供，不提供任何担保。**严禁商业用途。**

---

## 🙏 致谢

**Gemini Nexus** 基于 [Draculabo](https://github.com/Draculabo) 创建的原始项目 [AntigravityManager](https://github.com/Draculabo/AntigravityManager) 大幅增强和扩展。所有基础架构和设计均由原作者完成。
