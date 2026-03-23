import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@istifsar.ai';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Notify all Tier 1 validators of a new document submission.
 * Silently no-ops if RESEND_API_KEY is not set.
 */
export async function notifyValidators(
  documentId: string,
  documentTitle: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const admin = createAdminClient();

  // Get Tier 1 profile IDs
  const { data: tier1Profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('tier', 'tier_1');

  if (!tier1Profiles?.length) return;

  // Get emails from auth.users
  const {
    data: { users },
  } = await admin.auth.admin.listUsers({ perPage: 1000 });

  const tier1Ids = new Set(tier1Profiles.map((p) => p.id));
  const recipients = users.filter((u) => tier1Ids.has(u.id) && u.email);

  if (!recipients.length) return;

  await Promise.allSettled(
    recipients.map((u) =>
      resend.emails.send({
        from: FROM,
        to: u.email!,
        subject: `New source awaiting review: ${documentTitle}`,
        html: `
          <p>A contributor has submitted a new primary source for Tier 1 validation.</p>
          <p><strong>${documentTitle}</strong></p>
          <p>
            <a href="${APP_URL}/contribute/validate/${documentId}">
              Review it on Istifsar
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;">
            You are receiving this because you are a Tier 1 validator on Istifsar AI.
          </p>
        `,
      }),
    ),
  );
}
