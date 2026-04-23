**✅ Documento Completo: Integração com Custom Endpoint do OpenCode (Provedores Custom / OpenAI-Compatible)**

OpenCode (https://opencode.ai) é um agente de IA para terminal que usa o **Vercel AI SDK** para se comunicar com provedores de LLM. Ele suporta nativamente provedores customizados via o pacote `@ai-sdk/openai-compatible`, que segue o padrão **OpenAI Chat Completions API** (`/v1/chat/completions`).

Isso significa que **sua API precisa implementar exatamente o formato OpenAI-compatible** para que o OpenCode consiga conversar com ela diretamente.

---

### 1. Como Configurar um Provedor Custom no OpenCode

Crie ou edite o arquivo de configuração (recomendado: `~/.config/opencode/opencode.json` ou `opencode.json` na raiz do projeto):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minha-ia-custom": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Minha IA Custom (OpenCode)",
      "options": {
        "baseURL": "https://sua-api.com/v1",
        "apiKey": "sk-sua-chave-aqui-ou-{env:MINHA_API_KEY}",
        "headers": {
          "X-Custom-Header": "valor-opcional"
        }
      },
      "models": {
        "meu-modelo-principal": {
          "name": "Meu Modelo Principal",
          "limit": {
            "context": 128000,
            "output": 8192
          }
        },
        "meu-modelo-rapido": {
          "name": "Modelo Rápido",
          "limit": {
            "context": 32000,
            "output": 4096
          }
        }
      }
    }
  },
  "model": "minha-ia-custom/meu-modelo-principal"
}
```

**Campos importantes:**

- `npm`: Sempre use `"@ai-sdk/openai-compatible"` para APIs que expõem `/v1/chat/completions`.
- `baseURL`: URL base da sua API (deve terminar com `/v1`).
- `apiKey`: Pode ser valor direto ou `{env:NOME_VARIAVEL}`.
- `models`: Defina os modelos que sua API expõe. O `limit` ajuda o OpenCode a gerenciar contexto.
- `model`: Define o modelo padrão no formato `provider_id/model_id`.

Depois de salvar, reinicie o OpenCode ou use `/models` para selecionar.

**Comando rápido para adicionar chave:**

```bash
opencode /connect
# Escolha "Other" → digite o provider_id (ex: minha-ia-custom) → cole a API key
```

---

### 2. Como o OpenCode Envia Requisições

O OpenCode (via AI SDK) faz chamadas **POST** para:

```
POST {baseURL}/chat/completions
```

**Headers enviados:**

- `Authorization: Bearer <sua-api-key>`
- `Content-Type: application/json`
- Headers customizados que você definir em `options.headers`

**Payload típico (exemplo real):**

```json
{
  "model": "meu-modelo-principal",
  "messages": [
    {
      "role": "system",
      "content": "Você é um assistente de código experiente..."
    },
    {
      "role": "user",
      "content": "Crie uma função em Python que..."
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 8192,
  "tools": [
    /* array de tools se o agente estiver usando ferramentas */
  ],
  "tool_choice": "auto"
}
```

**Parâmetros comuns que o OpenCode envia:**

- `messages` (array completo do histórico)
- `stream: true` (quase sempre, para UX em tempo real)
- `temperature`, `max_tokens`, `top_p`
- `tools` + `tool_choice` (quando usa agentes com ferramentas/MCP)
- `response_format` (às vezes)
- `providerOptions` (opções específicas do provedor – raras no openai-compatible)

---

### 3. Como o OpenCode Recebe e Processa Respostas

#### A. Streaming (recomendado – usado na maioria das interações)

Sua API deve responder com `Content-Type: text/event-stream` e eventos SSE:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1712345678,"model":"meu-modelo-principal","choices":[{"index":0,"delta":{"content":"Olá"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","choices":[{"index":0,"delta":{"content":"! Como"},"finish_reason":null}]}

data: [DONE]
```

O OpenCode processa cada chunk em tempo real.

#### B. Resposta não-streaming (completa)

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1712345678,
  "model": "meu-modelo-principal",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Resposta completa aqui..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 320,
    "total_tokens": 470
  }
}
```

#### Suporte a Tool Calling (essencial para agentes)

Se sua API suportar `tools`, o OpenCode pode:

1. Enviar `tools` na requisição.
2. Receber `tool_calls` na resposta.
3. Executar a ferramenta (via MCP ou built-in).
4. Enviar o resultado de volta como mensagem `tool`.

**Exemplo de resposta com tool call:**

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "call_123",
            "type": "function",
            "function": {
              "name": "read_file",
              "arguments": "{\"path\": \"src/app.ts\"}"
            }
          }
        ]
      }
    }
  ]
}
```

