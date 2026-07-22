import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { MODELS } from '@/src/lib/config/models';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';

/**
 * Heuristically pre-filter out obvious greetings, short tests, or empty inputs locally
 * to save Gemini LLM token costs.
 */
export function isQueryObviousSpam(query: string): boolean {
  const trimmed = query.trim().toLowerCase();

  // Filter out extremely short queries (e.g., "?", "a", "12")
  if (trimmed.length < 3) return true;

  // Filter out common greetings or testing keywords
  const greetings = new Set([
    'hello', 'hi', 'hey', 'test', 'testing', 'yo', 'hola',
    'kumusta', 'kamusta', 'halo', 'good morning', 'good afternoon', 'good evening'
  ]);
  if (greetings.has(trimmed)) return true;

  // Filter out inputs with no alphabetical characters (just punctuation or numbers)
  if (!/[a-zA-Z]/.test(trimmed)) return true;

  return false;
}

interface ProcessGapParams {
  query: string;
  userId: string;
}

/**
 * Auto-categorizes an unanswered query and inserts it into archive_gaps in a
 * single database operation, but ONLY if the query is deemed relevant to historical
 * or archival inquiry (filtering out greetings, off-topic prompts, etc.).
 */
export async function processAndInsertArchiveGap(
  supabase: SupabaseClient<Database>,
  params: ProcessGapParams,
): Promise<void> {
  const { query, userId } = params;

  // Step 1: Run local heuristic filter
  if (isQueryObviousSpam(query)) {
    console.log(`[ArchiveGap] Filtered locally: "${query}"`);
    return;
  }

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Step 2: Query Gemini to check historical relevance and extract metadata in one go
    const { text } = await generateText({
      model: google(MODELS.fast),
      system: `You are a historical research assistant. Analyze the user's unanswered query.
Determine if it is a meaningful query/question about history, historical events, figures, documents, culture, politics, or academic research (particularly general or Philippine history).
It is NOT relevant if it is general chitchat (e.g. "how are you"), coding/tech help (e.g. "JavaScript help"), math, translations, or gibberish.

Return a raw JSON object with the following structure:
{
  "is_relevant": boolean,
  "era": "historical period or null",
  "geography": "region/country or null",
  "subject": "topic or null"
}
Return ONLY valid raw JSON. No markdown formatting, no backticks.`,
      messages: [{ role: 'user', content: `Analyze: "${query}"` }],
    });

    const cleaned = text.replace(/```json?\s*|\s*```/g, '').trim();
    const result = JSON.parse(cleaned) as {
      is_relevant: boolean;
      era?: string | null;
      geography?: string | null;
      subject?: string | null;
    };

    if (!result.is_relevant) {
      console.log(`[ArchiveGap] Filtered by LLM: "${query}"`);
      return;
    }

    // Step 3: Insert into the database in a single transaction
    const { error } = await supabase.from('archive_gaps').insert({
      query_text: query,
      user_id: userId,
      mode: 'scholarly_consensus',
      era: result.era || null,
      geography: result.geography || null,
      subject: result.subject || null,
    });

    if (error) {
      console.error('[ArchiveGap] Error inserting gap:', error);
    } else {
      console.log(`[ArchiveGap] Successfully logged gap: "${query}" (Era: ${result.era}, Geo: ${result.geography}, Subj: ${result.subject})`);
    }
  } catch (err) {
    console.error('[ArchiveGap] Unexpected execution error:', err);
  }
}

export type CategorizationResult = {
  isRelevant: boolean;
  era: string | null;
  geography: string | null;
  subject: string | null;
  reason?: string;
};

/**
 * Classifies a user-posted request title & description using Gemini Flash
 * to extract historical metadata (era, geography, subject) and filter out spam.
 */
export async function classifyUserRequest(
  title: string,
  description?: string | null
): Promise<CategorizationResult> {
  const combined = `${title} ${description || ''}`.trim();

  if (isQueryObviousSpam(combined)) {
    return {
      isRelevant: false,
      era: null,
      geography: null,
      subject: null,
      reason: 'Flagged as spam or insufficient text length.',
    };
  }

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const { text } = await generateText({
      model: google(MODELS.fast),
      system: `You are a historical research assistant. Analyze the user's historical inquiry title and description.
      Determine if it is a valid, meaningful question or topic request about history, historical events, figures, documents, culture, or research.
      It is NOT relevant if it is general chitchat, tech/coding support, math, translations, or offensive spam.

      Return a raw JSON object:
      {
        "is_relevant": boolean,
        "era": "historical period (e.g. 'Spanish Colonial', 'WWII Era', '19th Century') or null",
        "geography": "region or country (e.g. 'Philippines', 'Iloilo', 'Southeast Asia') or null",
        "subject": "topic area (e.g. 'Trade', 'Revolution', 'Genealogy', 'Governance') or null"
      }
      Return ONLY valid raw JSON. No markdown formatting, no backticks.`,
      messages: [{ role: 'user', content: `Title: ${title}\nDescription: ${description || 'N/A'}` }],
    });

    const cleaned = text.replace(/```json?\s*|\s*```/g, '').trim();
    const result = JSON.parse(cleaned) as {
      is_relevant: boolean;
      era?: string | null;
      geography?: string | null;
      subject?: string | null;
    };

    return {
      isRelevant: result.is_relevant,
      era: result.era || null,
      geography: result.geography || null,
      subject: result.subject || null,
    };
  } catch (err) {
    console.error('[ArchiveGap] Error classifying user request:', err);
    // Fallback gracefully so valid posts aren't blocked if AI API fails
    return {
      isRelevant: true,
      era: null,
      geography: null,
      subject: null,
    };
  }
}

