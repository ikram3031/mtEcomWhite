# Decantre Email & SMTP Credentials

## 1. Webmail & Account Details
- **Email Address:** `support@decantrebd.com`
- **Password:** `Qz+J*Tzz?b0`
- **Webmail URL:** https://mail.hostinger.com
- **Mail Provider:** Hostinger Business / Premium Email

---

## 2. SMTP Outgoing Configuration (Transaction & Notifications)
- **SMTP Host:** `smtp.hostinger.com`
- **SMTP Port:** `587` (STARTTLS / TLS) or `465` (SSL)
- **Encryption:** `TLS` (for port 587) / `SSL` (for port 465)
- **Authentication:** Required
- **Username / Login:** `support@decantrebd.com`
- **Password:** `Qz+J*Tzz?b0`
- **From Name:** `Decantre BD`
- **From Email:** `support@decantrebd.com`

---

## 3. IMAP Incoming Configuration
- **IMAP Host:** `imap.hostinger.com`
- **IMAP Port:** `993`
- **Encryption:** `SSL/TLS`
- **Username:** `support@decantrebd.com`
- **Password:** `Qz+J*Tzz?b0`

---

## 4. Production VPS Environment Mapping
File Location on VPS (`144.79.218.126`):
`/opt/decantre/configs/backend.env`

```env
# SMTP / Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_ENCRYPTION=TLS
SMTP_USER=support@decantrebd.com
SMTP_PASSWORD=Qz+J*Tzz?b0
SMTP_FROM_NAME=Decantre BD
SMTP_FROM=support@decantrebd.com

# IMAP / Webmail Sync
IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=support@decantrebd.com
IMAP_PASSWORD=Qz+J*Tzz?b0
IMAP_SYNC_ENABLED=true
```

---

## 5. Connection Test & Verification Status
- **Port 587 (TLS/STARTTLS):** Verified & Active (`true`)
- **Port 465 (SSL):** Verified & Active (`true`)
- **Last Verified:** 2026-09-05
