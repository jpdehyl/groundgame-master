import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const integrations: Record<string, {
    connected: boolean;
    status: string;
    detail?: string;
  }> = {};

  // Supabase — use admin client (bypasses RLS) so connectivity check doesn't fail on policy
  if (!isSupabaseConfigured) {
    integrations.supabase = { connected: false, status: 'Not Configured', detail: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY' };
  } else {
    try {
      const { count, error } = await supabaseAdmin
        .from('roles')
        .select('id', { count: 'exact', head: true });

      if (error) {
        integrations.supabase = { connected: false, status: 'Error', detail: error.message };
      } else {
        integrations.supabase = { connected: true, status: 'Connected', detail: `${count ?? 0} roles in database` };
      }
    } catch (err) {
      integrations.supabase = { connected: false, status: 'Error', detail: err instanceof Error ? err.message : 'Connection failed' };
    }
  }

  // Clerk
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (clerkPubKey && clerkSecret) {
    integrations.clerk = { connected: true, status: 'Connected', detail: `Key: ${clerkPubKey.slice(0, 12)}...` };
  } else if (clerkPubKey || clerkSecret) {
    integrations.clerk = { connected: false, status: 'Partial', detail: 'Missing one of CLERK_SECRET_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' };
  } else {
    integrations.clerk = { connected: false, status: 'Not Configured', detail: 'No Clerk keys found' };
  }

  // Veem — always available as CSV export, no API key needed
  integrations.veem = { connected: true, status: 'Ready', detail: 'CSV export available in Payroll' };

  // Email (placeholder — not implemented yet)
  integrations.email = { connected: false, status: 'Not Configured' };

  // Calendar (placeholder — not implemented yet)
  integrations.calendar = { connected: false, status: 'Not Configured' };

  return Response.json({ success: true, data: integrations });
}
