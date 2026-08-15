# Earn Development Safety

- Preserve existing browser data and maintain backward-compatible localStorage keys.
- Never place UPI IDs, payee names, transaction data, service charges, or opening balances in source, logs, screenshots, or test artifacts.
- Treat URL parameters as untrusted. Only allow explicitly approved local return routes.
- Do not claim payment-provider verification; the receive flow records user-confirmed payments locally.
- Keep third-party QR/PDF dependencies HTTPS-only and document their offline limitations.
- Bump the service-worker cache name when cached application files change.
- Validate JavaScript syntax and local asset references before each checkpoint.
- Keep generated files, browser state, `.DS_Store`, and unrelated user changes out of commits.
