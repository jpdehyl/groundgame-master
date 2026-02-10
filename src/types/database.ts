// Database types for GroundGame Master

export interface Client {
  id: string
  name: string
  email?: string
  contact_person?: string
  billing_address?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  description?: string
  hourly_rate?: number
  created_at: string
}

export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  client_id?: string
  role_id?: string
  employment_type: 'contractor' | 'employee'
  start_date: string
  end_date?: string
  salary_compensation?: number
  pay_frequency: 'weekly' | 'biweekly' | 'monthly'
  internet_speed_up?: number
  internet_speed_down?: number
  computer_serial?: string
  status: 'active' | 'inactive' | 'terminated'
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  role?: Role
}

export interface ClientPricing {
  id: string
  client_id: string
  role_id: string
  hourly_rate: number
  effective_from: string
  effective_to?: string
  created_at: string
}

export interface Document {
  id: string
  employee_id: string
  document_type: 'contract' | 'w8ben' | 'other'
  file_name: string
  google_drive_id?: string
  google_drive_url?: string
  upload_date: string
  expiry_date?: string
  status: 'active' | 'expired' | 'replaced'
  created_at: string
}

export interface PayPeriod {
  id: string
  period_start: string
  period_end: string
  period_type: 'weekly' | 'biweekly' | 'monthly'
  status: 'open' | 'closed' | 'processed'
  created_at: string
}

export interface TimeOff {
  id: string
  employee_id: string
  leave_type: 'pto' | 'sick' | 'unpaid'
  start_date: string
  end_date: string
  days_count: number
  status: 'pending' | 'approved' | 'denied'
  reason?: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

export interface WorkEntry {
  id: string
  employee_id: string
  pay_period_id: string
  work_date: string
  hours_worked: number
  leads_processed: number
  spifs: number
  notes?: string
  created_at: string
}

export interface PayrollRun {
  id: string
  pay_period_id: string
  run_date: string
  total_amount?: number
  employee_count?: number
  status: 'draft' | 'processed' | 'sent'
  csv_file_path?: string
  created_by?: string
  created_at: string
}

export interface PayrollEntry {
  id: string
  payroll_run_id: string
  employee_id: string
  base_hours?: number
  hourly_rate?: number
  base_pay?: number
  leads_bonus: number
  spifs_bonus: number
  total_gross?: number
  deductions: number
  net_pay?: number
  created_at: string
}

export interface User {
  id: string
  email: string
  google_id?: string
  role: 'admin' | 'contractor'
  employee_id?: string
  last_login?: string
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface EmployeeFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  client_id?: string
  role_id?: string
  employment_type: 'contractor' | 'employee'
  start_date: string
  salary_compensation?: number
  pay_frequency: 'weekly' | 'biweekly' | 'monthly'
  internet_speed_up?: number
  internet_speed_down?: number
  computer_serial?: string
}

export interface ClientFormData {
  name: string
  email?: string
  contact_person?: string
  billing_address?: string
}

export interface TimeOffFormData {
  employee_id: string
  leave_type: 'pto' | 'sick' | 'unpaid'
  start_date: string
  end_date: string
  reason?: string
}