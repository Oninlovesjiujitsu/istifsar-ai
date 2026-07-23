/**
 * KG Entity & Relationship Extractor
 *
 * Extracts entities (historians, events, dates, locations, claims, etc.)
 * and relationships between them from full document text using Gemini Flash.
 *
 * Uses Vercel AI SDK generateObject for guaranteed structured JSON outputs,
 * with fallbacks for robust handling of large historical texts.
 */

import { generateObject, generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { MODELS } from '@/src/lib/config/models';

// ---------------------------------------------------------------------------
// Types & Schema
// ---------------------------------------------------------------------------

export type EntityType =
  | 'HISTORIAN'
  | 'EVENT'
  | 'DATE'
  | 'LOCATION'
  | 'CLAIM'
  | 'SOURCE_REFERENCE'
  | 'CONCEPT';

export type RelationshipType =
  | 'ARGUES'
  | 'CONTRADICTS'
  | 'OCCURRED_AT'
  | 'PARTICIPATED_IN'
  | 'CITES'
  | 'SUPPORTS'
  | 'AUTHORED'
  | 'ABOUT'
  | 'OCCURRED_DURING'
  | 'RELATED_TO';

export type ExtractedEntity = {
  name: string;
  type: EntityType;
  aliases: string[];
  excerpt: string;
  confidence: number;
};

export type ExtractedRelationship = {
  sourceEntity: string;
  targetEntity: string;
  type: RelationshipType;
  evidence: string;
  weight: number;
};

export type ExtractionResult = {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
};

const entityTypeSchema = z.enum([
  'HISTORIAN',
  'EVENT',
  'DATE',
  'LOCATION',
  'CLAIM',
  'SOURCE_REFERENCE',
  'CONCEPT',
]);

const relationshipTypeSchema = z.enum([
  'ARGUES',
  'CONTRADICTS',
  'OCCURRED_AT',
  'PARTICIPATED_IN',
  'CITES',
  'SUPPORTS',
  'AUTHORED',
  'ABOUT',
  'OCCURRED_DURING',
  'RELATED_TO',
]);

const extractionSchema = z.object({
  entities: z.array(
    z.object({
      name: z.string().describe('Formal complete name of the historical entity'),
      type: entityTypeSchema,
      aliases: z.array(z.string()).default([]),
      excerpt: z.string().default(''),
      confidence: z.number().min(0).max(1).default(0.8),
    }),
  ).default([]),
  relationships: z.array(
    z.object({
      sourceEntity: z.string().describe('Entity name matching an entity above'),
      targetEntity: z.string().describe('Entity name matching an entity above'),
      type: relationshipTypeSchema,
      evidence: z.string().default(''),
      weight: z.number().min(0).max(1).default(0.7),
    }),
  ).default([]),
});

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `You are a knowledge graph extraction assistant specialized in historiography.
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
7. Relationship evidence: include a brief excerpt supporting the relationship
8. Weight: 1.0 for explicitly stated relationships, 0.7 for implied, 0.5 for inferred`;

// ---------------------------------------------------------------------------
// Helper: Robust JSON Sanitizer
// ---------------------------------------------------------------------------

function sanitizeAndParseJSON(rawText: string): any {
  // Strip markdown fences
  let cleaned = rawText.replace(/```json?\s*|\s*```/g, '').trim();

  // Quote unquoted type values like "type": RELATED_TO -> "type": "RELATED_TO"
  cleaned = cleaned.replace(
    /"type":\s*([A-Z_]+)(?=[,\s\n\}])/g,
    '"type": "$1"'
  );

  // Quote unquoted keys if any
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // Strip trailing commas
  cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch {
    // Substring extraction fallback
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sub = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sub);
    }
    throw new Error('Failed to parse JSON response from Gemini');
  }
}

// ---------------------------------------------------------------------------
// Extraction function
// ---------------------------------------------------------------------------

/**
 * Extract entities and relationships from a full document text.
 * Uses Gemini Flash with structured JSON output enforcement.
 */
