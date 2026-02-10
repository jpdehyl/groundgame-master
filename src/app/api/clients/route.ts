import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, email, contact_person, status')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    return Response.json({
      success: true,
      data: clients || []
    });

  } catch (error) {
    console.error('Clients API error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}