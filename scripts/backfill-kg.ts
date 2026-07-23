/**
 * scripts/backfill-kg.ts
 *
 * Standalone Knowledge Graph Backfill Runner Script.
 * Extracts entity nodes and relationships from all published documents in Supabase
 * that currently lack KG entity mentions.
 *
 * Run using:
 *   npx tsx scripts/backfill-kg.ts
 */

import fs from 'fs';
import path from 'path';

// Parse .env.local manually if environment variables are not already set
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envFileContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        let value = trimmed.slice(equalsIdx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

import { createClient } from '@supabase/supabase-js';
import { extractEntitiesAndRelationships } from '../src/lib/ai/kg/extractor';
import { linkToGraph, clearDocumentKG } from '../src/lib/ai/kg/linker';

async function main() {
  console.log('===========================================================');
  console.log('📜 ISTIFSAR AI — Knowledge Graph Backfill Runner');
  console.log('===========================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY must be set in .env.local');
    process.exit(1);
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Query published documents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: docs, error: fetchErr } = await (db as any)
    .from('documents')
    .select('id, title, submitter_id, profiles!documents_submitter_id_fkey(display_name)')
    .eq('status', 'published');

  if (fetchErr) {
    console.error('❌ Error querying published documents:', fetchErr.message);
    process.exit(1);
  }

  if (!docs || docs.length === 0) {
    console.log('ℹ️ No published documents found in the database.');
    process.exit(0);
  }

  console.log(`🔍 Found ${docs.length} published document(s) in total.`);

  // Filter to documents missing KG mentions
  const docIds = docs.map((d: { id: string }) => d.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingMentions } = await (db as any)
    .from('kg_entity_mentions')
    .select('document_id')
    .in('document_id', docIds);

  const docsWithKG = new Set(
    ((existingMentions ?? []) as Array<{ document_id: string }>).map((m) => m.document_id),
  );

  const docsToProcess = docs.filter((d: { id: string }) => !docsWithKG.has(d.id));

  console.log(`📊 Documents with existing KG data: ${docsWithKG.size}`);
  console.log(`📊 Documents needing KG backfill: ${docsToProcess.length}\n`);

  if (docsToProcess.length === 0) {
    console.log('✅ All published documents already have Knowledge Graph data!');
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < docsToProcess.length; i++) {
    const doc = docsToProcess[i];
    console.log(`-----------------------------------------------------------`);
    console.log(`[${i + 1}/${docsToProcess.length}] Processing document: "${doc.title}"`);
    console.log(`    Document ID: ${doc.id}`);

    try {
      // Reconstruct text from chunks
      const { data: chunks, error: chunksErr } = await db
        .from('document_chunks')
        .select('content')
        .eq('document_id', doc.id)
        .order('chunk_index');

      if (chunksErr || !chunks || chunks.length === 0) {
        console.warn(`    ⚠️ Warning: No text chunks found for "${doc.title}". Skipping.`);
        failCount++;
        continue;
      }

      const fullText = chunks.map((c) => c.content).join('\n\n');
      const authorName = (doc.profiles as { display_name?: string } | null)?.display_name ?? null;

      // Clear any prior partial KG data for clean re-extraction
      await clearDocumentKG(db, doc.id);

      // Extract entities & relationships using Gemini Flash
      console.log('    🧠 Extracting historical entities & relationships via Gemini AI...');
      const extraction = await extractEntitiesAndRelationships(
        fullText,
        doc.title,
        authorName,
      );

      console.log(`    Found ${extraction.entities.length} entities and ${extraction.relationships.length} relationships.`);

      // Link to graph tables (with deduplication)
      console.log('    🔗 Linking entity nodes into Supabase graph tables...');
      const result = await linkToGraph(db, doc.id, extraction);

      console.log(
        `    ✅ Success! Linked ${result.entitiesLinked} entity nodes and created ${result.relationshipsCreated} relationships.`,
      );
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ❌ Extraction failed for "${doc.title}":`, msg);
      failCount++;
    }
  }

  console.log('\n===========================================================');
  console.log(`🎉 BACKFILL COMPLETE: ${successCount} processed, ${failCount} failed.`);
  console.log('===========================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
