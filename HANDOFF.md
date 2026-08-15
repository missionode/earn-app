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

### CP-020 — Session-only natural physics treasure

- Status: implemented, validated, and committed locally.
- Objective: remove remembered and deterministic pile behavior so prosperity feels like a relaxing physics-based game: every visit starts empty, every click adds to the current session, and existing pieces move only through physical contact.
- State decision: all prosperity local-storage reads/writes are removed. Reloading or reopening the page starts a fresh empty treasure; no previous pile is restored or reflowed. Legacy storage values, if present from an earlier build, are ignored.
- Physics decision: settled coins and gems remain as sleeping Cannon rigid bodies with their original Three.js meshes and transforms. A new batch collides directly with them and may naturally wake, shift, roll, or tumble earlier pieces. No static instancing, generated slot, transform remapping, collision proxy, or synthetic layer placement remains.
- Count behavior: the 24/32/40 device limit now applies only to the newly released batch. Session bodies are never recycled or capped, so repeated clicks can progress exactly to the full `#dailyCounter` value (461 on 2026-08-15); the existing unit proof reaches the supplied total without overshoot.
- Basin behavior: the wide flat centre is replaced with a narrow responsive basin and steeper zero-friction physical slopes. Bodies sleeping high on an invisible slope are awakened to continue sliding under gravity; low, slow bodies may sleep naturally. This gathers one irregular mound without assigning final positions or creating visually suspended outliers.
- Settling behavior: normal body sleep remains primary. A 16-second soft threshold sleeps only slow current-batch pieces near the visible pile, and a 24-second safety threshold sleeps low/central bodies; high slope pieces continue moving until gravity brings them down. Sound still ends independently after at most 3.1 seconds.
- Cache checkpoint: `earn-app-v30`.
- Validation:
  - `static/unit` PASS — syntax, `git diff --check`, and `npm test` (26/26). Tests assert absence of prosperity persistence, deterministic pile placement, static instancing, and collision proxies, while preserving exact full-counter batch arithmetic.
  - `desktop browser/visual` PASS — two consecutive physics batches settle with retained bodies, all ten materials, and no page errors; inspected screenshot shows a compact irregular mound with no uniform structure or suspended pieces.
  - `responsive browser` PASS — Playwright Chromium mobile `390x844`, tablet `768x1024`, and desktop `1440x900`, plus the reload-reset case (4/4). Every viewport retains more bodies after the second click, respects per-batch limits, reaches zero awake bodies, and produces no browser errors. Reloading creates a fresh first-batch count rather than restoring the prior session.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `e633267` (`[CP-020] Use session-only natural pile physics`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device feel/performance review at very high session counts.
- Next: push/deploy only when explicitly requested, then review the relaxing motion and high-count performance on the target device.

### CP-021 — Flat transparent viewport container

- Status: implemented, validated, and committed locally.
- Objective: make the viewport feel like a large transparent flat-bottomed container that fills from the top centre with the complete session inventory under natural physics.
- Container physics: the sloped basin, ramp material, funnel geometry, and slope-specific wake/sleep logic are completely removed. The existing responsive floor, left/right viewport walls, and front/back depth walls now form one rectangular flat-bottom container.
- Container visuals: a subtle transmissive glass floor and faint front floor/side edge highlights make the otherwise transparent container readable without obscuring the application. The WebGL canvas exposes `data-container-shape="flat-bottom-viewport"` for verification.
- Release behavior: every piece begins in a compact responsive region at the top centre (`data-release-origin="top-center"`). Small random x/depth offsets, fully random starting orientation, angular velocity, and restrained lateral velocity keep the fall varied while gravity always begins from the central origin.
- Accumulation: current-session bodies and meshes remain fully physical and are never reflowed, persisted, recycled, or replaced. Repeated clicks keep adding batches until the exact daily inventory is present; on the flat floor, impacts, friction, restitution, rolling, and inter-body collision determine how the container fills.
- Settling: without invisible slopes, the standard 16-second low/slow soft sleep and 24-second safety endpoint apply directly to bodies above the visible flat floor. The magical audio remains bounded to 3.1 seconds.
- Cache checkpoint: `earn-app-v31`.
- Validation:
  - `static/unit` PASS — syntax, `git diff --check`, and `npm test` (26/26), including explicit flat-container/top-centre markers and absence of ramp/basin code.
  - `responsive browser` PASS — mobile `390x844`, tablet `768x1024`, and desktop `1440x900` each completed two top-centre physics batches with retained counts, all ten materials, zero final awake bodies, and no page errors. The reload-reset check passed separately after aligning its lazy-load startup allowance.
  - `visual` PASS — all three settled screenshots inspected: pieces visibly accumulate and spread from the centre across one flat bottom, with varied physical poses and no uniform arrangement.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `737e310` (`[CP-021] Add flat viewport treasure container`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device review while progressively approaching all 461 objects.
- Next: push/deploy only when explicitly requested, then review the transparent-container feel and high-count filling behavior on the target device.

### CP-022 — Responsive rapid clicks, raised floor, and original sound

- Status: implemented, validated, and committed locally.
- Objective: ensure every prosperity click responds even while an earlier batch is spawning/falling, raise the flat platform slightly, and replace the synthesized whoosh with the earlier simple coin sound.
- Click diagnosis/fix: the controller-level `isShowerActive` early return and engine-level active/spawn guard caused clicks during the 16–24 second physics cycle to be ignored. Both locks are removed. Every click now calls the shower engine immediately, including during module loading, active timers, or falling bodies.
- Count safety: the engine calculates committed inventory as `entries.length + spawnTimers.size` before every click. A rapid second click therefore schedules another responsive batch immediately while pending timers count toward the 461 limit, preventing duplicate or excess objects. Additional clicks can keep filling the same live container until no inventory remains.
- Shared cycle: overlapping click batches join the current `batchBodies` set, extend the settling deadlines, and use the latest settlement callback. Existing and newly scheduled pieces continue interacting in one Cannon world.
- Platform position: the flat floor is raised by 6% of responsive viewport height (about 51 px mobile, 61 px tablet, and 54 px desktop in validation), while retaining the same transparent visual floor and physical boundaries.
- Sound: the generated Web Audio whoosh/chimes are removed. The original `assets/sounds/coin_drop.mp3` is restored at 72% volume and precached again, but playback is explicitly stopped/reset after 3.2 seconds or when the shared physics cycle settles, avoiding the legacy 20.4-second overrun.
- Cache checkpoint: `earn-app-v32`.
- Validation:
  - `static/unit` PASS — syntax, `git diff --check`, and `npm test` (26/26), including absence of the active-click guard, pending-timer inventory accounting, restored bounded MP3 playback, and exact cache inclusion.
  - `responsive browser` PASS — mobile, tablet, and desktop each received a second click after only five first-batch bodies existed, grew beyond the first batch size, completed all pending timers, and settled to zero awake bodies. Reload reset also passed. The former basin-era 70% spread assertion was relaxed to 80% for the flat container; mobile passed on rerun.
  - `visual` PASS — raised-floor screenshots inspected at all three viewports; two rapid batches retain varied natural piles with the platform visibly higher and no uniform placement.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `bf664a7` (`[CP-022] Support rapid prosperity drops`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device audio preference and repeated-tap feel.
- Next: push/deploy only when explicitly requested, then review audio and repeated-tap feel on the target device.

### CP-023 — Lively contained bounce and edge distribution

- Status: implemented, validated, and committed locally.
- Objective: prevent top-centre releases from accumulating as one central heap and let coins and gems travel naturally toward the viewport edges and corners through gravity, momentum, bounce, and collision.
- Release dynamics: pieces still originate from the requested compact top-centre region, but each receives a random full-circle outward impulse. Horizontal speed scales responsively with the visible width (capped at 6.5 world units), while a smaller depth impulse distributes pieces toward the front and back of the transparent container. Random orientations and angular velocities continue to make every fall different.
- Contact response: wall/floor restitution is raised to `0.42` with friction reduced to `0.26`; piece-to-piece restitution is raised to `0.30` with friction reduced to `0.22`. Coin damping is reduced to `0.08` linear/`0.24` angular and gem damping to `0.10` linear/`0.30` angular, preserving visible rebound, rolling, spinning, and secondary collisions without allowing objects to escape the container.
- Settling correction: the 24-second safety sleep now applies only near the raised floor. A piece still airborne after a lively collision therefore remains governed by gravity instead of freezing above the pile; low/slow pieces retain the earlier bounded settling behavior.
- Diagnostics: the WebGL canvas exposes `data-bounce-profile="lively-contained"`; responsive browser assertions verify both meaningful horizontal distribution and containment.
- Cache checkpoint: `earn-app-v33`.
- Validation:
  - `static/unit` PASS — module syntax, `git diff --check`, and `npm test` (26/26), including outward release impulse, restitution profile, diagnostics, and cache version.
  - `responsive browser` PASS — Playwright Chromium mobile `390x844`, tablet `768x1024`, desktop `1440x900`, and reload-reset behavior (4/4). Rapid batches spread beyond the former central heap, remain within the container, finish pending timers, settle to zero awake bodies, and produce no page errors.
  - `visual` PASS — final desktop capture inspected: varied coins and gemstones reach both sides and near-corner regions while the main treasure remains naturally distributed along the raised flat floor, with no uniform placement or frozen airborne pieces.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `7961d02` (`[CP-023] Add contained bounce distribution`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device feel/performance review at high accumulated counts.
- Next: push/deploy only when explicitly requested, then review bounce energy and corner distribution on the target device.

### CP-024 — Full-width falling path with live page collisions

- Status: implemented, validated, and committed locally.
- Objective: release prosperity pieces from anywhere across the top of the viewport, let them visibly interact with the actual Earn interface on their downward path, and ensure they ultimately leave those elements and gather at the bottom.
- Release model: each responsive batch now uses nearly the complete safe viewport width (`data-release-origin="full-width-top"`) with random x/depth positions, restrained lateral momentum, random orientation, and angular velocity. The same normal Earth gravity remains authoritative after release.
- Live element physics: visible logo/help controls, Total Income card, wallet controls, Income artwork/button, Transactions heading/table, mantra strip, and footer marks are measured with `getBoundingClientRect()` and projected from screen coordinates into the Three/Cannon world. Matching static bodies are rebuilt for the current responsive layout and updated on resize, scroll, and every shower (`data-obstacle-model="dom-elements"`). Hidden/offscreen/tiny elements are excluded.
- Interaction feel: page-element contacts use a dedicated low-friction `0.035`, restitution `0.48` material, subtle alternating depth slopes, and bounded collision impulses. Coins and gems therefore bounce, spin, roll, and deflect across the visible interface instead of passing through it.
- Bottom guarantee: element colliders occupy only a shallow central depth, leaving front/back escape paths. A supported-body check continues a gentle physical roll-off whenever a piece slows on a page element. Diagnostics and browser tests require recorded element collisions and zero bodies remaining supported by page elements when the batch settles.
- Usability: the WebGL layer remains `pointer-events: none`; all links, icons, buttons, filters, and prosperity-trigger clicks continue passing directly to the real page controls.
- Responsive behavior: element colliders are derived from each viewport's actual layout rather than hard-coded coordinates. Full-width release margins, obstacle depth, piece size, velocity, floor height, and container walls continue scaling by viewport/performance tier.
- Cache checkpoint: `earn-app-v34`.
- Validation:
  - `static/unit` PASS — module syntax, `git diff --check`, and `npm test` (26/26), including full-width origin, DOM projection, dedicated contact material, roll-off safeguard, diagnostics, and cache version.
  - `responsive browser` PASS — Playwright Chromium mobile `390x844`, tablet `768x1024`, desktop `1440x900`, and reload-reset behavior (4/4). Every responsive fall created more than five live page colliders, recorded real element contacts, completed pending spawns, ended with zero awake bodies, left zero pieces resting on page elements, remained contained, and produced no page errors.
  - `visual` PASS — final desktop and mobile captures inspected: releases originate across the header width, visibly traverse the interface through varied collision paths, and finish distributed along the raised bottom rather than remaining on the Income card or mantra strip.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `7006f17` (`[CP-024] Add live page collision path`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device motion/performance review with repeated high-count batches.
- Next: push/deploy only when explicitly requested, then review the live collision feel on the target device.

### CP-025 — Opening balance income setup and synchronization

- Status: implemented, validated, and committed locally.
- Objective: let a user enter an existing opening income during first-time setup or later through the same Settings form, include it in the lotus Income total, and show it as a normal successful income transaction.
- Setup/Settings UI: a responsive numeric `Opening balance (₹)` field now appears immediately below Standard Service Charge. It accepts ₹0 or more, defaults to ₹0 for new/legacy profiles, restores the saved amount when Settings reopens, and explains that edits adjust one Opening balance transaction. The full-height setup panel now scrolls vertically on small devices so all fields and the submit button remain reachable.
- Storage model: the profile amount is saved under backward-compatible localStorage key `earn_openingBalance`. Existing users are not forced through setup merely because that new optional key is absent.
- Transaction model: a shared helper maintains one stable `earn-opening-balance` transaction with type `income`, category `cash`, description `Opening balance`, and status `success`. A positive setup value creates it; later edits update the same transaction without duplication while preserving its original date/time; changing the amount to ₹0 removes only that opening transaction.
- Income calculation: because the opening balance is a successful income transaction, the existing summary path automatically includes it in both Total Income and `🪷 … ₹`, as well as the default Income transaction table and filters.
- Transaction-editor consistency: editing the opening row's amount from All Transactions updates `earn_openingBalance` through the same helper; deleting that row resets the stored opening balance to ₹0. Canonical type/category/description/status remain protected.
- Reset/offline behavior: factory reset removes `earn_openingBalance`, the warning text now names it, `opening-balance.js` is precached, and the service-worker cache advances to `earn-app-v35`.
- Validation:
  - `static/unit` PASS — JavaScript syntax, `git diff --check`, and `npm test` (31/31). Tests cover creation, in-place update/no duplication, zero removal with unrelated-income preservation, invalid/negative rejection, page integration, editor synchronization, and offline caching.
  - `browser` PASS — complete Playwright Chromium suite (5/5): Opening Balance setup/settings plus all mobile/tablet/desktop prosperity and reload checks. The focused opening-balance test also passes at `390x844`, proving first setup at ₹1,250.50, Settings update to ₹1,800, one retained transaction, and synchronized Total Income/lotus Income displays.
  - `visual` PASS — mobile `390x844` setup capture inspected: the new field is clearly positioned below Service Charge, helper copy wraps cleanly, ₹0 default is visible, and Start Earn remains reachable.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `40c40d3` (`[CP-025] Add opening balance income`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device review.
- Next: push/deploy only when explicitly requested, then confirm the installed PWA refreshes to cache `earn-app-v35` and review setup/settings on the target device.

### CP-026 — Exponential prosperity mint and visible progress

- Status: implemented, validated, and committed locally.
- Objective: replace the initially large fixed prosperity showers with the approved `2^x` click progression and visibly explain what is happening while pieces fall, after each batch settles, and when the daily treasure is complete.
- Exponential model: successful clicks now release `2^x` pieces for click exponent `x`, starting at `x = 1`: 2, 4, 8, 16, 32, 64, 128, and so on. Every batch is capped to the remaining daily inventory, so the current 461 count resolves exactly as `2 + 4 + 8 + 16 + 32 + 64 + 128 + 207 = 461` without overshoot.
- Session behavior: the exponent starts fresh on every page load, increments only when a non-empty batch is committed, and remains safe during rapid clicks because pending spawn timers still count toward committed inventory. The final all-remaining click cannot create duplicates.
- Long-batch physics: soft/hard settlement deadlines now include the batch's staggered spawn duration. Large exponential batches therefore receive the same full gravity/collision settling window after their final piece appears instead of having that time consumed while pieces are still being released.
- Visible status: the former screen-reader-only status is now a compact, non-interactive live pill. It shows `Preparing the prosperity mint…`, then `Minting and polishing N prosperity pieces…`, followed by `Treasure settled — X of Y blessings gathered. Tap again to mint the next batch.` The full-count branch shows `Prosperity treasure complete — all Y blessings gathered.` Settled/completion messages remain visible for eight seconds.
- Accessibility/usability: the message retains `role="status"` and `aria-live="polite"`, uses responsive sizing and safe-area positioning, does not intercept pointer input, and continues to support reduced-motion/3D-unavailable explanations.
- Cache checkpoint: `earn-app-v36`.
- Validation:
  - `static/unit` PASS — module/controller syntax, `git diff --check`, and `npm test` (31/31). The arithmetic test proves the exact eight-click 461 sequence and final cap; controller tests cover minting/completion copy and existing bounded sound behavior.
  - `responsive browser` PASS — Playwright Chromium mobile `390x844`, tablet `768x1024`, desktop `1440x900`, and reload-reset behavior (4/4). Each responsive run proves the rapid 2/4/8/16 sequence, 30 committed/visible pieces, element collisions, zero final awake/supported bodies, and the visible 30-of-daily settled message. Reload proves the exponent restarts at 1 and again reaches 30 after four clicks.
  - `regression browser` PASS — Opening Balance setup/settings remains green (1/1), for combined browser evidence of 5/5.
  - `visual` PASS — final mobile capture inspected: the responsive status pill clearly reads `Treasure settled — 30 of 461 blessings gathered. Tap again to mint the next batch.` above the distributed treasure without blocking controls.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `0df5713` (`[CP-026] Add exponential prosperity mint`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device high-count performance review through the 32/64/128/final batches.
- Next: push/deploy only when explicitly requested, then review the later exponential batches and visible status timing on the target device.

### CP-027 — Minimal exponential counter progress

- Status: implemented, validated, and committed locally.
- Objective: remove the recently added prosperity popup/status messaging and express exponential progress only through the existing `#dailyCounter` beside the coin icon.
- Display behavior: the untouched initial state shows the available daily count (`461` on 2026-08-15). Each successful exponential click replaces it with the current batch/available format: `2/461`, `4/461`, `8/461`, `16/461`, and onward. The value remains compact after settling and updates only when the next batch is committed; once no inventory remains, it shows `461/461`.
- Removed UI: the floating prosperity status element, fixed glass/gold pill styling, preparation text, minting text, settled text, completion text, and associated hide timer are completely removed.
- Accessibility: `#dailyCounter` itself now has `aria-live="polite"` and `aria-atomic="true"`. Its accessible label changes with every committed batch (for example, `16 of 461 prosperity pieces in this batch`) without adding any separate visual message.
- Preserved behavior: exponential `2^x` arithmetic, rapid-click inventory safety, sounds, full-width physics, live page-element collisions, roll-off behavior, responsive sizing, reload reset, and reduced-motion fallback remain unchanged.
- Cache checkpoint: `earn-app-v37`.
- Validation:
  - `static/unit` PASS — controller syntax, `git diff --check`, and `npm test` (31/31). Tests assert the live/atomic counter, exact batch display expression, absence of the status element and all removed message strings, and cache version.
  - `responsive browser` PASS — Playwright Chromium mobile, tablet, desktop, and reload reset (4/4). Each viewport proves counter transitions `2/daily → 4/daily → 8/daily → 16/daily`, 30 physical pieces after four rapid clicks, final settling/containment, and no browser errors.
  - `regression browser` PASS — Opening Balance setup/settings remains green (1/1), for combined browser evidence of 5/5.
  - `visual` PASS — final mobile capture inspected: only `16/461` appears next to the coin trigger; no popup or status pill obscures the interface or treasure.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `e30466d` (`[CP-027] Simplify prosperity progress`) on `feature/prosperity-coins`.
- Progress: 100% complete | Confidence: high | Current phase: implementation and local validation complete | Main remaining scope: target-device review.
- Next: push/deploy only when explicitly requested, then confirm the compact counter progression on the target device.

### CP-028 — Automatic counter-priced Lite income celebration

- Status: implemented and validated locally.
- Objective: remove manual Service Charge setup, use Earn's automatically increasing daily counter as the Lite per-client charge, lock the calculated Lite amount, and celebrate successful income collection before returning to Earn.
- Daily value model: a shared `EarnDailyCounter` helper documents 11 May 2025 as the day Earn came into existence. It compares local calendar dates through UTC day numbers, preserving the existing value of 461 on 15 August 2026 and increasing exactly once per new calendar day (462 on 16 August 2026) without storage or user input.
- Setup: Standard Service Charge and its validation/storage requirements are removed. First-time completion now requires only UPI ID, payee name, and a valid opening balance. Existing `earn_serviceCharge` data is ignored but remains removable through factory reset for backward-compatible cleanup.
- Lite receive: `receive.html?Source=Lite` uses `daily counter × clients`, keeps Sadhana and `Dakshina recieved for meditation`, recalculates when Clients changes, and makes Amount read-only. The existing transaction `serviceCharge` property is retained for data compatibility but now records the daily counter used.
- Success celebration: Add Income and QR-page Received Payment save exactly once, disable their success action, release the complete daily counter as one accelerated full-width 3D coin/gem shower with the original bounded coin sound, then return to `index.html`. A 12-second fallback guarantees navigation if physics settlement or WebGL is unavailable. Lite back/edit navigation remains unchanged and still returns to Lite where appropriate.
- Routing verification: the landing Income button continues to open plain `receive.html`; ordinary Add Income is not classified as Lite. Both ordinary and Lite success paths now return to the Earn landing page after the prosperity shower.
- Offline cache checkpoint: `earn-app-v38`, including the shared counter and celebration controllers.
- Validation:
  - `static/unit` PASS — all changed JavaScript/MJS parses, `git diff --check`, and `npm test` (35/35). Coverage proves founding-date arithmetic, one-per-day progression, removed setup charge, locked Lite multiplication, stale pending recalculation, normal-vs-Lite routing, full-count celebration configuration, transaction persistence, and QR completion.
  - `runtime` PASS — local HTTP server returned 200 for index, Lite receive, and receive QR pages.
  - `browser` BLOCKED — the browser-control runtime reported no available browser, so interactive animation/navigation and visual checks remain pending on a connected browser or target device.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `b91b0ed` (`[CP-028] Use daily counter for Lite income`) on `feature/prosperity-coins`.
- Progress: 100% implementation and automated validation complete | Confidence: high | Main remaining scope: target-device visual/performance review of the full 461-piece success shower.
- Next: push/deploy only when explicitly requested, then verify Lite ₹461 × clients, locked Amount, successful shower timing, and return to Earn on the device.

### CP-029 — Full-length celebration sound and fresh QR success path

- Status: implemented and validated locally.
- Objective: keep the prosperity sound active for the whole full-count shower and ensure QR `Recieved Payment` visibly follows the same celebration-and-Earn-return behavior as Add Income instead of executing the older cached Lite redirect.
- Audio lifecycle: the original coin sound now loops during the celebration and stops only inside the single completion path, whether physics settles normally, initialization fails, or the safety deadline is reached. The former fixed 3.2-second stop is removed.
- Completion timing: the safety deadline now scales with the complete piece count using the same 8ms full-shower spawn interval plus a 25-second hard-settlement allowance. At the current 461 count this allows roughly 28.7 seconds instead of cutting the experience off at 12 seconds; normal settlement still completes and redirects sooner when possible.
- QR parity: both Add Income and QR `Recieved Payment` use `EarnProsperityCelebration.play`, release the complete current counter, persist the income once, and navigate to `index.html` from the celebration completion callback. Lite cancellation, back, edit, and missing-data routes retain their existing Lite return behavior.
- Stale-cache protection: receive, receive QR, counter, and celebration scripts now carry `?v=39` page references, the versioned requests are precached alongside their canonical assets, and the service-worker cache advances to `earn-app-v39`.
- Validation:
  - `static/unit` PASS — JavaScript syntax, `git diff --check`, and `npm test` (35/35), including looped audio, settlement allowance, full-count release, QR success persistence, and Earn redirect assertions.
  - `runtime` PASS — a local server on `127.0.0.1:8001` served both Lite pages with v39 script URLs; served celebration code contains `sound.loop = true`; served QR code invokes the celebration and redirects to `index.html` on completion.
  - `browser` BLOCKED — no connected browser backend is available in this session; target-device visual/audio timing remains the final experiential check.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `b0723c2` (`[CP-029] Sustain income celebration sound`) on `feature/prosperity-coins`.
- Progress: 100% implementation and automated/runtime validation complete | Confidence: high | Main remaining scope: listen through one complete target-device shower and confirm the loop transition feels natural.
- Next: push/deploy only when explicitly requested, refresh the installed PWA to v39, then test Add Income and QR `Recieved Payment` from Lite.

### CP-030 — Stop celebration audio at visual settlement

- Status: implemented and validated locally.
- Objective: stop the looped prosperity sound when the visible shower settles rather than letting it continue through the later redirect/physics-cleanup interval.
- Settlement signal: the 3D engine now tracks visibly moving bodies separately from Cannon's stricter awake-body state. After all pieces have spawned, visual settlement requires 24 consecutive frames with no more than 1% of bodies (minimum allowance two) moving faster than the restrained linear/angular thresholds. This avoids sound continuing because of a few imperceptibly awake/jittering rigid bodies.
- Lifecycle separation: `startProsperityShower` accepts a dedicated `onVisuallySettled` callback. The celebration uses it only to stop/reset the looping audio; the existing `onSettled` callback still clears the safety timer and performs navigation. Final settlement also invokes the visual callback as an idempotent fallback.
- Cache checkpoint: receive and QR page script URLs advance to `?v=40`; service-worker cache advances to `earn-app-v40` with matching versioned assets.
- Validation: JavaScript/MJS syntax PASS, `git diff --check` PASS, and `npm test` PASS (35/35), including explicit visual-settlement callback, stable-frame threshold, looped audio, and v40 cache assertions.
- Browser status: no connected browser backend is available in this session, so target-device audio timing remains the final experiential check.
- Scope protection: user-owned untracked `Template-earn/qrcode.jpeg` remains untouched and excluded.
- Git checkpoint: `4e850e1` (`[CP-030] Stop celebration sound at settlement`) on `feature/prosperity-coins`.
- Progress: 100% implementation and automated validation complete | Confidence: high | Main remaining scope: confirm the perceived stop point on the target phone.
- Next: push/deploy only when explicitly requested, refresh to v40, and compare sound stop against the final visibly moving pieces.

### CP-031 — Future-safe UPI handle validation

- Status: implemented and validated locally.
- Objective: accept the valid Google Pay `@okaxis` handle and prevent other legitimate/current or future UPI handles from being rejected merely because Earn's hardcoded domain list is incomplete.
- Root cause: setup used an exact local `validDomains.includes(domain)` allowlist. It contained `axisbank`, `oksbi`, `okhdfcbank`, and `okicici`, but omitted `okaxis`, so a structurally valid Google Pay VPA failed with `Invalid UPI ID domain.`
- Official evidence: Google Pay documents four PSP routes—`@okaxis`, `@okhdfcbank`, `@okicici`, and `@oksbi`; NPCI's published UPI member/handle material also identifies `okaxis` under Axis Bank.
- Validation model: a shared `EarnUpiId` helper replaces the stale bank/PSP allowlist with bounded structural validation of the local part and handle. It explicitly exposes the four current Google Pay handles for regression coverage while allowing other structurally valid handles to be verified by the user's UPI app/payment network rather than falsely rejected offline.
- Normalization: surrounding whitespace is trimmed and the handle portion is lowercased before validation/storage, so entries such as `teacher@OKAXIS` become `teacher@okaxis` without altering the local identifier.
- Rejections retained: missing local part, missing handle, absent `@`, whitespace inside the identifier, and other malformed values continue to show `Invalid UPI ID format.`
- Cache checkpoint: `earn-app-v41`; index loads cache-busted v41 validator/index scripts and both canonical/versioned assets are precached.
- Validation: `node --check` PASS, `git diff --check` PASS, and `npm test` PASS (38/38), including all four Google Pay handles, a future/previously unknown PSP handle, domain normalization, and malformed input rejection.
- Browser status: no connected browser backend is available in this session; the focused pure validation tests cover the changed behavior.
- Scope protection: user-owned QR artwork remains untouched and excluded.
- Git checkpoint: `fcddacb` (`[CP-031] Accept current UPI handles`) on `main`.
- Progress: 100% implementation and automated validation complete | Confidence: high | Main remaining scope: target-device setup save using the user's real `@okaxis` VPA.
- Next: push/deploy only when explicitly requested, refresh to v41, enter the real `@okaxis` address, and generate a low-value QR for device confirmation.

### CP-032 — Settlement-aware landing shower sound

- Status: implemented and validated locally.
- Objective: restore sound throughout the landing page's large final exponential shower and stop it when the pieces visibly settle.
- Root cause: the landing controller retained its original fixed `setTimeout(stopCoinDropSound, 3200)`. At the 461 daily count, the final 207-piece batch takes about 14.8 seconds just to spawn at 72ms intervals, so most of that shower ran silently even though receive-page celebrations had already adopted settlement-aware audio.
- Audio lifecycle: the landing coin sound now loops after each successful user-triggered shower and stops through the 3D engine's `onVisuallySettled` signal. The stricter final `onSettled` callback remains as an idempotent safety stop, and empty/fallback/error branches still stop immediately.
- Preserved behavior: exponential batches, full-count cap, visual-settlement thresholds, physics, counter progress, reduced-motion fallback, and the original sound asset/volume remain unchanged.
- Cache checkpoint: `earn-app-v42`; `index.html` references `prosperity.js?v=42`, and both canonical/versioned controller URLs are precached.
- Validation: `node --check js/prosperity.js` PASS, `git diff --check` PASS, and `npm test` PASS (38/38), including looped landing audio, visual-settlement callback, removal of the fixed cutoff, and v42 cache assertions.
- Browser status: no connected browser backend is available in this session; target-device listening through the 207-piece final batch remains the experiential check.
- Scope protection: user-owned QR artwork remains untouched and excluded.
- Git checkpoint: `a023599` (`[CP-032] Sustain landing shower sound`) on `main`.
- Progress: 100% implementation and automated validation complete | Confidence: high | Main remaining scope: confirm the final shower audio stops at the perceived resting point on the target phone.
- Next: push/deploy only when explicitly requested, refresh to v42, then play through the complete landing sequence and listen to the final batch.
