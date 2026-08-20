// Función serverless de Vercel (Node.js).
// Se despliega sola apenas subas esta carpeta "api" a tu repositorio de GitHub —
// Vercel detecta cualquier archivo dentro de /api como un endpoint.
//
// Requiere una variable de entorno en Vercel: ANTHROPIC_API_KEY
// (Project Settings > Environment Variables en el dashboard de Vercel)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Falta el texto a analizar' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel' });
  }

  const prompt = `Eres un asistente que ayuda a un instalador de sistemas solares en Colombia a convertir una descripción en texto libre de los equipos eléctricos de un cliente en una lista estructurada.

Descripción del cliente:
"""
${text}
"""

Devuelve SOLO un array JSON (sin texto adicional, sin markdown, sin backticks) con este formato exacto:
[
  { "equipo": "nombre del equipo", "potencia_w": numero, "cantidad": numero, "horas_dia": numero }
]

Reglas:
- Usa potencias típicas realistas en vatios para cada equipo si el cliente no las da (ej: nevera ~150W, TV ~100W, bombillo LED ~10W, ventilador ~60W, bomba de agua ~750W, aire acondicionado ~1200W, lavadora ~500W).
- Si el cliente menciona horas de uso, úsalas. Si no, asume un uso típico razonable en horas por día.
- Si menciona cantidad ("dos bombillos"), refléjalo en "cantidad".
- No inventes equipos que no se mencionaron.
- Responde en español.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Error al llamar a la IA: ' + errText });
    }

    const data = await response.json();
    const rawText = (data.content && data.content[0] && data.content[0].text) || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let equipos;
    try {
      equipos = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(502).json({ error: 'La IA no devolvió un JSON válido: ' + cleaned.slice(0, 200) });
    }

    if (!Array.isArray(equipos)) {
      return res.status(502).json({ error: 'La IA no devolvió una lista válida' });
    }

    return res.status(200).json({ equipos });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
