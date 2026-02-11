import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('client_invoices')
      .select(`
        *,
        client:clients(id, name),
        pay_period:pay_periods(id, period_start, period_end)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    return Response.json({ success: true, data: invoices ?? [] });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return Response.json({ success: true, data: [] });
  }
}

/**
 * POST /api/invoices
 * Generate an invoice for a client + pay period.
 * Aggregates hours for all of that client's employees, applies client pricing.
 *
 * Body: { client_id, pay_period_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.client_id || !body.pay_period_id) {
      return Response.json({
        success: false,
        error: 'client_id and pay_period_id are required'
      }, { status: 400 });
    }

    // Check for existing invoice
    const { data: existing, error: existErr } = await supabase
      .from('client_invoices')
      .select('id')
      .eq('client_id', body.client_id)
      .eq('pay_period_id', body.pay_period_id)
      .single();

    if (existErr && existErr.code !== 'PGRST116') throw existErr;
    if (existing) {
      return Response.json({
        success: false,
        error: 'An invoice already exists for this client and pay period'
      }, { status: 400 });
    }

    // Get pay period
    const { data: period, error: periodErr } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', body.pay_period_id)
      .single();
    if (periodErr) throw periodErr;

    // Get employees for this client
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select(`
        id, first_name, last_name,
        role:roles(id, name, hourly_rate)
      `)
      .eq('client_id', body.client_id)
      .eq('status', 'active');
    if (empErr) throw empErr;

    if (!employees || employees.length === 0) {
      return Response.json({
        success: false,
        error: 'No active employees found for this client'
      }, { status: 400 });
    }

    // Get client pricing overrides
    const { data: clientPricing, error: priceErr } = await supabase
      .from('client_pricing')
      .select('*')
      .eq('client_id', body.client_id)
      .lte('effective_from', period.period_end)
      .or(`effective_to.is.null,effective_to.gte.${period.period_start}`);
    if (priceErr) throw priceErr;

    // Get work entries for this period for these employees
    const empIds = employees.map(e => e.id);
    const { data: workEntries, error: workErr } = await supabase
      .from('work_entries')
      .select('*')
      .eq('pay_period_id', body.pay_period_id)
      .in('employee_id', empIds);
    if (workErr) throw workErr;

    // Aggregate hours by employee
    const hoursByEmployee = new Map<string, number>();
    for (const entry of workEntries ?? []) {
      const current = hoursByEmployee.get(entry.employee_id) || 0;
      hoursByEmployee.set(entry.employee_id, current + (Number(entry.hours_worked) || 0));
    }

    // Build pricing lookup: role_id -> client rate
    const pricingMap = new Map<string, number>();
    for (const p of clientPricing ?? []) {
      pricingMap.set(p.role_id, Number(p.hourly_rate));
    }

    // Generate line items
    const lineItems = [];
    let totalAmount = 0;

    for (const emp of employees) {
      const hours = hoursByEmployee.get(emp.id) || 0;
      if (hours === 0) continue;

      const role = Array.isArray(emp.role) ? emp.role[0] : emp.role;
      const roleId = role?.id;

      // Client pricing > base role rate
      const hourlyRate = (roleId && pricingMap.has(roleId))
        ? pricingMap.get(roleId)!
        : Number(role?.hourly_rate) || 0;

      const amount = Math.round(hours * hourlyRate * 100) / 100;

      lineItems.push({
        employee_id: emp.id,
        description: `${emp.first_name} ${emp.last_name} - ${role?.name ?? 'Unknown Role'}`,
        hours,
        hourly_rate: hourlyRate,
        amount
      });

      totalAmount += amount;
    }

    if (lineItems.length === 0) {
      return Response.json({
        success: false,
        error: 'No billable hours found for this client in this period'
      }, { status: 400 });
    }

    // Generate invoice number: INV-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('client_invoices')
      .select('id', { count: 'exact', head: true });
    const seq = ((count ?? 0) + 1).toString().padStart(4, '0');
    const invoiceNumber = `INV-${year}-${seq}`;

    // Create invoice
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from('client_invoices')
      .insert({
        client_id: body.client_id,
        pay_period_id: body.pay_period_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        total_amount: Math.round(totalAmount * 100) / 100,
        status: 'draft'
      })
      .select()
      .single();
    if (invErr) throw invErr;

    // Insert line items
    const itemsWithInvoice = lineItems.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));
    const { error: itemsErr } = await supabaseAdmin
      .from('invoice_line_items')
      .insert(itemsWithInvoice);
    if (itemsErr) throw itemsErr;

    return Response.json({
      success: true,
      data: { ...invoice, line_items_count: lineItems.length }
    });
  } catch (error) {
    console.error('Invoice POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
