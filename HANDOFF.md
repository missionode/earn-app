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

### CP-013 — Remove expense from landing analysis

- Status: implemented and validated.
- Objective: keep the landing-page analysis interface focused exclusively on income.
- Result: the Expense type option is hidden and the filtered summary displays only Filtered Income. Expense data and supporting implementation remain preserved.
- Cache checkpoint: `earn-app-v23`.
- Validation: `static` PASS (JavaScript syntax and diff checks); `unit` PASS (`node --test tests/*.test.js`, 17/17), including hidden Expense type and absent Filtered Expenses summary.
- Next: commit, push, and confirm the GitHub Pages build.

### CP-014 — Compact Sadhana lotus icon

- Status: implemented and validated.
- Objective: replace the oversized Sadhana transaction artwork with a simple responsive symbol.
- Result: Sadhana now uses a square lotus SVG in the receive selector and both transaction views. Category icons have an explicit responsive 24×24 box, preventing large intrinsic SVG dimensions from stretching table rows.
- Cache checkpoint: `earn-app-v24`.
- Validation: `static` PASS (JavaScript syntax, SVG presence, cache inclusion, and diff checks); `unit` PASS (`node --test tests/*.test.js`, 18/18), including lotus mapping and responsive dimensions in both transaction views.
- Next: push and confirm the GitHub Pages build when requested.

### CP-015 — Namaskar icon for Sadhana

- Status: implemented and validated.
- Objective: distinguish Sadhana/Dakshina entries from the lotus used for total Income.
- Result: Sadhana now uses a custom square namaskar SVG in the receive selector and both transaction views, retaining the responsive 24×24 category-icon sizing from CP-014. The lotus remains the prosperity symbol for Income.
- Cache checkpoint: `earn-app-v25`.
- Validation: `static` PASS (JavaScript syntax, SVG presence, cache inclusion, and diff checks); `unit` PASS (`node --test tests/*.test.js`, 18/18), including namaskar mappings and responsive sizing.
- Next: commit, push, and confirm the GitHub Pages build.

### CP-016 — Earn logo-mark favicon

- Status: implemented and validated.
- Objective: provide a consistent favicon using the existing Earn logo mark.
- Result: a scalable blue-and-white Earn logo-mark favicon is referenced from every root application page, including pages that previously had no favicon and the QR page that incorrectly targeted the domain root. The legacy ICO remains available as a compatibility asset.
- Cache checkpoint: `earn-app-v26`.
- User artwork: the upgraded `assets/icons/namaskar.svg` supplied after CP-015 is preserved and included in this checkpoint.
- Validation: `static` PASS (favicon SVG structure, all root-page references, cache inclusion, JavaScript syntax, and diff checks); `unit` PASS (`node --test tests/*.test.js`, 19/19).
- Next: commit, push, and confirm the GitHub Pages build.

### CP-017 — Responsive 3D prosperity treasure physics

