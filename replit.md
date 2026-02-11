# GroundGame App

## Overview
GroundGame is an HR/business management dashboard built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It uses Supabase as its backend database and authentication provider.

## Recent Changes
- 2026-02-11: Initial Replit setup - configured Next.js for port 5000, allowed all dev origins for proxy compatibility, set up deployment config.

## Project Architecture
- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI**: React 19, Tailwind CSS v4, Lucide React icons
- **Database/Auth**: Supabase (requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- **Language**: TypeScript 5.9

## Project Structure
```
src/
  app/             - Next.js App Router pages and API routes
    api/           - Backend API routes (clients, employees, dashboard, roles, seed, test-db)
    dashboard/     - Dashboard pages (employees, clients, payroll, documents, time-off, reports, settings)
  components/      - Reusable React components (dashboard, forms, ui)
  lib/             - Utility libraries (supabase client, utils)
  types/           - TypeScript type definitions
database/          - Database schema SQL files
supabase/          - Supabase configuration and migrations
public/            - Static assets
```

## Running the App
- Dev: `npm run dev` (runs on 0.0.0.0:5000)
- Build: `npm run build`
- Start: `npm run start` (runs on 0.0.0.0:5000)

## Environment Variables Needed
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
