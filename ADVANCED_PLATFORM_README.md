# SRS Vision — Advanced Platform Workspaces

This package adds separate, dedicated dashboards for:

- Social Media Hub: WhatsApp Business, Instagram, YouTube Studio, Pinterest, Facebook, LinkedIn, Telegram and X
- Notification Center: unified in-app notification inbox, browser notification permission and test events
- AI Platform Hub: direct launch slots for ChatGPT, Gemini, Claude, Microsoft Copilot and Perplexity
- Secure Money Transfer: 12-member Allow/Deny approval gate with audit-style status flow

## Money transfer safety model

A transfer request is internal workflow data only. All 12 approval slots are required. Any single Deny immediately blocks the request. 12/12 Allow moves the request to `APPROVED_FOR_EXECUTION`, but the website does not bypass bank/payment-provider authentication.

Actual bank/UPI execution requires a secure backend plus a supported bank/payment API, beneficiary verification and the provider's own OTP/2FA or equivalent authentication. Do not use the browser UI as the sole security boundary for real money movement.

## Platform notifications

Real private notifications from social platforms require each platform's approved API/OAuth/webhook path. The dashboard provides the inbox and connector slots; it does not pretend that a static browser page can receive private platform events without a connector.
