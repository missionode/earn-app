# Specification: Redesign and Refactor the Core UPI Bridge and Landing Experience

## Overview
This track focuses on two primary goals: 
1. Redesigning the landing page (`index.html`) and transaction flows to adhere to the "one-section-at-a-time" centered design found in `Template-earn/`.
2. Strengthening the UPI bridge by implementing a "Verify Payment" loop that allows users to confirm transaction success after returning from a UPI app.

## User Stories
- As a user, I want a focused, distraction-free home screen so I can quickly see my balance and choose my next action.
- As a user, I want a clear way to verify that my UPI payment was successful, even if the automatic redirect fails.
- As a user, I want the app to feel snappy and responsive, matching the "tactile" guidelines.

## Functional Requirements
### UI Redesign
- Reorganize `index.html` to display one primary section at a time (e.g., Summary, Actions, Recent Transactions).
- Apply CSS variables and components from `Template-earn/` to ensure visual consistency.
- Simplify the "Expense" and "Income" logging screens to follow the same centered, focused pattern.

### UPI Bridge Verification
- Implement a `pending_upi_confirmation` state in Local Storage.
- When a user is redirected to a UPI app, log the transaction as "pending".
- Upon returning to the app (via callback or manual return), display a prominent "Verify Payment" modal or section.
- Allow users to manually confirm "Success" or "Failure" to update the transaction status.

## Non-Functional Requirements
- **Performance:** Transitions between "sections" must be under 100ms.
- **Privacy:** Ensure no transaction verification data is sent to external servers.
- **Offline:** Verification flow must work offline (status updated in Local Storage).

## Acceptance Criteria
- [ ] `index.html` matches the visual theme and "one-section-at-a-time" layout of `Template-earn/`.
- [ ] A transaction initiated via UPI correctly appears as "pending" in Local Storage.
- [ ] The "Verify Payment" prompt appears immediately upon returning to the app if a confirmation is pending.
- [ ] Manual confirmation successfully updates the transaction status from "pending" to "success" or "failed".
