# Supervisor Change Trace Guide (Non-Technical)

This guide helps you quickly show where a change should happen.
It is written for walkthroughs with managers, QA, and non-technical reviewers.

## 1) Fast Rule

Always trace in this order:

1. Screen file (what user sees)
2. Frontend API call (what data is sent)
3. Backend route (where request enters)
4. Controller (request checks)
5. Service (business decision)
6. Model (data fields used)

Use this sentence:

"This is the screen, this is the API call, this is the backend check, and this is the final business rule."

## 2) If Supervisor Says: Change Colors

Check these first:

- `client/src/index.css` for global app colors.
- `client/tailwind.config.js` for utility color setup.
- `client/src/components/ui/*` for shared button/input/card colors.
- Specific page file in `client/src/pages/*` for page-only styling.

How to present:

1. Show current screen.
2. Show exact color token/class location.
3. Show one small change.
4. Rebuild and show updated screen.

## 3) If Supervisor Says: Change Validation

Validation usually exists in two places:

- Frontend validation (user feedback) in page files like checkout.
- Backend validation (data safety) in middleware/controllers/services.

Typical files:

- Frontend: `client/src/pages/Checkout.jsx`
- Frontend API payload: `client/src/services/orderApi.js`
- Backend middleware: `server/middleware/validation.js`
- Backend controller/service: `server/controllers/*`, `server/services/*`

How to present:

1. Show frontend message rule.
2. Show backend safety rule.
3. Confirm both sides match.
4. Show test/build proof.

## 4) If Supervisor Asks: Where Is Delivery Assignment Logic?

Main logic path:

- `server/services/orderService.js` (auto-assignment)
- `server/controllers/deliveryController.js` (delivery status and availability reset)
- `server/controllers/adminController.js` (manual assignment fallback)

Key point:

- Assignment is workload-based, not random.

## 5) CODEMAP Search Workflow

Use VS Code search for:

- `CODEMAP:` to jump to architecture comments.
- `validateForm` for frontend input checks.
- `router.` in `server/routes/*` to find endpoint path.
- `exports.` in controllers to find handler names.
- service method names in `server/services/*` for final decisions.

## 6) Safe Update Checklist (Before Commit)

1. Did we change only what was requested?
2. Did we avoid database/schema changes unless requested?
3. Did we keep comments simple and useful?
4. Did we run lint/build/tests?
5. Can we explain flow from page to service to route to controller to service?

## 7) Suggested Review Meeting Script

- "Request received: color/validation/flow update."
- "Here is the exact screen file."
- "Here is the API function used by that screen."
- "Here is the backend endpoint and checks."
- "Here is the business-rule function that decides behavior."
- "Here is proof from build/tests."

This script keeps reviews clear and consistent for technical and non-technical audiences.
