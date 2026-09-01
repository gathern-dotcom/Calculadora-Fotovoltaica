// =========================================================================
// API ROUTE: /api/analyze-equipment
// Extracción estructurada de electrodomésticos y motores usando Gemini / DeepSeek
// =========================================================================

import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Falta el texto de descripción de los equipos a analizar.' },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (!geminiKey && !deepseekKey) {
      return NextResponse.json(
        {
          error:
            'No hay ninguna clave de API configurada. Configura GEMINI_API_KEY o DEEPSEEK_API_KEY en Vercel/entorno.'
        },
        { status: 500 }
      );
    }

    const prompt = `Eres un asistente especializado en dimensionamiento de sistemas solares fotovoltaicos en Colombia para Sinergy Soluciones Integrales.

Convierte la siguiente descripción en texto libre de los equipos eléctricos de un cliente en una lista JSON estructurada:
"""
${text}
"""

Responde EXCLUSIVAMENTE con un JSON válido con la siguiente estructura de objeto:
{
  "equipos": [
    {
      "equipo": "nombre del equipo",
      "hp": 0,
      "potencia_w": 0,
      "cantidad": 1,
      "horas_dia": 0
    }
  ]
}

REGLAS:
1. No inventes equipos que el cliente no haya mencionado.
2. Si el cliente proporciona potencia en HP (motores, bombas, compresores):
   - Conserva el valor en "hp".
   - Convierte HP a W usando 1 HP = 746 W y asígnalo a "potencia_w".
3. Si proporciona potencia en kW, conviértela a W (ej. 1.2 kW = 1200 W).
4. Si proporciona potencia directa en Watts (W), respétala ("hp" = 0).
5. Si no proporciona potencia, usa potencias típicas razonables en Colombia:
   - Nevera/Refrigerador: 150 W
   - TV LED: 100 W
   - Bombillo LED: 10 W
   - Ventilador: 60 W
   - Bomba de agua: 750 W (1 HP)
   - Aire acondicionado: 1200 W
   - Lavadora: 500 W
   - Computador: 150 W
6. Si indica horas de uso al día, úsalas. Si no, haz una estimación razonable.
7. Cantidad por defecto es 1 si no se especifica.
8. Todos los valores numéricos deben ser de tipo número (no strings).`;

    let geminiError = null;

    // 1. INTENTAR CON GEMINI
    if (geminiKey) {
      try {
        const geminiResult = await llamarGemini(prompt, geminiKey);
        const validados = validarEquipos(geminiResult);
        if (validados && validados.length > 0) {
          return NextResponse.json({
            equipos: validados,
            proveedor: 'gemini'
          });
        }
        geminiError = 'Gemini devolvió una lista vacía o formato inválido.';
      } catch (err) {
        geminiError = err.message;
        console.error('Gemini API Error:', err);
      }
    }

    // 2. FALLBACK A DEEPSEEK
    if (deepseekKey) {
      try {
        const deepseekResult = await llamarDeepSeek(prompt, deepseekKey);
        const validados = validarEquipos(deepseekResult);
        if (validados && validados.length > 0) {
          return NextResponse.json({
            equipos: validados,
            proveedor: 'deepseek',
            fallback: true,
            gemini_error: geminiError
          });
        }
      } catch (err) {
        console.error('DeepSeek API Error:', err);
        return NextResponse.json(
          {
            error: 'Falló el análisis con Gemini y DeepSeek.',
            gemini_error: geminiError,
            deepseek_error: err.message
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'No se pudo procesar la solicitud con los proveedores de IA disponibles.',
        gemini_error: geminiError
      },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno en el servidor: ' + error.message },
      { status: 500 }
    );
  }
}

async function llamarGemini(prompt, apiKey) {
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return extraerJSON(rawText);
  } finally {
    clearTimeout(timeout);
  }
}

async function llamarDeepSeek(prompt, apiKey) {
  const url = 'https://api.deepseek.com/chat/completions';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Responde exclusivamente en formato JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    return extraerJSON(rawText);
  } finally {
    clearTimeout(timeout);
  }
}

function extraerJSON(text) {
  let limpio = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(limpio);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.equipos)) return parsed.equipos;
    return parsed;
  } catch (e) {
    const startObj = limpio.indexOf('{');
    const endObj = limpio.lastIndexOf('}');
    if (startObj !== -1 && endObj > startObj) {
      const obj = JSON.parse(limpio.substring(startObj, endObj + 1));
      if (Array.isArray(obj.equipos)) return obj.equipos;
    }

    const startArr = limpio.indexOf('[');
    const endArr = limpio.lastIndexOf(']');
    if (startArr !== -1 && endArr > startArr) {
      return JSON.parse(limpio.substring(startArr, endArr + 1));
    }
    throw new Error('No se pudo extraer una estructura JSON válida de la respuesta.');
  }
}

function validarEquipos(equipos) {
  if (!Array.isArray(equipos)) return null;

  return equipos
    .map(eq => {
      if (!eq || typeof eq !== 'object') return null;
      const equipo = String(eq.equipo || '').trim();
      if (!equipo) return null;

      let hp = Number(eq.hp);
      if (!Number.isFinite(hp) || hp < 0) hp = 0;

      let potencia = Number(eq.potencia_w);
      if (!Number.isFinite(potencia) || potencia < 0) potencia = 0;

      if (hp > 0) {
        potencia = hp * 746;
      }

      let cantidad = Number(eq.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) cantidad = 1;

      let horas = Number(eq.horas_dia);
      if (!Number.isFinite(horas) || horas < 0) horas = 0;
      if (horas > 24) horas = 24;

      return {
        equipo,
        hp,
        potencia_w: Math.round(potencia),
        cantidad: Math.round(cantidad),
        horas_dia: horas
      };
    })
    .filter(Boolean);
}
