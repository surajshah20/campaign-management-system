# Agency OS - Architecture Specification

## Overview
Agency OS is a commercial, multi-tenant B2B SaaS platform designed specifically for digital marketing agencies. It centralizes agency workflow from campaign ideation, task management, creative design, client approvals, advertising performance tracking, budget monitoring, to automated client reporting.

## Core Architectural Principles
1. **Multi-Tenancy by Design**:
   - Every tenant is an `Agency`.
   - All agency data is strictly isolated using `agency_id` scoping at the database and middleware layers.
   - Client portal users are sub-tenants tied to a single `client_id` under an agency.
2. **Layered Decoupled Architecture**:
   - **Presentation Layer**: React 19 + TypeScript + Vite with shadcn/ui and Tailwind CSS.
   - **API / Gateway Layer**: Express.js REST API with Helmet, CORS, Rate Limiting, and Cookie-based Auth.
   - **Business Logic Layer**: Domain services handling agency lifecycle, campaigns, tasks, and approval state machines.
   - **Data Access Layer**: Prisma ORM with strict tenant-scoping extension and relational referential integrity.
3. **Defense in Depth**:
   - Never rely on frontend checks for security.
   - Never accept an `agency_id` parameter directly from client requests without verifying authorization.
   - Passwords hashed using bcrypt/argon2.
   - HTTP-only, SameSite, Secure cookies for JWT session management.

## System Topology
```
[React SPA Client] ──(HTTPS / REST)──> [Express API Gateway]
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
            [Business Services]                              [File Storage Adapter]
                     │
                     ▼
           [PostgreSQL / SQLite]
```
