import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('clients')
      .select(`
        id, name, email, contact_person, billing_address, status, created_at,
        employees:employees(id)
      `)
      .order('name');

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data: clients, error } = await query;

    if (error) throw error;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return Response.json({
        success: false,
        error: 'Client name is required'
      }, { status: 400 });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        name: body.name.trim(),
        email: body.email?.trim() || null,
        contact_person: body.contact_person?.trim() || null,
        billing_address: body.billing_address?.trim() || null,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Client POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
