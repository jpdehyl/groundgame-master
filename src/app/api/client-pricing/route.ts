import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return Response.json({
        success: false,
        error: 'client_id query parameter is required'
      }, { status: 400 });
    }

    const { data: pricing, error } = await supabase
      .from('client_pricing')
      .select(`
        *,
        role:roles(id, name, hourly_rate)
      `)
      .eq('client_id', clientId)
      .order('effective_from', { ascending: false });

    if (error) throw error;

    return Response.json({
      success: true,
      data: pricing ?? []
    });
  } catch (error) {
    console.error('Client pricing GET error:', error);
    return Response.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.client_id || !body.role_id || !body.hourly_rate || !body.effective_from) {
      return Response.json({
        success: false,
        error: 'client_id, role_id, hourly_rate, and effective_from are required'
      }, { status: 400 });
    }

    const { data: pricing, error } = await supabaseAdmin
      .from('client_pricing')
      .insert({
        client_id: body.client_id,
        role_id: body.role_id,
        hourly_rate: body.hourly_rate,
        effective_from: body.effective_from,
        effective_to: body.effective_to || null
      })
      .select(`
        *,
        role:roles(id, name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return Response.json({
          success: false,
          error: 'A pricing entry already exists for this client, role, and effective date'
        }, { status: 400 });
      }
      throw error;
    }

    return Response.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Client pricing POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
