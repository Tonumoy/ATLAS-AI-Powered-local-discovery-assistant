import { Message, Coordinates, GroundingChunk } from "../types";

// Utility to score string similarity (0 to 1) - Kept for client-side chunk matching if needed, 
// though ideally the server does the heavy lifting. We'll keep it for the fallback logic if we decide to keep that client-side,
// but for now, we'll trust the server response mostly.
const similarity = (s1: string, s2: string) => {
  const normS1 = s1.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normS2 = s2.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanS1 = normS1.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const cleanS2 = normS2.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

  if (cleanS1.length === 0 || cleanS2.length === 0) return 0;
  if (cleanS1.includes(cleanS2) || cleanS2.includes(cleanS1)) return 0.8;
  return 0;
};

export const generateResponse = async (
  history: Message[],
  currentPrompt: string,
  userLocation: Coordinates | null,
  preferredLanguage: string = 'English',
  userProfile: string = ''
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        prompt: currentPrompt,
        location: userLocation,
        language: preferredLanguage,
        userProfile,
        mode: 'chat'
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.text;
    let rawChunks = data.groundingChunks || [];

    // --- Client-Side Card Matching Logic (Preserved for visual consistency) ---
    // The server returns raw chunks, we still want to filter/sort them based on the generated text
    // to ensure the cards match what the AI actually talked about.

    const processedChunks: GroundingChunk[] = [];
    const usedChunkIndices = new Set<number>();

    if (rawChunks.length > 0) {
      const nameRegex = /\*\*([^*]+)\*\*/g;
      const textNames: string[] = [];
      let match;
      while ((match = nameRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const ignoredHeaders = [
          'MY TOP PICK', 'SOLID ALTERNATIVES', 'TOP PICK', 'ALTERNATIVES',
          'আমার সেরা বিকল্প', 'অন্যান্য বিকল্প', 'অন্যান্য ভালো বিকল্প',
          'मेरी शीर्ष पसंद', 'अन्य विकल्प', 'ठोस विकल्प',
          'MORNING FUEL', 'ACTIVITY', 'LUNCH', 'DINNER'
        ];

        if (!ignoredHeaders.includes(name.toUpperCase()) && !name.match(/^\d+:\d+/)) {
          const cleanName = name.replace(/^\d+\.\s*/, '');
          textNames.push(cleanName);
        }
      }

      textNames.forEach(textName => {
        const matchIndex = rawChunks.findIndex((chunk: any) => {
          const chunkTitle = chunk.maps?.title || "";
          return similarity(textName, chunkTitle) > 0.5;
        });

        if (matchIndex !== -1) {
          if (usedChunkIndices.has(matchIndex)) return;
          const chunk = rawChunks[matchIndex];
          usedChunkIndices.add(matchIndex);

          const nameIndex = text.indexOf(textName);
          if (nameIndex !== -1) {
            const context = text.substring(nameIndex, nameIndex + 150);
            const distMatch = context.match(/\[Distance:\s*(\d+(?:\.\d+)?)\s*(km|m)\]/i) ||
              context.match(/(\d+(?:\.\d+)?)\s*(km|m)\b/i);

            let distStr = "";
            if (distMatch) {
              distStr = distMatch[2].toLowerCase() === 'm'
                ? (parseFloat(distMatch[1]) / 1000).toFixed(1)
                : distMatch[1];
            }

            const rateMatch = context.match(/⭐\s*([\d.]+)|([\d.]+)\s*stars?/i);
            const rating = rateMatch ? (rateMatch[1] || rateMatch[2]) : "";
            const reviewMatch = context.match(/\(([^)]+)\)/);
            const reviews = reviewMatch ? reviewMatch[1] : "";

            chunk.extractedMetadata = {
              distance: distStr || chunk.extractedMetadata?.distance,
              rating: rating || chunk.extractedMetadata?.rating,
              reviews: reviews || chunk.extractedMetadata?.reviews
            };
          }
          processedChunks.push(chunk);
        }
      });
    }

    // FALLBACK: If strict matching failed to find ANY cards, but we have raw chunks, show them!
    // This prevents the "No cards" issue.
    // We prioritize the processed ones (matched to text), but if that fails, we show the top 3 raw results.
    const finalChunks = processedChunks.length > 0 ? processedChunks : rawChunks.slice(0, 3);

    return { text, groundingChunks: finalChunks };

  } catch (error: any) {
    console.error("API Service Error:", error);
    return { text: "I'm having a momentary lapse in connection. Give me a sec and try again?" };
  }
};

export const generateTitle = async (firstPrompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: firstPrompt,
        mode: 'title'
      }),
    });

    if (!response.ok) return "New Journey";

    const data = await response.json();
    return data.title || "New Journey";
  } catch (e) {
    return "New Journey";
  }
}
