// src/controllers/chatbot/chatbotController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

// Node 18+ trae fetch global. Si no existe, fallamos con un mensaje claro.
const fetchFn = (...args) => {
  if (typeof fetch === 'function') return fetch(...args);
  throw new Error('fetch no está disponible en este runtime de Node (se requiere Node 18+).');
};

const DEFAULTS = {
  provider: 'groq',
  groqModel: 'llama-3.1-8b-instant',
  googleModel: 'gemini-1.5-flash',
  temperature: 0.4,
  maxHistory: 10,
  systemPrompt:
    'Eres el asistente virtual del Herbario HEAA de la Institución Universitaria del Putumayo (Uniputumayo), en Mocoa, Colombia. ' +
    'Ayudas a los visitantes a navegar el sitio y a resolver dudas sobre el herbario, la flora de la Amazonía/Putumayo y conceptos botánicos básicos. ' +
    'Responde siempre en español, de forma breve, clara y amable. Si no sabes algo o no está relacionado con el herbario, dilo con honestidad y sugiere usar el formulario de contacto. ' +
    'No inventes datos de especímenes ni cifras que no conozcas.',
};

// Carga la configuración del chatbot (category 'chatbot') desde la BD.
const loadConfig = async () => {
  const cfg = {};
  try {
    const [rows] = await db.query(
      "SELECT key_name, value FROM settings WHERE category = 'chatbot'"
    );
    for (const r of rows) cfg[r.key_name] = r.value;
  } catch (e) {
    logger.warn('No se pudo leer la configuración del chatbot:', e.message);
  }
  return cfg;
};

// Normaliza el historial recibido del frontend.
const sanitizeMessages = (messages, maxHistory) => {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 4000),
    }))
    .slice(-Math.max(1, maxHistory));
};

// ── Proveedor: Groq (API compatible con OpenAI) ──────────────────────────────
const callGroq = async ({ apiKey, model, systemPrompt, history, temperature }) => {
  const res = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 800,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Groq respondió ${res.status}`;
    throw new Error(msg);
  }
  return json?.choices?.[0]?.message?.content?.trim() || '';
};

// ── Proveedor: Google AI Studio (Gemini) ─────────────────────────────────────
const callGoogle = async ({ apiKey, model, systemPrompt, history, temperature }) => {
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature, maxOutputTokens: 800 },
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Google AI respondió ${res.status}`;
    throw new Error(msg);
  }
  return (
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() || ''
  );
};

/**
 * Servicio público: chatbot.send
 * data = { messages: [{ role, content }], message?: string }
 */
const send = async (data = {}) => {
  const cfg = await loadConfig();

  const enabled = (cfg.chatbot_enabled ?? 'false') === 'true';
  if (!enabled) {
    throw new Error('El asistente virtual está desactivado.');
  }

  const provider = (cfg.chatbot_provider || DEFAULTS.provider).toLowerCase();
  const systemPrompt = cfg.chatbot_system_prompt || DEFAULTS.systemPrompt;
  const temperature = cfg.chatbot_temperature
    ? Number(cfg.chatbot_temperature)
    : DEFAULTS.temperature;
  const maxHistory = cfg.chatbot_max_history
    ? parseInt(cfg.chatbot_max_history)
    : DEFAULTS.maxHistory;

  // Construir historial: usa messages[] o un único message
  let history = sanitizeMessages(data.messages, maxHistory);
  if (history.length === 0 && typeof data.message === 'string' && data.message.trim()) {
    history = [{ role: 'user', content: data.message.slice(0, 4000) }];
  }
  if (history.length === 0) {
    throw new Error('No se recibió ningún mensaje.');
  }

  let reply = '';
  if (provider === 'google' || provider === 'gemini') {
    const apiKey = cfg.chatbot_google_api_key || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Falta la API key de Google AI Studio. Configúrala en el panel de administración.');
    const model = cfg.chatbot_model || DEFAULTS.googleModel;
    reply = await callGoogle({ apiKey, model, systemPrompt, history, temperature });
  } else {
    // Groq por defecto
    const apiKey = cfg.chatbot_groq_api_key || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Falta la API key de Groq. Configúrala en el panel de administración.');
    const model = cfg.chatbot_model || DEFAULTS.groqModel;
    reply = await callGroq({ apiKey, model, systemPrompt, history, temperature });
  }

  if (!reply) {
    throw new Error('El asistente no devolvió respuesta. Intenta de nuevo.');
  }

  logger.info(`🤖 chatbot.send (${provider}) respondió ${reply.length} caracteres`);
  return { reply, provider };
};

module.exports = { send };
