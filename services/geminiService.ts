
import { GoogleGenAI } from "@google/genai";
import { Subticket, Ticket } from "../types";

// IMPORTANT: This key is read from environment variables and should not be hardcoded.
// For this example, we assume `process.env.API_KEY` is configured in the build environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateSqlFromNaturalLanguage = async (naturalLanguageQuery: string): Promise<string> => {
  if (!API_KEY) {
    return `/* Las funciones de IA están deshabilitadas. Por favor, configure una API Key. \nSe habría generado SQL para: "${naturalLanguageQuery}" */`;
  }
  
  const model = "gemini-2.5-flash-preview-04-17";
  const systemInstruction = `Eres un experto generador de SQL. Dada una solicitud de un usuario en lenguaje natural, genera una consulta SQL segura y de solo lectura.
La base de datos tiene dos tablas: "tickets" y "subtickets".

La tabla "tickets" tiene las columnas: id, code, type, reportedBy, initialDiagnosis, creationDate, serviceUnavailable, node, olt, advisor, emailStatus, status, closingDate.
La tabla "subtickets" tiene las columnas: id, ticketId, code, cto, card, port, city, clientCount, eventStartDate, reportedToPextDate, creator, status, node, olt, closingAdvisor, eventEndDate, rootCause, badPraxis, solution, statusPostSLA, comment, eventResponsible.

- Solo genera sentencias SELECT.
- No generes ninguna sentencia INSERT, UPDATE, DELETE o DROP.
- Envuelve los nombres de las tablas y columnas con comillas dobles.
- Devuelve ÚNICAMENTE la consulta SQL como una cadena de texto sin formato, sin texto adicional, explicaciones o formato markdown.
`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: naturalLanguageQuery,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.1
        },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating SQL:", error);
    return `/* Error generando SQL desde la IA. Revisa la consola para más detalles. */`;
  }
};

export const suggestClosingSolution = async (ticket: Ticket, subticket: Subticket): Promise<{rootCause: string, solution: string, comment: string}> => {
    if (!API_KEY) {
        return { rootCause: '', solution: '', comment: 'Funciones de IA deshabilitadas.'};
    }

    const model = 'gemini-2.5-flash-preview-04-17';
    const systemInstruction = `Eres un analista experto en soporte técnico. Se te proporcionarán datos de ticket y subticket en formato JSON.
    Tu tarea es sugerir una "rootCause" (causa raíz), una "solution" (solución) y un "comment" (comentario) para cerrar el subticket.
    La respuesta debe ser un objeto JSON válido con tres claves: "rootCause", "solution", y "comment".
    No incluyas ningún otro texto o formato markdown.
    Ejemplo de respuesta: {"rootCause": "Daño físico en la fibra", "solution": "Se empalmó el cable de fibra óptica", "comment": "Técnico confirmó restauración de la señal después del empalme."}`;

    const prompt = `Basado en la siguiente información de ticket y subticket, sugiere una solución de cierre.
    Ticket: ${JSON.stringify(ticket)}
    Subticket: ${JSON.stringify(subticket)}`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json'
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        return JSON.parse(jsonStr);

    } catch(error) {
        console.error("Error suggesting solution:", error);
        return { rootCause: '', solution: '', comment: 'No se pudo obtener la sugerencia de la IA.'};
    }
};
