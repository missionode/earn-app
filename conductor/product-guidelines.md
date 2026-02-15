# Product Guidelines

## Visual & Interaction Design
- **Design Authority:** The `Template-earn/` directory is the absolute source of truth for all UI components, colors, and layout patterns.
- **Layout:** Strictly follow a **Centered, "One-Section-at-a-Time"** view to maximize user focus and minimize distraction.
- **Feel:** The application must be **Instantaneous & Snappy**. Transitions should be immediate to maintain the lightweight PWA experience.
- **Feedback:** Provide **Tactile & Responsive** visual feedback for every user interaction (button presses, form submissions, etc.) to reinforce a sense of control.

## Prose & Messaging
- **Tone:** Concise, direct, and action-oriented. Avoid unnecessary jargon or long explanations.
- **Sentiment:** Empowering and positive. Use encouraging language to celebrate financial milestones and minimalism.
- **Privacy Transparency:** Explicitly reassure users that their data is local-only during critical flows (e.g., initial setup, transaction logging, and app resets).

## Feature Representation
- **Minimalist Goals:** Use simple progress bars rather than complex multi-axis charts.
- **Financial Anticipation:** Deliver insights via minimalist text-based forecasts (e.g., "Daily budget: ₹X") to support quick decision-making.
- **Focus:** Maintain a single-metric focus per screen to avoid cognitive overload.

## UPI Bridge UX
- **Verification Flow:** Prioritize an automated return to the app after triggering a UPI intent. 
- **Fallback:** Always provide a prominent, tactile "Confirm Payment" button for manual verification if the automatic redirect fails.
- **State Management:** Ensure the transaction is immediately reflected in the UI (e.g., as "Processing" or "Pending") to provide instant reassurance to the user.
