# Agency OS — Enterprise Multi-Tenant SaaS for Digital Marketing Agencies

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-38bdf8.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant-indigo.svg)](docs/ARCHITECTURE.md)

**Agency OS** is a commercial, multi-tenant B2B SaaS platform engineered specifically for digital marketing agencies. It unifies the end-to-end agency lifecycle into a high-density, software suite: **Manage → Create → Approve → Publish → Analyze → Report**.

Inspired by the precision, typography, and usability of **Linear**, **Stripe**, and **Attio**, Agency OS provides agencies with a minimal, high-performance interface with backend-enforced tenant isolation and role-based access control.

---

## System Architecture & Topology

```
┌────────────────────────────────────────────────────────┐
│               React SPA Client (Vite)                  │
│   • Linear / Stripe Caliber Interface (shadcn/ui)      │
│   • TanStack Query Caching & Zustand UI State          │
│   • Responsive Agency Dashboard & Client Portal        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST / Cookies
                            ▼
┌────────────────────────────────────────────────────────┐
│             Node.js + Express API Gateway              │
│   • Helmet, Strict CORS & Rate Limiting                │
│   • Cookie-Based Session JWT Verification              │
│   • Tenant Isolation Middleware (`req.tenant`)         │
│   • RBAC Policy Authorization (`requirePermission`)    │
│   • Zod Schema Input Validation                        │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Business Domains      │ │   Third-Party Services    │
│  • Workspaces & IAM       │ │  • S3 / Cloudinary Assets │
│  • Client CRM & Portal    │ │  • Meta / Google Ad Sync  │
│  • Campaigns & Kanban     │ │  • PDF Report Engine      │
│  • Content Studio & Vers. │ │  • Email Notifications    │
└─────────────┬─────────────┘ └───────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────┐
│            Data Layer & Storage Isolation              │
│   • PostgreSQL / SQLite via Prisma ORM                 │
│   • Compound Scoping `WHERE agency_id = ?`             │
│   • Sub-tenant Client Boundary `client_id = ?`         │
└────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### 1. Multi-Tenant Architecture & Dynamic Workspaces
* **Organizational Isolation**: Every agency workspace is an isolated tenant. No agency can ever access or query another agency's private records.
* **Workspace Switcher**: Users belonging to multiple agencies can switch seamlessly between organizations without re-authenticating.
* **Accounting Standards**: Configurable currency per agency with native **NPR (Nepalese Rupee)** support alongside USD, EUR, GBP, and INR.

### 2. Role-Based Access Control (RBAC)
Granular, backend-enforced permissions across 7 distinct personas:
* **Agency Owner**: Full administrative governance, billing, member deletion, and workspace settings.
* **Agency Admin**: Team management, invitations, client creation, and operational control.
* **Campaign Manager**: Manages clients, schedules campaigns, delegates tasks, and tracks budgets.
* **Designer**: Creative asset uploads, version iterations, and task execution.
* **Content Writer**: Caption drafting, calendar planning, and copy editing.
* **Marketing Executive**: Paid advertising setups, campaign metrics, and spend tracking.
* **Client (External)**: Restricted to the Client Portal. Can only review assigned creatives and click *Approve* or *Request Changes*.

### 3. Client Management & CRM Workspaces
* Complete client directories with status filters (`ACTIVE`, `ONBOARDING`, `PAUSED`, `INACTIVE`) and instant search.
* **Dedicated Client Workspaces**:
  * **Overview**: Corporate details, assigned account manager, and internal notes.
  * **Campaigns**: Associated marketing initiatives.
  * **Client Portal Access**: Authorized client contacts permitted to sign off on assets.

### 4. Campaign Orchestration
* Multi-platform campaign wizard: Instagram, Facebook, TikTok, YouTube, LinkedIn, Google Ads.
* Lifecycle state machine: `DRAFT` → `PLANNING` → `ACTIVE` → `PAUSED` → `COMPLETED` → `ARCHIVED`.
* Campaign workspace with sub-sections for Strategy, Tasks, Content, and Budget.

### 5. Task Management & Interactive Kanban Board
* Multiple views: Interactive **5-Column Kanban Board** (`To Do`, `In Progress`, `In Review`, `Completed`, `Blocked`) and high-density **List View**.
* Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
* Threaded task comments for internal team collaboration.

### 6. Content Studio & Social Media Calendar
* Content pipeline: `IDEA` → `DRAFT` → `INTERNAL_REVIEW` → `CLIENT_APPROVAL` → `APPROVED` → `SCHEDULED` → `PUBLISHED`.
* **Immutable Version History**: When creative changes are requested, a new version (e.g. `V2`) is created while keeping `V1` intact for auditability.
* Caption drafting and visual media asset previews.

### 7. Restricted Client Review Portal
* Isolated sub-portal for external brand clients.
* Full media previews, caption copy, and version history.
* **One-Click Actions**:
  * **Approve Asset**: Transitions content to approved for scheduling.
  * **Request Changes**: Records specific feedback and prompts the creative team for Version `N+1`.
  * **Review History**: Audit trail with timestamps and feedback notes.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18 / 19, TypeScript, Vite, Tailwind CSS, Radix UI (shadcn primitives), Lucide React, Recharts |
| **Client State** | TanStack Query v5 (server-cache), Context API (auth & tenant state) |
| **Backend** | Node.js (v24+), Express, TypeScript, Zod Schema Validation, Helmet, CORS, Cookie-Parser |
| **Security & IAM** | JWT in HTTP-only SameSite cookies, bcrypt password hashing, Crypto token generator |
| **ORM & Database** | Prisma ORM, SQLite (local development), PostgreSQL-ready with compound tenant indices |

---

## Directory Structure

```text
campaign_management_system/
├── docs/                        # Architecture, DB Schema, API & Security Specs
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── SECURITY.md
│
├── server/                      # Express TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Complete relational schema
│   │   └── seed.ts              # Realistic development demo fixtures
│   ├── src/
│   │   ├── constants/           # Roles, permissions, and status enums
│   │   ├── controllers/         # Thin HTTP controllers
│   │   ├── middleware/          # auth.ts, tenant.ts, rbac.ts, validate.ts
│   │   ├── routes/              # Modular Express routers
│   │   ├── services/            # Pure business domain logic
│   │   └── server.ts            # Entrypoint
│   └── test/                    # Automated integration & isolation test suites
│
└── client/                      # React TypeScript Frontend (Vite)
    ├── src/
    │   ├── api/                 # Fetch client with credentials & CSRF
    │   ├── components/
    │   │   ├── layout/          # AppLayout, Sidebar, TopNavigation
    │   │   └── ui/              # Button, Input, Badge, Card, Dialog, Skeleton
    │   ├── context/             # AuthContext & active workspace state
    │   └── features/            # Feature modules
    │       ├── auth/            # LoginPage, RegisterPage
    │       ├── dashboard/       # OverviewPage (Live Recharts dashboard)
    │       ├── clients/         # ClientsPage, ClientDetailPage
    │       ├── campaigns/       # CampaignsPage, CampaignDetailPage
    │       ├── tasks/           # TasksPage (Kanban & List views)
    │       ├── content/         # ContentCalendarPage
    │       ├── approvals/       # ClientPortalPage
    │       ├── team/            # TeamPage (Members & Invitations)
    │       └── settings/        # SettingsPage (Workspace configuration)
    └── tailwind.config.js       # Design system tokens & Inter font
