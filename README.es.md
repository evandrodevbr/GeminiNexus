<p align="center">
  <img src="docs/assets/logo.png" alt="Gemini Nexus" width="128" height="128" />
</p>

<h1 align="center">Gemini Nexus</h1>

<p align="center">
  <strong>🚀 Gateway de IA multi-cuenta profesional para Google Gemini y Claude</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.pt-BR.md">Português</a> | <a href="README.zh-CN.md">中文</a> | Español
</p>

<p align="center">
  <a href="https://github.com/Draculabo/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/Draculabo/GeminiNexus?style=flat-square" alt="Versión" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/Draculabo/GeminiNexus/total?style=flat-square&color=blue" alt="Descargas" />
  </a>
  <a href="https://github.com/Draculabo/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Draculabo/GeminiNexus?style=flat-square" alt="Licencia" />
  </a>
  <img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square" alt="Plataforma" />
</p>

---

## ✨ ¿Por qué Gemini Nexus?

Al usar IDEs y herramientas de programación con IA, ¿te has encontrado con estos problemas?

- 😫 La cuota de una sola cuenta se agota rápido, requiriendo cambios manuales frecuentes
- 🔄 Gestionar múltiples cuentas de Google/Claude es tedioso
- 📊 No sabes cuántos tokens has consumido o cuánta cuota queda
- 🔌 Necesitas un proxy local confiable que hable los protocolos OpenAI/Anthropic

**Gemini Nexus** resuelve todo esto. Es una aplicación de escritorio profesional en Electron que actúa como gateway inteligente entre tus herramientas de desarrollo y Google Gemini / Claude AI:

- ✅ **Pool de Cuentas Ilimitado** — Agrega cualquier cantidad de cuentas Google Gemini y Claude
- ✅ **Cambio Automático Inteligente** — Rota automáticamente a la siguiente cuenta disponible cuando la cuota es baja
- ✅ **Analytics de Uso en Tiempo Real** — Dashboard nivel SaaS con gráficos de área, indicadores de tendencia y distribución por modelo
- ✅ **Observabilidad Completa del Proxy** — Monitor de tráfico en vivo, replay de solicitudes e inspector de capacidades de modelos
- ✅ **Compatible con OpenAI y Anthropic** — Proxy drop-in para Cursor, Windsurf, OpenCode y cualquier herramienta compatible
- ✅ **Seguro por Defecto** — Cifrado AES-256-GCM con gestión nativa de credenciales del SO

---

## 🎯 Características

