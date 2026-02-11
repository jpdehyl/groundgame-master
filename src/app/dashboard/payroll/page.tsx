'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Download,
  Calculator,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

// --- Types ---

interface PayPeriod {
  id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  status: 'open' | 'closed' | 'processed';
  created_at: string;
}

interface PayrollEntry {
  id: string;
  employee_id: string;
  base_hours: number;
  hourly_rate: number;
  base_pay: number;
  leads_bonus: number;
  spifs_bonus: number;
  total_gross: number;
  deductions: number;
  net_pay: number;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    client?: { id: string; name: string } | { id: string; name: string }[];
    role?: { id: string; name: string } | { id: string; name: string }[];
  };
}

interface PayrollRun {
  id: string;
  pay_period_id: string;
  run_date: string;
  total_amount: number;
  employee_count: number;
  status: 'draft' | 'processed' | 'sent';
  created_at: string;
  pay_period?: PayPeriod;
  entries?: PayrollEntry[];
}

// --- Helpers ---

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getNestedField<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

function statusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-accent-blue/15 text-accent-blue';
    case 'closed': return 'bg-accent-yellow/15 text-accent-yellow';
    case 'processed': return 'bg-accent-green/15 text-accent-green';
    case 'draft': return 'bg-white/10 text-gray-300';
    case 'sent': return 'bg-accent-green/15 text-accent-green';
    default: return 'bg-white/10 text-gray-300';
  }
}

// --- Component ---

