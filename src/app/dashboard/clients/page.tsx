'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus, Search, Download, Building2, Users, Calendar,
  Edit, Trash2, X, Save, DollarSign, AlertCircle
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string | null;
  contact_person: string | null;
  billing_address: string | null;
  status: string;
  created_at: string;
  employee_count: number;
}

interface Role {
  id: string;
  name: string;
  hourly_rate: number;
}

interface PricingEntry {
  id: string;
  client_id: string;
  role_id: string;
  hourly_rate: number;
  effective_from: string;
  effective_to: string | null;
  role?: { id: string; name: string; hourly_rate: number } | { id: string; name: string; hourly_rate: number }[];
}

function getNestedField<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Client form
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', contact_person: '', billing_address: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Pricing
  const [pricingClient, setPricingClient] = useState<Client | null>(null);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [newPricing, setNewPricing] = useState({ role_id: '', hourly_rate: '', effective_from: '' });

  const fetchClients = useCallback(async () => {
    try {
      const [clientsRes, rolesRes] = await Promise.all([
        fetch('/api/clients?include_inactive=true'),
        fetch('/api/roles')
      ]);
      const clientsData = await clientsRes.json();
      const rolesData = await rolesRes.json();
      if (clientsData.success) setClients(clientsData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch {
      console.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // --- Client CRUD ---

  function openAddForm() {
    setEditingClient(null);
    setFormData({ name: '', email: '', contact_person: '', billing_address: '' });
    setShowForm(true);
  }

  function openEditForm(client: Client) {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      contact_person: client.contact_person || '',
      billing_address: client.billing_address || ''
    });
    setShowForm(true);
  }

  async function saveClient() {
    if (!formData.name.trim()) { setError('Client name is required'); return; }
    setFormLoading(true);
    setError(null);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowForm(false);
      await fetchClients();
    } catch {
      setError('Failed to save client');
    } finally {
      setFormLoading(false);
    }
  }

  async function deactivateClient(client: Client) {
    if (!confirm(`Deactivate ${client.name}?`)) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      await fetchClients();
    } catch {
      setError('Failed to deactivate client');
    }
  }

  // --- Pricing ---

  async function openPricing(client: Client) {
    setPricingClient(client);
    setPricingLoading(true);
    try {
      const res = await fetch(`/api/client-pricing?client_id=${client.id}`);
      const data = await res.json();
      if (data.success) setPricing(data.data);
    } catch {
      console.error('Failed to fetch pricing');
    } finally {
      setPricingLoading(false);
    }
  }

  async function addPricing() {
    if (!pricingClient || !newPricing.role_id || !newPricing.hourly_rate || !newPricing.effective_from) {
      setError('Role, rate, and effective date are required');
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/client-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: pricingClient.id,
          role_id: newPricing.role_id,
          hourly_rate: parseFloat(newPricing.hourly_rate),
          effective_from: newPricing.effective_from
        })
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setNewPricing({ role_id: '', hourly_rate: '', effective_from: '' });
      await openPricing(pricingClient);
    } catch {
      setError('Failed to add pricing');
    }
  }

  async function deletePricing(id: string) {
    if (!pricingClient) return;
    try {
      await fetch(`/api/client-pricing/${id}`, { method: 'DELETE' });
      await openPricing(pricingClient);
    } catch {
      console.error('Failed to delete pricing');
    }
  }

  // --- CSV Export ---

  function exportCsv() {
    const headers = ['Name', 'Email', 'Contact Person', 'Status', 'Employees', 'Created'];
    const rows = filteredClients.map(c => [
      c.name, c.email || '', c.contact_person || '', c.status,
      c.employee_count.toString(),
      new Date(c.created_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const totalEmployees = clients.reduce((sum, c) => sum + c.employee_count, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-muted-foreground">Manage client relationships and pricing</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-sm">Dismiss</button>
        </div>
      )}

      {/* Search + Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50 placeholder:text-muted-foreground"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-accent-blue/15 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                  {client.billing_address && (
                    <p className="text-sm text-muted-foreground">{client.billing_address}</p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {client.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Employees</span>
                </div>
                <div className="text-lg font-semibold text-white">{client.employee_count}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Since</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {client.contact_person && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Contact:</span>
                  <span className="text-sm text-gray-600">{client.contact_person}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <span className="text-sm text-blue-600">{client.email}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-4 border-t border-gray-200">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditForm(client)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openPricing(client)}>
                <DollarSign className="h-4 w-4 mr-1" />
                Pricing
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => deactivateClient(client)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search.' : 'Get started by adding your first client.'}
          </p>
          {!searchTerm && (
            <Button onClick={openAddForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Client
            </Button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{clients.length}</div>
            <div className="text-sm text-muted-foreground">Total Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-green">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-blue">{totalEmployees}</div>
            <div className="text-sm text-muted-foreground">Assigned Employees</div>
          </div>
        </div>
      </div>

      {/* Client Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingClient ? 'Edit Client' : 'Add Client'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-md">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="billing@acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(f => ({ ...f, contact_person: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                <textarea
                  value={formData.billing_address}
                  onChange={(e) => setFormData(f => ({ ...f, billing_address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St, Suite 100"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveClient} disabled={formLoading}>
                <Save className="h-4 w-4 mr-2" />
                {formLoading ? 'Saving...' : editingClient ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {pricingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pricing — {pricingClient.name}
              </h2>
              <button onClick={() => setPricingClient(null)} className="p-2 hover:bg-gray-100 rounded-md">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {pricingLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : pricing.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">No pricing set. Add a rate below.</p>
            ) : (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2 pr-3">Role</th>
                    <th className="pb-2 pr-3 text-right">Hourly Rate</th>
                    <th className="pb-2 pr-3">From</th>
                    <th className="pb-2 pr-3">To</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((p) => {
                    const role = getNestedField(p.role);
                    return (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="py-2 pr-3 font-medium">{role?.name ?? '—'}</td>
                        <td className="py-2 pr-3 text-right">${Number(p.hourly_rate).toFixed(2)}</td>
                        <td className="py-2 pr-3">{p.effective_from}</td>
                        <td className="py-2 pr-3">{p.effective_to || '—'}</td>
                        <td className="py-2">
                          <button onClick={() => deletePricing(p.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add Rate</h4>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={newPricing.role_id}
                  onChange={(e) => setNewPricing(p => ({ ...p, role_id: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (base: ${r.hourly_rate})</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Rate ($/hr)"
                  value={newPricing.hourly_rate}
                  onChange={(e) => setNewPricing(p => ({ ...p, hourly_rate: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={newPricing.effective_from}
                  onChange={(e) => setNewPricing(p => ({ ...p, effective_from: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button className="mt-3 bg-blue-600 hover:bg-blue-700" size="sm" onClick={addPricing}>
                <Plus className="h-4 w-4 mr-1" />
                Add Rate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
