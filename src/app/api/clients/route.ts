import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id, name, email, contact_person, billing_address, status, created_at,
        employees:employees(id)
      `)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Clients API error:', error);
      return Response.json({ success: true, data: [], dbError: error.message });
    }

    const enriched = (clients ?? []).map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      contact_person: client.contact_person,
      billing_address: client.billing_address,
      status: client.status,
      created_at: client.created_at,
      employee_count: Array.isArray(client.employees) ? client.employees.length : 0,
    }));

    return Response.json({ success: true, data: enriched });

  } catch (error) {
    console.error('Clients API error:', error);
    return Response.json({ success: true, data: [], dbError: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.name) {
      return Response.json({ success: false, error: 'Client name is required' }, { status: 400 });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        name: body.name,
        email: body.email || null,
        contact_person: body.contact_person || null,
        billing_address: body.billing_address || null,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: client });

  } catch (error) {
    console.error('Create client error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
