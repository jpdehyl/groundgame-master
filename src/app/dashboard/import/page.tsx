'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Trash2,
  Users,
  Building2,
  Briefcase
} from 'lucide-react';

type ImportType = 'employees' | 'clients' | 'roles';
type Step = 'select' | 'paste' | 'preview' | 'importing' | 'done';

interface ParsedRow {
  [key: string]: string;
}

interface ImportResults {
  imported: number;
  skipped: number;
  errors: string[];
}

const EMPLOYEE_TEMPLATE = `first_name,last_name,email,phone,client_name,role_name,hourly_rate,employment_type,start_date,pay_frequency,status
Maria,Rodriguez,maria@example.com,+1-555-1234,AppFolio,SDR,25,contractor,2024-01-15,biweekly,active
John,Smith,john@example.com,+1-555-5678,RentSpree,Lead Generation,20,contractor,2024-02-01,biweekly,active`;

const CLIENT_TEMPLATE = `name,email,contact_person,billing_address
AppFolio,contact@appfolio.com,Sarah Johnson,"50 Castilian Dr, Santa Barbara, CA"
RentSpree,partnerships@rentspree.com,Mike Chen,"1875 Century Park E, Los Angeles, CA"`;

const ROLE_TEMPLATE = `name,description,hourly_rate
SDR,Sales Development Representative,25
Lead Generation,Generates leads for clients,20
Account Manager,Manages client relationships,35`;

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse headers
  const headers = parseCsvLine(lines[0]);

  // Parse rows
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.some(v => v.trim())) {
      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = (values[idx] || '').trim();
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('select');
  const [importType, setImportType] = useState<ImportType>('employees');
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] }>({ headers: [], rows: [] });
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handlePaste = () => {
    if (!csvText.trim()) {
      setError('Please paste your CSV data');
      return;
    }
    setError(null);
    const parsed = parseCsv(csvText);
    if (parsed.rows.length === 0) {
      setError('No data rows found. Make sure the first row contains column headers.');
      return;
    }
    setParsedData(parsed);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          rows: parsedData.rows
        })
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.data);
        setStep('done');
      } else {
        setError(result.error || 'Import failed');
        setStep('preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep('select');
    setCsvText('');
    setParsedData({ headers: [], rows: [] });
    setResults(null);
    setError(null);
  };

  const loadTemplate = () => {
    const templates = { employees: EMPLOYEE_TEMPLATE, clients: CLIENT_TEMPLATE, roles: ROLE_TEMPLATE };
    setCsvText(templates[importType]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Import Data</h1>
        <p className="text-muted-foreground">
          Import your existing data from Google Sheets or CSV files
        </p>
      </div>

      {/* How it works */}
      <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-accent-blue mb-3">How to import from Google Sheets</h3>
        <ol className="text-sm text-accent-blue space-y-2">
          <li><strong>1.</strong> Open your Google Sheet</li>
          <li><strong>2.</strong> Select all data (Ctrl+A / Cmd+A)</li>
          <li><strong>3.</strong> Copy it (Ctrl+C / Cmd+C)</li>
          <li><strong>4.</strong> Choose what to import below, then paste into the text area</li>
        </ol>
        <p className="text-xs text-accent-blue/70 mt-3">
          Tip: You can also use File → Download → CSV in Google Sheets, then paste the CSV content here.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center space-x-2 text-sm">
        {['Select Type', 'Paste Data', 'Preview', 'Import'].map((label, idx) => {
          const stepMap: Step[] = ['select', 'paste', 'preview', 'done'];
          const current = stepMap.indexOf(step);
          const isActive = idx <= current || (step === 'importing' && idx <= 3);
          return (
            <div key={label} className="flex items-center">
              {idx > 0 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-accent-blue/15 text-accent-blue' : 'bg-white/10 text-muted-foreground'
              }`}>{label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-accent-red mt-0.5" />
          <div className="text-sm text-accent-red">{error}</div>
        </div>
      )}

      {/* Step 1: Select import type */}
      {step === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { type: 'employees' as ImportType, icon: Users, title: 'Employees', desc: 'Import contractors and employees with their details, client assignments, and roles' },
            { type: 'clients' as ImportType, icon: Building2, title: 'Clients', desc: 'Import client companies with contact info and billing addresses' },
            { type: 'roles' as ImportType, icon: Briefcase, title: 'Roles', desc: 'Import job roles with descriptions and hourly rates' },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => { setImportType(item.type); setStep('paste'); }}
              className={`bg-card p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:shadow-black/20 ${
                importType === item.type ? 'border-accent-blue ring-2 ring-accent-blue/30' : 'border-border hover:border-accent-blue/50'
              }`}
            >
              <div className="h-12 w-12 bg-accent-blue/15 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-accent-blue" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Paste data */}
      {step === 'paste' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Paste your {importType} data (CSV format)
            </h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={loadTemplate}>
                <Download className="h-4 w-4 mr-1" />
                Load Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCsvText('')}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {importType === 'employees' && 'Required columns: first_name, last_name, email. Optional: phone, client_name, role_name, hourly_rate, employment_type, start_date, pay_frequency, status'}
            {importType === 'clients' && 'Required columns: name. Optional: email, contact_person, billing_address'}
            {importType === 'roles' && 'Required columns: name. Optional: description, hourly_rate'}
          </p>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste your CSV data here...\n\nThe first row should be column headers.\nExample:\nfirst_name,last_name,email\nJohn,Doe,john@example.com`}
            className="w-full h-64 px-4 py-3 bg-input-bg border border-input-border text-white placeholder:text-muted-foreground font-mono rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50 resize-y"
          />

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={reset}>Back</Button>
            <Button onClick={handlePaste} className="bg-accent-blue hover:bg-accent-blue/90">
              Preview Data
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Preview ({parsedData.rows.length} rows)</h3>
                <p className="text-sm text-muted-foreground">Review your data before importing</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {parsedData.headers.length} columns detected
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">#</th>
                  {parsedData.headers.map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedData.rows.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted">
                    <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                    {parsedData.headers.map(h => (
                      <td key={h} className="px-4 py-2 text-white whitespace-nowrap max-w-xs truncate">{row[h] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.rows.length > 50 && (
              <div className="px-6 py-3 text-sm text-muted-foreground bg-muted">
                Showing first 50 of {parsedData.rows.length} rows
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => setStep('paste')}>Back to Edit</Button>
            <Button onClick={handleImport} className="bg-accent-green hover:bg-accent-green/90">
              <Upload className="h-4 w-4 mr-2" />
              Import {parsedData.rows.length} {importType}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === 'importing' && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Importing...</h3>
          <p className="text-muted-foreground">Processing {parsedData.rows.length} rows. This may take a moment.</p>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 'done' && results && (
        <div className="bg-card rounded-xl border border-border p-8">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-accent-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Import Complete</h3>
            <p className="text-muted-foreground">Your data has been processed successfully</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-accent-green/10 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-accent-green mb-1">{results.imported}</div>
              <div className="text-sm text-accent-green">Imported</div>
            </div>
            <div className="bg-accent-yellow/10 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-1">{results.skipped}</div>
              <div className="text-sm text-accent-yellow">Skipped (duplicates)</div>
            </div>
            <div className="bg-accent-red/10 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-accent-red mb-1">{results.errors.length}</div>
              <div className="text-sm text-accent-red">Errors</div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-accent-red mb-2">Error Details:</h4>
              <ul className="text-sm text-accent-red/80 space-y-1 max-h-32 overflow-y-auto">
                {results.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={reset}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import More Data
            </Button>
            <Button className="bg-accent-blue hover:bg-accent-blue/90" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
