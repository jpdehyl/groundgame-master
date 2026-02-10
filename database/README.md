# GroundGame Master Database Schema

## Overview

PostgreSQL database designed for employee management, payroll processing, and client billing.

## Core Tables

### Employee Management
- `employees` - Core employee/contractor records
- `clients` - Companies that employ contractors
- `roles` - Job roles (SDR, Manager, etc.) with base rates
- `client_pricing` - Client-specific pricing overrides

### Document Management
- `documents` - File tracking (Google Drive integration)
  - Contracts, W-8BEN forms, other documents
  - Automatic expiry tracking for W-8BEN (3 years)

### Payroll System
- `pay_periods` - Bi-weekly/monthly pay cycles
- `work_entries` - Daily work records (hours, leads, spifs)
- `payroll_runs` - Payroll processing batches
- `payroll_entries` - Individual employee payroll details
- `time_off` - PTO/sick/unpaid leave tracking

### Client Billing
- `client_invoices` - Invoices sent to clients
- `invoice_line_items` - Detailed billing breakdown

### System
- `users` - Admin and contractor logins (Google OAuth)
- `audit_log` - Change tracking for compliance

## Key Features

### Flexible Pricing
- Base rates in `roles` table
- Client-specific overrides in `client_pricing`
- Effective date ranges for rate changes

### Document Expiry Tracking
- W-8BEN forms automatically flagged for renewal (3 years)
- Google Drive integration for file storage

### Payroll Calculations
- Supports hourly, salary, and bonus structures
- Tracks leads processed for performance bonuses
- SPIF (bonus) tracking per employee

### Audit Trail
- All critical changes logged
- User attribution for accountability

## Setup Instructions

1. Create Supabase project
2. Run `schema.sql` in Supabase SQL editor
3. Configure Row Level Security (RLS) policies
4. Set up Google Drive API integration

## Environment Variables Needed

```bash
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_DRIVE_API_KEY="..."
```