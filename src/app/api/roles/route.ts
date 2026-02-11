import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, description, hourly_rate')
      .order('name');

    if (error) {
      console.error('Roles API error:', error);
      return Response.json({ success: true, data: [], dbError: error.message });
    }

    return Response.json({ success: true, data: roles || [] });

  } catch (error) {
    console.error('Roles API error:', error);
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
      return Response.json({ success: false, error: 'Role name is required' }, { status: 400 });
    }

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .insert({
        name: body.name,
        description: body.description || null,
        hourly_rate: body.hourly_rate || null
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: role });

  } catch (error) {
    console.error('Create role error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}