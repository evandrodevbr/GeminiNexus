<p align="center">
  <img src="docs/assets/logo.png" alt="Gemini Nexus" width="128" height="128" />
</p>

<h1 align="center">Gemini Nexus</h1>

<p align="center">
  <strong>🚀 Gerenciador multi-contas profissional para Google Gemini & Claude AI</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | Português (Brasil)
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
</p>

---

## ✨ Por que o Gemini Nexus?

Quando você usa suas IDEs favoritas, já encontrou estes problemas?

- 😫 A cota da sua única conta acaba rápido, exigindo trocas manuais frequentes
- 🔄 Gerenciar múltiplas contas do Google/Claude é cansativo
- 📊 Você não sabe quanta cota resta na conta atual
- 🔌 Precisa de um proxy local e confiável para suas ferramentas de desenvolvimento

**Gemini Nexus** está aqui para resolver tudo isso! Ele é um app desktop profissional construído em Electron que te ajuda a:

- ✅ **Contas Ilimitadas** - Adicione quantas contas Google Gemini / Claude quiser
- ✅ **Troca Automática** - Troca inteligentemente para a próxima conta disponível quando o limite é atingido
- ✅ **Monitoramento em Tempo Real** - Visualize o uso de cota de todas as contas
- ✅ **Proxy de API Local** - Servidor proxy integrado compatível com OpenAI/Anthropic
- ✅ **Criptografia Segura** - Criptografia AES-256-GCM para seus dados sensíveis

---

## 🌟 Melhorias sobre o Projeto Base

Este projeto contém melhorias significativas de desenvolvimento, correção de erros e melhorias de configuração em relação ao projeto original base.

Principais melhorias incluem:

- **Interface de Gerenciamento de API Aprimorada:** Seletores dinâmicos de modelos e recursos de "Copiar Nome da API" implementados para facilitar a integração com outras ferramentas.
- **Streaming Robusto (SSE):** Correção de bugs críticos no streaming via Server-Sent Events (SSE) no endpoint proxy `/v1/chat/completions` para suportar perfeitamente IDEs como Cursor, OpenCode e Windsurf.
- **Rebranding e Localização:** Rebranding completo para Gemini Nexus com traduções melhoradas em Português (Brasil) e padrões em Inglês.
- **Capacidades de Agentes:** Integração direta de frameworks avançados de agentes desenvolvedores de IA e skills (GSD, AutoResearch, Superpowers) no ecossistema do projeto para desenvolvimento autônomo rápido.
- **Ambiente de Build e Dev:** Melhores configurações de build cross-platform, schemas atualizados e processos de toolchain automatizados.

---

## 🎯 Funcionalidades

<table>
  <tr>
    <td width="50%">
      <h3>☁️ Pool de Contas na Nuvem</h3>
      <ul>
        <li>Adicione contas via OAuth do Google e Anthropic</li>
        <li>Mostra avatar, e-mail, status e último horário de uso</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📊 Monitoramento de Cota</h3>
      <ul>
        <li>Suporte multi-modelo: gemini-pro, claude-3-5-sonnet, etc.</li>
        <li>Barras de progresso visuais com indicadores de cores</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔄 Troca Automática</h3>
      <ul>
        <li>Modo de pool ilimitado com seleção inteligente</li>
        <li>Monitoramento a cada 5 minutos em segundo plano</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔌 Proxy Local</h3>
      <ul>
        <li>Compatível com API da OpenAI & Anthropic</li>
        <li>Mapeamento de modelos customizável (ex: Claude → Gemini)</li>
      </ul>
    </td>
  </tr>
</table>

---

## ⚡ Começo Rápido

### Construindo pelo Código Fonte

#### Pré-requisitos

- Node.js v18 ou superior
- npm

#### Passos

```bash
# Clone o repositório
git clone https://github.com/Draculabo/GeminiNexus.git
cd GeminiNexus

# Instale as dependências
npm install

# Inicie o modo de desenvolvimento
npm start

# Construa para produção
npm run make
```

---

## 📄 Licença

[CC BY-NC-SA 4.0](LICENSE)

---

## ⚠️ Aviso Legal

> [!WARNING]
> **Apenas para Fins Educacionais**
>
> Este projeto destina-se exclusivamente a fins de pesquisa e educação. Ele é fornecido "como está" sem qualquer garantia. **O uso comercial é estritamente proibido.**

---

## 🙏 Créditos

**Gemini Nexus** é uma versão significativamente aprimorada e expandida baseada no projeto original [AntigravityManager](https://github.com/Draculabo/AntigravityManager) criado por [Draculabo](https://github.com/Draculabo). Toda a arquitetura fundamental e design do projeto foram criados pelo autor original.
