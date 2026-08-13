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
- Git checkpoint: included in external commit `799dba7` (`update`).
- Next: browser/manual visual verification when available.

### CP-003 — QR edit-history navigation

- Status: implemented and validated.
- Objective: add a separate QR-page history-back link for editing without discarding the pending collection.
- Scope: QR navigation, Lite pending-value restoration, focused tests, service-worker cache.
- Baseline: external commit `799dba7` included CP-002 plus broader user files; it was preserved and revalidated.
- Result: QR page exposes “Edit payment details”; it uses history-back when available, preserves the pending transaction, and has a direct receive-page fallback. Lite forms restore pending clients and description before recalculating the amount.
- Validation: `static` PASS (syntax, cache references, diff check); `unit` PASS (`node --test tests/*.test.js`, 6/6).
- Git checkpoint: `27c64e1` (`[CP-003] Add QR edit history navigation`); handoff reference completed by `b07d9ae`.
- Next: browser/manual visual verification when available.

### CP-004 — Divine balance symbol

- Status: implemented and validated.
- Objective: replace the balance-scale symbol with the lotus prosperity symbol.
- Scope: balance display text, focused regression test, service-worker cache.
- Result: balance now renders as `🪷 <amount> ₹`.
- Validation: `static` PASS (syntax, cache references, diff check); `unit` PASS (`node --test tests/*.test.js`, 7/7).
- Git checkpoint: `6375b59` (`[CP-004] Use lotus for balance`).
- Next: browser/manual visual verification when available.

### CP-005 — Google Pay-compatible UPI preservation and manual confirmation

- Status: implemented and validated through runtime/protocol evidence.
- Objective: preserve scanned UPI merchant contracts, remove URL-based false success, and prompt for manual confirmation after returning from a UPI app.
- Scope: bounded UPI parser/builder, send flow, return state, confirmation UX, cache, protocol-focused tests.
- Security decision: a URL return is never payment proof; transactions remain pending until explicit user confirmation. Automatic verification is deferred until a bank/PSP server integration exists.
- Result: scanned merchant fields are preserved; missing personal/static-QR fields receive bounded defaults; amount mismatches and unsafe signed-QR mutations are rejected; the reference URL resolves within Earn; UPI app return opens a clearly labeled manual confirmation.
- Privacy: transaction and pending-state debug logging was removed from the confirmation path.
- Validation:
  - `static` PASS — JavaScript syntax, 115 cached assets, and diff checks.
  - `protocol` PASS — `node --test tests/*.test.js` (12/12), including merchant preservation, personal QR defaults, mismatch rejection, signature preservation, and manual-only return.
  - `runtime` PASS — local HTTP server returned 200 for index and send pages and served the current UPI/confirmation scripts.
  - `browser` BLOCKED — no connected browser backend was available; no real Google Pay financial transaction was attempted.
- Open risk: device-level behavior still needs a real Android/Google Pay test using a low-value payment; bank status remains user-confirmed.
- Git checkpoint: `6a15312` (`[CP-005] Preserve UPI requests and confirm manually`).
- Next: device-test merchant and personal QR payments, then push only when explicitly requested.

### CP-006 — Preserve personal UPI classification

- Status: implemented and validated through protocol evidence.
- Objective: address Google Pay's low-value “limit exceeded” rejection for personal/static QR payments.
- Finding: Earn was adding merchant/reconciliation fields (`mc=0000`, `tr`, and `url`) to personal QRs that did not provide them, which can change how the PSP classifies and validates the request.
- Result: personal QRs now receive only the entered amount, INR currency, and bounded optional note. Merchant QRs continue to retain every merchant field supplied by the QR.
- Validation: `static` PASS (syntax, 115 cache references, diff check); `protocol` PASS (`node --test tests/*.test.js`, 12/12).
- Caveat: Google Pay may still show the same message for a genuine payer-bank daily/count/cooling-period limit; only a real device retry can distinguish that external condition.
- Git checkpoint: `db64a17` (`[CP-006] Keep personal UPI requests minimal`).
- Next: deploy when requested, refresh the installed PWA, and retry ₹10 against the same personal QR.

### CP-007 — Activate PWA fixes immediately