- Status: implemented, validated, and committed locally.
- Objective: replace the flat falling PNG animation with responsive 3D gold coins and faceted gemstones that follow normal Earth gravity, collide, bounce, roll, and remain as a bounded treasure pile at the bottom of the viewport.
- Branch/baseline: `feature/prosperity-coins` at `9a100e2`; user-owned `Template-earn/qrcode.jpeg` remains untracked and outside scope.
- Implementation profile: production-shaped vanilla browser PWA; transparent WebGL overlay; local ESM dependencies; no backend, database, queue, worker, or WebSocket.
- Physics decisions: gravity is fixed at `(0, -9.82, 0)` m/s²; release positions vary horizontally and in depth, while initial linear motion follows gravity; natural variation comes from orientation, angular velocity, collision, friction, and restitution. Static floor and viewport walls retain the pile. Sleeping bodies reduce CPU use.
- Visual/material direction: use procedural true-3D geometry rather than the legacy flat PNG faces. Coins retain realistic cylindrical thickness, raised rims, face detail, and distinct gold, silver, copper, and platinum physically based metals. The gemstone set uses diamond-cut faceting with clear/white diamond plus ruby, emerald, sapphire, amethyst, and warm topaz colourways; transmission, controlled transparency, environment reflections, specular highlights, and restrained bloom-like glints provide shine without obscuring the app.
- Lighting decision: a compact studio-style environment with key, fill, rim, and ground lighting will make reflections move as bodies rotate. Rendering remains transparent over the existing landing page, with tone mapping and capped pixel ratio for mobile performance.
- Responsive/performance decisions: world/camera bounds and coin/gem dimensions scale from viewport size; device-pixel ratio and active rigid bodies are capped; oldest pieces are recycled on repeated showers; reduced-motion and unavailable-WebGL clients receive a lightweight fallback.
- Result: clicking the keyboard-accessible prosperity container now lazily creates a transparent WebGL scene. Procedural coins and gems fall under Earth gravity, tumble in three axes, collide with one another and responsive boundaries, slide down a shallow basin, then remain as a settled treasure pile. Repeated showers retain a device-specific cap and recycle oldest pieces.
- Materials: coins use gold, silver, copper, and platinum PBR metals with cylindrical thickness, separate raised rims, reflected studio lighting, and bump-mapped ₹ relief. Faceted diamond, ruby, emerald, sapphire, amethyst, and topaz use transparent/transmissive PBR materials with distinct IOR/attenuation, environment reflections, tone mapping, and moving specular highlights.
- Responsive/accessibility: piece size scales from 24px mobile to 54px desktop; DPR caps are 1.5 mobile/2 elsewhere; body caps are 36/48/64. Reduced-motion or unavailable-WebGL clients receive a static responsive treasure fallback. The ARIA live region reports preparation, active treasure, or fallback state.
- Dependencies: approved `three@0.185.1`, `cannon-es@0.20.0`, and development-only `@playwright/test@1.62.0` are exact-lockfile pinned. Three and cannon runtime modules are vendored locally for offline use; no runtime CDN is required. Vendor SHA-256: Three module `86bcee...beb6`, Three core `05b260...fa90`, cannon-es `f0700...d37c`.
- Cache checkpoint: `earn-app-v27`; obsolete flat coin/jewel PNG cache entries were removed, while their source files remain preserved.
- Validation:
  - `static` PASS — JavaScript/MJS syntax, dependency import, service-worker assets, and `git diff --check`.
  - `unit` PASS — `npm test` (25/25), including Earth gravity, responsive tiers, bounded showers, materials, boundaries, offline modules, and exact dependencies.
  - `runtime` PASS — temporary Python server on `127.0.0.1:8765` returned HTTP 200 for the page and all 3D modules.
  - `browser` PASS — Playwright `1.62.0`, headless Chromium, zero retries: mobile `390x844`, tablet `768x1024`, desktop `1440x900` (3/3). Each scene loaded without page errors, rendered all ten material variants, stayed within its device cap, placed at least 90% of bodies in the central basin, and reached zero awake bodies. Temporary screenshots were visually inspected and removed.
  - Dependency/security PASS — `npm audit --omit=dev` found 0 vulnerabilities; `npm ls --all` is healthy. No financial/setup data enters rendering or diagnostics, and no external runtime request was introduced; OWASP ASVS L1 browser-facing dependency/source controls applied.
