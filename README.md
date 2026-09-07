# AtomQuest Goals — Goal Setting & Performance Management Portal

A full-stack goal management application built with **Next.js 15**, **Prisma**, **PostgreSQL (Supabase)**, and **Auth.js v5**. Designed for organizational goal-setting with quarterly check-ins, manager approvals, and admin analytics.

---

## ✨ Key Features

### Core Goal Management
- **Goal Creation** with multi-goal batch wizard (max 8 goals, min 10% weightage each)
- **5 UoM Types**: Numeric (Higher/Lower is Better), Percentage, Timeline/Deadline, Zero-Based
- **Real-time weightage validation** (must total exactly 100%)
- **Thrust Area classification** for strategic alignment

### Workflow & Approvals
- **Manager Approval** workflow (Submit → Review → Approve/Return)
- **Goal Locking** after approval to prevent modifications
- **Admin Unlock** capability for special cases

### Quarterly Check-ins
- **4 quarterly windows** with strict enforcement (Q1: Jul, Q2: Oct, Q3: Jan, Q4: Mar/Apr)
- **Goal Setting window** (May 1 – Jun 30)
- **Progress calculation** with weighted formulas per UoM type
- **Manager comments** on check-ins
- **Admin override** for all window restrictions

### Reporting & Analytics
- **Interactive dashboards** with Recharts (pie charts, bar charts, line charts)
- **Excel export** (6-sheet workbook with auto-sized columns)
- **CSV export** with UTF-8 BOM encoding
- **Completion Dashboard** — org-wide goal-setting compliance tracking
- **Department comparison** and individual employee status

### Role-Based Access Control
| Feature | Employee | Manager | Admin |
|---------|----------|---------|-------|
| Create/Edit Goals | ✅ | ✅ | ✅ |
| Submit for Approval | ✅ | ✅ | ✅ |
| Approve/Return Goals | ❌ | ✅ | ✅ |
| Lock Goals | ❌ | ✅ | ✅ |
| View Team | ❌ | ✅ | ✅ |
| Reports & Export | ❌ | ✅ | ✅ |
| Completion Dashboard | ❌ | ❌ | ✅ |
| Manage Cycles | ❌ | ❌ | ✅ |
| Override Windows | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | Full-stack React framework |
| TypeScript | Type safety |
| Prisma | Database ORM |
| PostgreSQL | Production database (Supabase) |
| Auth.js v5 | Authentication |
| Tailwind CSS | Styling |
| shadcn/ui | UI component library |
| Recharts | Interactive charts |
| XLSX | Excel file generation |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- PostgreSQL database (free: [Supabase](https://supabase.com) or [Neon](https://neon.tech))

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd Atom_Quest
npm install
```

### 2. Set up Database
1. Create a free PostgreSQL database at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and fill in your database URL:

```bash
cp .env.example .env
```

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
AUTH_SECRET="generate-a-random-secret-here"
```

### 3. Push Schema & Seed Data
```bash
npx prisma db push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin/HR | admin@atomquest.com | admin123 |
| Manager | manager@atomquest.com | manager123 |
| Manager | ravi@atomquest.com | ravi123 |
| Employee | alice@atomquest.com | alice123 |
| Employee | bob@atomquest.com | bob123 |
| Employee | carol@atomquest.com | carol123 |
| Employee | dave@atomquest.com | dave123 |

---

## 🌐 Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "AtomQuest Goals - Final Release"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Set **Environment Variables** in Vercel dashboard:
   - `DATABASE_URL` → Your Supabase pooled connection string (port 6543)
   - `DIRECT_URL` → Your Supabase direct connection string (port 5432)
   - `AUTH_SECRET` → A random 32-character secret
3. Click **Deploy**

### 3. Initialize Production Database
After first deployment, run the following from your local machine:
```bash
# Push schema to production database
npx prisma db push

# Seed demo data (optional)
npm run db:seed
```

> **Note**: Vercel automatically runs `prisma generate` during build via the build script.

---

## 📁 Project Structure

```
Atom_Quest/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── approvals/     # Manager approval workflow
│   │   │   ├── check-ins/     # Quarterly check-in dashboard
│   │   │   ├── completion/    # Admin completion tracker
│   │   │   ├── cycles/        # Goal cycle management
│   │   │   ├── goals/         # Goal list & creation
│   │   │   ├── reports/       # Reports & analytics
│   │   │   ├── shared-goals/  # Shared team goals
│   │   │   ├── team/          # Team management
│   │   │   └── unlock/        # Admin goal unlock
│   │   ├── api/
│   │   │   ├── auth/          # Auth.js API routes
│   │   │   └── export/excel/  # Excel export API
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── app-sidebar.tsx    # Mobile-responsive sidebar
│   │   └── theme-toggle.tsx   # Dark/light mode
│   └── lib/
│       ├── actions/           # Server actions
│       ├── quarterly-windows.ts # Window enforcement
│       ├── progress.ts        # Progress calculation
│       ├── schemas.ts         # Zod validation
│       ├── auth.ts            # Auth configuration
│       └── prisma.ts          # Prisma client
└── package.json
```

---

## 📊 Quarterly Window Schedule

| Window | Period | Purpose |
|--------|--------|---------|
| Goal Setting | May 1 – Jun 30 | Create and submit goals |
| Q1 Check-in | Jul 1 – Jul 31 | First quarter review |
| Q2 Check-in | Oct 1 – Oct 31 | Mid-year review |
| Q3 Check-in | Jan 1 – Jan 31 | Third quarter review |
| Q4 / Annual | Mar 1 – Apr 30 | Year-end review |

> Admin users can bypass all window restrictions.

---

## 📝 License

MIT License — Built for AtomQuest Hackathon