- Status: implemented and validated.
- Objective: ensure an installed Earn PWA stops serving the previous cached UPI builder after a successful deployment.
- Finding: GitHub Pages served CP-006 correctly, but the v15 service worker could remain active while v16 waited, leaving the old `mc=0000`, `tr`, and `url` behavior on the device.
- Result: service-worker updates bypass the browser HTTP cache, explicitly check for updates, activate immediately, remove only obsolete Cache Storage entries, and claim open Earn pages. Financial data in localStorage is untouched.
- Cache checkpoint: `earn-app-v17`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit/protocol` PASS (`node --test tests/*.test.js`, 13/13), including immediate service-worker activation and local-data preservation assertions.
- Next: commit, push, confirm the GitHub Pages build, then retest after reopening Earn.

### CP-008 — Reliable QR-to-UPI launch

- Status: implemented and validated at the available evidence levels.
- Objective: fix Add Expense stalling after QR detection, the black camera on retry, and Quick Scan losing the Google Pay intent during app unlock.
- Finding: external UPI navigation ran from asynchronous camera callbacks; Add Expense additionally waited for camera shutdown before navigation. Mobile browsers may reject that non-user-initiated launch, and an unresolved scanner instance retained the camera.
- Result: both scanners now stop and release the camera after detection, then expose a direct user-tap UPI link. Add Expense persists one pending transaction only when the link is tapped; Quick Scan keeps the link available for a second tap when Google Pay first opens only to unlock. Raw UPI IDs no longer create an invalid zero-amount request.
- Cache checkpoint: `earn-app-v18`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit/protocol` PASS (`node --test tests/*.test.js`, 14/14); `browser` BLOCKED (no local or connected browser backend available); `manual` pending on Android/Google Pay.
- Next: confirm the Pages deployment, then device-test both paths.

### CP-009 — Income-focused landing experience

- Status: implemented and validated.
- Objective: align Earn's landing page with its earning purpose while preserving the unfinished expense capability.
- Result: the landing-page Expense button and Total Expenses card are hidden without deletion; the lotus figure now labels and displays total Income; the type filter defaults and resets to Income; the FAQ explains that a refined expense experience is coming soon. Expense files, records, filters, and transaction handling remain intact.
- Cache checkpoint: `earn-app-v19`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit` PASS (`node --test tests/*.test.js`, 16/16), including hidden-but-preserved expense controls, income default/reset, income lotus total, and FAQ wording.
- Next: push and confirm the GitHub Pages build when requested.

### CP-010 — Editable Lite income amount

- Status: implemented and validated.
- Objective: allow `receive.html?Source=Lite` users to adjust the calculated income amount.
- Result: service charge × clients remains the initial suggested amount and continues recalculating while untouched. Once the user edits the amount, later client changes preserve that manual value. Returning from the QR edit link restores a manually adjusted pending amount.
- Cache checkpoint: `earn-app-v20`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit` PASS (`node --test tests/*.test.js`, 17/17), including manual amount preservation and pending-edit restoration.
- Next: push CP-009 and CP-010 and confirm the GitHub Pages build.

### CP-011 — Hide Quick Scan launcher

- Status: implemented and validated.
- Objective: remove the outgoing-payment shortcut from Earn's income-focused landing experience without deleting its implementation.
- Result: Quick Scan remains available in the codebase but its landing-page link stays hidden regardless of setup status.
- Cache checkpoint: `earn-app-v21`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit` PASS (`node --test tests/*.test.js`, 17/17), including persistent Quick Scan hiding.
- Next: commit, push, and monitor the superseding GitHub Pages build.

### CP-012 — Remove Quick Scan floating icon

- Status: implemented and validated.
- Objective: ensure the outgoing-payment shortcut is no longer present on the landing page, including on clients where author CSS could interfere with the HTML `hidden` attribute.
- Result: the Quick Scan anchor is removed from `index.html`; `quickscan.html`, its scripts, styles, and cached assets remain preserved for future refinement.
- Cache checkpoint: `earn-app-v22`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit` PASS (`node --test tests/*.test.js`, 17/17), including absence of the landing-page Quick Scan anchor.
- Next: commit, push, and confirm the newest GitHub Pages build.
