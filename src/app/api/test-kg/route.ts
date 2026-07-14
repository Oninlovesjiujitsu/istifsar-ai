import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/src/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const db = createAdminClient();
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    log('Fetching a published document...');
    const { data: docs, error: docErr } = await db
      .from('documents')
      .select('*')
      .eq('status', 'published')
      .limit(1);

    if (docErr || !docs || docs.length === 0) {
      log('Failed to fetch document: ' + JSON.stringify(docErr));
      return NextResponse.json({ logs });
    }

    const doc = docs[0];
    log('Selected Document: ' + doc.title);

    log('Fetching chunks...');
    const { data: chunks, error: chunkErr } = await db
      .from('document_chunks')
      .select('content')
      .eq('document_id', doc.id)
      .order('chunk_index');

    if (chunkErr || !chunks || chunks.length === 0) {
      log('Failed to fetch chunks: ' + JSON.stringify(chunkErr));
      return NextResponse.json({ logs });
    }

    const text = chunks.map((c) => c.content).join('\n\n');
    const maxChars = 30_000;
    const snippet = text.length > maxChars
      ? text.slice(0, maxChars) + '\n\n[... document truncated for extraction ...]'
      : text;

    const userPrompt = [
      `Document Title: "${doc.title}"`,
      doc.author_name ? `Author/Historian: ${doc.author_name}` : null,
      `\n--- DOCUMENT TEXT ---\n${snippet}\n--- END DOCUMENT TEXT ---`,
      `\nExtract all entities and relationships from this document.`,
    ].filter(Boolean).join('\n');

    const KG_EXTRACTION_PROMPT = `You are a knowledge graph extraction assistant specialized in historiography.
Given a scholarly document text, extract structured entities and relationships.

## Entity Types
- HISTORIAN: Named scholars, authors, or academics referenced in the text
- EVENT: Historical events (battles, treaties, revolutions, etc.)
- DATE: Specific dates, years, or time periods mentioned
- LOCATION: Geographic locations (cities, countries, regions, landmarks)
- CLAIM: Specific historical claims or arguments made by scholars
- SOURCE_REFERENCE: Primary sources, manuscripts, or documents cited
- CONCEPT: Historical concepts, movements, ideologies, or themes

## Relationship Types
- ARGUES: A historian makes a specific claim (HISTORIAN → CLAIM)
- CONTRADICTS: Two claims or entities are in factual contradiction (CLAIM → CLAIM)
- OCCURRED_AT: An event happened at a location (EVENT → LOCATION)
- PARTICIPATED_IN: A person was involved in an event (HISTORIAN/entity → EVENT)
- CITES: A historian references a primary source (HISTORIAN → SOURCE_REFERENCE)
- SUPPORTS: Evidence or a claim supports another claim (CLAIM → CLAIM)
- AUTHORED: A historian wrote a document or source (HISTORIAN → SOURCE_REFERENCE)
- ABOUT: An entity is about a topic/concept (any → CONCEPT)
- OCCURRED_DURING: An event happened during a time period (EVENT → DATE)
- RELATED_TO: General thematic or contextual connection

## Rules
1. Extract ALL meaningful entities — err on the side of inclusion
2. Entity names should be the most complete/formal version used in the text
3. Include aliases (alternative names, abbreviations, transliterations)
4. For CLAIM entities, state the claim concisely (under 30 words)
5. Confidence: 1.0 for explicitly stated, 0.8 for strongly implied, 0.6 for inferred
6. Excerpt: include a brief verbatim quote (max 40 words) where the entity appears
7. Weight: 1.0 for explicitly stated relationships, 0.7 for implied, 0.5 for inferred

Respond with ONLY a JSON object (no markdown, no prose):
{
  "entities": [
    { "name": "string", "type": "ENTITY_TYPE", "aliases": ["string"], "excerpt": "verbatim quote", "confidence": 0.0-1.0 }
  ],
  "relationships": [
    { "sourceEntity": "entity name", "targetEntity": "entity name", "type": "RELATIONSHIP_TYPE", "evidence": "brief excerpt", "weight": 0.0-1.0 }
  ]
}`;

    const VALID_ENTITY_TYPES = new Set([
      'HISTORIAN', 'EVENT', 'DATE', 'LOCATION', 'CLAIM', 'SOURCE_REFERENCE', 'CONCEPT',
    ]);

    log('Calling Gemini API...');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: KG_EXTRACTION_PROMPT + '\n\n' + userPrompt }] },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      log(`Gemini KG extraction error ${res.status}: ${body}`);
      return NextResponse.json({ logs });
    }

    const geminiResult = await res.json();
    log('Gemini returned successfully.');

    if (geminiResult.promptFeedback) {
      log('Prompt Feedback: ' + JSON.stringify(geminiResult.promptFeedback));
    }

    const candidate = geminiResult.candidates?.[0];
    log('Candidate finishReason: ' + candidate?.finishReason);
    
    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) {
      log('No text returned by Gemini.');
      return NextResponse.json({ logs });
    }

    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      log(`Parsed JSON successfully. Entities: ${parsed.entities?.length || 0}, Relationships: ${parsed.relationships?.length || 0}`);
    } catch (e) {
      log('JSON parse failed: ' + String(e));
      log('Raw text: ' + cleaned);
      return NextResponse.json({ logs });
    }

    const entities = (parsed.entities ?? [])
      .map((e: any) => ({ ...e, type: (e.type || '').toUpperCase() }))
      .filter(
        (e: any) => typeof e.name === 'string' && e.name.trim() && VALID_ENTITY_TYPES.has(e.type)
      );

    log(`Valid entities after filtering: ${entities.length}`);
    if (entities.length === 0) {
      log('Sample of raw entities: ' + JSON.stringify(parsed.entities?.slice(0, 3)));
    } else {
      log('Sample valid entity: ' + JSON.stringify(entities[0]));
    }
  } catch (error) {
    log('Unexpected error: ' + String(error));
  }

  return NextResponse.json({ logs });
}
