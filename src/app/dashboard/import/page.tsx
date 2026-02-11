'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Trash2,
  Users,
  Building2,
  Briefcase,
  ArrowDown,
  RotateCcw,
  Columns3
} from 'lucide-react';

type ImportType = 'employees' | 'clients' | 'roles';
type Step = 'select' | 'paste' | 'mapping' | 'preview' | 'importing' | 'done';

interface ParsedRow {
  [key: string]: string;
}

interface ImportResults {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Column alias mapping ───────────────────────────────────────────────────
// Maps common Google Sheets column names to our expected field names.
// Case-insensitive. Handles spaces, underscores, abbreviations.

const EMPLOYEE_FIELD_ALIASES: Record<string, string[]> = {
  first_name: ['first name', 'first_name', 'firstname', 'fname', 'given name', 'nombre'],
  last_name: ['last name', 'last_name', 'lastname', 'lname', 'surname', 'family name', 'apellido'],
  email: ['email', 'email address', 'e-mail', 'work email', 'correo'],
  phone: ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell', 'cell phone', 'telefono'],
  client_name: ['client', 'client name', 'client_name', 'company', 'company name', 'organization', 'org', 'employer', 'account'],
  role_name: ['role', 'role name', 'role_name', 'position', 'title', 'job title', 'job role', 'designation', 'puesto'],
  hourly_rate: ['hourly rate', 'hourly_rate', 'rate', 'pay rate', 'rate/hr', '$/hr', 'hourly', 'pay', 'compensation', 'salary'],
  employment_type: ['employment type', 'employment_type', 'type', 'emp type', 'worker type', 'classification', 'contractor/employee'],
  start_date: ['start date', 'start_date', 'hire date', 'hire_date', 'date started', 'joined', 'onboard date', 'fecha inicio'],
  pay_frequency: ['pay frequency', 'pay_frequency', 'frequency', 'pay period', 'pay schedule', 'payment frequency'],
  status: ['status', 'employee status', 'active', 'state'],
  internet_speed_up: ['upload speed', 'internet up', 'speed up', 'upload', 'internet_speed_up', 'upload mbps'],
  internet_speed_down: ['download speed', 'internet down', 'speed down', 'download', 'internet_speed_down', 'download mbps'],
  computer_serial: ['computer serial', 'serial', 'computer_serial', 'serial number', 'device serial', 'asset tag'],
  work_location: ['work location', 'location', 'city', 'country', 'work_location', 'timezone', 'time zone'],
};

const CLIENT_FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'client name', 'client_name', 'company', 'company name', 'organization', 'org', 'account name', 'business name'],
  email: ['email', 'email address', 'e-mail', 'billing email', 'contact email'],
  contact_person: ['contact', 'contact person', 'contact_person', 'primary contact', 'poc', 'point of contact', 'contact name'],
  billing_address: ['billing address', 'billing_address', 'address', 'mailing address', 'street address', 'location'],
};

const ROLE_FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'role', 'role name', 'role_name', 'position', 'title', 'job title'],
  description: ['description', 'desc', 'details', 'role description', 'about'],
  hourly_rate: ['hourly rate', 'hourly_rate', 'rate', 'pay rate', 'base rate', '$/hr', 'hourly'],
};

function getFieldAliases(type: ImportType): Record<string, string[]> {
  if (type === 'clients') return CLIENT_FIELD_ALIASES;
  if (type === 'roles') return ROLE_FIELD_ALIASES;
  return EMPLOYEE_FIELD_ALIASES;
}

function getRequiredFields(type: ImportType): string[] {
  if (type === 'clients') return ['name'];
  if (type === 'roles') return ['name'];
  return ['first_name', 'last_name', 'email'];
}

function getOptionalFields(type: ImportType): string[] {
  if (type === 'clients') return ['email', 'contact_person', 'billing_address'];
  if (type === 'roles') return ['description', 'hourly_rate'];
  return ['phone', 'client_name', 'role_name', 'hourly_rate', 'employment_type', 'start_date', 'pay_frequency', 'status'];
}

// Smart field mapping: given a raw header, find the best DB field match
function autoMapField(rawHeader: string, type: ImportType): string | null {
  const aliases = getFieldAliases(type);
  const normalized = rawHeader.toLowerCase().trim().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ');

  // Direct match first
  for (const [field, aliasList] of Object.entries(aliases)) {
    if (aliasList.some(a => a === normalized || a === rawHeader.toLowerCase().trim())) {
      return field;
    }
  }

  // Fuzzy: check if any alias is contained in the header or vice versa
  for (const [field, aliasList] of Object.entries(aliases)) {
    if (aliasList.some(a => normalized.includes(a) || a.includes(normalized))) {
      return field;
    }
  }

  return null;
}

