# Earn App Handoff

## START

- Target application root: `/Users/lekshmisyam/Desktop/Ikigai/earn-app`
- Reusable instructions root: `Loop/`
- Product: local-only vanilla HTML/CSS/JavaScript expense and income PWA.
- Permanent constraints: preserve local-only financial data, offline behavior, existing user data, and focused UI.

## MID

- Baseline: `main` at `928d943996d4789e425d160ded69baa0ba3288b9`.
- Existing working tree before CP-001: modified `.DS_Store` and untracked `Loop/`; both are user-owned and outside implementation scope.
- Active Conductor UPI redesign plan is stale: pending-payment logic already exists in the application.

## NOW

### CP-001 — Lite meditation collection integration

- Status: implemented and validated through runtime evidence.
- Objective: support `receive.html?Source=Lite` with a saved per-client service charge, calculated amount, Lite-only Sadhana category, fixed description, and Lite return navigation.
- Scope: setup form/storage, receive flow, receive QR flow, service-worker cache, static/browser validation.
- Implementation profile: production-shaped vanilla JavaScript browser PWA; localStorage persistence; HTTP static-file transport; no backend, database, queue, worker, or WebSocket required for this feature.
- Result: setup stores `earn_serviceCharge`; existing users are migrated through the prefilled setup form; Lite collections calculate service charge × clients, select Sadhana, preserve the requested description, and return to the allowlisted Lite URL from both receive pages.
- Validation:
  - `static` PASS — JavaScript syntax, manifest parse, diff whitespace, contract strings, and 114 service-worker cache references checked.
  - `unit` PASS — `node --test tests/lite-receive.test.js` (4/4).
  - `runtime` PASS — local HTTP server returned 200 for index, Lite receive, and Lite receive QR pages; server stopped cleanly.
  - `browser` BLOCKED — no connected in-app or external browser backend was available.
- Security/privacy: service charge and transaction metadata remain in localStorage; setup return route is an exact local allowlist match; Lite return URL is a fixed HTTPS destination.
- Open risk: EasyQRCodeJS remains an existing external CDN dependency, so first-time QR generation is not fully offline.
- Git checkpoint: `b036607` (`[CP-001] Add Lite meditation collection flow`).
- Next: browser/manual visual verification when a browser backend is available, then deploy only with explicit user approval.

### CP-002 — Gate Quick Scan behind completed setup

- Status: implemented and validated.
- Objective: prevent Quick Scan from appearing until UPI ID, payee name, and service charge are valid.
- Scope: default HTML visibility, setup-state synchronization, service-worker cache, focused regression test.
- Result: the link is hidden before JavaScript runs and becomes visible only when UPI ID, payee name, and a positive service charge are stored; successful setup reveals it immediately.
- Validation: `static` PASS (syntax, cache references, diff check); `unit` PASS (`node --test tests/*.test.js`, 5/5 including the new visibility regression).
- Browser evidence remains environment-blocked from CP-001; this focused fix introduced no dependency or architecture change.
- Existing unrelated working state remains modified `.DS_Store` and untracked `Loop/`.
- Git checkpoint: pending.
- Next: browser/manual visual verification when available.

### CP-003 — QR edit-history navigation

- Status: implemented and validated.
- Objective: add a separate QR-page history-back link for editing without discarding the pending collection.
- Scope: QR navigation, Lite pending-value restoration, focused tests, service-worker cache.
- Baseline: external commit `799dba7` included CP-002 plus broader user files; it was preserved and revalidated.
- Result: QR page exposes “Edit payment details”; it uses history-back when available, preserves the pending transaction, and has a direct receive-page fallback. Lite forms restore pending clients and description before recalculating the amount.
- Validation: `static` PASS (syntax, cache references, diff check); `unit` PASS (`node --test tests/*.test.js`, 6/6).
- Git checkpoint: pending.
- Next: browser/manual visual verification when available.