export async function extractEntitiesAndRelationships(
  text: string,
  title: string,
  author?: string | null,
): Promise<ExtractionResult> {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  // Cap snippet at ~30k chars (~7.5k tokens) for focused extraction
  const maxChars = 30_000;
  const snippet = text.length > maxChars
    ? text.slice(0, maxChars) + '\n\n[... document truncated for extraction ...]'
    : text;

  const userPrompt = [
    `Document Title: "${title}"`,
    author ? `Author/Historian: ${author}` : null,
    `\n--- DOCUMENT TEXT ---\n${snippet}\n--- END DOCUMENT TEXT ---`,
    `\nExtract all entities and relationships from this document.`,
  ]
    .filter(Boolean)
    .join('\n');

  let rawEntities: Array<{
    name: string;
    type: string;
    aliases?: string[];
    excerpt?: string;
    confidence?: number;
  }> = [];

  let rawRelationships: Array<{
    sourceEntity: string;
    targetEntity: string;
    type: string;
    evidence?: string;
    weight?: number;
  }> = [];

  // Primary: Use Vercel AI SDK generateObject (enforces strict JSON Schema)
  try {
    const { object } = await generateObject({
      model: google(MODELS.fast),
      schema: extractionSchema,
      system: EXTRACTION_PROMPT,
      prompt: userPrompt,
    });
    rawEntities = object.entities ?? [];
    rawRelationships = object.relationships ?? [];
  } catch (genObjErr) {
    console.warn('[KG Extraction] generateObject failed, falling back to generateText + robust parser:', genObjErr);

    // Fallback: Use generateText with manual sanitizer
    const { text: responseText } = await generateText({
      model: google(MODELS.fast),
      system: EXTRACTION_PROMPT + '\nRespond strictly with a single valid JSON object.',
      prompt: userPrompt,
    });

    const parsed = sanitizeAndParseJSON(responseText);
    rawEntities = parsed.entities ?? [];
    rawRelationships = parsed.relationships ?? [];
  }

  // Validate and sanitize types
  const validEntityTypes = new Set<string>([
    'HISTORIAN', 'EVENT', 'DATE', 'LOCATION',
    'CLAIM', 'SOURCE_REFERENCE', 'CONCEPT',
  ]);
  const validRelTypes = new Set<string>([
    'ARGUES', 'CONTRADICTS', 'OCCURRED_AT', 'PARTICIPATED_IN',
    'CITES', 'SUPPORTS', 'AUTHORED', 'ABOUT',
    'OCCURRED_DURING', 'RELATED_TO',
  ]);

  const entities = rawEntities
    .map((e) => ({
      ...e,
      type: (e.type || '').toUpperCase(),
    }))
    .filter(
      (e) =>
        typeof e.name === 'string' &&
        e.name.trim() &&
        validEntityTypes.has(e.type),
    )
    .map((e) => ({
      name: e.name.trim(),
      type: e.type as EntityType,
      aliases: Array.isArray(e.aliases)
        ? e.aliases.filter((a) => typeof a === 'string' && a.trim()).map((a) => a.trim())
        : [],
      excerpt: typeof e.excerpt === 'string' ? e.excerpt.slice(0, 200) : '',
      confidence: typeof e.confidence === 'number'
        ? Math.max(0, Math.min(1, e.confidence))
        : 0.8,
    }));

  const entityNames = new Set(entities.map((e) => e.name));

  const relationships = rawRelationships
    .map((r) => ({
      ...r,
      type: (r.type || '').toUpperCase(),
    }))
    .filter(
      (r) =>
        typeof r.sourceEntity === 'string' &&
        typeof r.targetEntity === 'string' &&
        validRelTypes.has(r.type) &&
        entityNames.has(r.sourceEntity) &&
        entityNames.has(r.targetEntity),
    )
    .map((r) => ({
      sourceEntity: r.sourceEntity,
      targetEntity: r.targetEntity,
      type: r.type as RelationshipType,
      evidence: typeof r.evidence === 'string' ? r.evidence.slice(0, 200) : '',
      weight: typeof r.weight === 'number'
        ? Math.max(0, Math.min(1, r.weight))
        : 0.7,
    }));

  return { entities, relationships };
}
