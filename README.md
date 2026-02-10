# GroundGame Master

Employee management, payroll processing, and client billing system for contractor-based operations.

## 🎯 Features

### Employee Management
- Complete onboarding workflow
- Client and role assignments
- Document management (contracts, W-8BEN)
- Technical requirements tracking (internet speed, equipment)

### Payroll System
- Automated bi-weekly/monthly payroll calculations
- Lead-based bonuses and SPIF tracking
- Time-off management (PTO, sick, unpaid leave)
- CSV export for payment processing

### Client Billing
- Role-based pricing with client overrides
- Automated invoice generation
- QuickBooks CSV export
- Billing reconciliation

### Document Management
- Google Drive integration
- W-8BEN expiry tracking (3-year renewal)
- Contract storage and access
- Secure document sharing

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Google OAuth
- **File Storage**: Google Drive API
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- Google Workspace account
- Google Cloud Console project

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd groundgame-master
npm install
```

2. **Setup environment variables**
```bash
cp .env.local.example .env.local
# Fill in your environment variables
```

3. **Setup database**
```bash
# Create Supabase project
# Run database/schema.sql in Supabase SQL editor
```

4. **Configure Google OAuth**
- Create OAuth 2.0 client in Google Cloud Console
- Add your client ID/secret to .env.local
- Configure authorized redirect URIs

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📊 Database Schema

See `database/README.md` for detailed schema documentation.

### Core Tables
- `employees` - Employee/contractor records
- `clients` - Companies employing contractors  
- `roles` - Job roles with pricing
- `payroll_runs` - Payroll processing
- `documents` - File management
- `time_off` - Leave tracking

## 🔧 Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_DRIVE_API_KEY` | Google Drive API key |
| `NEXTAUTH_SECRET` | NextAuth secret key |

### Google APIs Required
- Google OAuth 2.0
- Google Drive API  
- Gmail API (for notifications)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Admin dashboard
│   └── contractor/        # Contractor portal
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── forms/            # Form components
│   └── tables/           # Data table components
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── auth.ts           # Authentication
│   └── utils.ts          # Helper functions
├── types/                # TypeScript definitions
└── hooks/                # React hooks
database/
├── schema.sql            # Database schema
└── README.md            # Database documentation
```

## 🚢 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Setup
- Production Supabase project
- Google Cloud Console production OAuth
- Google Drive API quotas and limits

## 🔒 Security

- Row Level Security (RLS) policies in Supabase
- Google OAuth for authentication
- Role-based access control
- Audit logging for sensitive operations
- Secure file sharing via Google Drive

## 🧪 Testing

```bash
npm test                  # Run unit tests
npm run test:e2e         # Run E2E tests
npm run type-check       # TypeScript checking
```

## 📚 Documentation

- [Database Schema](database/README.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [User Guide](docs/user-guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@groundgamemaster.com or create an issue in GitHub.