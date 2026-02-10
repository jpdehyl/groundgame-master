import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, description, hourly_rate')
      .order('name');

    if (error) throw error;

    return Response.json({
      success: true,
      data: roles || []
    });

  } catch (error) {
    console.error('Roles API error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}