# Database Architecture Specification

## Schema Design & Relationships
The database is structured as a relational schema adhering to 3NF standards where appropriate, with foreign keys, compound indexes, and explicit tenant scoping.

### Core Tables
1. **Tenants & IAM**:
   - `users`: Identity, authentication credentials, and user profile.
   - `agencies`: The tenant entity. Holds name, slug, branding, settings, and base currency (default NPR).
   - `agency_members`: Maps `users` to `agencies` with specific roles (`AGENCY_OWNER`, `AGENCY_ADMIN`, `CAMPAIGN_MANAGER`, `DESIGNER`, `CONTENT_WRITER`, `MARKETING_EXECUTIVE`).
   - `invitations`: Secure invitation tokens for team onboarding.
   - `subscriptions`: Agency SaaS subscription plan and billing state.

2. **Client Management (CRM)**:
   - `clients`: Companies/brands managed by an agency.
   - `client_members`: Client users granted restricted access to the Client Portal for a given client.

3. **Campaigns & Tasks**:
   - `campaigns`: Marketing campaigns linked to a client and agency.
   - `campaign_members`: Team members assigned to work on a campaign.
   - `tasks`: Execution items with statuses (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `BLOCKED`).
   - `task_comments`: Collaboration discussion on specific tasks.

4. **Creatives, Content & Approvals**:
   - `content_posts`: Scheduled content/posts with status pipeline (`IDEA` -> `DRAFT` -> `INTERNAL_REVIEW` -> `CLIENT_APPROVAL` -> `APPROVED` -> `SCHEDULED` -> `PUBLISHED`).
   - `content_versions`: Immutable versions of post copies and creative media assets.
   - `approvals`: Formal approval requests presented in the Client Portal (`PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `REJECTED`).
   - `approval_comments`: Review feedback from clients.

5. **Advertising, Budgets & Reports**:
   - `ad_accounts` & `ad_campaigns`: Paid ad setups across Meta, Google, TikTok, LinkedIn.
   - `ad_metrics`: Ingested / entered performance metrics (impressions, clicks, spend, conversions, ROAS).
   - `budgets` & `expenses`: Allocated budgets vs. actual ad spend and production costs.
   - `reports`: Saved and published performance reports with public share tokens.

6. **Auditing & Telemetry**:
   - `activity_logs`: Immutable audit trail of critical agency actions.
   - `notifications`: User notifications for assignments, approvals, and deadlines.
