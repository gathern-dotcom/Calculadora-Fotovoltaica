// Función serverless de Vercel (Node.js).
// Se despliega sola apenas subas esta carpeta "api" a tu repositorio de GitHub —
// Vercel detecta cualquier archivo dentro de /api como un endpoint.
//
//
// Usa la API GRATUITA de Google Gemini (sin tarjeta de crédito, sin vencimiento).
// Requiere una variable de entorno en Vercel: GEMINI_API_KEY
// Consíguela gratis en https://aistudio.google.com/apikey

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Falta el texto a analizar' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel' });
  }

  const prompt = `Eres un asistente que ayuda a un instalador de sistemas solares en Colombia a convertir una descripción en texto libre de los equipos eléctricos de un cliente en una lista estructurada.

Descripción del cliente:
"""
${text}
"""

Devuelve un array JSON con este formato exacto, sin texto adicional:
[
  { "equipo": "nombre del equipo", "potencia_w": numero, "cantidad": numero, "horas_dia": numero }
]

Reglas:
- Usa potencias típicas realistas en vatios para cada equipo si el cliente no las da (ej: nevera ~150W, TV ~100W, bombillo LED ~10W, ventilador ~60W, bomba de agua ~750W, aire acondicionado ~1200W, lavadora ~500W).
- Si el cliente menciona horas de uso, úsalas. Si no, asume un uso típico razonable en horas por día.
- Si menciona cantidad ("dos bombillos"), refléjalo en "cantidad".
- No inventes equipos que no se mencionaron.
- Responde en español.`;

  const model = 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Error al llamar a Gemini: ' + errText });
    }

    const data = await response.json();
    const rawText =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text) || '';

    let equipos;
    try {
      equipos = JSON.parse(rawText);
    } catch (parseErr) {
      return res.status(502).json({ error: 'Gemini no devolvió un JSON válido: ' + rawText.slice(0, 200) });
    }

    if (!Array.isArray(equipos)) {
      return res.status(502).json({ error: 'Gemini no devolvió una lista válida' });
    }

    return res.status(200).json({ equipos });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
