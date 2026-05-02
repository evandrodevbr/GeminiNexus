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
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/v/release/evandrodevbr/GeminiNexus?style=flat-square" alt="Versión" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/releases">
    <img src="https://img.shields.io/github/downloads/evandrodevbr/GeminiNexus/total?style=flat-square&color=blue" alt="Descargas" />
  </a>
  <a href="https://github.com/evandrodevbr/GeminiNexus/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/evandrodevbr/GeminiNexus?style=flat-square" alt="Licencia" />
  </a>
  <img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square" alt="Plataforma" />
  <img src="https://img.shields.io/badge/electron-latest-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
</p>

> [!IMPORTANT]
> **Usuarios de Windows:** Si ves una advertencia de SmartScreen **"Windows protegió su PC"** durante la instalación, haz clic en **"Más información"** y luego en **"Ejecutar de todas formas"**. Esta es una advertencia de seguridad esperada para aplicaciones nuevas no firmadas.

---

## 📖 Tabla de Contenidos

- [✨ ¿Por qué Gemini Nexus?](#-por-qué-gemini-nexus)
- [🎯 Características](#-características)
- [📸 Capturas de Pantalla](#-capturas-de-pantalla)
- [⚡ Instalación e Inicio Rápido](#-instalación-e-inicio-rápido)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [💻 Desarrollo](#-desarrollo)
- [❓ Preguntas Frecuentes](#-preguntas-frecuentes)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

---

## ✨ ¿Por qué Gemini Nexus?

Al usar IDEs y herramientas de programación con IA, ¿te has encontrado con estos problemas?

- 😫 **Límites de cuota:** La cuota de una sola cuenta se agota rápido, requiriendo cambios manuales frecuentes.
- 🔄 **Gestión de cuentas:** Gestionar múltiples cuentas de Google/Claude es tedioso.
- 📊 **Uso a ciegas:** No sabes cuántos tokens has consumido o cuánta cuota queda.
- 🔌 **Problemas de integración:** Necesitas un proxy local confiable que hable los protocolos OpenAI/Anthropic de forma nativa.
- 🔍 **Falta de transparencia:** No puedes ver qué se envía o recibe exactamente a través del proxy.

**Gemini Nexus** resuelve todo esto. Es una aplicación de escritorio profesional en Electron que actúa como gateway inteligente entre tus herramientas de desarrollo y Google Gemini / Claude AI.

### Propuesta de Valor

- ✅ **Pool de Cuentas Ilimitado** — Agrega cualquier cantidad de cuentas Google Gemini y Claude.
- ✅ **Cambio Automático Inteligente** — Rota automáticamente a la siguiente cuenta disponible cuando la cuota es baja o hay rate limit.
- ✅ **Analytics de Uso en Tiempo Real** — Dashboard nivel SaaS con gráficos de área, indicadores de tendencia y distribución por modelo.
- ✅ **Observabilidad Completa del Proxy** — Monitor de tráfico en vivo, replay de solicitudes e inspector de capacidades de modelos.
- ✅ **Compatible con OpenAI y Anthropic** — Proxy drop-in para Cursor, Windsurf, OpenCode y cualquier herramienta compatible con OpenAI.
- ✅ **Seguro por Defecto** — Cifrado AES-256-GCM con gestión nativa de credenciales del sistema operativo.

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
        <li>Soporte completo de streaming SSE (probado con Cursor, Windsurf, OpenCode)</li>
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
        <li><strong>Monitor de Tráfico</strong> — Log en vivo de solicitudes/respuestas con latencia y modelo</li>
        <li><strong>Replay de Solicitudes</strong> — Reproduce cualquier solicitud para debugging</li>
        <li><strong>Capacidades de Modelos</strong> — Inspecciona soporte de visión, thinking, streaming, modo JSON</li>
        <li><strong>Herramientas para Devs</strong> — Generación de código cURL y Python, copia con un clic</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔐 Seguridad y Cifrado</h3>
      <ul>
        <li>Cifrado AES-256-GCM para todos los datos sensibles</li>
        <li>Integración con gestor de credenciales nativo del SO (Keytar + SafeStorage)</li>
        <li>Migración automática de datos legacy en texto plano</li>
        <li>Almacenamiento cifrado de tokens y cuotas por cuenta</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚙️ Configuración y Personalización</h3>
      <ul>
        <li>Soporte de temas Oscuro / Claro / Sistema</li>
        <li>Multi-idioma: English & Português (Brasil)</li>
        <li>Override de proxy URL por cuenta</li>
        <li>Toggles de visibilidad de modelos</li>
        <li>Acceso al directorio de logs</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🖥️ Experiencia de Escritorio</h3>
      <ul>
        <li>App nativa Electron con integración en bandeja del sistema</li>
        <li>Sidebar colapsable con estado persistente</li>
        <li>Layouts responsivos en todas las vistas</li>
        <li>Barra de estado con indicadores en vivo de proxy y conexión</li>
        <li>Error boundaries con fallbacks amigables al usuario</li>
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

## ⚡ Instalación e Inicio Rápido

### 📦 Descarga

Puedes descargar los binarios precompilados más recientes para Windows, macOS y Linux desde nuestra [página de Releases](https://github.com/evandrodevbr/GeminiNexus/releases).

*(Consulta la advertencia en la parte superior de esta página si usas Windows y te encuentras con el aviso de SmartScreen).*

### 🔌 Uso con IDEs de IA

Con la aplicación en ejecución y al menos una cuenta agregada, configura tu IDE preferido (Cursor, Windsurf, OpenCode, etc.):

```plaintext
API Base URL:  http://localhost:10100/v1
API Key:       (copiar de la página Proxy en la app)
Model:         gemini-3-flash  (o cualquier modelo mapeado)
```

### 🛠️ Compilar desde el Código Fuente

#### Requisitos Previos

- **Node.js** v20 o superior
- **npm** (este proyecto usa `package-lock.json`)

#### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/evandrodevbr/GeminiNexus.git
cd GeminiNexus

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm start

# Compilar para producción (ej: instalador de Windows)
npm run make
```

---

## 🛠️ Stack Tecnológico

| Categoría         | Tecnologías                                    |
| ----------------- | ---------------------------------------------- |
| **Core**          | Electron, React 19, TypeScript                 |
| **Build**         | Vite, Electron Forge                           |
| **Estilos**       | Tailwind CSS v4, Radix UI, Lucide Icons        |
| **Estado**        | TanStack Query, TanStack Router                |
| **Backend**       | NestJS (gateway interno), ORPC (RPC type-safe) |
| **Base de Datos** | Better-SQLite3, Drizzle ORM                    |
| **Gráficos**      | Nivo (Line, Bar, Pie)                          |
| **Testing**       | Vitest, Playwright                             |

---

## 💻 Desarrollo

```bash
# Iniciar entorno de dev (Electron + Vite HMR)
npm start

# Ejecutar linting
npm run lint

# Verificación de tipos
npm run type-check

# Formatear código
npm run format:write

# Ejecutar pruebas
npm test
```

---

## ❓ Preguntas Frecuentes

<details>
<summary><b>P: ¿Aviso de Windows SmartScreen ("Windows protegió su PC") durante la instalación?</b></summary>

Sí, este es un aviso común para nuevas aplicaciones no firmadas. Haz clic en **"Más información"** y luego en **"Ejecutar de todas formas"**. Consulta la advertencia en la parte superior del README para más detalles.
</details>

<details>
<summary><b>P: ¿La app no inicia al compilar desde el código fuente?</b></summary>

1. Asegúrate de que todas las dependencias están instaladas: `npm install`.
2. Verifica que tu versión de Node.js sea >= 20.
3. Intenta eliminar `node_modules` y reinstalar.
4. En Windows, asegúrate de que el WiX Toolset esté disponible para el comando `npm run make`.
</details>

<details>
<summary><b>P: ¿El inicio de sesión de la cuenta falló?</b></summary>

1. Asegúrate de que tu conexión a la red funcione correctamente.
2. Intenta borrar los datos de la app y volver a iniciar sesión.
3. Comprueba si la cuenta está restringida por Google/Claude.
</details>

<details>
<summary><b>P: ¿El IDE no se puede conectar al proxy?</b></summary>

1. Asegúrate de que el proxy esté funcionando (indicador verde en la barra de estado).
2. Confirma que el puerto coincide con tu configuración del IDE (por defecto `10100`).
3. Copia la API key directamente desde la página Proxy y pégala en la configuración de tu IDE.
4. Asegúrate de tener al menos una cuenta activa en la página Cuentas.
</details>

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee `CONTRIBUTING.md` para más detalles.

---

## 📄 Licencia

[CC BY-NC-SA 4.0](LICENSE)

---

## ⚠️ Aviso Legal

> [!WARNING]
> **Solo con Fines Educativos**
>
> Este proyecto está destinado exclusivamente a fines educativos y de investigación. Se proporciona "tal cual" sin ninguna garantía. **El uso comercial está estrictamente prohibido.**
>
> Al utilizar este software, aceptas que no lo usarás para ningún fin comercial y eres el único responsable de asegurar que tu uso cumpla con todas las leyes y regulaciones aplicables. Los autores y colaboradores no son responsables del mal uso o los daños derivados de la utilización de este software.

---

## 🙏 Créditos

**Gemini Nexus** es una versión significativamente mejorada y expandida del proyecto original [AntigravityManager](https://github.com/Draculabo/AntigravityManager) creado por [Draculabo](https://github.com/Draculabo). Toda la arquitectura fundamental y diseño fueron realizados por el autor original.