export default function PayrollPage() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<Record<string, PayrollRun>>({});
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ period_start: '', period_end: '', period_type: 'biweekly' });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [periodsRes, runsRes] = await Promise.all([
        fetch('/api/pay-periods?limit=50'),
        fetch('/api/payroll?limit=50')
      ]);
      const periodsData = await periodsRes.json();
      const runsData = await runsRes.json();

      if (periodsData.success) setPeriods(periodsData.data);
      if (runsData.success) setRuns(runsData.data);
    } catch (err) {
      console.error('Failed to fetch payroll data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Actions ---

  async function createPayPeriod() {
    if (!newPeriod.period_start || !newPeriod.period_end) {
      setError('Start and end dates are required');
      return;
    }
    setActionLoading('create-period');
    setError(null);
    try {
      const res = await fetch('/api/pay-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod)
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      setShowCreatePeriod(false);
      setNewPeriod({ period_start: '', period_end: '', period_type: 'biweekly' });
      await fetchData();
    } catch {
      setError('Failed to create pay period');
    } finally {
      setActionLoading(null);
    }
  }

  async function updatePeriodStatus(periodId: string, status: string) {
    setActionLoading(`period-${periodId}`);
    setError(null);
    try {
      const res = await fetch(`/api/pay-periods/${periodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      await fetchData();
    } catch {
      setError('Failed to update pay period');
    } finally {
      setActionLoading(null);
    }
  }

  async function createPayrollRun(payPeriodId: string) {
    setActionLoading(`run-${payPeriodId}`);
    setError(null);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_period_id: payPeriodId })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      await fetchData();
    } catch {
      setError('Failed to create payroll run');
    } finally {
      setActionLoading(null);
    }
  }

  async function updateRunStatus(runId: string, status: string) {
    const confirmMsg = status === 'processed'
      ? 'Confirm this payroll run? This locks the calculations.'
      : status === 'sent'
        ? 'Mark as sent? This will also mark the pay period as processed.'
        : '';

    if (confirmMsg && !confirm(confirmMsg)) return;

    setActionLoading(`run-status-${runId}`);
    setError(null);
    try {
      const res = await fetch(`/api/payroll/${runId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      await fetchData();
    } catch {
      setError('Failed to update payroll run');
    } finally {
      setActionLoading(null);
    }
  }

  async function exportCsv(runId: string) {
    setActionLoading(`export-${runId}`);
    setError(null);
    try {
      const res = await fetch(`/api/payroll/${runId}/export`);
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') || 'payroll.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      await fetchData();
    } catch {
      setError('Failed to export CSV');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleRunDetails(runId: string) {
    if (expandedRun === runId) {
      setExpandedRun(null);
      return;
    }
    setExpandedRun(runId);
    if (!runDetails[runId]) {
      try {
        const res = await fetch(`/api/payroll/${runId}`);
        const data = await res.json();
        if (data.success) {
          setRunDetails(prev => ({ ...prev, [runId]: data.data }));
        }
      } catch {
        console.error('Failed to fetch run details');
      }
    }
  }

  // --- Derived state ---

  const openPeriods = periods.filter(p => p.status === 'open');
  const closedPeriods = periods.filter(p => p.status === 'closed');
  const runsByPeriod = new Map<string, PayrollRun>();
  for (const run of runs) {
    runsByPeriod.set(run.pay_period_id, run);
  }

  // Stats from latest runs
  const totalPayrollYtd = runs
    .filter(r => r.status === 'sent')
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const latestRun = runs[0];
  const totalEmployeesInLatest = latestRun?.employee_count ?? 0;

  // --- Render ---

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-muted-foreground">Manage pay periods, process payroll, and export to Veem</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-accent-blue hover:bg-accent-blue/90"
            onClick={() => setShowCreatePeriod(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Pay Period
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-accent-red mr-2 mt-0.5" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-accent-red hover:text-accent-red text-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* Create Pay Period Modal */}
      {showCreatePeriod && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-lg shadow-black/50 max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create Pay Period</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Period Start</label>
                <input
                  type="date"
                  value={newPeriod.period_start}
                  onChange={(e) => setNewPeriod(p => ({ ...p, period_start: e.target.value }))}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Period End</label>
                <input
                  type="date"
                  value={newPeriod.period_end}
                  onChange={(e) => setNewPeriod(p => ({ ...p, period_end: e.target.value }))}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={newPeriod.period_type}
                  onChange={(e) => setNewPeriod(p => ({ ...p, period_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => { setShowCreatePeriod(false); setError(null); }}>
                Cancel
              </Button>
              <Button
                className="bg-accent-blue hover:bg-accent-blue/90"
                onClick={createPayPeriod}
                disabled={actionLoading === 'create-period'}
              >
                {actionLoading === 'create-period' ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Open Periods</div>
              <div className="text-2xl font-bold text-white">{openPeriods.length}</div>
            </div>
            <Calendar className="h-8 w-8 text-accent-blue" />
          </div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Ready to Process</div>
              <div className="text-2xl font-bold text-accent-yellow">{closedPeriods.filter(p => !runsByPeriod.has(p.id)).length}</div>
            </div>
            <Calculator className="h-8 w-8 text-accent-yellow" />
          </div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Latest Run</div>
              <div className="text-2xl font-bold text-white">{totalEmployeesInLatest} employees</div>
            </div>
            <Users className="h-8 w-8 text-accent-green" />
          </div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Paid (All Runs)</div>
              <div className="text-2xl font-bold text-accent-green">{formatCurrency(totalPayrollYtd)}</div>
            </div>
            <DollarSign className="h-8 w-8 text-accent-green" />
          </div>
        </div>
      </div>

      {/* Active Pay Periods */}
      {(openPeriods.length > 0 || closedPeriods.length > 0) && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Active Pay Periods</h3>
          <div className="space-y-3">
            {[...openPeriods, ...closedPeriods].map((period) => {
              const existingRun = runsByPeriod.get(period.id);
              return (
                <div key={period.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      period.status === 'open' ? 'bg-accent-blue/10' : 'bg-accent-yellow/10'
                    }`}>
                      {period.status === 'open' ? (
                        <Clock className="h-5 w-5 text-accent-blue" />
                      ) : (
                        <Lock className="h-5 w-5 text-accent-yellow" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {formatDate(period.period_start)} – {formatDate(period.period_end)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {period.period_type} period
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(period.status)}`}>
                      {period.status}
                    </span>

                    {period.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePeriodStatus(period.id, 'closed')}
                        disabled={actionLoading === `period-${period.id}`}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        {actionLoading === `period-${period.id}` ? 'Closing...' : 'Close Period'}
                      </Button>
                    )}

                    {period.status === 'closed' && !existingRun && (
                      <Button
                        size="sm"
                        className="bg-accent-blue hover:bg-accent-blue/90"
                        onClick={() => createPayrollRun(period.id)}
                        disabled={actionLoading === `run-${period.id}`}
                      >
                        <Calculator className="h-4 w-4 mr-1" />
                        {actionLoading === `run-${period.id}` ? 'Calculating...' : 'Process Payroll'}
                      </Button>
                    )}

                    {period.status === 'closed' && existingRun && (
                      <span className="text-sm text-muted-foreground">
                        Run: {existingRun.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for periods */}
      {periods.length === 0 && (
        <div className="bg-card p-12 rounded-xl border border-border text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No pay periods yet</h3>
          <p className="text-muted-foreground mb-4">Create your first pay period to start processing payroll.</p>
          <Button className="bg-accent-blue hover:bg-accent-blue/90" onClick={() => setShowCreatePeriod(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Pay Period
          </Button>
        </div>
      )}

      {/* Payroll Runs */}
      {runs.length > 0 && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Payroll Runs</h3>
          <div className="space-y-3">
            {runs.map((run) => {
              const payPeriod = getNestedField(run.pay_period);
              const isExpanded = expandedRun === run.id;
              const details = runDetails[run.id];

              return (
                <div key={run.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Run Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-muted cursor-pointer hover:bg-white/5"
                    onClick={() => toggleRunDetails(run.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        run.status === 'sent' ? 'bg-accent-green/10' :
                        run.status === 'processed' ? 'bg-accent-blue/10' : 'bg-white/10'
                      }`}>
                        {run.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-accent-green" />
                        ) : run.status === 'processed' ? (
                          <FileText className="h-5 w-5 text-accent-blue" />
                        ) : (
                          <Calculator className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {payPeriod
                            ? `${formatDate(payPeriod.period_start)} – ${formatDate(payPeriod.period_end)}`
                            : `Run ${run.id.slice(0, 8)}`
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {run.employee_count} employees · Run date: {formatDate(run.run_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right mr-2">
                        <div className="font-semibold text-white">{formatCurrency(run.total_amount || 0)}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        {run.status === 'draft' && (
                          <Button
                            size="sm"
                            className="bg-accent-blue hover:bg-accent-blue/90"
                            onClick={() => updateRunStatus(run.id, 'processed')}
                            disabled={actionLoading === `run-status-${run.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {actionLoading === `run-status-${run.id}` ? 'Confirming...' : 'Confirm'}
                          </Button>
                        )}

                        {run.status === 'processed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportCsv(run.id)}
                            disabled={actionLoading === `export-${run.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {actionLoading === `export-${run.id}` ? 'Exporting...' : 'Export Veem CSV'}
                          </Button>
                        )}

                        {run.status === 'sent' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportCsv(run.id)}
                            disabled={actionLoading === `export-${run.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Re-download
                          </Button>
                        )}
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-border">
                      {!details ? (
                        <p className="text-sm text-muted-foreground">Loading details...</p>
                      ) : (details.entries?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">No entries in this payroll run.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b border-border">
                                <th className="pb-2 pr-4">Employee</th>
                                <th className="pb-2 pr-4">Client</th>
                                <th className="pb-2 pr-4">Role</th>
                                <th className="pb-2 pr-4 text-right">Hours</th>
                                <th className="pb-2 pr-4 text-right">Rate</th>
                                <th className="pb-2 pr-4 text-right">Base Pay</th>
                                <th className="pb-2 pr-4 text-right">SPIFs</th>
                                <th className="pb-2 text-right">Net Pay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {details.entries!.map((entry) => {
                                const emp = entry.employee;
                                const client = emp ? getNestedField(emp.client) : undefined;
                                const role = emp ? getNestedField(emp.role) : undefined;
                                return (
                                  <tr key={entry.id} className="border-b border-border hover:bg-white/5">
                                    <td className="py-2 pr-4">
                                      <div className="font-medium text-white">
                                        {emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{emp?.email}</div>
                                    </td>
                                    <td className="py-2 pr-4 text-muted-foreground">{client?.name ?? '—'}</td>
                                    <td className="py-2 pr-4 text-muted-foreground">{role?.name ?? '—'}</td>
                                    <td className="py-2 pr-4 text-right">{Number(entry.base_hours).toFixed(1)}</td>
                                    <td className="py-2 pr-4 text-right">{formatCurrency(entry.hourly_rate)}</td>
                                    <td className="py-2 pr-4 text-right">{formatCurrency(entry.base_pay)}</td>
                                    <td className="py-2 pr-4 text-right">{formatCurrency(entry.spifs_bonus)}</td>
                                    <td className="py-2 text-right font-semibold">{formatCurrency(entry.net_pay)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-300">
                                <td colSpan={5} className="py-2 pr-4 font-semibold text-white">Total</td>
                                <td className="py-2 pr-4 text-right font-semibold">
                                  {formatCurrency(details.entries!.reduce((s, e) => s + Number(e.base_pay), 0))}
                                </td>
                                <td className="py-2 pr-4 text-right font-semibold">
                                  {formatCurrency(details.entries!.reduce((s, e) => s + Number(e.spifs_bonus), 0))}
                                </td>
                                <td className="py-2 text-right font-bold text-white">
                                  {formatCurrency(details.entries!.reduce((s, e) => s + Number(e.net_pay), 0))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Payroll Runs</div>
              <div className="text-2xl font-bold text-white">{runs.length}</div>
            </div>
            <FileText className="h-8 w-8 text-accent-blue" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Completed & Sent</div>
              <div className="text-2xl font-bold text-accent-green">
                {runs.filter(r => r.status === 'sent').length}
              </div>
            </div>
            <Send className="h-8 w-8 text-accent-green" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Pending Action</div>
              <div className="text-2xl font-bold text-accent-yellow">
                {runs.filter(r => r.status === 'draft' || r.status === 'processed').length}
              </div>
            </div>
            <AlertCircle className="h-8 w-8 text-accent-yellow" />
          </div>
        </div>
      </div>
    </div>
  );
}
