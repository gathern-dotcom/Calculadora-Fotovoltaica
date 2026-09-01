// api/analizar-equipos.js
// Función serverless de Vercel (Node.js)
//
// IA principal: Google Gemini
// IA secundaria: DeepSeek
//
// Variables de entorno necesarias en Vercel:
// GEMINI_API_KEY
// DEEPSEEK_API_KEY

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido'
    });
  }

  const { text } = req.body || {};

  if (
    !text ||
    typeof text !== 'string' ||
    !text.trim()
  ) {
    return res.status(400).json({
      error: 'Falta el texto a analizar'
    });
  }


  const geminiKey =
    process.env.GEMINI_API_KEY;

  const deepseekKey =
    process.env.DEEPSEEK_API_KEY;


  if (!geminiKey && !deepseekKey) {
    return res.status(500).json({
      error:
        'No hay ninguna API configurada. Configura GEMINI_API_KEY o DEEPSEEK_API_KEY en Vercel.'
    });
  }


  // ========================================================
  // PROMPT COMÚN
  // ========================================================

  const prompt = `Eres un asistente especializado en sistemas solares fotovoltaicos en Colombia.

Tu función es convertir una descripción en texto libre de los equipos eléctricos de un cliente en una lista estructurada.

Descripción del cliente:
"""
${text}
"""

Devuelve EXCLUSIVAMENTE un array JSON válido, sin Markdown, sin explicaciones y sin texto adicional.

Formato obligatorio:

[
  {
    "equipo": "nombre del equipo",
    "hp": numero,
    "potencia_w": numero,
    "cantidad": numero,
    "horas_dia": numero
  }
]

REGLAS:

1. No inventes equipos que el cliente no haya mencionado.

2. Si el cliente proporciona una potencia explícita, respétala.

3. Si proporciona potencia en kW, conviértela a W.

4. Si proporciona potencia en HP:
   - Conserva el valor original en "hp".
   - Convierte HP a W usando:
     1 HP = 746 W.
   - Coloca el resultado convertido en "potencia_w".

5. Si el equipo es un motor, bomba, compresor u otro equipo cuya potencia se expresa normalmente en HP, presta especial atención al valor de HP indicado por el cliente.

6. Si el cliente proporciona directamente los vatios, utiliza ese valor.

7. Si no proporciona potencia:
   - utiliza una potencia típica razonable.
   - ejemplos aproximados:
     nevera: 150 W
     TV: 100 W
     bombillo LED: 10 W
     ventilador: 60 W
     bomba de agua: 750 W
     aire acondicionado: 1200 W
     lavadora: 500 W

8. Si el cliente proporciona horas de uso por día, utiliza exactamente ese valor.

9. Si no proporciona horas de uso, realiza una estimación razonable.

10. Si indica una cantidad, utiliza esa cantidad.
    Ejemplo:
    "tres bombillos" → cantidad = 3.

11. Si no indica cantidad, utiliza cantidad = 1.

12. "hp" debe ser 0 cuando el equipo no tenga una potencia expresada en HP.

13. Todos los valores numéricos deben ser números, no texto.

14. Responde siempre en español.

15. No incluyas equipos adicionales para completar una instalación fotovoltaica. Solo devuelve los equipos mencionados o claramente identificables en la descripción.`;


  // ========================================================
  // 1. INTENTAR GEMINI
  // ========================================================

  let geminiError = null;

  if (geminiKey) {

    try {

      const equiposGemini =
        await llamarGemini(
          prompt,
          geminiKey
        );


      const equiposValidados =
        validarEquipos(equiposGemini);


      if (equiposValidados) {

        return res.status(200).json({
          equipos: equiposValidados,
          proveedor: 'gemini'
        });

      }

      geminiError =
        'Gemini devolvió una estructura inválida.';

    } catch (error) {

      geminiError = error.message;

      console.error(
        'Gemini falló:',
        error
      );

    }

  }


  // ========================================================
  // 2. FALLBACK → DEEPSEEK
  // ========================================================

  if (deepseekKey) {

    try {

      const equiposDeepSeek =
        await llamarDeepSeek(
          prompt,
          deepseekKey
        );


      const equiposValidados =
        validarEquipos(equiposDeepSeek);


      if (equiposValidados) {

        return res.status(200).json({
          equipos: equiposValidados,
          proveedor: 'deepseek',
          fallback: true,
          gemini_error: geminiError
        });

      }

      throw new Error(
        'DeepSeek devolvió una estructura inválida.'
      );


    } catch (deepseekError) {

      console.error(
        'DeepSeek también falló:',
        deepseekError
      );


      return res.status(502).json({

        error:
          'No fue posible analizar los equipos con ninguna IA.',

        gemini_error:
          geminiError,

        deepseek_error:
          deepseekError.message

      });

    }

  }


  // ========================================================
  // 3. NO HAY FALLBACK CONFIGURADO
  // ========================================================

  return res.status(502).json({

    error:
      'Gemini no pudo procesar la solicitud y DeepSeek no está configurado.',

    gemini_error:
      geminiError

  });

}


