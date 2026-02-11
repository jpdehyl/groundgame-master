import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: period, error } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!period) {
      return Response.json({
        success: false,
        error: 'Pay period not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: period
    });

  } catch (error) {
    console.error('Pay period GET error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow status transitions
    if (!body.status) {
      return Response.json({
        success: false,
        error: 'status is required'
      }, { status: 400 });
    }

    const validTransitions: Record<string, string[]> = {
      'open': ['closed'],
      'closed': ['open', 'processed'],
      'processed': [] // terminal state
    };

    // Get current period
    const { data: current, error: fetchError } = await supabase
      .from('pay_periods')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) {
      return Response.json({ success: false, error: 'Pay period not found' }, { status: 404 });
    }

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(body.status)) {
      return Response.json({
        success: false,
        error: `Cannot transition from '${current.status}' to '${body.status}'. Allowed: ${allowed.join(', ') || 'none'}`
      }, { status: 400 });
    }

    const { data: period, error } = await supabaseAdmin
      .from('pay_periods')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: period
    });

  } catch (error) {
    console.error('Pay period PUT error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
