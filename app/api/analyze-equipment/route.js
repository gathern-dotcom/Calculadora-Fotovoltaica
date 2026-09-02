// =========================================================================
// API ROUTE: /api/analyze-equipment
// IA Principal: Google Gemini | IA Respaldo: DeepSeek
// =========================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Escribe una descripción de los equipos primero.' },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (!geminiKey && !deepseekKey) {
      return NextResponse.json(
        {
          error:
            'No hay ninguna clave de IA configurada. Configura GEMINI_API_KEY o DEEPSEEK_API_KEY en Vercel.'
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

    // ========================================================
    // 1. INTENTAR PRIMERO CON GOOGLE GEMINI
    // ========================================================
    if (geminiKey) {
      const candidateModels = [
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash'
      ];

      for (const model of candidateModels) {
        try {
          const rawJson = await ejecutarGemini(prompt, geminiKey, model);
          const validados = validarEquipos(rawJson);
          if (validados && validados.length > 0) {
            return NextResponse.json({
              equipos: validados,
              proveedor: `gemini (${model})`
            });
          }
        } catch (err) {
          geminiError = err.message;
          // Si no es un 404, paramos el ciclo de Gemini y pasamos al respaldo
          if (!err.message.includes('404') && !err.message.includes('not found')) {
            break;
          }
        }
      }

      // Si fallaron los modelos fijos por 404, consultar dinámicamente modelos activos
      try {
        const activeModel = await obtenerModeloActivo(geminiKey);
        if (activeModel && !candidateModels.includes(activeModel)) {
          const rawJson = await ejecutarGemini(prompt, geminiKey, activeModel);
          const validados = validarEquipos(rawJson);
          if (validados && validados.length > 0) {
            return NextResponse.json({
              equipos: validados,
              proveedor: `gemini (${activeModel})`
            });
          }
        }
      } catch (e) {
        // Ignorar y continuar hacia DeepSeek
      }
    }

    // ========================================================
    // 2. RESPALDO AUTOMÁTICO (FALLBACK) -> DEEPSEEK
    // ========================================================
    let deepseekError = null;

    if (deepseekKey) {
      try {
        const rawJson = await llamarDeepSeek(prompt, deepseekKey);
        const validados = validarEquipos(rawJson);
        if (validados && validados.length > 0) {
          return NextResponse.json({
            equipos: validados,
            proveedor: 'deepseek (respaldo)',
            fallback: true,
            gemini_error: geminiError
          });
        }
        deepseekError = 'DeepSeek devolvió una lista vacía o estructura inválida.';
      } catch (err) {
        deepseekError = err.message;
        console.error('DeepSeek respaldo falló:', err.message);
      }
    }

    // Si ambos proveedores fallaron, reportar los detalles de ambos
    return NextResponse.json(
      {
        error: `Gemini falló (${geminiError || 'No configurado'}). DeepSeek falló (${deepseekError || 'No configurado'}).`,
        gemini_error: geminiError,
        deepseek_error: deepseekError
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

// ==========================================================
// CLIENTE GEMINI
// ==========================================================
async function ejecutarGemini(prompt, apiKey, model) {
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
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return extraerJSON(rawText);
  } finally {
    clearTimeout(timeout);
  }
}

async function obtenerModeloActivo(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const models = data.models || [];

  const flashModel = models.find(
    m =>
      m.supportedGenerationMethods?.includes('generateContent') &&
      m.name?.toLowerCase().includes('flash')
  );

  if (flashModel) {
    return flashModel.name.replace('models/', '');
  }

  const anyModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent'));
  return anyModel ? anyModel.name.replace('models/', '') : null;
}

// ==========================================================
// CLIENTE DEEPSEEK (RESPALDO)
// ==========================================================
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
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    return extraerJSON(rawText);
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================================
// UTILIDADES: EXTRACCIÓN Y VALIDACIÓN
// ==========================================================
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
