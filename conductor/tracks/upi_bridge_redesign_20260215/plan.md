# Implementation Plan: Redesign and Refactor the Core UPI Bridge and Landing Experience

## Phase 1: UI Foundation & Theme Alignment
Focus on aligning the core CSS and layout with the `Template-earn/` authority.

- [ ] Task: Extract and consolidate CSS variables and components from `Template-earn/` into `css/styles.css`.
- [ ] Task: Refactor `index.html` structure to support "one-section-at-a-time" visibility toggling.
- [ ] Task: Implement basic JS logic for section navigation (e.g., switching between Summary and Action views).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: UI Foundation & Theme Alignment' (Protocol in workflow.md) [checkpoint: ]

## Phase 2: Transaction Flow Refinement
Simplify the logging process and ensure UI consistency.

- [ ] Task: Redesign `receive.html` and `send.html` to follow the centered, focused design pattern.
- [ ] Task: Write tests for the transaction logging logic to ensure Local Storage is updated correctly.
- [ ] Task: Implement "Instantaneous" transitions between logging screens and the home screen.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Transaction Flow Refinement' (Protocol in workflow.md) [checkpoint: ]

## Phase 3: UPI Bridge Verification Loop
Implement the logic to handle post-redirect confirmation.

- [ ] Task: Implement `pending_upi_confirmation` state management in `js/script.js`.
- [ ] Task: Create the "Verify Payment" modal component in `index.html` (following the new theme).
- [ ] Task: Write tests for the state transition from "pending" to "success/failed" based on user confirmation.
- [ ] Task: Implement the "Verify Payment" trigger logic on app load/visibility change.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UPI Bridge Verification Loop' (Protocol in workflow.md) [checkpoint: ]

## Phase 4: Final Polishing & Snappiness
Ensure all tactile and performance guidelines are met.

- [ ] Task: Add tactile feedback (visual CSS active states) to all primary buttons.
- [ ] Task: Audit performance to ensure section transitions meet the <100ms requirement.
- [ ] Task: Final review against `product-guidelines.md` and `Template-earn/`.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polishing & Snappiness' (Protocol in workflow.md) [checkpoint: ]
