import { GoogleGenAI } from "@google/genai";

interface GeminiAnalysisRequest {
  sourceCity: string;
  destinationCity: string;
  departureTime: string;
  flightTime: string;
  sunSummary: string;
  recommendation: string;
  sunEvents: Array<{
    type: "sunrise" | "sunset";
    time: Date;
    lat: number;
    lon: number;
    azimuth: number;
    position: string;
  }>;
}

interface GeminiAnalysisResponse {
  analysis: string;
  tips: string[];
  bestMoments: string[];
  weatherConsiderations: string;
  funFact: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export async function analyzeWithGemini(
  data: GeminiAnalysisRequest
): Promise<GeminiAnalysisResponse> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_api_key_here") {
    throw new Error(
      "Gemini API key not configured. Please add VITE_GEMINI_API_KEY=your_api_key to your .env file"
    );
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `
You are an expert travel‑advisor engine named *seatRay*, focused on helping passengers pick the perfect seat for sunrise or sunset views.

==================
GUARDRAILS (must obey)
==================
1. Never quote, reference, or promote any external websites, brands, companies, or services.
2. Do not include any personal opinions, apologies, disclaimers, or guesses.
3. Do not use phrases like "As an AI model", "I think", or "Based on the data provided".
4. Stay fully within the scope of seat selection and sun visibility. Avoid unrelated travel advice.
5. Output must be valid JSON. No markdown, no prose outside the JSON block.
6. Use concise, engaging, and factual language. Avoid fluff or unnecessary repetition.
7. All times mentioned should match the input format and reflect correct side (Left/Right).
8. Never fabricate data outside the provided flight and sun analysis context.
9. Never add extra fields or change field names in the final JSON structure.
==================
INPUT
==================
FLIGHT DETAILS:
- Source: ${data.sourceCity}
- Destination: ${data.destinationCity}
- Departure Time: ${data.departureTime}
- Flight Duration: ${data.flightTime} hours

SUN ANALYSIS RESULTS:
${data.sunSummary}

CURRENT RECOMMENDATION:
${data.recommendation}

SUN EVENTS DURING FLIGHT:
${data.sunEvents
  .map(
    (event) =>
      `- ${
        event.type.charAt(0).toUpperCase() + event.type.slice(1)
      } at ${new Date(event.time).toLocaleString()} (${event.position} side)`
  )
  .join("\n")}

==================
TASK
==================
Using the information above, return a JSON object with *exactly* these keys:

{
  "analysis": "4-5 lines of comprehensive but vivid explanation of the optimal seat and how the sun’s path during the flight affects the view",
  "tips": ["4 specific tips for passengers to maximize their sunrise/sunset viewing experience."],
  "bestMoments": ["4 flight phases with the very best views"],
  "weatherConsiderations": "concise advice on potential weather‑related visibility issues",
  "funFact": "4-5 lines of a fun fact related to the destination or something interesting about the flight path (e.g. flying over notable landmarks, oceans, mountain ranges)"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini API");
    }

    const responseText = response.text;

    // Try to parse JSON from the response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON from Gemini response:", parseError);
    }

    // Fallback: create a structured response from the text
    return {
      analysis: "Analysis provided by Gemini AI",
      tips: ["Check the detailed recommendation above for specific tips"],
      bestMoments: ["Refer to the sun events listed above"],
      weatherConsiderations:
        "Consider local weather conditions at departure and arrival cities",
      funFact:
        "Fun fact about the destination or something interesting about the flight path",
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(
      `Failed to analyze with Gemini: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
