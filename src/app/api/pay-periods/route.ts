import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('pay_periods')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: periods, error } = await query;

    if (error) throw error;

    return Response.json({
      success: true,
      data: periods ?? []
    });

  } catch (error) {
    console.error('Pay periods GET error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.period_start || !body.period_end) {
      return Response.json({
        success: false,
        error: 'period_start and period_end are required'
      }, { status: 400 });
    }

    const start = new Date(body.period_start);
    const end = new Date(body.period_end);

    if (end <= start) {
      return Response.json({
        success: false,
        error: 'period_end must be after period_start'
      }, { status: 400 });
    }

    // Check for overlapping open/closed periods of the same type
    const periodType = body.period_type || 'biweekly';
    const { data: overlapping, error: overlapError } = await supabase
      .from('pay_periods')
      .select('id, period_start, period_end')
      .eq('period_type', periodType)
      .in('status', ['open', 'closed'])
      .lte('period_start', body.period_end)
      .gte('period_end', body.period_start);

    if (overlapError) throw overlapError;

    if (overlapping && overlapping.length > 0) {
      return Response.json({
        success: false,
        error: 'This period overlaps with an existing open or closed pay period'
      }, { status: 400 });
    }

    const { data: period, error } = await supabaseAdmin
      .from('pay_periods')
      .insert({
        period_start: body.period_start,
        period_end: body.period_end,
        period_type: periodType,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: period
    });

  } catch (error) {
    console.error('Pay periods POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
