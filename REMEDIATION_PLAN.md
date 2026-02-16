# Remediation Plan (Production Readiness)

## Phase 0 - Immediate (0-3 days)
- **Backend**: Fix order access control (customer ownership, role checks), remove sensitive logging, wire auth rate limits.
- **Backend**: Align API base paths (`/api/v1`) and add legacy aliases for compatibility.
- **Backend**: Enforce delivery distance validation on order creation.
- **Frontend**: Remove mock checkout/order tracking flows and hard-block production builds without live API wiring.
- **DevOps**: Rotate secrets; remove hardcoded DB creds from repo; enforce HTTPS for all endpoints.

## Phase 1 - Stabilize Core Transactions (4-14 days)
- **Backend**: Replace controller order flow with transactional service (stock reservation, payment verify, status history).
- **Backend**: Add payment init + webhook endpoints (PayHere/Stripe) with signature validation and idempotency keys.
- **Backend**: Restore automated jobs (combo schedules, auto-disable stock, token cleanup) with job health checks.
- **Frontend**: Implement real cart/checkout/order history/tracking with loading/error states.
- **QA**: Add integration tests for order placement, cancellation/refund, and stock oversell prevention.

## Phase 2 - Security Hardening (15-30 days)
- **Backend**: Move JWT to HttpOnly cookies; add CSRF protection.
- **Backend**: Add audit logs for admin actions and payment changes.
- **Backend**: Add device/IP-based anomaly checks for OTP and login abuse.
- **Frontend**: Add role-aware UI rendering but rely on server-side enforcement.

## Phase 3 - Scale and Reliability (31-60 days)
- **Backend**: Add caching for menu and category reads, and pagination for admin lists.
- **DB**: Add composite indexes for report queries; implement data retention for logs.
- **Ops**: Add monitoring/alerts for payment failures, high error rates, and job failures.

## Acceptance Criteria
- Orders are fully transactional with no stock oversell under concurrency.
- All payments are verified by webhook signature; failed payments trigger retry UI.
- Customer order access is restricted to ownership; staff access is role-limited.
- All core UI flows use real API endpoints and are tested in staging.