// ─── CSV/TSV Parser ─────────────────────────────────────────────────────────
// Handles CSV, TSV (tab-separated), and direct Google Sheets paste (tab-separated)

function detectDelimiter(firstLine: string): string {
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseData(text: string): { headers: string[]; rows: ParsedRow[]; delimiter: string } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [], delimiter: ',' };

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvLine(line, delimiter);
    if (values.some(v => v.trim())) {
      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header] = (values[idx] || '').trim();
      });
      rows.push(row);
    }
  }

  return { headers, rows, delimiter };
}

// ─── Validation ─────────────────────────────────────────────────────────────

interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

function validateMappedData(
  rows: ParsedRow[],
  mapping: Record<string, string>,
  type: ImportType
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = getRequiredFields(type);
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));

  // Check required fields are mapped
  for (const field of required) {
    if (!mappedFields.has(field)) {
      issues.push({ row: 0, field, message: `Required field "${field}" is not mapped to any column`, severity: 'error' });
    }
  }

  // Reverse mapping: DB field -> raw header
  const reverseMap: Record<string, string> = {};
  for (const [rawHeader, dbField] of Object.entries(mapping)) {
    if (dbField) reverseMap[dbField] = rawHeader;
  }

  // Per-row validation
  const emails = new Set<string>();
  rows.forEach((row, idx) => {
    // Required field checks
    for (const field of required) {
      const rawHeader = reverseMap[field];
      if (rawHeader && !row[rawHeader]?.trim()) {
        issues.push({ row: idx + 1, field, message: `Row ${idx + 1}: missing ${field}`, severity: 'error' });
      }
    }

    // Email format
    if (reverseMap.email && row[reverseMap.email]) {
      const email = row[reverseMap.email].trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        issues.push({ row: idx + 1, field: 'email', message: `Row ${idx + 1}: invalid email "${email}"`, severity: 'error' });
      }
      if (emails.has(email)) {
        issues.push({ row: idx + 1, field: 'email', message: `Row ${idx + 1}: duplicate email "${email}"`, severity: 'warning' });
      }
      emails.add(email);
    }

    // Rate should be numeric
    if (reverseMap.hourly_rate && row[reverseMap.hourly_rate]) {
      const val = row[reverseMap.hourly_rate].replace(/[$,]/g, '');
      if (val && isNaN(Number(val))) {
        issues.push({ row: idx + 1, field: 'hourly_rate', message: `Row ${idx + 1}: non-numeric rate "${row[reverseMap.hourly_rate]}"`, severity: 'warning' });
      }
    }
  });

  return issues;
}

