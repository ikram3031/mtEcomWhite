# Contact & Subscriber API Documentation

This document describes the public contact form submission and newsletter subscriber endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

---

## 1. Newsletter Subscription

Allows storefront customers to subscribe or re-activate their newsletter email subscription.

- **Method:** `POST`
- **URL:** `/api/v1/subscribers`
- **Authentication:** Not required

### Request Body:
```json
{
  "email": "customer@example.com"
}
```

### Success Response (201 Created / 200 OK):
```json
{
  "success": true,
  "message": "Subscribed! Welcome to the club."
}
```

### Error Responses:
- `400 Bad Request`: "Email is required." / "This email is already subscribed."

---

## 2. Contact Message Submission

Submits contact inquiry form messages and sends notification emails asynchronously to store administration and acknowledgment to the customer.

- **Method:** `POST`
- **URL:** `/api/v1/contact`
- **Authentication:** Not required

### Request Body:
```json
{
  "name": "Sarah Khan",
  "email": "sarah@example.com",
  "phone": "+8801712345678",
  "message": "I would like to inquire about bulk ordering for wedding gifts."
}
```

### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Your message has been sent successfully!"
}
```

### Error Response:
- `400 Bad Request`: "Name, email, and message are required."
