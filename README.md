# Immoaura Client Portal

A comprehensive client portal application for managing orders, invoices, messaging, and calendar scheduling. Built with React, TypeScript, and Supabase.

## 🚀 Features

### Client Features
- **Dashboard** - View order statistics, spending analytics, and recent orders
- **Order Management** - Create orders through a multi-step wizard with service configuration
- **Invoice Management** - View and download invoices
- **Messaging** - Receive and respond to messages from administrators
- **Profile Management** - Update account information and preferences
- **Multi-language Support** - Available in English, French, German, and Dutch

### Admin Features
- **Admin Dashboard** - Overview of orders, invoices, and system statistics
- **Order Management** - Track and update order statuses
- **Invoice Creation** - Generate invoices and upload PDFs
- **Calendar Management** - Manage availability slots and bookings
- **Messaging System** - Send messages to individual clients or broadcast to all users
- **Activity Logging** - Track all admin actions for audit purposes

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Backend:** Supabase (PostgreSQL, Authentication, Storage)
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6
- **Form Handling:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS
- **Charts:** Recharts

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase project (see [Setup](#setup) section)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kalana8/Immoaura-client-portal-.git
cd Immoaura-client-portal-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can copy from `.env.example`:

```bash
cp .env.example .env.local
```

Then update the values with your Supabase project credentials.

### 4. Set Up Supabase Database

The project includes database migrations in the `supabase/migrations/` directory. Apply these migrations to your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql`
   - `20251022050000_fix_users_rls.sql`
   - `20251023000000_create_order_number_function.sql`
   - `20251101192740_fix_order_number_sequence.sql`
   - `20251102000000_create_admin_infrastructure.sql`
   - `20251102050000_phase6_email_notifications.sql`

Alternatively, use the automated migration script:

```bash
./migrate-to-new-project.sh
```

### 5. Configure Supabase Storage

Create a storage bucket for file uploads:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `invoices` (or update the bucket name in the code)
3. Set it to public or configure appropriate policies

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── orders/          # Order-related components
│   │   ├── invoices/       # Invoice components
│   │   ├── messages/        # Messaging components
│   │   └── ui/              # Reusable UI components (shadcn)
│   ├── pages/               # Page components
│   ├── contexts/            # React contexts (Language, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── integrations/       # External integrations (Supabase)
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper utilities
├── supabase/
│   ├── migrations/          # Database migration files
│   └── functions/           # Edge functions
├── public/                  # Static assets
└── dist/                    # Production build output
```

## 🗄️ Database Schema

### Core Tables
- **users** - User profiles and authentication
- **orders** - Client orders with status tracking
- **invoices** - Invoice records with payment status
- **calendar_slots** - Availability and booking management
- **admin_activity_log** - Audit trail for admin actions
- **admin_settings** - System configuration
- **email_notifications** - Email tracking and history

### Key Functions
- `generate_order_number()` - Auto-generates order numbers (IM-000001)
- `generate_invoice_number()` - Auto-generates invoice numbers (INV-2025-000001)
- `log_admin_action()` - Logs admin operations
- `log_email_notification()` - Tracks email notifications

For detailed database documentation, see [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)

## 🌍 Multi-language Support

The application supports 4 languages:
- English (EN)
- French (FR)
- German (DE)
- Dutch (NL)

Language preference is stored in user profiles and persists across sessions. The language selector is available in the navigation bar.

## 🔐 Authentication & Security

- **Email/Password Authentication** via Supabase Auth
- **Role-Based Access Control** (Admin/Client roles)
- **Row-Level Security (RLS)** policies on all database tables
- **Protected Routes** - Admin and client routes are separated
- **Secure Token Storage** - Handled by Supabase

## 📦 Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

## 🚢 Deployment

### Hostinger Deployment

1. Build the project: `npm run build`
2. Upload the `dist/` folder contents to your Hostinger `public_html/` directory
3. Ensure `.htaccess` is included for SPA routing
4. Configure environment variables on your hosting platform

For detailed deployment instructions, see [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)

## 📚 Documentation

- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) - Complete Supabase setup and database reference
- [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) - Deployment guide
- [ADMIN_PANEL_COMPLETE_GUIDE.md](./ADMIN_PANEL_COMPLETE_GUIDE.md) - Admin panel documentation
- [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) - Database migration instructions

## 🧪 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👤 Author

**Kalana Kavinda**

- GitHub: [@Kalana8](https://github.com/Kalana8)

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)

---

For questions or support, please open an issue on GitHub.
