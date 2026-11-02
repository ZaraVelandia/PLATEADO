# Mentores Plata

Cuatro agentes de chat (Bendito, Milagros, Clara y Franco) que responden con Claude a través de tu propio servidor.

## Estructura

- `public/index.html` — la página del chat (lo que ve la gente).
- `server.js` — servidor que recibe los mensajes y llama a la API de Anthropic con tu clave.
- `mentors.js` — la personalidad e instrucciones de cada agente. Edítalo para cambiar cómo responden.

## Cómo correrlo en tu computador

1. Instala Node.js 20.6 o superior.
2. Crea una clave de API en https://console.anthropic.com
3. Copia `.env.example` como `.env` y pega tu clave.
4. En esta carpeta ejecuta:
   ```
   npm install
   npm start
   ```
5. Abre http://localhost:3000

## Publicarlo en internet

Sirve en cualquier servicio que corra Node.js (Render, Railway, Fly.io, un VPS, etc.):
- Comando de instalación: `npm install`
- Comando de inicio: `node server.js`
- Variable de entorno: `ANTHROPIC_API_KEY` (y opcionalmente `CLAUDE_MODEL`).

## Importante

- Nunca pongas la clave de API dentro de `index.html`: cualquiera podría verla y usarla. Por eso va en el servidor.
- Cada mensaje consume créditos de tu cuenta de Anthropic. El servidor limita a 20 mensajes por minuto por persona; ajusta el número en `server.js`.
- El historial de cada chat se guarda en el navegador de cada usuario.
