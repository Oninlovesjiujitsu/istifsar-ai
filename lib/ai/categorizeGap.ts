import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { MODELS } from '@/lib/config/models';
import { createClient } from '@/lib/supabase/server';

/**
 * Auto-categorize an archive gap using Gemini Flash.
 * Extracts era, geography, and subject from the unanswered query
 * and updates the archive_gaps row. Designed to be called fire-and-forget.
 */
export async function categorizeArchiveGap(
  gapId: string,
  queryText: string,
): Promise<void> {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const { text } = await generateText({
      model: google(MODELS.fast),
      system:
        'You are a history classification assistant. Analyze a history question and return a JSON object with three keys: era (the historical period), geography (the region or country), and subject (the topic or theme). Use concise labels. Return ONLY valid JSON, no markdown.',
      messages: [
        {
          role: 'user',
          content: `Classify this unanswered history question:\n\n"${queryText}"`,
        },
      ],
    });

    // Parse the JSON response
    const cleaned = text.replace(/```json?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned) as {
      era?: string;
      geography?: string;
      subject?: string;
    };

    const supabase = await createClient();
    await supabase
      .from('archive_gaps')
      .update({
        era: parsed.era ?? null,
        geography: parsed.geography ?? null,
        subject: parsed.subject ?? null,
      })
      .eq('id', gapId);
  } catch {
    // Non-fatal — categorization failure should never surface to the user
  }
}
