import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@istifsar.ai';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Notify admins of a new event (e.g., verification request).
 * Silently no-ops if RESEND_API_KEY is not set.
 */
export async function notifyAdmins(
  subject: string,
  html: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const admin = createAdminClient();

  const { data: adminProfiles } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (!adminProfiles?.length) return;

  const {
    data: { users },
  } = await admin.auth.admin.listUsers({ perPage: 1000 });

  const adminIds = new Set(adminProfiles.map((p) => p.id));
  const recipients = users.filter((u) => adminIds.has(u.id) && u.email);

  if (!recipients.length) return;

  await Promise.allSettled(
    recipients.map((u) =>
      resend.emails.send({
        from: FROM,
        to: u.email!,
        subject,
        html,
      }),
    ),
  );
}