```

---

## Getting Started

### Prerequisites
* **Node.js**: `v20.x` or higher (Tested on `v24.12.0`)
* **Package Manager**: `pnpm` (recommended) or `npm`

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/surajshah20/campaign-management-system.git
   cd campaign-management-system
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   pnpm install
   ```

3. **Initialize Database & Seed Demonstration Data**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

4. **Install Client Dependencies**:
   ```bash
   cd ../client
   pnpm install
   ```

---

## Running the Application

### Development Mode

Start both servers in separate terminal tabs:

* **Backend API Server** (Port 5000):
  ```bash
  cd server
  pnpm run dev
  ```
* **Frontend Application** (Port 5173):
  ```bash
  cd client
  pnpm run dev
  ```

Open your browser to: **[http://localhost:5173](http://localhost:5173)**

---

## Development Demonstration Accounts

For local evaluation, four pre-configured accounts are seeded with sample records:

| Role | Email | Password | Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **Agency Owner** | `owner@apexdigital.com` | `Password123!` | Full workspace access, billing, settings, team invitations |
| **Campaign Manager** | `manager@apexdigital.com` | `Password123!` | Campaign creation, task delegation, budget tracking |
| **Designer** | `designer@apexdigital.com` | `Password123!` | Creative uploads, version iterations |
| **Client Contact** | `client@himalayancoffee.com` | `Password123!` | Restricted Client Portal access (approvals & sign-offs) |

*You can also create a new organization from scratch at any time via the `/register` onboarding flow.*

---

## Automated Test Suites

Agency OS includes integration tests verifying multi-tenant isolation, authorization, and operational workflows:

```bash
cd server

# Run Auth & Multi-Tenant Isolation Tests
npx tsx test/auth-tenant.test.ts

# Run Client CRM & Team Governance Tests
npx tsx test/operations.test.ts

# Run Campaign, Kanban Task & Version Approval Tests
npx tsx test/campaigns-content.test.ts
```

All 17 integration tests pass with zero warnings.

---

## Technical Documentation

* [Architecture Specification](docs/ARCHITECTURE.md)
* [Database & Relational Model](docs/DATABASE.md)
* [API Conventions & Endpoints](docs/API.md)
* [Security & Tenant Isolation Standards](docs/SECURITY.md)

---

## Roadmap

- [x] **Phase 1: Foundation** (Monorepo, Database Schema, Auth, RBAC, Design System, Executive Overview)
- [x] **Phase 2: Agency Operations** (Client CRM, Dedicated Client Workspaces, Team Invitations, Audit Stream)
- [x] **Phase 3: Campaign Operations** (Campaign wizard, Multi-platform lifecycle, Interactive 5-Column Kanban Board)
- [x] **Phase 4: Content Studio & Approvals** (Social calendar, Immutable version iterations, Restricted Client Portal)
- [ ] **Phase 5: Paid Advertising & Analytics** (Meta & Google Ad performance ingestion, ROAS trends, Conversion charts)
- [ ] **Phase 6: Client Reports** (PDF report generation & public share links)
- [ ] **Phase 7: Third-Party Integrations** (Meta Marketing API, Google Ads API, S3/Cloudinary media storage)
- [ ] **Phase 8: Commercial SaaS** (Subscription billing & usage tiers)

---

## License

This software is developed as a commercial SaaS product. All rights reserved.
