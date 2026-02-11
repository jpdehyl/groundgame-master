import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

interface ImportRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  client_name?: string;
  role_name?: string;
  employment_type?: string;
  start_date?: string;
  salary_compensation?: string | number;
  pay_frequency?: string;
  hourly_rate?: string | number;
  status?: string;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { rows, type } = body as { rows: ImportRow[]; type: 'employees' | 'clients' | 'roles' };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return Response.json({ success: false, error: 'No data rows provided' }, { status: 400 });
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    if (type === 'clients') {
      for (const row of rows) {
        const name = row.client_name || (row as Record<string, string>).name;
        if (!name) {
          results.skipped++;
          results.errors.push('Row missing client name');
          continue;
        }

        const { error } = await supabaseAdmin
          .from('clients')
          .upsert({
            name,
            email: (row as Record<string, string>).email || null,
            contact_person: (row as Record<string, string>).contact_person || null,
            billing_address: (row as Record<string, string>).billing_address || null,
            status: 'active'
          }, { onConflict: 'name', ignoreDuplicates: true });

        if (error) {
          // Try insert without upsert
          const { error: insertError } = await supabaseAdmin
            .from('clients')
            .insert({
              name,
              email: (row as Record<string, string>).email || null,
              contact_person: (row as Record<string, string>).contact_person || null,
              billing_address: (row as Record<string, string>).billing_address || null,
              status: 'active'
            });
          if (insertError) {
            results.skipped++;
            results.errors.push(`Client "${name}": ${insertError.message}`);
          } else {
            results.imported++;
          }
        } else {
          results.imported++;
        }
      }
    } else if (type === 'roles') {
      for (const row of rows) {
        const name = row.role_name || (row as Record<string, string>).name;
        if (!name) {
          results.skipped++;
          continue;
        }

        const { error } = await supabaseAdmin
          .from('roles')
          .insert({
            name,
            description: (row as Record<string, string>).description || null,
            hourly_rate: row.hourly_rate ? Number(row.hourly_rate) : null
          });

        if (error) {
          if (error.message.includes('duplicate')) {
            results.skipped++;
          } else {
            results.skipped++;
            results.errors.push(`Role "${name}": ${error.message}`);
          }
        } else {
          results.imported++;
        }
      }
    } else {
      // Import employees
      // First, get existing clients and roles for name-to-ID resolution
      const { data: clients } = await supabaseAdmin.from('clients').select('id, name');
      const { data: roles } = await supabaseAdmin.from('roles').select('id, name');

      const clientMap = new Map((clients ?? []).map(c => [c.name.toLowerCase(), c.id]));
      const roleMap = new Map((roles ?? []).map(r => [r.name.toLowerCase(), r.id]));

      for (const row of rows) {
        if (!row.first_name || !row.last_name || !row.email) {
          results.skipped++;
          results.errors.push(`Row missing required fields (first_name, last_name, email)`);
          continue;
        }

        // Resolve client and role by name
        let clientId = null;
        if (row.client_name) {
          clientId = clientMap.get(row.client_name.toLowerCase());
          if (!clientId) {
            // Auto-create client
            const { data: newClient } = await supabaseAdmin
              .from('clients')
              .insert({ name: row.client_name, status: 'active' })
              .select('id')
              .single();
            if (newClient) {
              clientId = newClient.id;
              clientMap.set(row.client_name.toLowerCase(), clientId);
            }
          }
        }

        let roleId = null;
        if (row.role_name) {
          roleId = roleMap.get(row.role_name.toLowerCase());
          if (!roleId) {
            // Auto-create role
            const { data: newRole } = await supabaseAdmin
              .from('roles')
              .insert({
                name: row.role_name,
                hourly_rate: row.hourly_rate ? Number(row.hourly_rate) : null
              })
              .select('id')
              .single();
            if (newRole) {
              roleId = newRole.id;
              roleMap.set(row.role_name.toLowerCase(), roleId);
            }
          }
        }

        const employeeData: Record<string, unknown> = {
          first_name: row.first_name.trim(),
          last_name: row.last_name.trim(),
          email: row.email.trim().toLowerCase(),
          phone: row.phone || null,
          client_id: clientId,
          role_id: roleId,
          employment_type: row.employment_type || 'contractor',
          start_date: row.start_date || new Date().toISOString().split('T')[0],
          salary_compensation: row.salary_compensation ? Number(row.salary_compensation) : (row.hourly_rate ? Number(row.hourly_rate) : null),
          pay_frequency: row.pay_frequency || 'biweekly',
          status: row.status || 'active'
        };

        const { error } = await supabaseAdmin
          .from('employees')
          .insert(employeeData);

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            results.skipped++;
            results.errors.push(`"${row.first_name} ${row.last_name}" (${row.email}): already exists`);
          } else {
            results.skipped++;
            results.errors.push(`"${row.first_name} ${row.last_name}": ${error.message}`);
          }
        } else {
          results.imported++;
        }
      }
    }

    return Response.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