---

### 4. Como é Exibido no Chat do OpenCode (TUI)

- **Streaming**: Texto aparece caractere por caractere com efeito de digitação.
- **Markdown**: Suporte completo a código (syntax highlight), listas, tabelas, etc.
- **Tool Calls**: Mostra “Executando ferramenta: read_file...” + resultado.
- **Multi-turn**: Mantém histórico completo na conversa.
- **Erros**: Mostra mensagens de erro claras no terminal.
- **Contexto**: Respeita os limites de `context` e `output` que você definiu no config.

O OpenCode usa o TUI (Terminal User Interface) baseado em React/Ink para renderizar tudo de forma bonita.

---

### 5. Requisitos Mínimos da Sua API para Funcionar Perfeitamente

| Recurso                | Obrigatório? | Recomendado? | Observação                         |
| ---------------------- | ------------ | ------------ | ---------------------------------- |
| `/v1/chat/completions` | Sim          | -            | Endpoint principal                 |
| Streaming (SSE)        | Sim          | -            | Essencial para UX                  |
| Tool Calling           | Não          | Sim          | Para agentes completos             |
| System messages        | Sim          | -            | -                                  |
| Multi-turn history     | Sim          | -            | -                                  |
| Usage stats            | Não          | Sim          | Mostra tokens gastos               |
| Error handling         | Sim          | -            | Retorne JSON de erro padrão OpenAI |

**Endpoint exato esperado:**  
`POST https://sua-api.com/v1/chat/completions`

---

### 6. Exemplo Completo de Configuração + Teste

1. Configure o `opencode.json` como acima.
2. Rode:
   ```bash
   opencode
   ```
3. Digite algo ou use `/models` para selecionar seu provedor.
4. Teste com:
   ```bash
   curl -X POST https://sua-api.com/v1/chat/completions \
     -H "Authorization: Bearer sk-..." \
     -H "Content-Type: application/json" \
     -d '{"model":"meu-modelo-principal","messages":[{"role":"user","content":"Olá"}],"stream":true}'
   ```

---

### 7. Troubleshooting Comum

- **“Route not found” ou requests indo para lugar errado** → Verifique se `baseURL` termina com `/v1` e não com `/v1/chat/completions`.
- **Custom provider não aparece** → Certifique-se que o ID do provider no `/connect` bate com a chave no `opencode.json`.
- **Sem streaming / resposta lenta** → Implemente SSE corretamente.
- **Tool calls não funcionam** → Sua API precisa retornar `tool_calls` no formato OpenAI exato.
- **Erro de autenticação** → Use `apiKey` ou `headers` corretamente.

---

### Referências Oficiais

- **Docs Principais**: https://opencode.ai/docs/providers/
- **Models**: https://opencode.ai/docs/models/
- **Config**: https://opencode.ai/docs/config/
- **Schema de Config**: https://opencode.ai/config.json
- **GitHub**: https://github.com/anomalyco/opencode
- **AI SDK OpenAI-Compatible**: https://ai-sdk.dev/providers/openai-compatible-providers

---

**Resumo Final para Você (que está construindo a API):**

Sua API **precisa ser 100% compatível** com o endpoint OpenAI `/v1/chat/completions` (streaming + tool calling recomendado).  
O OpenCode vai:

1. Configurar via `opencode.json` (baseURL + apiKey)
2. Enviar requisições padrão OpenAI
3. Receber streaming ou resposta completa
4. Renderizar tudo lindamente no TUI com suporte a ferramentas

Se você implementar exatamente o padrão OpenAI Chat Completions, vai funcionar perfeitamente com o OpenCode.

Quer que eu monte um **exemplo de servidor mínimo** (em Node.js/Fastify ou Python/FastAPI) que já funcione com o OpenCode? Posso criar um template completo para você.
