import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Database connection successful',
      clientCount: clients?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}