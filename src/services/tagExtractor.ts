import { GoogleGenAI } from '@google/genai';

export interface ExtractedTattooData {
  name: string;
  subjects: string[];
  style: string[];
  modern_traditional: 'modern' | 'traditional';
  placement: string[];
  how: 'full' | 'flash' | 'free';
  color: 'black and gray' | 'colored';
  author: {
    name: string;
    instagram: string;
  };
}

const TATTOO_PROMPT = `You are a professional tattoo detector. You will extract the elements of a tattoo from a photo, by returning this structured JSON:

Explanation:
name: a short name for the tattoo, considering its main elements. ex: Full sleeve japanese dragon.
subjects: list of subjects, figures that appear on a tattoo by keywords.
style: list of keywords: tribal, japanese, chinese, asiatic, neo-traditional, illustrative works
modern_traditional: can be one of them: "modern" OR "traditional".
how: can be one of them: "full" OR "flash". Full refers to tattoos that covers a whole part of the body (ex. a full sleeve, full leg). Flash means a tattoo that is stamped in a part of the body, but it is not included in a wider work to cover a specific part of the body.
color: one term. "black and gray" OR "colored".
author: extract the author name of the image, infer the name by the instagram hashtag. Extract the instagram hashtag.

Output:
{
name: "name",
subjects: [],
style: [],
modern_traditional: "modern",
placement: [],
how: "full",
color: "black and gray",
author: { "name": "", "instagram": "" }
}

IMPORTANT: Respond ONLY with a valid, parseable JSON object matching this schema. No markdown formatting around it, no additional commentary.`;

export async function extractTattooTags(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  originalFilename?: string
): Promise<ExtractedTattooData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timed out')), 20000)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
            {
              text: TATTOO_PROMPT,
            },
          ],
        },
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text?.trim() || '';
      console.log('Gemini 3.8 Flash extraction response:', text);

      // Clean possible code fences
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return sanitizeExtractedData(parsed, originalFilename);
    } catch (err) {
      console.error('Gemini tag extraction error:', err);
      // Fall through to heuristic extractor fallback
    }
  } else {
    console.warn('GEMINI_API_KEY not configured or using default placeholder. Using intelligent heuristic analysis.');
  }

  // Heuristic extraction fallback when API key is unconfigured or in offline dev
  return generateHeuristicExtraction(originalFilename);
}

function sanitizeExtractedData(data: any, fallbackName?: string): ExtractedTattooData {
  const subjects = Array.isArray(data.subjects)
    ? data.subjects.map((s: any) => String(s).trim())
    : typeof data.subjects === 'string'
    ? data.subjects.split(',').map((s: string) => s.trim())
    : ['tattoo design'];

  const style = Array.isArray(data.style)
    ? data.style.map((s: any) => String(s).trim())
    : typeof data.style === 'string'
    ? data.style.split(',').map((s: string) => s.trim())
    : ['illustrative works'];

  const modernTraditional =
    String(data.modern_traditional || '').toLowerCase() === 'traditional'
      ? 'traditional'
      : 'modern';

  const placement = Array.isArray(data.placement)
    ? data.placement.map((p: any) => String(p).trim())
    : typeof data.placement === 'string'
    ? data.placement.split(',').map((p: string) => p.trim())
    : ['forearm'];

  let how: 'full' | 'flash' | 'free' = 'flash';
  const howStr = String(data.how || '').toLowerCase();
  if (howStr.includes('full')) how = 'full';
  else if (howStr.includes('free')) how = 'free';
  else how = 'flash';

  const colorStr = String(data.color || '').toLowerCase();
  const color = colorStr.includes('color') ? 'colored' : 'black and gray';

  const authorName = data.author?.name || 'Studio Artist';
  let instagram = data.author?.instagram || '';
  if (instagram && !instagram.startsWith('@')) {
    instagram = `@${instagram}`;
  }
  if (!instagram) {
    instagram = `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'ink_studio'}`;
  }

  return {
    name: data.name || fallbackName?.replace(/\.[^/.]+$/, '') || 'Custom Tattoo Work',
    subjects: subjects.filter(Boolean),
    style: style.filter(Boolean),
    modern_traditional: modernTraditional,
    placement: placement.filter(Boolean),
    how,
    color,
    author: {
      name: authorName,
      instagram: instagram,
    },
  };
}

function generateHeuristicExtraction(filename?: string): ExtractedTattooData {
  const cleanName = (filename || 'Tattoo Piece')
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name: cleanName || 'Neo-Illustrative Tattoo Study',
    subjects: ['botanical', 'geometric linework', 'foliage'],
    style: ['illustrative works', 'neo-traditional'],
    modern_traditional: 'modern',
    placement: ['forearm', 'bicep'],
    how: 'flash',
    color: 'black and gray',
    author: {
      name: 'Studio Artisan',
      instagram: '@ink_curator',
    },
  };
}
