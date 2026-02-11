'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus, Search, FileText, AlertTriangle, CheckCircle,
  Clock, X, ExternalLink, AlertCircle
} from 'lucide-react';

interface Document {
  id: string;
  employee_id: string;
  document_type: 'contract' | 'w8ben' | 'other';
  file_name: string;
  google_drive_id: string | null;
  google_drive_url: string | null;
  upload_date: string;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'replaced';
  created_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    client?: { id: string; name: string } | { id: string; name: string }[];
  };
}

function getNestedField<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const typeLabels: Record<string, string> = { contract: 'Contract', w8ben: 'W-8BEN', other: 'Other' };
const typeColors: Record<string, string> = {
  contract: 'bg-blue-100 text-blue-800',
  w8ben: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contract' | 'w8ben' | 'other'>('all');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '', document_type: 'contract', file_name: '',
    google_drive_url: '', google_drive_id: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [docsRes, empRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/employees')
      ]);
      const docsData = await docsRes.json();
      const empData = await empRes.json();
      if (docsData.success) setDocuments(docsData.data);
      if (empData.success) setEmployees(empData.data.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
    } catch {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function addDocument() {
    if (!formData.employee_id || !formData.file_name) {
      setError('Employee and file name are required');
      return;
    }
    setFormLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowForm(false);
      setFormData({ employee_id: '', document_type: 'contract', file_name: '', google_drive_url: '', google_drive_id: '' });
      await fetchData();
    } catch {
      setError('Failed to add document');
    } finally {
      setFormLoading(false);
    }
  }

  const activeDocs = documents.filter(d => d.status === 'active');
  const w8benDocs = activeDocs.filter(d => d.document_type === 'w8ben');
  const expiringW8 = w8benDocs.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 90 && daysUntil(d.expiry_date) > 0);
  const expiredW8 = w8benDocs.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 0);

  const filtered = activeDocs
    .filter(d => filterType === 'all' || d.document_type === filterType)
    .filter(d => {
      if (!searchTerm) return true;
      const emp = d.employee;
      const name = emp ? `${emp.first_name} ${emp.last_name}` : '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage contracts, W-8BEN forms, and compliance documents</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-sm">Dismiss</button>
        </div>
      )}

      {(expiredW8.length > 0 || expiringW8.length > 0) && (
        <div className="space-y-3">
          {expiredW8.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">{expiredW8.length} W-8BEN form{expiredW8.length !== 1 ? 's' : ''} expired</p>
                <p className="text-sm text-red-700 mt-1">
                  {expiredW8.map(d => {
                    const emp = d.employee;
                    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
                  }).join(', ')}
                </p>
              </div>
            </div>
          )}
          {expiringW8.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
              <Clock className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">{expiringW8.length} W-8BEN form{expiringW8.length !== 1 ? 's' : ''} expiring within 90 days</p>
                <p className="text-sm text-amber-700 mt-1">
                  {expiringW8.map(d => {
                    const emp = d.employee;
                    const days = d.expiry_date ? daysUntil(d.expiry_date) : 0;
                    return `${emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'} (${days} days)`;
                  }).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Active Documents</div>
          <div className="text-2xl font-bold text-gray-900">{activeDocs.length}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Contracts</div>
          <div className="text-2xl font-bold text-blue-600">{activeDocs.filter(d => d.document_type === 'contract').length}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">W-8BEN Active</div>
          <div className="text-2xl font-bold text-purple-600">{w8benDocs.length}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Expiring/Expired</div>
          <div className="text-2xl font-bold text-red-600">{expiringW8.length + expiredW8.length}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by employee or file name..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            {(['all', 'contract', 'w8ben', 'other'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {t === 'all' ? 'All' : typeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents</h3>
            <p className="text-gray-600">No documents match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map(doc => {
              const emp = doc.employee;
              const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
              const client = emp ? getNestedField(emp.client) : undefined;
              const isExpiring = doc.document_type === 'w8ben' && doc.expiry_date && daysUntil(doc.expiry_date) <= 90;
              const isExpired = doc.document_type === 'w8ben' && doc.expiry_date && daysUntil(doc.expiry_date) <= 0;

              return (
                <div key={doc.id} className={`p-4 flex items-center justify-between ${isExpired ? 'bg-red-50' : isExpiring ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isExpired ? 'bg-red-100' : isExpiring ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      {isExpired ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                       isExpiring ? <Clock className="h-5 w-5 text-amber-500" /> :
                       <FileText className="h-5 w-5 text-gray-500" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{doc.file_name}</div>
                      <div className="text-sm text-gray-600">
                        {empName}{client?.name && <span> · {client.name}</span>}
                        {doc.upload_date && <span> · Uploaded {formatDate(doc.upload_date)}</span>}
                      </div>
                      {doc.expiry_date && (
                        <div className={`text-xs mt-0.5 ${isExpired ? 'text-red-600 font-medium' : isExpiring ? 'text-amber-600' : 'text-gray-500'}`}>
                          {isExpired ? `Expired ${formatDate(doc.expiry_date)}` :
                           isExpiring ? `Expires ${formatDate(doc.expiry_date)} (${daysUntil(doc.expiry_date)} days)` :
                           `Expires ${formatDate(doc.expiry_date)}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[doc.document_type]}`}>
                      {typeLabels[doc.document_type]}
                    </span>
                    {isExpired ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>
                    ) : doc.status === 'active' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 inline mr-1" />Active
                      </span>
                    ) : null}
                    {doc.google_drive_url && (
                      <a href={doc.google_drive_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Document</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-md">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={formData.employee_id}
                  onChange={e => setFormData(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={formData.document_type}
                  onChange={e => setFormData(f => ({ ...f, document_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="contract">Contract</option>
                  <option value="w8ben">W-8BEN</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name *</label>
                <input type="text" value={formData.file_name}
                  onChange={e => setFormData(f => ({ ...f, file_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contract-john-smith-2026.pdf" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive URL</label>
                <input type="url" value={formData.google_drive_url}
                  onChange={e => setFormData(f => ({ ...f, google_drive_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://drive.google.com/file/d/..." />
              </div>
              {formData.document_type === 'w8ben' && (
                <p className="text-xs text-gray-500">W-8BEN expiry auto-set to 3 years from today.</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={addDocument} disabled={formLoading}>
                {formLoading ? 'Adding...' : 'Add Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
