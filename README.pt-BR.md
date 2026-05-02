<p align="center">
  <img src="docs/assets/logo.png" alt="Gemini Nexus" width="128" height="128" />
</p>

<h1 align="center">Gemini Nexus</h1>

<p align="center">
  <strong>🚀 Gateway de IA multi-contas profissional para Google Gemini & Claude</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | Português | <a href="README.zh-CN.md">中文</a> | <a href="README.es.md">Español</a>
</p>

<p align="center">
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/evandrodevbr/GeminiNexus?style=flat-square" alt="Release" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/evandrodevbr/GeminiNexus/total?style=flat-square&color=blue" alt="Downloads" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/evandrodevbr/GeminiNexus?style=flat-square" alt="Licença" />
  </a>
  <img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square" alt="Plataforma" />
  <img src="https://img.shields.io/badge/electron-latest-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
</p>

> [!IMPORTANT]
> **Usuários do Windows:** Se você vir um aviso do SmartScreen **"O Windows protegeu o seu computador"** durante a instalação, clique em **"Mais informações"** e depois em **"Executar mesmo assim"**. Isso é um aviso de segurança esperado para aplicativos novos e não assinados.

---

## 📖 Sumário

- [✨ Por que o Gemini Nexus?](#-por-que-o-gemini-nexus)
- [🎯 Funcionalidades](#-funcionalidades)
- [📸 Screenshots](#-screenshots)
- [⚡ Instalação e Início Rápido](#-instalação-e-início-rápido)
- [🛠️ Stack Tecnológica](#️-stack-tecnológica)
- [💻 Desenvolvimento](#-desenvolvimento)
- [❓ FAQ](#-faq)
- [🤝 Contribuindo](#-contribuindo)
- [📄 Licença](#-licença)

---

## ✨ Por que o Gemini Nexus?

Ao usar IDEs e ferramentas de programação com IA, você já enfrentou estes problemas?

- 😫 **Limites de cota:** A cota da conta única acaba rápido, exigindo trocas manuais frequentes.
- 🔄 **Gestão de contas:** Gerenciar múltiplas contas do Google/Claude é cansativo.
- 📊 **Uso às cegas:** Você não sabe quantos tokens já consumiu ou quanta cota resta.
- 🔌 **Problemas de integração:** Precisa de um proxy local confiável que fale os protocolos OpenAI/Anthropic nativamente.
- 🔍 **Falta de transparência:** Não consegue ver o que está sendo enviado ou recebido pelo proxy nos bastidores.

O **Gemini Nexus** resolve tudo isso. É um aplicativo desktop profissional em Electron que funciona como um gateway inteligente entre suas ferramentas de desenvolvimento e o Google Gemini / Claude AI.

### Principais Vantagens

- ✅ **Pool de Contas Ilimitado** — Adicione quantas contas Google Gemini & Claude quiser.
- ✅ **Troca Automática Inteligente** — Rotaciona automaticamente para a próxima conta disponível quando a cota está baixa ou com rate limit.
- ✅ **Analytics de Uso em Tempo Real** — Dashboard nível SaaS com gráficos de área, indicadores de tendência e distribuição por modelo.
- ✅ **Observabilidade Completa do Proxy** — Monitor de tráfego ao vivo, replay de requisições e inspetor de capacidades dos modelos.
- ✅ **Compatível com OpenAI & Anthropic** — Proxy drop-in para Cursor, Windsurf, OpenCode e qualquer ferramenta compatível com OpenAI.
- ✅ **Seguro por Padrão** — Criptografia AES-256-GCM com gerenciamento nativo de credenciais do sistema operacional.

---

## 🎯 Funcionalidades

<table>
  <tr>
    <td width="50%">
      <h3>☁️ Pool de Contas na Nuvem</h3>
      <ul>
        <li>Adicione contas ilimitadas do Google Gemini / Claude via OAuth</li>
        <li>Exibe avatar, e-mail, status e último uso</li>
        <li>Monitoramento de status em tempo real (Ativa, Rate Limited, Expirada)</li>
        <li>Configuração de proxy URL por conta</li>
        <li>Gerenciamento de perfil de identidade do dispositivo com histórico</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📊 Dashboard de Analytics de Uso</h3>
      <ul>
        <li>Consumo de tokens em tempo real com auto-refresh a cada 15s</li>
        <li>Gráficos de área para tokens de prompt & completion (diário/horário)</li>
        <li>Indicadores de tendência (% de variação vs período anterior)</li>
        <li>Sparklines inline nos cards de estatísticas</li>
        <li>Ranking de distribuição por modelo com gráficos de barras horizontais</li>
        <li>Visualização da proporção Prompt/Completion</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔌 Proxy de API Local (Gateway)</h3>
      <ul>
        <li>Endpoint compatível com OpenAI <code>/v1/chat/completions</code></li>
        <li>Endpoint compatível com Anthropic <code>/v1/messages</code></li>
        <li>Streaming SSE completo (testado com Cursor, Windsurf, OpenCode)</li>
        <li>Mapeamento de modelos (ex: <code>claude-sonnet-4-6</code> → <code>gemini-3-flash</code>)</li>
        <li>Porta, timeout e API key configuráveis</li>
        <li>Controle de visibilidade de modelos</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔄 Troca Automática Inteligente</h3>
      <ul>
        <li>Modo de pool ilimitado com seleção inteligente de backup</li>
        <li>Troca automática quando cota < 5% ou com rate limit</li>
        <li>Monitoramento em segundo plano a cada 5 minutos</li>
        <li>Fallback gracioso com rastreamento de motivo do status</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔍 Observabilidade do Proxy (Avançado)</h3>
      <ul>
        <li><strong>Monitor de Tráfego</strong> — Log ao vivo de requisições/respostas com latência e informações do modelo</li>
        <li><strong>Replay de Requisições</strong> — Reproduza qualquer requisição registrada para debugging</li>
        <li><strong>Capacidades dos Modelos</strong> — Inspecione suporte a visão, thinking, streaming e modo JSON</li>
        <li><strong>Ferramentas para Devs</strong> — Geração de código cURL & Python, cópia com um clique</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔐 Segurança e Criptografia</h3>
      <ul>
        <li>Criptografia AES-256-GCM para todos os dados sensíveis</li>
        <li>Integração com gerenciador de credenciais nativo (Keytar + SafeStorage)</li>
        <li>Migração automática de dados legados em texto plano</li>
        <li>Armazenamento criptografado de tokens & cotas por conta</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚙️ Configurações e Personalização</h3>
      <ul>
        <li>Suporte a temas Escuro / Claro / Sistema</li>
        <li>Multi-idioma: English & Português (Brasil)</li>
        <li>Override de proxy URL por conta</li>
        <li>Toggles de visibilidade de modelos</li>
        <li>Acesso ao diretório de logs</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🖥️ Experiência Desktop</h3>
      <ul>
        <li>App nativo Electron com integração na bandeja do sistema</li>
        <li>Sidebar retrátil com estado persistente</li>
        <li>Layouts responsivos em todas as telas</li>
        <li>Barra de status com indicadores ao vivo de proxy e conexão</li>
        <li>Error boundaries com fallbacks amigáveis ao usuário</li>
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

## ⚡ Instalação e Início Rápido

### 📦 Download

Você pode baixar os binários pré-compilados mais recentes para Windows, macOS e Linux na nossa [página de Releases](https://github.com/evandrodevbr/GeminiNexus/releases).

*(Consulte o aviso no topo desta página se você estiver usando o Windows e encontrar o prompt do SmartScreen).*

### 🔌 Usando com IDEs de IA

Com o aplicativo rodando e pelo menos uma conta adicionada, configure sua IDE preferida (Cursor, Windsurf, OpenCode, etc.):

```plaintext
API Base URL:  http://localhost:10100/v1
API Key:       (copie da página Proxy no app)
Model:         gemini-3-flash  (ou qualquer modelo mapeado)
```

### 🛠️ Compilando pelo Código Fonte

#### Pré-requisitos

- **Node.js** v20 ou superior
- **npm** (este projeto usa `package-lock.json`)

#### Passos

```bash
# Clone o repositório
git clone https://github.com/evandrodevbr/GeminiNexus.git
cd GeminiNexus

# Instale as dependências
npm install

# Inicie o modo de desenvolvimento
npm start

# Compile para produção (ex: instalador Windows)
npm run make
```

---

## 🛠️ Stack Tecnológica

| Categoria          | Tecnologias                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Core**           | [Electron](https://www.electronjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)  |
| **Build**          | [Vite](https://vitejs.dev/), [Electron Forge](https://www.electronforge.io/)                                            |
| **Estilização**    | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Estado**         | [TanStack Query](https://tanstack.com/query/latest), [TanStack Router](https://tanstack.com/router/latest)              |
| **Backend**        | [NestJS](https://nestjs.com/) (gateway interno), [ORPC](https://orpc.unnoq.com/) (RPC type-safe)                        |
| **Banco de Dados** | [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3), [Drizzle ORM](https://orm.drizzle.team/)                  |
| **Gráficos**       | [Nivo](https://nivo.rocks/) (Line, Bar, Pie)                                                                            |
| **i18n**           | [react-i18next](https://react.i18next.com/)                                                                             |
| **Testes**         | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)                                                    |

---

## 💻 Desenvolvimento

```bash
# Iniciar ambiente de dev (Electron + Vite HMR)
npm start

# Executar linting
npm run lint

# Verificar tipos
npm run type-check

# Formatar código
npm run format:write

# Rodar testes
npm test
```

### Estrutura do Projeto

```plaintext
src/
├── actions/           # Ações do app e orquestração de fluxos
├── components/        # Componentes React
│   ├── proxy/         # Componentes da página Proxy (abas avançadas)
│   ├── usage/         # Componentes de analytics de uso (StatCard, ChartCard)
│   └── ui/            # Primitivos base de UI (baseados no Radix)
├── hooks/             # Custom React hooks
├── ipc/               # Electron IPC + handlers de banco de dados
├── layouts/           # Componentes de layout (MainLayout + sidebar)
├── localization/      # Recursos de tradução i18n
├── routes/            # Páginas TanStack Router (index, usage, proxy, settings)
├── server/            # Backend NestJS (serviço de gateway proxy)
├── services/          # Camada de serviços
├── types/             # Definições de tipos TypeScript + schemas Zod
└── utils/             # Funções utilitárias
```

---

## ❓ FAQ

<details>
<summary><b>P: Aviso do Windows SmartScreen ("O Windows protegeu o seu computador") durante a instalação?</b></summary>

Sim, este é um aviso comum para novos aplicativos não assinados. Clique em **"Mais informações"** e depois em **"Executar mesmo assim"**. Veja o aviso no topo do README para mais detalhes.
</details>

<details>
<summary><b>P: O app não inicia ao compilar pelo código fonte?</b></summary>

1. Certifique-se de que todas as dependências estão instaladas: `npm install`.
2. Verifique se a versão do Node.js é >= 20.
3. Tente deletar `node_modules` e reinstalar.
4. No Windows, certifique-se de que o WiX Toolset está disponível para o comando `npm run make`.
</details>

<details>
<summary><b>P: O login da conta falhou?</b></summary>

1. Verifique se a conexão com a internet está funcionando.
2. Tente limpar os dados do app e fazer login novamente.
3. Verifique se a conta está restrita pelo Google/Claude.
</details>

<details>
<summary><b>P: A IDE não consegue conectar ao proxy?</b></summary>

1. Certifique-se de que o proxy está rodando (indicador verde na barra de status).
2. Verifique se a porta corresponde à configuração da sua IDE (padrão: `10100`).
3. Copie a API key da página Proxy e cole nas configurações da sua IDE.
4. Verifique se pelo menos uma conta está ativa na página de Contas.
</details>

<details>
<summary><b>P: A contagem de tokens mostra zero?</b></summary>

1. Este era um bug conhecido em versões anteriores — por favor, atualize para a versão mais recente.
2. O rastreamento de tokens agora lida corretamente com metadados de streaming e contagens estimadas.
3. Os dados de uso são atualizados a cada 15 segundos na página de Analytics de Uso.
</details>

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Leia o `CONTRIBUTING.md` para mais detalhes.

---

## 📄 Licença

[CC BY-NC-SA 4.0](LICENSE)

---

## ⚠️ Aviso Legal

> [!WARNING]
> **Apenas para Fins Educacionais**
>
> Este projeto destina-se exclusivamente a fins de pesquisa e educação. Ele é fornecido "como está" sem qualquer garantia. **O uso comercial é estritamente proibido.**
>
> Ao usar este software, você concorda que não o utilizará para quaisquer fins comerciais, e que é o único responsável por garantir que seu uso esteja em conformidade com todas as leis e regulamentações aplicáveis. Os autores e contribuidores não se responsabilizam por qualquer uso indevido ou danos decorrentes do uso deste software.

---

## 🙏 Créditos

**Gemini Nexus** é uma versão significativamente aprimorada e expandida do projeto original [AntigravityManager](https://github.com/Draculabo/AntigravityManager) criado por [Draculabo](https://github.com/Draculabo). Toda a arquitetura fundamental e design foram criados pelo autor original.
