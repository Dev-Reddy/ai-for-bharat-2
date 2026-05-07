# LeadOS Implementation Overrides

This file captures the agreed implementation overrides that differ from the original PDF/docs set in this folder.

## Product Scope Overrides

- MVP is currently treated as a **single-client white-label deployment**, not a true multi-tenant SaaS platform.
- We are **not** introducing `clients`, `tenant_id`, or platform-admin tenancy controls in the current phase.
- Admin and RM remain as separate portals for now to keep delivery faster.

## Auth Overrides

- Auth uses **Supabase email + password only**.
- Public signup is not allowed.
- Users are created only by admin flows.
- Role is enforced with a custom JWT claim:
  - `user_role = admin | rm`
- Built-in Supabase JWT claim `role` remains `authenticated`.
- Password setup for new users uses **invite flow**.
- Forgot-password remains user self-service.

## Frontend Architecture Overrides

- We are using **TanStack Store** for auth/app store state instead of Zustand.
- We are using **TanStack Query** for server state.
- Portals currently talk to **Supabase Auth directly** for:
  - login
  - logout
  - invite/recovery password update
- Portal business APIs continue through Supabase Edge Functions.

## Backend Overrides

- Current backend focus is the **auth and user-management foundation** first.
- Implemented Edge Function shape:
  - `/functions/v1/api`
- Current user-management routes use:
  - `GET /functions/v1/api/users`
  - `PATCH /functions/v1/api/users/:id`
  - `DELETE /functions/v1/api/users/:id`
- Auth/profile routes currently include:
  - `GET /functions/v1/api/auth-me`
  - `POST /functions/v1/api/admin-create-user`
  - `POST /functions/v1/api/admin-resend-invite`
  - `POST /functions/v1/api/forgot-password`

## Portal/Auth Behavior

- Admin portal only allows `user_role=admin`.
- RM portal only allows `user_role=rm`.
- Wrong-portal login signs the user out immediately and shows unauthorized state.

## Current Constraint

- The original backend/docs describe a larger end-to-end lead system.
- That full scope is **not implemented yet**.
- Current implementation is limited to auth, user management, and portal auth integration.
