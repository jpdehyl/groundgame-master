import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status || !['approved', 'denied'].includes(body.status)) {
      return Response.json({
        success: false,
        error: "status must be 'approved' or 'denied'"
      }, { status: 400 });
    }

    // Verify it's currently pending
    const { data: current, error: fetchErr } = await supabase
      .from('time_off')
      .select('status')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;
    if (!current) {
      return Response.json({ success: false, error: 'Request not found' }, { status: 404 });
    }
    if (current.status !== 'pending') {
      return Response.json({
        success: false,
        error: `Cannot update: request is already '${current.status}'`
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('time_off')
      .update({
        status: body.status,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .single();
    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Time-off PUT error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
