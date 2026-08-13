# 📧 Engulfic VPS Mail Server — Cloudflare DNS Setup Guide

এই গাইডটি অনুসরণ করে খুব সহজেই **Cloudflare Dashboard**-এ আপনার VPS মেইল সার্ভার এবং Webmail-এর জন্য প্রয়োজনীয় DNS রেকর্ডগুলো সেটআপ করে নিতে পারবেন।

---

## 🖥️ সার্ভার তথ্য (Server Overview)
* **VPS IP Address:** `144.79.218.8`
* **Mail Subdomain:** `mail.engulfic.com`
* **Webmail Portal:** `https://webmail.engulfic.com`
* **Default Mail Account:** `info@engulfic.com`
* **Mail Account Password:** `cx@_ujRt9ILW}@23Pt`

---

## 📋 Cloudflare DNS Records Table

Cloudflare Dashboard এ যান ➜ **engulfic.com** সিলেক্ট করুন ➜ **DNS > Records** সেকশনে প্রবেশ করে নিচের **৬টি রেকর্ড** অ্যাড / আপডেট করুন:

| # | Type | Name | Content / Value | Proxy Status | TTL |
|---|---|---|---|---|---|
| 1 | **A** | `mail` | `144.79.218.8` | **DNS only (Grey ⚪)** | Auto |
| 2 | **A** | `webmail` | `144.79.218.8` | **Proxied (Orange 🟠)** | Auto |
| 3 | **MX** | `@` | `mail.engulfic.com` *(Priority: 10)* | **DNS only** | Auto |
| 4 | **TXT** | `@` | `v=spf1 ip4:144.79.218.8 +a +mx ~all` | **DNS only** | Auto |
| 5 | **TXT** | `mail._domainkey` | *(নিচের DKIM কোডটি)* | **DNS only** | Auto |
| 6 | **TXT** | `_dmarc` | `v=DMARC1; p=none;` | **DNS only** | Auto |

---

## 🔑 রেকর্ড অনুযায়ী কপি-পেস্ট করার বিস্তারিত ভ্যালু:

### ১. Mail Server IP (A Record)
> ⚠️ **গুরুত্বপূর্ণ:** প্রক্সি অবশ্যই **বন্ধ (Grey Cloud ⚪)** রাখবেন।
* **Type:** `A`
* **Name:** `mail`
* **IPv4 address:** `144.79.218.8`
* **Proxy status:** `DNS only` (Grey Cloud ⚪)

---

### ২. Webmail Browser Access (A Record)
> 💡 **নোট:** এই সাবডোমেইনে প্রক্সি **অন (Orange Cloud 🟠)** থাকবে যাতে ব্রাউজারে ফ্রি Cloudflare SSL সার্টিফিকেট পাওয়া যায়।
* **Type:** `A`
* **Name:** `webmail`
* **IPv4 address:** `144.79.218.8`
* **Proxy status:** `Proxied` (Orange Cloud 🟠)

---

### ৩. Mail Exchange (MX Record)
* **Type:** `MX`
* **Name:** `@`
* **Mail server:** `mail.engulfic.com`
* **Priority:** `10`
* **TTL:** `Auto`

---

### ৪. Sender Policy Framework — SPF (TXT Record)
* **Type:** `TXT`
* **Name:** `@`
* **Content:**
```text
v=spf1 ip4:144.79.218.8 +a +mx ~all
```

---

### ৫. DomainKeys Identified Mail — DKIM (TXT Record)
* **Type:** `TXT`
* **Name:** `mail._domainkey`
* **Content (পুরো টেক্সটটি কপি করুন):**
```text
v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzgyMTdpGB6P4U/OFbwQXcGTZkcsKm6MoDMM7ILvlr389C6xmkaeFFd35iibvHpcrK8tnka1vCf32XQVCbFUR/HeqrSONhDddJDV4sMY/nEaXDf6Go1pgnHkMVbNdHscS2fgmpYtUHpmoPPeSGEXhFlX6+qiDW6nquN5OtlrKTMV+EjzFizMqv/eJDlIXJXUmyDq4VDyP0ku0ZkETzAMBCzPQ6FWLaVwYne3R8wVYfcopRgEZSxbhtW8vOsL9W1ZzUJkxxS7HRzduCA43rbrBVlJtbkj2OySnieCMvNCsJcoqVUd0+97Z6IRlgkhT9iGY81MhhlgjhDXNKE3AmcKoSQIDAQAB
```

---

### ৬. Domain-based Message Authentication — DMARC (TXT Record)
* **Type:** `TXT`
* **Name:** `_dmarc`
* **Content:**
```text
v=DMARC1; p=none;
```

---

## 🌐 Webmail অ্যাক্সেস করার নিয়ম:
1. ব্রাউজারে প্রবেশ করুন: **`https://webmail.engulfic.com`**
2. **Username:** `info@engulfic.com`
3. **Password:** `cx@_ujRt9ILW}@23Pt`
4. লগইন করে ইনবক্স, সেন্ট মেইল দেখা এবং নতুন ইমেইল পাঠানো যাবে।

---

## 🛠️ নতুন ইমেইল অ্যাকাউন্ট খোলার কমান্ড (VPS Terminal):
নতুন কোনো ইমেইল অ্যাকাউন্ট (যেমন: `support@engulfic.com`) তৈরি করতে VPS টার্মিনালে নিচের কমান্ডটি রান করুন:
```bash
docker exec -ti engulfic-mailserver setup email add support@engulfic.com YourPasswordHere
```