<table>
  <tr>
    <td width="50%">
      <h3>☁️ Pool de Cuentas en la Nube</h3>
      <ul>
        <li>Agrega cuentas ilimitadas de Google Gemini / Claude vía OAuth</li>
        <li>Muestra avatar, email, estado y último uso</li>
        <li>Monitoreo de estado en tiempo real (Activa, Rate Limited, Expirada)</li>
        <li>Configuración de proxy URL por cuenta</li>
        <li>Gestión de perfil de identidad del dispositivo con historial</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📊 Dashboard de Analytics de Uso</h3>
      <ul>
        <li>Consumo de tokens en tiempo real con auto-refresh cada 15s</li>
        <li>Gráficos de área para tokens de prompt y completion (diario/horario)</li>
        <li>Indicadores de tendencia (% de cambio vs período anterior)</li>
        <li>Sparklines inline en las tarjetas de estadísticas</li>
        <li>Ranking de distribución por modelo con gráficos de barras horizontales</li>
        <li>Visualización de proporción Prompt/Completion</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔌 Proxy de API Local (Gateway)</h3>
      <ul>
        <li>Endpoint compatible con OpenAI <code>/v1/chat/completions</code></li>
        <li>Endpoint compatible con Anthropic <code>/v1/messages</code></li>
        <li>Soporte completo de streaming SSE</li>
        <li>Mapeo de modelos (ej: <code>claude-sonnet-4-6</code> → <code>gemini-3-flash</code>)</li>
        <li>Puerto, timeout y API key configurables</li>
        <li>Control de visibilidad de modelos</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔄 Cambio Automático Inteligente</h3>
      <ul>
        <li>Modo pool ilimitado con selección inteligente de respaldo</li>
        <li>Cambio automático cuando cuota < 5% o con rate limit</li>
        <li>Monitoreo en segundo plano cada 5 minutos</li>
        <li>Fallback elegante con seguimiento de razón de estado</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔍 Observabilidad del Proxy (Avanzado)</h3>
      <ul>
        <li><strong>Monitor de Tráfico</strong> — Log en vivo de solicitudes/respuestas</li>
        <li><strong>Replay de Solicitudes</strong> — Reproduce cualquier solicitud para debugging</li>
        <li><strong>Capacidades de Modelos</strong> — Inspecciona visión, thinking, streaming, modo JSON</li>
        <li><strong>Herramientas para Devs</strong> — Generación de código cURL y Python</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔐 Seguridad y Cifrado</h3>
      <ul>
        <li>Cifrado AES-256-GCM para todos los datos sensibles</li>
        <li>Integración con gestor de credenciales nativo del SO</li>
        <li>Migración automática de datos legacy en texto plano</li>
        <li>Almacenamiento cifrado de tokens y cuotas por cuenta</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚙️ Configuración y Personalización</h3>
      <ul>
        <li>Tema Oscuro / Claro / Sistema</li>
        <li>Multi-idioma: English & Português (Brasil)</li>
        <li>Toggles de visibilidad de modelos</li>
        <li>Acceso al directorio de logs</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🖥️ Experiencia de Escritorio</h3>
      <ul>
        <li>App nativa Electron con integración en bandeja del sistema</li>
        <li>Sidebar colapsable con estado persistente</li>
        <li>Layouts responsivos</li>
        <li>Barra de estado con indicadores en vivo</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📸 Capturas de Pantalla

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

## ⚡ Inicio Rápido

### Requisitos Previos

- **Node.js** v20 o superior
- **npm**

### Compilar desde el Código Fuente

```bash
git clone https://github.com/Draculabo/GeminiNexus.git
cd GeminiNexus
npm install
npm start

# Compilar para producción
npm run make
```

### Uso con IDEs de IA

```plaintext
API Base URL:  http://localhost:10100/v1
API Key:       (copiar de la página Proxy en la app)
Model:         gemini-3-flash
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnologías |
|-----------|------------|
| **Core** | Electron, React 19, TypeScript |
| **Build** | Vite, Electron Forge |
| **Estilos** | Tailwind CSS v4, Radix UI, Lucide Icons |
| **Estado** | TanStack Query, TanStack Router |
| **Backend** | NestJS (gateway interno), ORPC (RPC type-safe) |
| **Base de Datos** | Better-SQLite3, Drizzle ORM |
| **Gráficos** | Nivo (Line, Bar, Pie) |
| **Testing** | Vitest, Playwright |

---

## ❓ Preguntas Frecuentes

<details>
<summary><b>P: ¿La app no inicia?</b></summary>

1. Asegúrate de que las dependencias están instaladas: `npm install`
2. Node.js versión >= 20
3. Intenta eliminar `node_modules` y reinstalar

</details>

<details>
<summary><b>P: ¿El IDE no conecta al proxy?</b></summary>

1. Asegúrate de que el proxy está corriendo (indicador verde en la barra de estado)
2. Confirma que el puerto coincide (por defecto `10100`)
3. Copia la API key de la página Proxy
4. Asegúrate de tener al menos una cuenta activa

</details>

---

## 📄 Licencia

[CC BY-NC-SA 4.0](LICENSE)

---

## ⚠️ Aviso Legal

> [!WARNING]
> **Solo con Fines Educativos**
>
> Este proyecto está destinado exclusivamente a fines educativos y de investigación. Se proporciona "tal cual" sin ninguna garantía. **El uso comercial está estrictamente prohibido.**

---

## 🙏 Créditos

**Gemini Nexus** es una versión significativamente mejorada y expandida del proyecto original [AntigravityManager](https://github.com/Draculabo/AntigravityManager) creado por [Draculabo](https://github.com/Draculabo). Toda la arquitectura fundamental y diseño fueron realizados por el autor original.
