# Brand Briefing — Gemini Nexus

## 1. Nome e Descrição

| Campo               | Valor                                                                |
| ------------------- | -------------------------------------------------------------------- |
| **Nome**            | Gemini Nexus                                                         |
| **Product Name**    | Gemini Nexus                                                         |
| **Package Name**    | gemini-nexus                                                         |
| **Versão**          | 0.11.1                                                               |
| **Descrição EN**    | Professional multi-account manager for Google Gemini & Claude AI     |
| **Descrição PT-BR** | Gerenciador multi-contas profissional para Google Gemini & Claude AI |
| **Autor**           | evandrodevbr / Draculabo                                             |
| **Licença**         | CC-BY-NC-SA-4.0 (apenas fins educacionais)                           |

---

## 2. Propósito do Aplicativo

Gemini Nexus é um **aplicativo desktop profissional** (Electron) que funciona como um **hub central (nexus)** para desenvolvedores que usam IDEs com IA.

### Funcionalidades Principais

- **Pool ilimitado de contas**: Adicionar múltiplas contas Google Gemini / Claude via OAuth
- **Auto-switching inteligente**: Troca automática de conta quando a cota acaba ou há rate limit
- **Monitoramento em tempo real**: Barras de progresso coloridas para visualizar uso de quota
- **Proxy API local**: Servidor proxy integrado compatível OpenAI/Anthropic (porta 8045)
- **Segurança**: Criptografia AES-256-GCM para dados sensíveis

### Público-Alvo

- Desenvolvedores que usam IDEs com integração AI (Cursor, Windsurf, VS Code, Claude Code, etc.)
- Power users que precisam alternar entre múltiplas contas de IA
- Usuários que precisam de um proxy API local confiável

---

## 3. Tom de Voz / Personalidade

- **Profissional e técnica**: Termos como "Nexus", "Proxy", "Gateway", "Quota", "Circuit Breaker"
- **Confiável e estável**: Monitoramento, health checks, logging robusto
- **Developer-first**: Suporte a múltiplas IDEs, geração de cURL/Python
- **Moderna e minimalista**: Interface limpa, componentes modulares
- **Global**: Suporte a i18n (EN, PT-BR, ZH, RU, VI)

---

## 4. Estilo Visual Atual

### Tema

- Dual theme (claro/escuro) com detecção automática do sistema
- Extremamente minimalista e quase monocromático

### Paleta de Cores (Tailwind OKLCH)

| Modo       | Background                     | Foreground            | Primary | Destructive     | Destaque |
| ---------- | ------------------------------ | --------------------- | ------- | --------------- | -------- |
| **Claro**  | oklch(0.99 0 0) — quase branco | oklch(0 0 0) — preto  | Preto   | Vermelho        | Azul     |
| **Escuro** | oklch(0 0 0) — preto puro      | oklch(1 0 0) — branco | Branco  | Vermelho escuro | —        |

### Cores Funcionais

- **Emerald/Green (`#10b981`)** — status ativo, quota alta, running
- **Amber/Yellow** — quota média, alertas
- **Rose/Red** — quota baixa, erro, stopped
- **Blue** — AI credits, informações premium

### Tipografia

- **Geist** (sans-serif) — fonte principal moderna e geométrica (da Vercel)
- **Geist Mono** (monospace) — dados técnicos, números de quota
- **Tomorrow** (display/futurista) — possíveis títulos estilizados

### Características de UI

- Bordas arredondadas (`0.5rem` / 8px)
- Sombras sutis
- Cards com hover states suaves
- Interface limpa com espaçamento generoso

---

## 5. Assets Visuais Existentes

| Arquivo                                                          | Descrição                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `docs/assets/logo.png`                                           | Logo antiga (Antigravity) — 128x128, usada no README |
| `docs/assets/screenshot-main.png`                                | Screenshot da interface principal                    |
| `docs/assets/screenshot-proxy.png`                               | Screenshot da aba proxy                              |
| `docs/assets/screenshot-setting.png`                             | Screenshot de settings                               |
| `src/assets/icon.png`                                            | Ícone do app (também é o logo antigo)                |
| `src/assets/tray.png`                                            | Ícone da system tray                                 |
| `images/icon.ico` / `images/icon.icns`                           | Ícones de build para Windows/Mac                     |
| `images/favicon-*.png`                                           | Favicons em múltiplos tamanhos                       |
| `images/32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png` | Ícones para AppImage Linux                           |
| `src/assets/fonts/geist/`                                        | Fonte Geist (principal)                              |
| `src/assets/fonts/geist-mono/`                                   | Fonte Geist Mono (código/dados)                      |
| `src/assets/fonts/tomorrow/`                                     | Fonte Tomorrow (display, 4 pesos)                    |

---

## 6. Conceitos Visuais Sugeridos para a Logo

### A. Nodo / Conexão (Nexus)

- Ponto central conectado a múltiplos pontos (contas gerenciadas)
- Círculo central com 2-3 linhas finas irradiando
- Dois círculos interligados (Gemini + Claude)

### B. Infinito / Loop (Gemini + Proxy)

- Símbolo de infinito (∞) modificado como circuito/loop de dados
- Referência à dualidade "Gemini" (gêmeos)
- Curva contínua elegante com seta indicando fluxo

### C. Cubo / Hexágono (Nexus / Hub)

- Hexágono ou cubo isométrico minimalista
- Linhas finas, perspectiva suave
- Face "aberta" ou conectada

### D. Monograma "GN"

- Letras "G" e "N" abstraídas como nodo de rede
- Estilo geométrico, similar a Tomorrow ou Geist

### E. Proxy / Pipe (Fluxo de Dados)

- Duas barras paralelas com seta passando entre elas
- "Pipe" minimalista — conduz tráfego entre APIs

---

## 7. Diretrizes para a Nova Logo

| Elemento                     | Especificação                                                             |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Estilo**                   | Minimalista, geométrica, precisa, técnica                                 |
| **Cores principais**         | Preto (`#000000`) e branco (`#ffffff`)                                    |
| **Cor de acento (opcional)** | Emerald (`#10b981`) para "ativo/online"                                   |
| **Versões necessárias**      | Dark mode e light mode                                                    |
| **Tamanhos**                 | De 16x16 (tray) até 512x512 (macOS)                                       |
| **Monocromática**            | Deve funcionar em preto e branco puro                                     |
| **Tipografia do wordmark**   | Geométrica sans-serif, peso medium/semibold, tracking levemente expandido |

---

## 8. Conclusão

O app pede uma logo que evoque **conexão/nexo** (Nexus) com **múltiplos pontos** (contas) de forma geométrica e limpa, usando primariamente preto/branco com um toque sutil de verde (emerald) para representar o estado "ativo/online" central ao propósito do app.

A logo deve transmitir:

- **Tecnologia** e **precisão**
- **Conectividade** e **hub central**
- **Profissionalismo** e **confiança**
- **Modernidade** e **minimalismo**
