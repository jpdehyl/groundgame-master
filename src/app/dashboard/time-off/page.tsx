'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, X
} from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  client?: { id: string; name: string } | { id: string; name: string }[];
}

interface TimeOffRequest {
  id: string;
  employee_id: string;
  leave_type: 'pto' | 'sick' | 'unpaid';
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'pending' | 'approved' | 'denied';
  reason: string | null;
  approved_at: string | null;
  created_at: string;
  employee?: Employee;
}

function getNestedField<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const leaveColors: Record<string, string> = {
  pto: 'bg-accent-blue/10 text-primary',
  sick: 'bg-accent-yellow/10 text-accent-yellow',
  unpaid: 'bg-muted text-muted-foreground'
};

const statusColors: Record<string, string> = {
  pending: 'bg-accent-yellow/10 text-accent-yellow',
  approved: 'bg-accent-green/10 text-accent-green',
  denied: 'bg-accent-red/10 text-accent-red'
};

export default function TimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [formData, setFormData] = useState({
    employee_id: '', leave_type: 'pto', start_date: '', end_date: '', reason: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, empRes] = await Promise.all([
        fetch('/api/time-off'),
        fetch('/api/employees')
      ]);
      const reqData = await reqRes.json();
      const empData = await empRes.json();
      if (reqData.success) setRequests(reqData.data);
      if (empData.success) setEmployees(empData.data.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
    } catch {
      console.error('Failed to fetch time-off data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function submitRequest() {
    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      setError('Employee, start date, and end date are required');
      return;
    }
    setError(null);
    setActionLoading('submit');
    try {
      const res = await fetch('/api/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowForm(false);
      setFormData({ employee_id: '', leave_type: 'pto', start_date: '', end_date: '', reason: '' });
      await fetchData();
    } catch {
      setError('Failed to submit request');
    } finally {
      setActionLoading(null);
    }
  }

  async function updateStatus(id: string, status: 'approved' | 'denied') {
    setActionLoading(`${status}-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/time-off/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      await fetchData();
    } catch {
      setError('Failed to update request');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Time Off</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Off</h1>
          <p className="text-muted-foreground">Manage PTO, sick leave, and unpaid time off requests</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-accent-red mr-2 mt-0.5" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-accent-red hover:text-accent-red text-sm">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="text-sm text-muted-foreground">Total Requests</div>
          <div className="text-2xl font-bold text-white">{requests.length}</div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-accent-yellow">{pendingCount}</div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold text-accent-green">{requests.filter(r => r.status === 'approved').length}</div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <div className="text-sm text-muted-foreground">Total Days Off</div>
          <div className="text-2xl font-bold text-primary">
            {requests.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.days_count), 0)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'denied'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-accent-blue text-white' : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-accent-yellow text-accent-yellow rounded-full px-1.5 text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-card rounded-xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No requests</h3>
            <p className="text-muted-foreground">No time-off requests to show.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(req => {
              const emp = req.employee;
              const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
              const client = emp ? getNestedField(emp.client) : undefined;
              return (
                <div key={req.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{empName}</div>
                      <div className="text-sm text-muted-foreground">
                        {client?.name && <span>{client.name} · </span>}
                        {formatDate(req.start_date)} – {formatDate(req.end_date)} · {req.days_count} day{Number(req.days_count) !== 1 ? 's' : ''}
                      </div>
                      {req.reason && <div className="text-sm text-muted-foreground mt-0.5">{req.reason}</div>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${leaveColors[req.leave_type]}`}>
                      {req.leave_type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="bg-accent-green hover:bg-green-600 h-8"
                          onClick={() => updateStatus(req.id, 'approved')}
                          disabled={actionLoading === `approved-${req.id}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-accent-red border-accent-red/20 hover:bg-accent-red/20 h-8"
                          onClick={() => updateStatus(req.id, 'denied')}
                          disabled={actionLoading === `denied-${req.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-lg shadow-black/40 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Time-Off Request</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-md">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Employee *</label>
                <select
                  value={formData.employee_id}
                  onChange={e => setFormData(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={e => setFormData(f => ({ ...f, leave_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="pto">PTO</option>
                  <option value="sick">Sick</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Start Date *</label>
                  <input type="date" value={formData.start_date}
                    onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">End Date *</label>
                  <input type="date" value={formData.end_date}
                    onChange={e => setFormData(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Reason</label>
                <textarea value={formData.reason} rows={2}
                  onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Optional reason..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary-hover" onClick={submitRequest}
                disabled={actionLoading === 'submit'}>
                {actionLoading === 'submit' ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
