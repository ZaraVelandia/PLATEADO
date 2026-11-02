import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { systemPromptFor } from "./mentors.js";

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";
const PORT = process.env.PORT || 3000;

if (!API_KEY) {
  console.error("Falta ANTHROPIC_API_KEY. Créala en https://console.anthropic.com y ponla en el archivo .env");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "64kb" }));
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "public")));

// Límite simple: 20 mensajes por minuto por IP, para cuidar tu presupuesto de API.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

app.post("/api/chat", async (req, res) => {
  const { mentor, messages } = req.body || {};
  const system = systemPromptFor(mentor);
  if (!system) return res.status(400).json({ error: "Mentor no válido." });

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
    return res.status(400).json({ error: "Conversación no válida." });
  }
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!clean.length || clean[0].role !== "user" || clean.at(-1).role !== "user") {
    return res.status(400).json({ error: "Conversación no válida." });
  }

  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: "Estás enviando muchos mensajes seguidos. Espera un minuto y vuelve a intentarlo." });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, system, messages: clean }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Error de Anthropic:", r.status, data?.error?.message);
      return res.status(502).json({ error: "El mentor no pudo responder en este momento. Vuelve a intentarlo." });
    }
    const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error del servidor. Vuelve a intentarlo." });
  }
});

app.listen(PORT, () => console.log(`Mentores Plata en http://localhost:${PORT}`));
