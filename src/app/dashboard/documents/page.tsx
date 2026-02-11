'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Search,
  FileText,
  AlertTriangle,
  Calendar,
  Download,
  Eye
} from 'lucide-react';

interface Document {
  id: string;
  employee: string;
  type: string;
  status: string;
  uploadDate: string;
  expiryDate: string | null;
  isExpiring: boolean;
  google_drive_url?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch('/api/documents');
        const result = await response.json();
        if (result.success) {
          setDocuments(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const filtered = documents.filter(doc => {
    const matchesSearch = !searchTerm ||
      doc.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || doc.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesSearch && matchesType;
  });

  const expiringCount = documents.filter(d => d.isExpiring).length;
  const activeCount = documents.filter(d => d.status === 'Active').length;
  const expiredCount = documents.filter(d => d.status === 'Expired').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-muted-foreground">Manage employee documents and compliance</p>
        </div>
        <Button className="bg-accent-blue hover:bg-accent-blue/90">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents or employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
          >
            <option value="">All Types</option>
            <option value="w-8ben">W-8BEN</option>
            <option value="contract">Contract</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {expiringCount > 0 && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-accent-yellow mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-accent-yellow">
                {expiringCount} document{expiringCount !== 1 ? 's' : ''} expiring within 30 days
              </h3>
              <p className="text-sm text-accent-yellow/80">
                Review and renew expiring W-8BEN documents to ensure compliance
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">All Documents</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No documents yet</h3>
            <p className="text-muted-foreground">Upload employee documents to track compliance and expirations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{doc.employee}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                        {doc.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.status === 'Active' ? 'bg-accent-green/15 text-accent-green'
                          : doc.status === 'Expiring' ? 'bg-accent-yellow/15 text-accent-yellow'
                          : 'bg-accent-red/15 text-accent-red'
                      }`}>{doc.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {doc.expiryDate ? (
                        <div className={`flex items-center ${doc.isExpiring ? 'text-accent-yellow' : ''}`}>
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          {new Date(doc.expiryDate).toLocaleDateString()}
                          {doc.isExpiring && <AlertTriangle className="h-4 w-4 text-accent-yellow ml-2" />}
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{documents.length}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-green">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-yellow">{expiringCount}</div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-red">{expiredCount}</div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </div>
        </div>
      </div>
    </div>
  );
}
