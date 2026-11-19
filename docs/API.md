# API Specification & Conventions

## General Conventions
- All endpoints are prefixed with `/api/v1`.
- Authentication is handled via HTTP-only cookie (`access_token`) or Bearer token header.
- Responses follow standard JSON format:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "total": 100, "page": 1, "limit": 20 }
  }
  ```
- Error format:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request parameters",
      "details": [ ... ]
    }
  }
  ```

## Key API Route Groups
- `/api/v1/auth`: Authentication, registration, login, logout, password reset, profile.
- `/api/v1/workspaces`: Agency workspace management, settings, switching.
- `/api/v1/team`: Member invitations, roles, permissions.
- `/api/v1/clients`: Agency client management (CRM).
- `/api/v1/campaigns`: Campaign lifecycle, platforms, objectives.
- `/api/v1/tasks`: Task boards, assignments, status updates, comments.
- `/api/v1/content`: Content calendar, post creation, versioning.
- `/api/v1/portal`: Restricted endpoints accessed by Client users for reviewing content and approving assets.
- `/api/v1/advertising`: Paid campaign management, metrics ingestion.
- `/api/v1/budgets`: Budget allocations, expenses, currency settings.
- `/api/v1/reports`: Campaign report generation and public share token verification.
- `/api/v1/analytics`: Aggregated executive performance metrics.
