-- GroundGame Master Database Schema
-- PostgreSQL + Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- CORE ENTITIES
-- ===========================

-- Companies/Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    contact_person VARCHAR(255),
    billing_address TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles (SDR, Manager, etc.)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees/Contractors
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Basic Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    -- Assignment
    client_id UUID REFERENCES clients(id),
    role_id UUID REFERENCES roles(id),
    -- Employment Details
    employment_type VARCHAR(50) DEFAULT 'contractor' CHECK (employment_type IN ('contractor', 'employee')),
    start_date DATE NOT NULL,
    end_date DATE,
    salary_compensation DECIMAL(10,2),
    pay_frequency VARCHAR(20) DEFAULT 'biweekly' CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly')),
    -- Technical Requirements
    internet_speed_up INTEGER, -- Mbps
    internet_speed_down INTEGER, -- Mbps
    computer_serial VARCHAR(255),
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- PRICING & BILLING
-- ===========================

-- Client-specific pricing for roles
CREATE TABLE client_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) NOT NULL,
    role_id UUID REFERENCES roles(id) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, role_id, effective_from)
);

-- ===========================
-- DOCUMENTS
-- ===========================

-- Document storage (Google Drive integration)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('contract', 'w8ben', 'other')),
    file_name VARCHAR(255) NOT NULL,
    google_drive_id VARCHAR(255), -- Google Drive file ID
    google_drive_url TEXT,
    upload_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE, -- For W-8BEN (3 years)
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'replaced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- TIME TRACKING & PAYROLL
-- ===========================

-- Pay periods
CREATE TABLE pay_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'biweekly' CHECK (period_type IN ('weekly', 'biweekly', 'monthly')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'processed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_start, period_end, period_type)
);

-- Time off requests
CREATE TABLE time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('pto', 'sick', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(4,2) NOT NULL, -- Support half days
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reason TEXT,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work entries (hours worked, leads processed, etc.)
CREATE TABLE work_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    pay_period_id UUID REFERENCES pay_periods(id) NOT NULL,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    leads_processed INTEGER DEFAULT 0,
    spifs DECIMAL(8,2) DEFAULT 0, -- Additional bonuses
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, pay_period_id, work_date)
);

-- Payroll runs
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pay_period_id UUID REFERENCES pay_periods(id) NOT NULL,
    run_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2),
    employee_count INTEGER,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'sent')),
    csv_file_path TEXT, -- Path to generated CSV
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual payroll entries
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID REFERENCES payroll_runs(id) NOT NULL,
    employee_id UUID REFERENCES employees(id) NOT NULL,
    -- Calculation components
    base_hours DECIMAL(6,2),
    hourly_rate DECIMAL(10,2),
    base_pay DECIMAL(10,2),
    leads_bonus DECIMAL(8,2) DEFAULT 0,
    spifs_bonus DECIMAL(8,2) DEFAULT 0,
    total_gross DECIMAL(10,2),
    -- Deductions (if any)
    deductions DECIMAL(8,2) DEFAULT 0,
    net_pay DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- CLIENT BILLING
-- ===========================

-- Client invoices
CREATE TABLE client_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) NOT NULL,
    pay_period_id UUID REFERENCES pay_periods(id) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
    csv_file_path TEXT, -- Path to QuickBooks CSV
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES client_invoices(id) NOT NULL,
    employee_id UUID REFERENCES employees(id) NOT NULL,
    description TEXT,
    hours DECIMAL(6,2),
    hourly_rate DECIMAL(10,2),
    amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- SYSTEM & AUDIT
-- ===========================

-- User accounts (admin access)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'contractor')),
    employee_id UUID REFERENCES employees(id), -- Link to employee record if contractor
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- INDEXES
-- ===========================

-- Performance indexes
CREATE INDEX idx_employees_client_role ON employees(client_id, role_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_expiry ON documents(expiry_date) WHERE document_type = 'w8ben';
CREATE INDEX idx_work_entries_employee_period ON work_entries(employee_id, pay_period_id);
CREATE INDEX idx_payroll_entries_run ON payroll_entries(payroll_run_id);
CREATE INDEX idx_time_off_employee ON time_off(employee_id);

-- ===========================
-- FUNCTIONS & TRIGGERS
-- ===========================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- SAMPLE DATA (Optional)
-- ===========================

-- Insert default roles
INSERT INTO roles (name, description, hourly_rate) VALUES
('SDR', 'Sales Development Representative', 25.00),
('Manager', 'Team Manager', 45.00),
('Analyst', 'Data Analyst', 35.00);

-- Insert sample client
INSERT INTO clients (name, email, contact_person) VALUES
('TechCorp Solutions', 'billing@techcorp.com', 'John Smith');