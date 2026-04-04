import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      let role = (data.session.user.app_metadata?.role as string) ?? 'reader';

      // Fallback: if the JWT hook hasn't synced the role, query profiles directly
      if (role === 'reader') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        if (profile?.role) role = profile.role;
      }

      if (role === 'admin') {
        return NextResponse.redirect(`${origin}/admin`);
      }
      if (role === 'verified_historian') {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
      // Readers
      return NextResponse.redirect(`${origin}/explore`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
