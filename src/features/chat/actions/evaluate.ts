'use server';

import { publishEvaluationTrace, type TracePayload } from '@/src/lib/evaluation/publisher';

export async function submitEvaluationFlag(payload: TracePayload) {
  return await publishEvaluationTrace(payload);
}
