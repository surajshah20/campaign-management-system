# Security & Compliance Specification

## Security Tenets

1. **Multi-Tenant Isolation**:
   - Every request is validated to ensure the authenticated user is an active member of the target `agency_id`.
   - Never trust frontend-supplied tenant identifiers. Tenant identity is resolved from the cryptographically verified session.
   - Database operations are scoped with compound conditions `where: { id, agency_id }`.

2. **Access Control (RBAC)**:
   - System recognizes 7 distinct personas:
     - Platform Owner (SaaS infrastructure admin)
     - Agency Owner (Full agency control + billing)
     - Agency Admin (Team management & agency config)
     - Campaign Manager (Campaign, client & task owner)
     - Designer (Creative asset and version uploads)
     - Content Writer (Post copy and calendar authoring)
     - Marketing Executive (Paid ad setups & performance metrics)
     - Client (Portal only, scoped strictly to approved assets of assigned client)

3. **Credential & Session Security**:
   - Passwords hashed using standard `bcrypt` with salt rounds >= 10.
   - JWT tokens signed with secure secret key, short-lived (15 min access, 7 day refresh).
   - Cookies marked `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` in production.

4. **Network & Transport Hygiene**:
   - Strict CORS policy disallowing unauthorized origins.
   - Helmet protection for standard headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).
   - Rate limiting on authentication routes (brute-force protection).
   - Input sanitization and strict Zod validation on every endpoint.