/* ==========================================================
   GEMINI
   ========================================================== */

async function llamarGemini(
  prompt,
  apiKey
) {

  const model =
    'gemini-3.6-flash';


  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      30000
    );


  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            contents: [

              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }

            ],

            generationConfig: {

              responseMimeType:
                'application/json'

            }

          }),

          signal:
            controller.signal
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Gemini HTTP ${response.status}: ${errorText}`
      );

    }


    const data =
      await response.json();


    const rawText =
      data?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text || '';


    if (!rawText.trim()) {

      throw new Error(
        'Gemini no devolvió contenido.'
      );

    }


    return extraerJSON(rawText);

  } finally {

    clearTimeout(timeout);

  }

}


/* ==========================================================
   DEEPSEEK
   ========================================================== */

async function llamarDeepSeek(
  prompt,
  apiKey
) {

  const url =
    'https://api.deepseek.com/chat/completions';


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      30000
    );


  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {

            'Content-Type':
              'application/json',

            'Authorization':
              `Bearer ${apiKey}`

          },

          body: JSON.stringify({

            model:
              'deepseek-chat',

            messages: [

              {
                role: 'system',

                content:
                  'Responde exclusivamente con JSON válido. No utilices Markdown.'
              },

              {
                role: 'user',

                content:
                  prompt
              }

            ],

            temperature: 0,

            response_format: {
              type: 'json_object'
            }

          }),

          signal:
            controller.signal
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `DeepSeek HTTP ${response.status}: ${errorText}`
      );

    }


    const data =
      await response.json();


    const rawText =
      data?.choices?.[0]
        ?.message?.content || '';


    if (!rawText.trim()) {

      throw new Error(
        'DeepSeek no devolvió contenido.'
      );

    }


    return extraerJSON(rawText);

  } finally {

    clearTimeout(timeout);

  }

}


/* ==========================================================
   EXTRAER JSON
   ========================================================== */

function extraerJSON(text) {

  let limpio =
    text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();


  try {

    return JSON.parse(limpio);

  } catch (error) {

    // Intentar localizar un objeto/array JSON
    const inicioArray =
      limpio.indexOf('[');

    const finArray =
      limpio.lastIndexOf(']');


    if (
      inicioArray !== -1 &&
      finArray !== -1 &&
      finArray > inicioArray
    ) {

      return JSON.parse(
        limpio.substring(
          inicioArray,
          finArray + 1
        )
      );

    }


    // DeepSeek con response_format puede devolver
    // un objeto que contiene "equipos".
    const inicioObjeto =
      limpio.indexOf('{');

    const finObjeto =
      limpio.lastIndexOf('}');


    if (
      inicioObjeto !== -1 &&
      finObjeto !== -1 &&
      finObjeto > inicioObjeto
    ) {

      const objeto =
        JSON.parse(
          limpio.substring(
            inicioObjeto,
            finObjeto + 1
          )
        );


      if (Array.isArray(objeto.equipos)) {
        return objeto.equipos;
      }

    }


    throw new Error(
      'La IA no devolvió JSON válido.'
    );

  }

}


/* ==========================================================
   VALIDAR RESULTADO
   ========================================================== */

function validarEquipos(equipos) {

  if (!Array.isArray(equipos)) {
    return null;
  }

  return equipos
    .map(eq => {

      if (!eq || typeof eq !== 'object') {
        return null;
      }

      const equipo = String(eq.equipo || '').trim();

      if (!equipo) {
        return null;
      }


      // ====================================================
      // HP
      // ====================================================

      let hp = Number(eq.hp);

      if (!Number.isFinite(hp)) {
        hp = 0;
      }


      // ====================================================
      // POTENCIA
      // ====================================================

      let potencia = Number(eq.potencia_w);

      if (!Number.isFinite(potencia)) {
        potencia = 0;
      }


      // ====================================================
      // SI EXISTE HP, HP ES LA FUENTE PRINCIPAL
      // ====================================================

      if (hp > 0) {

        // 1 HP = 746 W
        potencia = hp * 746;

      }


      // ====================================================
      // CANTIDAD
      // ====================================================

      let cantidad = Number(eq.cantidad);

      if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {
        cantidad = 1;
      }


      // ====================================================
      // HORAS
      // ====================================================

      let horas = Number(eq.horas_dia);

      if (
        !Number.isFinite(horas) ||
        horas < 0
      ) {
        horas = 0;
      }


      return {

        equipo,

        // Conservamos HP
        hp,

        // Potencia calculada desde HP
        potencia_w: Math.round(potencia),

        cantidad,

        horas_dia: horas

      };

    })
    .filter(Boolean);

}