// ─── Templates ──────────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('select');
  const [importType, setImportType] = useState<ImportType>('employees');
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] }>({ headers: [], rows: [] });
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Step 2 → 3: Parse data and auto-map fields
  const handleParse = () => {
    if (!csvText.trim()) {
      setError('Please paste your data');
      return;
    }
    setError(null);
    const parsed = parseData(csvText);
    if (parsed.rows.length === 0) {
      setError('No data rows found. Make sure the first row contains column headers.');
      return;
    }
    setParsedData({ headers: parsed.headers, rows: parsed.rows });

    // Auto-map fields
    const mapping: Record<string, string> = {};
    for (const header of parsed.headers) {
      const match = autoMapField(header, importType);
      mapping[header] = match || '';
    }
    setFieldMapping(mapping);
    setStep('mapping');
  };

  // Step 3 → 4: Validate mapping and show preview
  const handleValidateMapping = () => {
    const issues = validateMappedData(parsedData.rows, fieldMapping, importType);
    setValidationIssues(issues);

    const errors = issues.filter(i => i.severity === 'error' && i.row === 0);
    if (errors.length > 0) {
      setError(errors.map(e => e.message).join('. '));
      return;
    }
    setError(null);
    setStep('preview');
  };

  // Transform rows using field mapping before import
  const getMappedRows = useCallback((): ParsedRow[] => {
    const reverseMap: Record<string, string> = {};
    for (const [rawHeader, dbField] of Object.entries(fieldMapping)) {
      if (dbField) reverseMap[dbField] = rawHeader;
    }

    return parsedData.rows.map(row => {
      const mapped: ParsedRow = {};
      for (const [dbField, rawHeader] of Object.entries(reverseMap)) {
        const val = row[rawHeader] || '';
        // Clean currency symbols from rate fields
        if (dbField === 'hourly_rate' || dbField === 'salary_compensation') {
          mapped[dbField] = val.replace(/[$,]/g, '');
        } else {
          mapped[dbField] = val;
        }
      }
      return mapped;
    });
  }, [parsedData.rows, fieldMapping]);

  // Step 4 → 5: Import
  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    setError(null);

    try {
      const mappedRows = getMappedRows();
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          rows: mappedRows
        })
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.data);
        setStep('done');
        toast(`Imported ${result.data.imported} ${importType} successfully`, 'success');
      } else {
        setError(result.error || 'Import failed');
        setStep('preview');
        toast('Import failed', 'error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
      toast('Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep('select');
    setCsvText('');
    setParsedData({ headers: [], rows: [] });
    setFieldMapping({});
    setValidationIssues([]);
    setResults(null);
    setError(null);
  };

  const loadTemplate = () => {
    const templates = { employees: EMPLOYEE_TEMPLATE, clients: CLIENT_TEMPLATE, roles: ROLE_TEMPLATE };
    setCsvText(templates[importType]);
  };

  const allDbFields = [...getRequiredFields(importType), ...getOptionalFields(importType)];
  const mappedDbFields = new Set(Object.values(fieldMapping).filter(Boolean));
  const unmappedRequired = getRequiredFields(importType).filter(f => !mappedDbFields.has(f));

  // Get mapped column headers for preview
  const previewHeaders = Object.entries(fieldMapping)
    .filter(([, dbField]) => dbField)
    .map(([rawHeader, dbField]) => ({ rawHeader, dbField }));

  const stepLabels = ['Select Type', 'Paste Data', 'Map Fields', 'Preview', 'Import'];
  const stepKeys: Step[] = ['select', 'paste', 'mapping', 'preview', 'done'];

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
          Supports CSV (comma-separated) and TSV (tab-separated, direct paste from Sheets). Column names are auto-detected — use any naming convention.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center space-x-1 text-sm overflow-x-auto pb-2">
        {stepLabels.map((label, idx) => {
          const current = stepKeys.indexOf(step as Step);
          const importingIdx = step === 'importing' ? 4 : current;
          const isActive = idx <= importingIdx;
          return (
            <div key={label} className="flex items-center shrink-0">
              {idx > 0 && <ArrowRight className="h-3 w-3 mx-1.5 text-muted-foreground" />}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-accent-blue/15 text-accent-blue' : 'bg-white/10 text-muted-foreground'
              }`}>{label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-accent-red mt-0.5 shrink-0" />
          <div className="text-sm text-accent-red flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-accent-red hover:text-accent-red/80 text-xs shrink-0">Dismiss</button>
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
              Paste your {importType} data
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
            Paste CSV, TSV, or data copied directly from Google Sheets. Column names will be auto-detected in the next step.
          </p>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste your data here...\n\nThe first row should be column headers.\nWorks with CSV, tabs (from Google Sheets), or any delimiter.\n\nExample:\nFirst Name\tLast Name\tEmail\nJohn\tDoe\tjohn@example.com`}
            className="w-full h-64 px-4 py-3 bg-input-bg border border-input-border text-white placeholder:text-muted-foreground font-mono rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50 resize-y"
          />

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={reset}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleParse} className="bg-accent-blue hover:bg-accent-blue/90">
              Auto-detect Columns
              <Columns3 className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Field mapping */}
      {step === 'mapping' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-1">Map Your Columns</h3>
            <p className="text-sm text-muted-foreground">
              We auto-detected your column mappings. Review and adjust if needed. {parsedData.rows.length} rows found.
            </p>
          </div>

          {unmappedRequired.length > 0 && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-accent-yellow">
                Required fields not yet mapped: <strong>{unmappedRequired.join(', ')}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {parsedData.headers.map(header => {
              const mapped = fieldMapping[header] || '';
              const isRequired = getRequiredFields(importType).includes(mapped);
              const sampleValues = parsedData.rows.slice(0, 3).map(r => r[header]).filter(Boolean);

              return (
                <div key={header} className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{header}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {sampleValues.length > 0 ? `e.g. ${sampleValues.join(', ')}` : 'No data'}
                    </div>
                  </div>
                  <ArrowDown className="h-4 w-4 text-muted-foreground shrink-0 rotate-[-90deg]" />
                  <div className="w-48 shrink-0">
                    <select
                      value={mapped}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, [header]: e.target.value }))}
                      className={`w-full px-2 py-1.5 border rounded-md text-sm bg-input-bg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue/50 ${
                        !mapped ? 'border-white/20 text-muted-foreground' :
                        isRequired ? 'border-accent-green/50' : 'border-input-border'
                      }`}
                    >
                      <option value="">— Skip this column —</option>
                      {allDbFields.map(field => {
                        const usedElsewhere = Object.entries(fieldMapping).some(
                          ([h, f]) => f === field && h !== header
                        );
                        return (
                          <option key={field} value={field} disabled={usedElsewhere}>
                            {field}{getRequiredFields(importType).includes(field) ? ' *' : ''}
                            {usedElsewhere ? ' (used)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-4">
            <span>
              {Object.values(fieldMapping).filter(Boolean).length} of {parsedData.headers.length} columns mapped
            </span>
            <button
              onClick={() => {
                const remapped: Record<string, string> = {};
                for (const header of parsedData.headers) {
                  remapped[header] = autoMapField(header, importType) || '';
                }
                setFieldMapping(remapped);
              }}
              className="text-accent-blue hover:text-accent-blue/80 flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-detect
            </button>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('paste')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Edit
            </Button>
            <Button onClick={handleValidateMapping} className="bg-accent-blue hover:bg-accent-blue/90">
              Preview Import
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 'preview' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Preview ({parsedData.rows.length} rows)</h3>
                <p className="text-sm text-muted-foreground">Review your mapped data before importing</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {previewHeaders.length} fields mapped
                </span>
              </div>
            </div>
          </div>

          {/* Validation warnings */}
          {validationIssues.filter(i => i.severity === 'warning').length > 0 && (
            <div className="px-6 py-3 bg-accent-yellow/10 border-b border-accent-yellow/30">
              <p className="text-sm text-accent-yellow font-medium mb-1">
                {validationIssues.filter(i => i.severity === 'warning').length} warning{validationIssues.filter(i => i.severity === 'warning').length !== 1 ? 's' : ''}
              </p>
              <ul className="text-xs text-accent-yellow/80 space-y-0.5 max-h-20 overflow-y-auto">
                {validationIssues.filter(i => i.severity === 'warning').slice(0, 10).map((issue, idx) => (
                  <li key={idx}>{issue.message}</li>
                ))}
                {validationIssues.filter(i => i.severity === 'warning').length > 10 && (
                  <li>...and {validationIssues.filter(i => i.severity === 'warning').length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Validation errors */}
          {validationIssues.filter(i => i.severity === 'error' && i.row > 0).length > 0 && (
            <div className="px-6 py-3 bg-accent-red/10 border-b border-accent-red/30">
              <p className="text-sm text-accent-red font-medium mb-1">
                {validationIssues.filter(i => i.severity === 'error' && i.row > 0).length} row error{validationIssues.filter(i => i.severity === 'error' && i.row > 0).length !== 1 ? 's' : ''}
              </p>
              <ul className="text-xs text-accent-red/80 space-y-0.5 max-h-20 overflow-y-auto">
                {validationIssues.filter(i => i.severity === 'error' && i.row > 0).slice(0, 10).map((issue, idx) => (
                  <li key={idx}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">#</th>
                  {previewHeaders.map(({ dbField }) => (
                    <th key={dbField} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      {dbField}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedData.rows.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted">
                    <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                    {previewHeaders.map(({ rawHeader, dbField }) => (
                      <td key={dbField} className="px-4 py-2 text-white whitespace-nowrap max-w-xs truncate">
                        {row[rawHeader] || <span className="text-muted-foreground">—</span>}
                      </td>
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
            <Button variant="outline" onClick={() => setStep('mapping')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mapping
            </Button>
            <Button onClick={handleImport} className="bg-accent-green hover:bg-accent-green/90">
              <Upload className="h-4 w-4 mr-2" />
              Import {parsedData.rows.length} {importType}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Importing */}
      {step === 'importing' && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Importing...</h3>
          <p className="text-muted-foreground">Processing {parsedData.rows.length} rows. This may take a moment.</p>
        </div>
      )}

      {/* Step 6: Done */}
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