- Local run: from `/Users/lekshmisyam/Desktop/Ikigai/earn-app`, run `npm install`, then `python3 -m http.server 8765 --bind 127.0.0.1`; open `http://127.0.0.1:8765/index.html`. Validate with `npm test` and `npm run test:browser`. Stop the server with `Ctrl-C`; no database, queue, environment file, credential, or external service is required.
- Known limitation: final reflectivity and frame rate still merit manual testing on the target Android device/GPU; unsupported WebGL automatically uses the static fallback.
- Git checkpoint: `ca1a7d9` (`[CP-017] Add realistic 3D prosperity treasure`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: none within agreed local feature scope.
- Next: push/deploy only when explicitly requested, then perform target-device visual review.

### CP-018 — Progressive prosperity inventory and brilliant-cut gems

- Status: implemented, validated, and committed locally.
- Objective: let the daily prosperity inventory (460 on 2026-08-14, increasing by one each day) accumulate through repeated, non-repetitive showers instead of replacing earlier pieces; reduce object scale; improve diamond realism; and ensure celebration audio ends with the active effect.
- Progressive model: each tap releases only the remaining inventory, capped at 24 mobile, 32 tablet, or 40 desktop pieces. Settled transforms are saved under `earn.prosperityTreasure.v1`; reloads restore the collected pile, and a future day's additional inventory remains available for the next tap.
- Performance model: only the newest batch uses Cannon rigid bodies. When it settles, bodies are removed and all retained coins/gems are rebuilt as material-grouped Three.js instanced meshes. This permits the visible pile to approach the complete daily count without hundreds of continuously simulated bodies or unbounded draw calls.
- Physics endpoint: normal Earth gravity and collisions run first. A nine-second safety boundary sleeps persistent collision outliers and places only those outliers into responsive pile slots, preventing suspended pieces and guaranteeing that animation and audio terminate.
- Visual scale: rendered geometry radius now ranges from 10–22 CSS pixels (approximately 20–44 px diameter), down from 24–54 px radius. The reduced-motion fallback follows the same smaller visual direction.
- Gem reference: the round-brilliant-inspired geometry uses the supplied ideal-range reference at a 57% table, 34° crown, and 41° pavilion. Diamond material uses IOR 2.42, increased transmission/reflections, low roughness, and controlled iridescence for brightness, spectral fire, and rotational scintillation; coloured transparent stones retain their individual IOR and attenuation.
- Audio: the former long `coin_drop.mp3` playback is replaced with a locally synthesized 3.1-second band-pass whoosh and three restrained sine chimes. It has both an intrinsic endpoint and an explicit stop/AudioContext close when the physics batch settles. The legacy MP3 file remains preserved but is no longer precached or played.
- Cache checkpoint: `earn-app-v28`.
- Validation:
  - `static` PASS — JavaScript/MJS syntax and `git diff --check`.
  - `unit` PASS — `npm test` (26/26), including responsive batch sizing, brilliant-cut proportions, iridescence, instancing, persistence, synthesized sound, and obsolete-audio cache removal.
  - `browser` PASS — Playwright Chromium mobile `390x844`, tablet `768x1024`, and desktop `1440x900` (3/3). Two consecutive batches per viewport increased retained/visible counts, stayed inside active-body limits, ended with zero pending/awake bodies, and produced no page errors.
  - `visual` PASS — final mobile, tablet, and desktop screenshots inspected: pieces are materially smaller, faceted materials remain legible, and settled batches form bottom treasure piles without suspended outliers.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `0e04eeb` (`[CP-018] Add progressive prosperity treasure`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device sound/material review.
- Next: push/deploy only when explicitly requested, then review sound and material response on the target Android device/GPU.

### CP-019 — Layered dynamic treasure mound and exact daily inventory

- Status: implemented, validated, and committed locally.
- Objective: make each progressive batch land visibly on top of the retained treasure instead of visually intersecting it, preserve a dynamic pile effect, and prove that the retained visible total can reach the exact `#dailyCounter` inventory.
- Layering model: one responsive click batch forms one 3D layer (24 mobile, 32 tablet, 40 desktop). Layers use both horizontal and depth slots with separated centres, subtle deterministic offsets, and physics-derived resting rotations. Lower layers remain broad while upper layers taper to 50% width/depth, producing a mound rather than a rectangular wall.
- Dynamic collision model: after each batch settles, an invisible Cannon collision surface is rebuilt immediately above the current top layer. The next batch is released only inside that surface's responsive footprint, so falling bodies collide above the retained treasure instead of passing through it or landing behind it. The surface height and layer count rise after every completed batch.
- Persistence migration: storage advances to `earn.prosperityTreasure.v2`; restored pieces are reflowed into the new separated mound geometry. Invalid kinds or non-finite quaternions are rejected before restoration.
- Full-count behavior: active rigid bodies remain capped per batch, but retained instanced meshes are not capped by that active limit. Repeated taps therefore reach the entire counter inventory—461 on 2026-08-15—and future daily increments create the next available top-layer piece.
- Cache checkpoint: `earn-app-v29`.
- Validation:
  - `static` PASS — JavaScript/MJS syntax and `git diff --check`.
  - `unit` PASS — `npm test` (26/26), including an iterative mobile-batch proof that exactly reaches the supplied inventory without overshoot.
  - `browser` PASS — Playwright Chromium (4/4): two-layer mobile, tablet, and desktop runs verify rising collision-surface height and layer count; the full-inventory case restores 441 pieces, drops the remaining 20, and verifies `collectedCount`, `visiblePieceCount`, and `#dailyCounter` all equal 461 with zero active bodies.
  - `visual` PASS — final full-count screenshot inspected: 461 varied pieces form a centred tapered mound with a broad base, narrower top, and no suspended or rectangular-wall arrangement.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `43b4052` (`[CP-019] Build layered prosperity mound`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device feel review.
- Next: push/deploy only when explicitly requested, then review the completed mound and rising-layer motion on the target device.
