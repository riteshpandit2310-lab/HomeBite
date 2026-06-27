# HomeBite — REST API Specification

**Document ID:** HB-API-001  
**Version:** 1.0  
**Status:** Baseline  
**Classification:** Internal — Engineering  
**Base URL:** `https://api.homebite.in/api/v1`  
**References:** PRD v1.0 · SRS v1.0 · ARCHITECTURE v1.0 · DB v1.0  
**Last Updated:** June 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Request & Response Standards](#3-request--response-standards)
4. [Error Handling](#4-error-handling)
5. [Auth Endpoints](#5-auth-endpoints)
6. [Sender Endpoints](#6-sender-endpoints)
7. [Receiver Endpoints](#7-receiver-endpoints)
8. [Rider Endpoints](#8-rider-endpoints)
9. [Payment Endpoints](#9-payment-endpoints)
10. [Admin Endpoints](#10-admin-endpoints)
11. [Webhook Endpoints](#11-webhook-endpoints)
12. [WebSocket Events](#12-websocket-events)
13. [Rate Limiting](#13-rate-limiting)
14. [Status Code Reference](#14-status-code-reference)
15. [Validation Rules Reference](#15-validation-rules-reference)

---

## 1. Overview

### 1.1 Architecture Summary

HomeBite is a three-sided logistics platform. The API serves four distinct client surfaces:

| Client | Base Path | Primary Role |
|---|---|---|
| Sender Web App | `/sender/*` | Books and tracks deliveries |
| Receiver Web App | `/receiver/*` | Tracks incoming deliveries, confirms OTP |
| Rider PWA | `/rider/*` | Manages pickup and delivery jobs |
| Admin Dashboard | `/admin/*` | Operations, monitoring, dispute resolution |

### 1.2 API Versioning

All endpoints are versioned under `/api/v1/`. Breaking changes will increment the version. Non-breaking additions (new optional fields, new endpoints) do not increment the version.

### 1.3 Content Types

- **Request:** `Content-Type: application/json`
- **Response:** `Content-Type: application/json`
- **File uploads (profile photo):** `Content-Type: multipart/form-data`

### 1.4 Idempotency

All state-mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) accept an `X-Idempotency-Key` header (UUID v4). The server stores the result for 24 hours. Replaying a request with the same key returns the original response without re-executing the operation.

```
X-Idempotency-Key: f8a3c291-1234-4abc-9def-000000f1a2b3
```

---

## 2. Authentication

### 2.1 Mechanism

HomeBite uses **OTP-based, passwordless authentication** for all roles. There are no passwords.

- **Access Token:** JWT (HS256), 15-minute TTL, stored in `HttpOnly; Secure; SameSite=Strict` cookie named `access_token`.
- **Refresh Token:** 256-bit random string, 30-day TTL, stored in `HttpOnly; Secure; SameSite=Strict` cookie named `refresh_token`. Rotated on every use.

Cookies are sent automatically by the browser on every request. API clients must include `withCredentials: true`.

### 2.2 JWT Payload

```json
{
  "sub": "6660000000000000000000a1",
  "role": "SENDER",
  "aud": "homebite-api",
  "iat": 1719400000,
  "exp": 1719400900,
  "jti": "uuid-v4-token-id"
}
```

The payload contains **no PII** (no phone number, name, or address).

### 2.3 Role Hierarchy

| Role | Description | Allowed Paths |
|---|---|---|
| `SENDER` | Family member who schedules deliveries | `/auth/*`, `/sender/*`, `/payments/*` |
| `RECEIVER` | Person who receives tiffins | `/auth/*`, `/receiver/*` |
| `RIDER` | Verified delivery partner | `/auth/*`, `/rider/*` |
| `ADMIN` | HomeBite operations staff | `/auth/*`, `/admin/*` |
| `SUPER_ADMIN` | Platform owner / CTO | All paths including system config |

### 2.4 Token Refresh

When an access token expires, the API returns `401` with `{ "error": { "code": "TOKEN_EXPIRED" } }`. The client should silently call `POST /auth/refresh` with the refresh token cookie, then retry the original request.

### 2.5 Sending Authentication

Cookies are sent automatically. For non-browser clients (e.g., the Rider PWA WebSocket), pass the JWT in the Socket.IO handshake `auth` object:

```json
{ "auth": { "token": "<access_token_value>" } }
```

---

## 3. Request & Response Standards

### 3.1 Success Response Envelope

```json
{
  "success": true,
  "data": { }
}
```

For paginated list responses:

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "cursor": "6660000000000000000000f9",
    "hasMore": true,
    "total": 150
  }
}
```

### 3.2 Pagination

All list endpoints use **cursor-based pagination**.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | `string` (ObjectId) | — | Last document `_id` from previous page |
| `limit` | `integer` | `20` | Max items per page (max `100`) |

### 3.3 Date & Time Format

All timestamps use **ISO 8601 UTC** format: `2026-06-27T11:44:00.000Z`.

Dates without a time component use `YYYY-MM-DD`: `2026-06-27`.

All displayed times are in **IST (UTC+5:30)** for the UI; the API always stores and returns UTC.

---

## 4. Error Handling

### 4.1 Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_DUPLICATE",
    "message": "An active subscription already exists for this receiver.",
    "field": "receiverProfileId"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Machine-readable constant. Use this in client error handling, not `message`. |
| `message` | `string` | Human-readable explanation. May change between versions. |
| `field` | `string` (optional) | The input field that caused the error, for inline form validation. |

No stack traces, internal error messages, or database error strings are ever included in error responses.

### 4.2 Standard Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | One or more request fields failed schema validation. `field` indicates which. |
| `OTP_INVALID` | 400 | Submitted OTP does not match. |
| `OTP_EXPIRED` | 400 | OTP has expired (10-minute TTL). |
| `OTP_RATE_LIMIT` | 429 | Too many OTP requests for this phone number. |
| `OTP_DELIVERY_INVALID` | 400 | Delivery OTP does not match. |
| `OTP_DELIVERY_LOCKED` | 400 | OTP locked after 5 failed attempts. Contact support. |
| `TOKEN_MISSING` | 401 | No access token present. |
| `TOKEN_INVALID` | 401 | Access token is malformed or has an invalid signature. |
| `TOKEN_EXPIRED` | 401 | Access token has expired. Refresh and retry. |
| `FORBIDDEN` | 403 | Authenticated but insufficient role for this endpoint. |
| `NOT_FOUND` | 404 | Requested resource does not exist or does not belong to this user. |
| `SUBSCRIPTION_DUPLICATE` | 409 | An active subscription already exists for this receiver. |
| `RECEIVER_LIMIT_REACHED` | 409 | Maximum of 5 receiver profiles per sender account. |
| `RIDER_JOB_LIMIT` | 409 | Rider has reached the 15-job daily limit. |
| `INVALID_STATE_TRANSITION` | 409 | Requested job state transition is not permitted. |
| `DISPUTE_EXISTS` | 409 | A dispute already exists for this delivery job. |
| `PAUSE_WINDOW_OVERLAP` | 422 | Requested pause window overlaps with an existing pause. |
| `PAUSE_TOO_LATE` | 422 | Pause must be requested at least 2 hours before the pickup window. |
| `PAUSE_TOO_LONG` | 422 | Pause window exceeds the 14-day maximum. |
| `DISPUTE_WINDOW_EXPIRED` | 422 | Disputes must be raised within 24 hours of the delivery window. |
| `PAYMENT_SIGNATURE_INVALID` | 422 | Razorpay payment signature verification failed. |
| `PAYOUT_TOO_EARLY` | 422 | Payouts are processed after 18:00 IST only. |
| `REFUND_EXCEEDS_PAYMENT` | 422 | Refund amount exceeds the original payment amount. |
| `RECEIVER_PROFILE_HAS_ACTIVE_JOBS` | 422 | Cannot delete a receiver profile with active or pending jobs. |
| `RATE_LIMIT_EXCEEDED` | 429 | Request rate limit exceeded. See `Retry-After` header. |
| `INTERNAL_ERROR` | 500 | Unexpected server error. Reference `requestId` when contacting support. |

---

## 5. Auth Endpoints

### POST /auth/request-otp

Sends a 6-digit OTP to the provided phone number via SMS. Works for both new registration and returning users.

**Authentication:** Public (no token required)

**Request Body:**

```json
{
  "phone": "9876543210"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `phone` | `string` | Yes | 10-digit Indian mobile number. No country code prefix. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully.",
    "expiresInSeconds": 600
  }
}
```

`400 Bad Request` — Validation failure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number must be a 10-digit Indian mobile number.",
    "field": "phone"
  }
}
```

`429 Too Many Requests` — Rate limit: 3 OTP requests per phone per hour
```json
{
  "success": false,
  "error": {
    "code": "OTP_RATE_LIMIT",
    "message": "Too many OTP requests. Please try again in 47 minutes.",
    "field": "phone"
  }
}
```

**Headers on 429:** `Retry-After: 2820` (seconds)

---

### POST /auth/verify-otp

Verifies the OTP. On success, issues an access token and refresh token as `HttpOnly` cookies. Also handles first-time registration (creates user account) and returning login (updates `lastLoginAt`).

**Authentication:** Public

**Request Body:**

```json
{
  "phone": "9876543210",
  "otp": "482916",
  "name": "Priya Mehta",
  "role": "SENDER"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `phone` | `string` | Yes | 10-digit mobile number. |
| `otp` | `string` | Yes | Exactly 6 digits. |
| `name` | `string` | Conditionally | Required only on first registration. 2–60 characters. |
| `role` | `string` | Conditionally | Required only on first registration. Enum: `SENDER`, `RECEIVER`, `RIDER`. |

**Responses:**

`200 OK` — Sets two `HttpOnly` cookies: `access_token` (15 min), `refresh_token` (30 days)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6660000000000000000000a1",
      "name": "Priya Mehta",
      "role": "SENDER",
      "status": "ACTIVE",
      "profilePhotoUrl": null,
      "createdAt": "2026-06-27T07:30:00.000Z"
    },
    "isNewUser": false,
    "redirectTo": "/sender"
  }
}
```

`400 Bad Request` — Wrong OTP
```json
{
  "success": false,
  "error": {
    "code": "OTP_INVALID",
    "message": "The OTP you entered is incorrect.",
    "field": "otp"
  }
}
```

`400 Bad Request` — Expired OTP
```json
{
  "success": false,
  "error": {
    "code": "OTP_EXPIRED",
    "message": "This OTP has expired. Please request a new one.",
    "field": "otp"
  }
}
```

`403 Forbidden` — Account suspended
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This account has been suspended. Please contact support."
  }
}
```

---

### POST /auth/refresh

Silently refreshes the access token using the refresh token cookie. Issues a new access token and rotates the refresh token.

**Authentication:** Refresh token cookie (no access token required)

**Request Body:** None

**Responses:**

`200 OK` — Sets new `access_token` and `refresh_token` cookies
```json
{
  "success": true,
  "data": {
    "message": "Token refreshed."
  }
}
```

`401 Unauthorized` — Refresh token missing, invalid, or expired
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "Session expired. Please log in again."
  }
}
```

---

### POST /auth/logout

Invalidates the current session. Clears both cookies and blacklists the refresh token in Redis.

**Authentication:** JWT required

**Request Body:** None

**Responses:**

`200 OK` — Clears `access_token` and `refresh_token` cookies
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

---

### GET /auth/me

Returns the currently authenticated user's profile.

**Authentication:** JWT required (any role)

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6660000000000000000000a1",
      "name": "Priya Mehta",
      "role": "SENDER",
      "status": "ACTIVE",
      "profilePhotoUrl": "https://cdn.homebite.in/photos/6660000000000000000000a1.jpg",
      "walletBalance": 45000,
      "createdAt": "2026-05-01T07:30:00.000Z",
      "lastLoginAt": "2026-06-27T06:45:00.000Z"
    }
  }
}
```

For `RIDER` role, response also includes:
```json
{
  "riderProfile": {
    "vehicleType": "BIKE",
    "vehicleRegNumber": "MH02AB1234",
    "kycStatus": "VERIFIED",
    "zone": "MUM-BANDRA",
    "ratingAverage": 4.8,
    "ratingCount30d": 42,
    "dailyJobCount": 6
  }
}
```

---

### PATCH /auth/profile

Updates the authenticated user's name or profile photo.

**Authentication:** JWT required (any role)

**Request Body:**

```json
{
  "name": "Priya S. Mehta",
  "profilePhotoUrl": "https://cdn.homebite.in/photos/new-upload.jpg"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | `string` | No | 2–60 characters. |
| `profilePhotoUrl` | `string` | No | Valid CDN URL. Photo must be uploaded to CDN before this call. |

Phone number cannot be changed via this endpoint.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6660000000000000000000a1",
      "name": "Priya S. Mehta",
      "profilePhotoUrl": "https://cdn.homebite.in/photos/new-upload.jpg",
      "updatedAt": "2026-06-27T12:00:00.000Z"
    }
  }
}
```

`400 Bad Request` — Attempted phone change
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number cannot be changed after registration.",
    "field": "phone"
  }
}
```

---

## 6. Sender Endpoints

All endpoints in this section require `role: SENDER`.

---

### GET /sender/receivers

Returns all receiver profiles for the authenticated sender.

**Authentication:** JWT — `SENDER`

**Query Parameters:** None

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000c1",
      "name": "Arjun Mehta",
      "relationship": "SON",
      "dropAddress": {
        "line1": "Hostel Block-C, Room 204",
        "line2": "IIT Bombay Campus",
        "city": "Mumbai",
        "pincode": "400076",
        "landmark": "Near Gymkhana Ground",
        "deliveryNotes": "Ring the intercom at the main gate.",
        "lat": 19.1334,
        "lng": 72.9133
      },
      "status": "ACTIVE",
      "linkedUserId": "6660000000000000000000a2",
      "hasActiveSubscription": true,
      "createdAt": "2026-05-01T07:45:00.000Z"
    }
  ]
}
```

---

### POST /sender/receivers

Creates a new receiver profile. Maximum 5 per sender account.

**Authentication:** JWT — `SENDER`

**Request Body:**

```json
{
  "name": "Arjun Mehta",
  "relationship": "SON",
  "phone": "9123456789",
  "dropAddress": {
    "line1": "Hostel Block-C, Room 204",
    "line2": "IIT Bombay Campus",
    "city": "Mumbai",
    "pincode": "400076",
    "landmark": "Near Gymkhana Ground",
    "deliveryNotes": "Ring the intercom at the main gate. Guard will let you in."
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | `string` | Yes | 2–60 characters. |
| `relationship` | `string` | Yes | Enum: `SON`, `DAUGHTER`, `HUSBAND`, `WIFE`, `FRIEND`, `OTHER`. |
| `phone` | `string` | Yes | 10-digit Indian mobile number. |
| `dropAddress.line1` | `string` | Yes | 1–200 characters. |
| `dropAddress.line2` | `string` | No | 1–100 characters. |
| `dropAddress.city` | `string` | Yes | 2–60 characters. |
| `dropAddress.pincode` | `string` | Yes | Exactly 6 digits. Must be a valid Indian pincode. |
| `dropAddress.landmark` | `string` | No | Max 200 characters. |
| `dropAddress.deliveryNotes` | `string` | No | Max 200 characters. |

The system geocodes the address via Google Maps to derive `lat`/`lng`. If the address cannot be geocoded, the request is rejected.

If the `phone` matches an existing HomeBite user, the system links the accounts and returns `linkedUser`.

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "receiver": {
      "_id": "6660000000000000000000c1",
      "name": "Arjun Mehta",
      "relationship": "SON",
      "dropAddress": {
        "line1": "Hostel Block-C, Room 204",
        "city": "Mumbai",
        "pincode": "400076",
        "lat": 19.1334,
        "lng": 72.9133
      },
      "status": "ACTIVE",
      "linkedUser": {
        "_id": "6660000000000000000000a2",
        "name": "Arjun Mehta"
      },
      "createdAt": "2026-06-27T12:00:00.000Z"
    }
  }
}
```

`409 Conflict` — Maximum receivers reached
```json
{
  "success": false,
  "error": {
    "code": "RECEIVER_LIMIT_REACHED",
    "message": "You have reached the maximum of 5 receiver profiles."
  }
}
```

`422 Unprocessable Entity` — Address could not be geocoded
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The drop-off address could not be verified. Please check the pincode and try again.",
    "field": "dropAddress"
  }
}
```

---

### GET /sender/receivers/:id

Returns a single receiver profile.

**Authentication:** JWT — `SENDER`

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | `string` (ObjectId) | Receiver profile `_id`. |

**Responses:**

`200 OK` — Returns the receiver profile object (same structure as list item above).

`404 Not Found`
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Receiver profile not found."
  }
}
```

---

### PATCH /sender/receivers/:id

Updates a receiver profile's details.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — Receiver profile `_id`.

**Request Body** (all fields optional; only provided fields are updated):

```json
{
  "name": "Arjun R. Mehta",
  "relationship": "SON",
  "phone": "9123456790",
  "dropAddress": {
    "line1": "Hostel Block-D, Room 108",
    "city": "Mumbai",
    "pincode": "400076"
  }
}
```

Validation rules are identical to `POST /sender/receivers`. If `dropAddress` is provided (even partially), the full address is re-geocoded.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "receiver": {
      "_id": "6660000000000000000000c1",
      "name": "Arjun R. Mehta",
      "updatedAt": "2026-06-27T12:30:00.000Z"
    }
  }
}
```

---

### DELETE /sender/receivers/:id

Deletes a receiver profile. Blocked if the profile has any active or pending `delivery_jobs`.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — Receiver profile `_id`.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Receiver profile deleted.",
    "deletedId": "6660000000000000000000c1"
  }
}
```

`422 Unprocessable Entity` — Active jobs exist
```json
{
  "success": false,
  "error": {
    "code": "RECEIVER_PROFILE_HAS_ACTIVE_JOBS",
    "message": "This receiver profile cannot be deleted while there are active or pending deliveries. Please try again after today's delivery is complete."
  }
}
```

---

### GET /sender/subscriptions

Returns all subscriptions for the authenticated sender.

**Authentication:** JWT — `SENDER`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter by: `ACTIVE`, `PENDING_PAYMENT`, `PAUSED`, `CANCELLED`, `EXPIRED`. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `20` | Max items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000d1",
      "receiver": {
        "_id": "6660000000000000000000c1",
        "name": "Arjun Mehta",
        "relationship": "SON"
      },
      "planType": "MONTHLY",
      "planAmount": 99900,
      "pickupTimeWindow": { "start": "11:00", "end": "11:30" },
      "activeDays": ["MON", "TUE", "WED", "THU", "FRI"],
      "status": "ACTIVE",
      "startDate": "2026-06-02",
      "endDate": "2026-07-04",
      "deliveredCount": 18,
      "failedCount": 0,
      "pauseWindows": [
        { "from": "2026-06-28", "to": "2026-06-29" }
      ],
      "zone": "MUM-BANDRA",
      "createdAt": "2026-06-01T10:30:00.000Z"
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false,
    "total": 1
  }
}
```

---

### POST /sender/subscriptions

Creates a new subscription for a receiver. This endpoint creates the order but does **not** activate the subscription — activation happens after payment verification at `POST /payments/verify`.

**Authentication:** JWT — `SENDER`

**Request Body:**

```json
{
  "receiverProfileId": "6660000000000000000000c1",
  "planType": "MONTHLY",
  "pickupTimeWindow": {
    "start": "11:00",
    "end": "11:30"
  },
  "activeDays": ["MON", "TUE", "WED", "THU", "FRI"],
  "pickupAddress": {
    "line1": "42, Pali Hill Road",
    "line2": "Ground Floor",
    "city": "Mumbai",
    "pincode": "400050",
    "landmark": "Opposite Bandra Fort"
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `receiverProfileId` | `string` (ObjectId) | Yes | Must be a valid, active receiver profile owned by this sender. |
| `planType` | `string` | Yes | Enum: `SINGLE`, `SEVEN_DAY`, `MONTHLY`. |
| `pickupTimeWindow.start` | `string` | Yes | `HH:MM` format. Must be between `09:00` and `13:30`. |
| `pickupTimeWindow.end` | `string` | Yes | `HH:MM` format. Must be exactly 30 minutes after `start`. |
| `activeDays` | `string[]` | Yes | Array of: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`. At least one required. `SUN` not permitted. |
| `pickupAddress.line1` | `string` | Yes | Max 200 characters. |
| `pickupAddress.city` | `string` | Yes | Max 60 characters. |
| `pickupAddress.pincode` | `string` | Yes | 6-digit Indian pincode. |

**Plan Amounts:**

| Plan | Amount |
|---|---|
| `SINGLE` | ₹59 (5900 paise) |
| `SEVEN_DAY` | ₹299 (29900 paise) |
| `MONTHLY` | ₹999 (99900 paise) |

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "6660000000000000000000d1",
      "status": "PENDING_PAYMENT",
      "planType": "MONTHLY",
      "planAmount": 99900
    },
    "payment": {
      "razorpayOrderId": "order_PQx3fZmKtW9aBCD",
      "amount": 99900,
      "currency": "INR",
      "razorpayKeyId": "rzp_live_xxxxx"
    }
  }
}
```

The frontend uses `razorpayOrderId` and `razorpayKeyId` to open the Razorpay checkout modal.

`409 Conflict` — Duplicate subscription
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_DUPLICATE",
    "message": "An active subscription already exists for Arjun Mehta.",
    "field": "receiverProfileId"
  }
}
```

---

### GET /sender/subscriptions/:id

Returns full details of a specific subscription.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — Subscription `_id`.

**Responses:**

`200 OK` — Full subscription object including `pauseWindows`, `deliveredCount`, `failedCount`, and linked receiver profile.

---

### PATCH /sender/subscriptions/:id/pause

Pauses a subscription for a specific date range. No deliveries are generated for paused dates. Paused days roll forward to extend the subscription's end date.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — Subscription `_id`.

**Request Body:**

```json
{
  "from": "2026-06-28",
  "to": "2026-06-29"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `from` | `string` | Yes | `YYYY-MM-DD`. Must be a future date. |
| `to` | `string` | Yes | `YYYY-MM-DD`. Must be on or after `from`. |

**Business Rules Enforced:**
- The pause must be requested at least 2 hours before the pickup window start of the `from` date.
- The range `from` → `to` may not exceed 14 consecutive calendar days.
- The range must not overlap with any existing pause window.
- The subscription must have `status: ACTIVE`.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "6660000000000000000000d1",
      "status": "ACTIVE",
      "endDate": "2026-07-04",
      "pauseWindows": [
        {
          "from": "2026-06-28",
          "to": "2026-06-29",
          "createdAt": "2026-06-26T18:30:00.000Z"
        }
      ]
    }
  }
}
```

`422 Unprocessable Entity` — Pause too late
```json
{
  "success": false,
  "error": {
    "code": "PAUSE_TOO_LATE",
    "message": "Pauses must be requested at least 2 hours before the pickup window. The earliest you can pause is tomorrow.",
    "field": "from"
  }
}
```

`422 Unprocessable Entity` — Overlapping pause
```json
{
  "success": false,
  "error": {
    "code": "PAUSE_WINDOW_OVERLAP",
    "message": "This date range overlaps with an existing pause window.",
    "field": "from"
  }
}
```

---

### PATCH /sender/subscriptions/:id/resume

Removes a specific pause window, resuming deliveries from that date range. Only applicable for future pause windows.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — Subscription `_id`.

**Request Body:**

```json
{
  "from": "2026-06-28"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | `string` | Yes | `YYYY-MM-DD`. The `from` date of the pause window to remove. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Pause window removed. Deliveries will resume as scheduled."
  }
}
```

---

### DELETE /sender/subscriptions/:id

Cancels a subscription. Applies refund or wallet credit per business rules.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — Subscription `_id`.

**Request Body:**

```json
{
  "reason": "Going home for summer vacation."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `reason` | `string` | No | Max 500 characters. |

**Refund Rules:**
- Cancellation before day 15 of subscription: 50% of unused days credited to HomeBite wallet.
- Cancellation on or after day 15: 100% of unused value credited to HomeBite wallet (no cash refund).
- Any in-flight job (`PICKED_UP` or later) continues to completion.
- Any pending job (not yet `PICKED_UP`) is cancelled.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "6660000000000000000000d1",
      "status": "CANCELLED",
      "cancelledAt": "2026-06-27T13:00:00.000Z"
    },
    "refund": {
      "type": "WALLET_CREDIT",
      "amountPaise": 22500,
      "amountINR": 225.00,
      "walletBalancePaise": 67500
    }
  }
}
```

---

### GET /sender/jobs

Returns the delivery history for the authenticated sender across all receivers.

**Authentication:** JWT — `SENDER`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `receiverProfileId` | `string` | — | Filter by a specific receiver profile. |
| `status` | `string` | — | Filter by job status: `DELIVERED`, `ATTEMPTED_FAILED`, `IN_TRANSIT`, `ASSIGNED`, `PENDING_ASSIGNMENT`. |
| `from` | `string` | — | `YYYY-MM-DD`. Start of date range. |
| `to` | `string` | — | `YYYY-MM-DD`. End of date range. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `20` | Max items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000f0",
      "scheduledDate": "2026-06-26",
      "status": "DELIVERED",
      "receiver": {
        "name": "Arjun Mehta",
        "relationship": "SON"
      },
      "rider": {
        "name": "Raju Sharma",
        "ratingAverage": 4.8
      },
      "pickupWindow": { "start": "11:00", "end": "11:30" },
      "pickedUpAt": "2026-06-26T11:08:00.000Z",
      "deliveredAt": "2026-06-26T11:44:00.000Z",
      "riderEarnings": 5000,
      "distanceKm": 11.2
    }
  ],
  "meta": {
    "cursor": "6660000000000000000000f0",
    "hasMore": true,
    "total": 18
  }
}
```

---

### GET /sender/jobs/:id/tracking

Returns the active tracking state for a job that is currently `ASSIGNED`, `PICKED_UP`, or `IN_TRANSIT`. Used to initialise the tracking screen.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "IN_TRANSIT",
      "pickupWindow": { "start": "11:00", "end": "11:30" },
      "pickedUpAt": "2026-06-27T11:06:00.000Z",
      "dropAddress": {
        "line1": "Hostel Block-C, Room 204",
        "city": "Mumbai",
        "lat": 19.1334,
        "lng": 72.9133
      }
    },
    "rider": {
      "name": "Raju Sharma",
      "vehicleType": "BIKE",
      "ratingAverage": 4.8,
      "currentLocation": {
        "lat": 19.0851,
        "lng": 72.8672,
        "updatedAt": "2026-06-27T11:06:50.000Z"
      },
      "etaMinutes": 18
    }
  }
}
```

`404 Not Found` — Job does not belong to sender or does not exist.

---

### POST /sender/jobs/:id/dispute

Raises a dispute for a failed or unsatisfactory delivery.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Business Rules:**
- Must be raised within 24 hours of the job's pickup window end time.
- Only one dispute per delivery job is permitted.

**Request Body:**

```json
{
  "note": "The rider marked attempted-failed but I was home the entire morning. The bell was not rung."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `note` | `string` | Yes | 10–500 characters. |

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "dispute": {
      "_id": "6660000000000000000001a1",
      "deliveryJobId": "6660000000000000000000f2",
      "status": "OPEN",
      "type": "RIDER_NO_SHOW",
      "gpsClassification": "RIDER_NO_SHOW",
      "createdAt": "2026-06-27T14:30:00.000Z"
    }
  }
}
```

`409 Conflict` — Dispute already exists
```json
{
  "success": false,
  "error": {
    "code": "DISPUTE_EXISTS",
    "message": "A dispute has already been raised for this delivery."
  }
}
```

`422 Unprocessable Entity` — Dispute window expired
```json
{
  "success": false,
  "error": {
    "code": "DISPUTE_WINDOW_EXPIRED",
    "message": "Disputes must be raised within 24 hours of the delivery window. This window has passed."
  }
}
```

---

### POST /sender/jobs/:id/rate

Submits a rating for the delivery experience.

**Authentication:** JWT — `SENDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "stars": 5,
  "comment": "Always on time. Food arrived warm."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `stars` | `integer` | Yes | Integer 1–5. |
| `comment` | `string` | No | Max 150 characters. |

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "rating": {
      "_id": "6660000000000000000002a2",
      "stars": 5,
      "createdAt": "2026-06-27T14:00:00.000Z"
    }
  }
}
```

`409 Conflict` — Already rated
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "You have already rated this delivery."
  }
}
```

---

## 7. Receiver Endpoints

All endpoints in this section require `role: RECEIVER`.

---

### GET /receiver/jobs/active

Returns today's active incoming delivery for the receiver, if one exists. This is the primary screen for the receiver app.

**Authentication:** JWT — `RECEIVER`

**Responses:**

`200 OK` — Active job found
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "IN_TRANSIT",
      "scheduledDate": "2026-06-27",
      "pickupWindow": { "start": "11:00", "end": "11:30" },
      "sender": {
        "name": "Priya Mehta",
        "relationship": "SON"
      },
      "rider": {
        "name": "Raju Sharma",
        "vehicleType": "BIKE",
        "ratingAverage": 4.8,
        "currentLocation": {
          "lat": 19.0851,
          "lng": 72.8672,
          "updatedAt": "2026-06-27T11:06:50.000Z"
        },
        "etaMinutes": 18
      },
      "dropAddress": {
        "line1": "Hostel Block-C, Room 204",
        "city": "Mumbai",
        "lat": 19.1334,
        "lng": 72.9133
      }
    }
  }
}
```

`200 OK` — No active job today
```json
{
  "success": true,
  "data": {
    "job": null,
    "message": "No delivery scheduled for today."
  }
}
```

---

### GET /receiver/jobs/:id/otp

Returns the 4-digit OTP for the receiver to show to the rider. Only accessible when the job is in `IN_TRANSIT` status.

**Authentication:** JWT — `RECEIVER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Security:** The OTP is **only** returned to the authenticated receiver of that specific job. It is never returned to the sender, rider, or admin.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "otp": "7429",
    "expiresAt": "2026-06-27T15:06:00.000Z",
    "attemptsRemaining": 5
  }
}
```

`404 Not Found` — Job not in `IN_TRANSIT` status, or does not belong to this receiver.
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No active delivery found. Your rider may not have picked up the tiffin yet."
  }
}
```

---

### GET /receiver/jobs

Returns the delivery history for the authenticated receiver.

**Authentication:** JWT — `RECEIVER`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter: `DELIVERED`, `ATTEMPTED_FAILED`. |
| `from` | `string` | — | `YYYY-MM-DD`. |
| `to` | `string` | — | `YYYY-MM-DD`. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `20` | Items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000f0",
      "scheduledDate": "2026-06-26",
      "status": "DELIVERED",
      "sender": { "name": "Priya Mehta" },
      "rider": { "name": "Raju Sharma" },
      "deliveredAt": "2026-06-26T11:44:00.000Z",
      "rated": true
    }
  ],
  "meta": {
    "cursor": "6660000000000000000000f0",
    "hasMore": false,
    "total": 18
  }
}
```

---

### POST /receiver/jobs/:id/rate

Submits a rating for the rider after delivery.

**Authentication:** JWT — `RECEIVER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "stars": 5,
  "comment": "Super fast delivery! Food was still warm."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `stars` | `integer` | Yes | Integer 1–5. |
| `comment` | `string` | No | Max 150 characters. |

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "rating": {
      "_id": "6660000000000000000002a1",
      "stars": 5,
      "riderId": "6660000000000000000000b1",
      "createdAt": "2026-06-26T12:10:00.000Z"
    }
  }
}
```

---

### POST /receiver/jobs/:id/report

Reports an issue with a delivery (e.g., damaged container, wrong tiffin received).

**Authentication:** JWT — `RECEIVER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "reason": "DAMAGED_CONTAINER",
  "note": "The tiffin container lid was broken and food had spilled."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `reason` | `string` | Yes | Enum: `DAMAGED_CONTAINER`, `WRONG_TIFFIN`, `FOOD_QUALITY`, `OTHER`. |
| `note` | `string` | No | Max 500 characters. |

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "6660000000000000000001b1",
      "status": "SUBMITTED",
      "createdAt": "2026-06-26T12:30:00.000Z"
    },
    "message": "Your report has been submitted. Our team will review it shortly."
  }
}
```

---

## 8. Rider Endpoints

All endpoints in this section require `role: RIDER` with `kycStatus: VERIFIED` and `status: ACTIVE`.

---

### GET /rider/jobs/today

Returns all delivery jobs assigned to the authenticated rider for the current day, sorted by geographic pickup cluster (nearest first within the same time window).

**Authentication:** JWT — `RIDER`

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "6660000000000000000000f1",
        "status": "ASSIGNED",
        "scheduledDate": "2026-06-27",
        "pickupWindow": { "start": "11:00", "end": "11:30" },
        "pickupAddress": {
          "line1": "42, Pali Hill Road",
          "city": "Mumbai",
          "pincode": "400050",
          "landmark": "Opposite Bandra Fort",
          "lat": 19.0596,
          "lng": 72.8295
        },
        "dropAddress": {
          "line1": "Hostel Block-C, Room 204",
          "line2": "IIT Bombay Campus",
          "city": "Mumbai",
          "pincode": "400076",
          "deliveryNotes": "Ring the intercom at the main gate.",
          "lat": 19.1334,
          "lng": 72.9133
        },
        "sender": { "name": "Priya Mehta" },
        "receiver": { "name": "Arjun Mehta" },
        "riderEarnings": 5000,
        "distanceKm": 11.2
      }
    ],
    "summary": {
      "total": 6,
      "completed": 0,
      "pending": 6,
      "todayEarningsPaise": 0
    }
  }
}
```

---

### GET /rider/jobs/:id

Returns full details of a specific job assigned to the rider.

**Authentication:** JWT — `RIDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Responses:**

`200 OK` — Full job object. Includes sender masked phone when job is `ASSIGNED` or `IN_TRANSIT`:
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "ASSIGNED",
      "sender": {
        "name": "Priya Mehta",
        "maskedPhone": "98765 •••••"
      },
      "receiver": {
        "name": "Arjun Mehta"
      },
      "pickupWindow": { "start": "11:00", "end": "11:30" },
      "pickupAddress": { },
      "dropAddress": { },
      "riderEarnings": 5000
    }
  }
}
```

---

### PATCH /rider/jobs/:id/pickup

Marks the tiffin as picked up. Transitions the job from `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` (both transitions in a single call). Records the rider's GPS location at pickup. Begins GPS broadcasting.

**Authentication:** JWT — `RIDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "location": {
    "lat": 19.0594,
    "lng": 72.8297
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `location.lat` | `number` | Yes | Valid latitude (-90 to 90). |
| `location.lng` | `number` | Yes | Valid longitude (-180 to 180). |

**Side Effects:**
- Job status → `IN_TRANSIT`.
- `pickedUpAt` and `pickedUpLocation` are recorded.
- Push notification sent to Sender: "Rider picked up your tiffin."
- Push notification sent to Receiver: "Your tiffin is on the way."
- GPS WebSocket broadcasting begins.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "IN_TRANSIT",
      "pickedUpAt": "2026-06-27T11:06:00.000Z"
    }
  }
}
```

`409 Conflict` — Invalid state transition (job not in `ASSIGNED` status)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "This job cannot be marked as picked up. Current status: IN_TRANSIT."
  }
}
```

---

### POST /rider/jobs/:id/deliver

Submits the OTP provided by the receiver to complete the delivery. Transitions job to `DELIVERED` on success.

**Authentication:** JWT — `RIDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "otp": "7429",
  "location": {
    "lat": 19.1335,
    "lng": 72.9132
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `otp` | `string` | Yes | Exactly 4 digits. |
| `location.lat` | `number` | Yes | Valid latitude. |
| `location.lng` | `number` | Yes | Valid longitude. |

**Business Rules:**
- OTP is validated against the bcrypt hash stored on the job.
- Maximum 5 incorrect attempts. On the 5th failure, the OTP is locked and Admin is notified.
- Job must be in `IN_TRANSIT` status.

**Side Effects on success:**
- Job status → `DELIVERED`.
- GPS broadcasting stops.
- `deliveredAt` and `deliveredLocation` recorded.
- Rider earnings credited to `rider_wallets.pendingBalance`.
- Push notification sent to Sender: "Tiffin delivered."
- Push notification sent to Receiver: "Enjoy your meal."
- Subscription `deliveredCount` incremented.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "DELIVERED",
      "deliveredAt": "2026-06-27T11:44:00.000Z"
    },
    "earnings": {
      "thisJobPaise": 5000,
      "todayTotalPaise": 30000,
      "pendingWalletPaise": 30000
    }
  }
}
```

`400 Bad Request` — Wrong OTP
```json
{
  "success": false,
  "error": {
    "code": "OTP_DELIVERY_INVALID",
    "message": "Incorrect OTP. 3 attempts remaining.",
    "field": "otp"
  }
}
```

`400 Bad Request` — OTP locked
```json
{
  "success": false,
  "error": {
    "code": "OTP_DELIVERY_LOCKED",
    "message": "This delivery has been locked after 5 incorrect OTP attempts. Please contact HomeBite support.",
    "field": "otp"
  }
}
```

---

### PATCH /rider/jobs/:id/fail

Flags a delivery as attempted but failed. Rider must provide a reason code.

**Authentication:** JWT — `RIDER`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "reason": "RECEIVER_NOT_PRESENT",
  "note": "Waited 5 minutes. No one answered the intercom.",
  "location": {
    "lat": 19.1336,
    "lng": 72.9130
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `reason` | `string` | Yes | Enum: `RECEIVER_NOT_PRESENT`, `WRONG_ADDRESS`, `GATE_BLOCKED`, `OTHER`. |
| `note` | `string` | No | Max 200 characters. |
| `location.lat` | `number` | Yes | Valid latitude. |
| `location.lng` | `number` | Yes | Valid longitude. |

**Side Effects:**
- Job status → `ATTEMPTED_FAILED`.
- GPS broadcasting stops.
- Sender and Receiver notified.
- Admin notified.
- Dispute classification auto-run based on GPS trail.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "ATTEMPTED_FAILED",
      "failureReason": "RECEIVER_NOT_PRESENT",
      "failedAt": "2026-06-27T11:50:00.000Z"
    },
    "message": "Delivery flagged. The sender and receiver have been notified."
  }
}
```

---

### GET /rider/earnings

Returns a summary of earnings for the authenticated rider.

**Authentication:** JWT — `RIDER`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `period` | `string` | `today` | Enum: `today`, `week`, `month`. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "today": {
      "earningsPaise": 30000,
      "deliveries": 6
    },
    "pendingWalletPaise": 30000,
    "lastPayoutAmount": 192500,
    "lastPayoutAt": "2026-06-26T18:05:00.000Z",
    "totalEarningsAllTimePaise": 1247500
  }
}
```

---

### GET /rider/earnings/history

Returns a per-job earnings breakdown with pagination.

**Authentication:** JWT — `RIDER`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `from` | `string` | — | `YYYY-MM-DD`. |
| `to` | `string` | — | `YYYY-MM-DD`. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `20` | Items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "jobId": "6660000000000000000000f0",
      "scheduledDate": "2026-06-26",
      "receiver": "Arjun Mehta",
      "deliveredAt": "2026-06-26T11:44:00.000Z",
      "distanceKm": 11.2,
      "earningsPaise": 5000
    }
  ],
  "meta": {
    "cursor": "6660000000000000000000f0",
    "hasMore": false,
    "total": 42
  }
}
```

---

### POST /rider/payouts/request

Requests a payout of the pending wallet balance to the rider's registered bank account. Only available after 18:00 IST. One payout per calendar day.

**Authentication:** JWT — `RIDER`

**Request Body:** None

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "payout": {
      "_id": "6660000000000000000004b1",
      "amountPaise": 30000,
      "status": "PROCESSING",
      "mode": "IMPS",
      "createdAt": "2026-06-27T18:05:00.000Z"
    },
    "message": "Payout of ₹300.00 is being processed. It will be credited to your bank account within minutes."
  }
}
```

`422 Unprocessable Entity` — Too early
```json
{
  "success": false,
  "error": {
    "code": "PAYOUT_TOO_EARLY",
    "message": "Payouts are processed after 6:00 PM IST. Please try again later."
  }
}
```

`422 Unprocessable Entity` — Nothing to pay out
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Your pending wallet balance is ₹0. Complete deliveries to earn."
  }
}
```

---

### GET /rider/payouts

Returns the rider's payout history.

**Authentication:** JWT — `RIDER`

**Query Parameters:** `cursor`, `limit` (standard pagination).

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000004a1",
      "amountPaise": 192500,
      "status": "PROCESSED",
      "mode": "IMPS",
      "utr": "260612345678",
      "coverageDate": "2026-06-26",
      "jobCount": 3,
      "createdAt": "2026-06-26T18:05:00.000Z",
      "settledAt": "2026-06-26T18:07:45.000Z"
    }
  ],
  "meta": {
    "cursor": "6660000000000000000004a1",
    "hasMore": false,
    "total": 48
  }
}
```

---

## 9. Payment Endpoints

---

### POST /payments/create-order

Creates a Razorpay order for a subscription. Called immediately after `POST /sender/subscriptions` as part of the subscription creation flow. Returns the Razorpay order details needed to open the checkout modal on the client.

**Authentication:** JWT — `SENDER`

**Request Body:**

```json
{
  "subscriptionId": "6660000000000000000000d1"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `subscriptionId` | `string` (ObjectId) | Yes | Must be a `PENDING_PAYMENT` subscription owned by this sender. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_PQx3fZmKtW9aBCD",
    "amount": 99900,
    "currency": "INR",
    "razorpayKeyId": "rzp_live_xxxxx",
    "subscriptionId": "6660000000000000000000d1",
    "prefill": {
      "name": "Priya Mehta",
      "contact": "98765•••••"
    }
  }
}
```

`404 Not Found` — Subscription not found or not in `PENDING_PAYMENT` state.

---

### POST /payments/verify

Verifies the Razorpay payment signature server-side and activates the subscription. This endpoint is called immediately after the Razorpay checkout modal closes successfully.

**Authentication:** JWT — `SENDER`

**Request Body:**

```json
{
  "razorpayOrderId": "order_PQx3fZmKtW9aBCD",
  "razorpayPaymentId": "pay_PQx3gHnLuX0bEFG",
  "razorpaySignature": "a3f7e2b1c4d5...hmac_sha256_hex"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `razorpayOrderId` | `string` | Yes | Returned from Razorpay checkout. |
| `razorpayPaymentId` | `string` | Yes | Returned from Razorpay checkout. |
| `razorpaySignature` | `string` | Yes | HMAC-SHA256 signature from Razorpay. |

**Verification:** Server computes `HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, RAZORPAY_KEY_SECRET)` and compares it to `razorpaySignature`. Subscription is activated only if they match.

**Side Effects on success:**
- Payment record updated: `status → CAPTURED`, `capturedAt` set.
- Subscription updated: `status → ACTIVE`, `startDate` and `endDate` calculated.
- SMS receipt sent to sender.
- In-app notification sent.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "6660000000000000000000d1",
      "status": "ACTIVE",
      "startDate": "2026-06-28",
      "endDate": "2026-07-27",
      "planType": "MONTHLY"
    },
    "payment": {
      "_id": "6660000000000000000000e1",
      "status": "CAPTURED",
      "amount": 99900,
      "capturedAt": "2026-06-27T12:00:00.000Z"
    }
  }
}
```

`422 Unprocessable Entity` — Signature mismatch
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_SIGNATURE_INVALID",
    "message": "Payment verification failed. Please contact support if your amount was deducted.",
    "field": "razorpaySignature"
  }
}
```

---

### GET /payments

Returns the payment history for the authenticated sender.

**Authentication:** JWT — `SENDER`

**Query Parameters:** `cursor`, `limit` (standard pagination).

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000e1",
      "subscriptionId": "6660000000000000000000d1",
      "planType": "MONTHLY",
      "amount": 99900,
      "status": "CAPTURED",
      "amountRefunded": 0,
      "capturedAt": "2026-06-01T10:31:00.000Z",
      "refunds": []
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false,
    "total": 1
  }
}
```

---

## 10. Admin Endpoints

All endpoints in this section require `role: ADMIN` or `role: SUPER_ADMIN`.

---

### GET /admin/jobs

Returns all delivery jobs with comprehensive filtering. Supports export to CSV.

**Authentication:** JWT — `ADMIN`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter: `PENDING_ASSIGNMENT`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `ATTEMPTED_FAILED`. |
| `date` | `string` | today | `YYYY-MM-DD`. Specific date filter. |
| `from` | `string` | — | `YYYY-MM-DD`. Start of date range. |
| `to` | `string` | — | `YYYY-MM-DD`. End of date range. |
| `zone` | `string` | — | Zone code, e.g. `MUM-BANDRA`. |
| `riderId` | `string` | — | Filter by rider ObjectId. |
| `senderId` | `string` | — | Filter by sender ObjectId. |
| `escalated` | `boolean` | — | Filter escalated (unassigned at T-2h) jobs. |
| `export` | `boolean` | `false` | When `true`, returns CSV file instead of JSON. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `50` | Max items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000f1",
      "scheduledDate": "2026-06-27",
      "status": "IN_TRANSIT",
      "zone": "MUM-BANDRA",
      "sender": { "_id": "...", "name": "Priya Mehta" },
      "receiver": { "name": "Arjun Mehta" },
      "rider": { "_id": "...", "name": "Raju Sharma" },
      "pickupWindow": { "start": "11:00", "end": "11:30" },
      "pickedUpAt": "2026-06-27T11:06:00.000Z",
      "deliveredAt": null,
      "escalated": false,
      "riderEarnings": 5000
    }
  ],
  "meta": {
    "cursor": "6660000000000000000000f1",
    "hasMore": true,
    "total": 84
  }
}
```

`200 OK` (when `export=true`) — Returns `Content-Type: text/csv` with `Content-Disposition: attachment; filename="jobs-2026-06-27.csv"`.

---

### GET /admin/jobs/live

Returns all jobs currently in `IN_TRANSIT` status with their last known GPS position. Used to power the live operations map.

**Authentication:** JWT — `ADMIN`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `zone` | `string` | Optional. Filter by zone code. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000f1",
      "zone": "MUM-BANDRA",
      "rider": {
        "name": "Raju Sharma",
        "currentLocation": {
          "lat": 19.0851,
          "lng": 72.8672,
          "updatedAt": "2026-06-27T11:06:50.000Z"
        }
      },
      "dropAddress": {
        "lat": 19.1334,
        "lng": 72.9133
      },
      "pickedUpAt": "2026-06-27T11:06:00.000Z",
      "etaMinutes": 18
    }
  ]
}
```

---

### PATCH /admin/jobs/:id/assign

Manually assigns or reassigns a delivery job to a rider.

**Authentication:** JWT — `ADMIN`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Request Body:**

```json
{
  "riderId": "6660000000000000000000b1"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `riderId` | `string` (ObjectId) | Yes | Must be an `ACTIVE` rider with `kycStatus: VERIFIED` and fewer than 15 jobs today. |

**Side Effects:**
- If reassigning from another rider, that rider is notified via push: "A delivery has been reassigned."
- New rider notified via push: "A new delivery has been assigned to you."

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "ASSIGNED",
      "riderId": "6660000000000000000000b1",
      "assignedAt": "2026-06-27T10:00:00.000Z"
    }
  }
}
```

`409 Conflict` — Rider at daily job limit
```json
{
  "success": false,
  "error": {
    "code": "RIDER_JOB_LIMIT",
    "message": "Raju Sharma has reached the maximum of 15 deliveries for today.",
    "field": "riderId"
  }
}
```

---

### GET /admin/jobs/:id/gps-trail

Returns the full GPS trail for a job, used in dispute resolution.

**Authentication:** JWT — `ADMIN`

**Path Parameters:** `id` — DeliveryJob `_id`.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "6660000000000000000000f1",
      "status": "DELIVERED",
      "pickupAddress": { "lat": 19.0596, "lng": 72.8295 },
      "dropAddress": { "lat": 19.1334, "lng": 72.9133 }
    },
    "gpsTrail": [
      { "lat": 19.0594, "lng": 72.8297, "timestamp": "2026-06-27T11:06:10.000Z", "accuracy": 5 },
      { "lat": 19.0621, "lng": 72.8341, "timestamp": "2026-06-27T11:06:20.000Z", "accuracy": 6 }
    ],
    "trailCount": 228,
    "purgedAt": null
  }
}
```

`404 Not Found` — GPS trail purged (data older than 30 days) or job not found.

---

### GET /admin/disputes

Returns all disputes with filtering.

**Authentication:** JWT — `ADMIN`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | `OPEN` | Filter: `OPEN`, `UNDER_REVIEW`, `RESOLVED`. |
| `type` | `string` | — | Filter: `RECEIVER_ABSENT`, `RIDER_NO_SHOW`, `INDETERMINATE`. |
| `from` | `string` | — | `YYYY-MM-DD`. |
| `to` | `string` | — | `YYYY-MM-DD`. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `20` | Items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000001a1",
      "deliveryJobId": "6660000000000000000000f2",
      "type": "RIDER_NO_SHOW",
      "gpsClassification": "RIDER_NO_SHOW",
      "status": "OPEN",
      "resolution": "PENDING",
      "sender": { "name": "Priya Mehta" },
      "rider": { "name": "Raju Sharma" },
      "senderNote": "The rider marked attempted-failed but I was home.",
      "riderNote": "No one answered the intercom.",
      "createdAt": "2026-06-24T14:30:00.000Z"
    }
  ],
  "meta": { "cursor": null, "hasMore": false, "total": 1 }
}
```

---

### GET /admin/disputes/:id

Returns full dispute details including GPS trail analysis.

**Authentication:** JWT — `ADMIN`

**Path Parameters:** `id` — Dispute `_id`.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "dispute": {
      "_id": "6660000000000000000001a1",
      "status": "OPEN",
      "type": "RIDER_NO_SHOW",
      "gpsClassification": "RIDER_NO_SHOW",
      "senderNote": "The rider marked attempted-failed but I was home.",
      "riderNote": "No one answered the intercom.",
      "resolution": "PENDING"
    },
    "job": {
      "_id": "6660000000000000000000f2",
      "scheduledDate": "2026-06-24",
      "pickupWindow": { "start": "11:00", "end": "11:30" },
      "status": "ATTEMPTED_FAILED",
      "failureReason": "RECEIVER_NOT_PRESENT",
      "timeline": [
        { "event": "ASSIGNED", "at": "2026-06-23T18:00:00.000Z" },
        { "event": "ATTEMPTED_FAILED", "at": "2026-06-24T11:55:00.000Z" }
      ],
      "otpAttempts": 0
    },
    "gpsAnalysis": {
      "riderNearDropAddress": false,
      "closestApproachMetres": 820,
      "classification": "RIDER_NO_SHOW"
    },
    "sender": { "name": "Priya Mehta", "phone": "+91987•••••10" },
    "rider": { "name": "Raju Sharma", "phone": "+91987•••••01" }
  }
}
```

---

### POST /admin/disputes/:id/resolve

Resolves a dispute. Triggers a Razorpay refund if applicable. This action is irreversible by Admin; only Super Admin can reverse within 48 hours.

**Authentication:** JWT — `ADMIN`

**Path Parameters:** `id` — Dispute `_id`.

**Request Body:**

```json
{
  "resolution": "REFUND_FULL",
  "refundAmountPaise": 99900,
  "note": "GPS data confirms rider did not reach the drop-off address."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `resolution` | `string` | Yes | Enum: `REFUND_FULL`, `REFUND_PARTIAL`, `NO_REFUND`, `RESCHEDULE`. |
| `refundAmountPaise` | `integer` | Conditionally | Required when `resolution = REFUND_PARTIAL`. Must not exceed original payment amount. |
| `note` | `string` | Yes | Admin's explanation. 10–500 characters. |

**Side Effects:**
- Dispute `status → RESOLVED`.
- If `REFUND_FULL`: calls Razorpay refund API for full payment amount.
- If `REFUND_PARTIAL`: calls Razorpay refund API for `refundAmountPaise`.
- Audit log entry written.
- Sender notified of resolution.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "dispute": {
      "_id": "6660000000000000000001a1",
      "status": "RESOLVED",
      "resolution": "REFUND_FULL",
      "resolvedAt": "2026-06-27T15:00:00.000Z"
    },
    "refund": {
      "amountPaise": 99900,
      "razorpayRefundId": "rfnd_PQx3..."
    }
  }
}
```

`422 Unprocessable Entity` — Refund amount exceeds original
```json
{
  "success": false,
  "error": {
    "code": "REFUND_EXCEEDS_PAYMENT",
    "message": "Refund amount (₹1,200) exceeds the original payment (₹999).",
    "field": "refundAmountPaise"
  }
}
```

---

### GET /admin/riders

Returns all rider accounts.

**Authentication:** JWT — `ADMIN`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter: `PENDING_VERIFICATION`, `ACTIVE`, `UNDER_REVIEW`, `SUSPENDED`, `DEACTIVATED`. |
| `zone` | `string` | — | Filter by zone code. |
| `kycStatus` | `string` | — | Filter: `PENDING`, `VERIFIED`, `REJECTED`. |
| `search` | `string` | — | Search by name. |
| `cursor` | `string` | — | Pagination cursor. |
| `limit` | `integer` | `20` | Items per page. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6660000000000000000000b1",
      "name": "Raju Sharma",
      "status": "ACTIVE",
      "zone": "MUM-BANDRA",
      "vehicleType": "BIKE",
      "kycStatus": "VERIFIED",
      "ratingAverage": 4.8,
      "ratingCount30d": 42,
      "dailyJobCount": 6,
      "noShowCount30d": 0,
      "createdAt": "2026-04-15T09:00:00.000Z"
    }
  ],
  "meta": { "cursor": null, "hasMore": false, "total": 12 }
}
```

---

### POST /admin/riders

Onboards a new rider. Creates the user account and sends an OTP for the rider to complete registration.

**Authentication:** JWT — `ADMIN`

**Request Body:**

```json
{
  "name": "Vikram Nair",
  "phone": "9988776655",
  "vehicleType": "SCOOTER",
  "vehicleRegNumber": "MH04CD5678",
  "zone": "MUM-BANDRA",
  "kycVerificationToken": "DIGIO-KYC-TOKEN-9a4b3c2d",
  "bankAccountId": "fa_NewRiderBankAccount"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | `string` | Yes | 2–60 characters. |
| `phone` | `string` | Yes | 10-digit mobile number. Must not belong to an existing account. |
| `vehicleType` | `string` | Yes | Enum: `BIKE`, `SCOOTER`, `CYCLE`. |
| `vehicleRegNumber` | `string` | Yes | Valid Indian vehicle registration. |
| `zone` | `string` | Yes | Must be an active zone code in `zone_configs`. |
| `kycVerificationToken` | `string` | Yes | Token from KYC vault (Digio/DigiLocker). |
| `bankAccountId` | `string` | Yes | Razorpay fund_account ID. |

**Responses:**

`201 Created`
```json
{
  "success": true,
  "data": {
    "rider": {
      "_id": "6660000000000000000000b2",
      "name": "Vikram Nair",
      "status": "ACTIVE",
      "kycStatus": "VERIFIED",
      "zone": "MUM-BANDRA",
      "createdAt": "2026-06-27T16:00:00.000Z"
    }
  }
}
```

---

### PATCH /admin/riders/:id/status

Changes a rider's account status.

**Authentication:** JWT — `ADMIN`

**Path Parameters:** `id` — User `_id` of the rider.

**Request Body:**

```json
{
  "status": "SUSPENDED",
  "reason": "Three no-shows in the last 30 days. Under investigation."
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `status` | `string` | Yes | Enum: `ACTIVE`, `SUSPENDED`, `DEACTIVATED`. |
| `reason` | `string` | Yes | 10–500 characters. Written to audit log. |

**Side Effects:**
- Audit log entry written.
- If `SUSPENDED` or `DEACTIVATED`: rider's future jobs are flagged as `PENDING_ASSIGNMENT` and admins are notified.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "rider": {
      "_id": "6660000000000000000000b1",
      "status": "SUSPENDED",
      "updatedAt": "2026-06-27T16:30:00.000Z"
    },
    "jobsReturned": 3
  }
}
```

---

### GET /admin/riders/:id

Returns full profile, earnings history, job history, and rating history for a specific rider.

**Authentication:** JWT — `ADMIN`

**Path Parameters:** `id` — Rider user `_id`.

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "rider": {
      "_id": "6660000000000000000000b1",
      "name": "Raju Sharma",
      "status": "ACTIVE",
      "zone": "MUM-BANDRA",
      "vehicleType": "BIKE",
      "kycStatus": "VERIFIED",
      "ratingAverage": 4.8,
      "ratingCount30d": 42,
      "dailyJobCount": 6,
      "noShowCount30d": 0,
      "consecutiveLowRatings": 0,
      "createdAt": "2026-04-15T09:00:00.000Z"
    },
    "wallet": {
      "pendingBalance": 30000,
      "totalEarningsAllTime": 1247500,
      "lastPayoutAt": "2026-06-26T18:05:00.000Z"
    },
    "recentJobs": [ ],
    "recentRatings": [ ]
  }
}
```

---

### POST /admin/cron/trigger-job-gen

Manually triggers the nightly job generation cron. For emergency use when the automated cron has failed.

**Authentication:** JWT — `SUPER_ADMIN` only

**Request Body:**

```json
{
  "date": "2026-06-28",
  "confirm": true
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `date` | `string` | Yes | `YYYY-MM-DD`. The date to generate jobs for. Must be a future date. |
| `confirm` | `boolean` | Yes | Must be `true`. Safety guard against accidental calls. |

**Responses:**

`202 Accepted`
```json
{
  "success": true,
  "data": {
    "message": "Job generation for 2026-06-28 has been queued. Check logs for completion.",
    "queueJobId": "bull:job-generation:42"
  }
}
```

---

### GET /admin/analytics/revenue

Returns revenue analytics with daily, weekly, or monthly breakdown.

**Authentication:** JWT — `ADMIN`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `period` | `string` | `monthly` | Enum: `daily`, `weekly`, `monthly`. |
| `from` | `string` | — | `YYYY-MM-DD`. |
| `to` | `string` | — | `YYYY-MM-DD`. |
| `export` | `boolean` | `false` | Returns CSV when `true`. |

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "grossRevenuePaise": 4876200,
      "grossRevenueINR": 48762.00,
      "transactionCount": 52,
      "avgOrderValueINR": 937.73,
      "platformRevenuePaise": 877716
    },
    "breakdown": [
      {
        "date": "2026-06-27",
        "grossRevenueINR": 8982.00,
        "transactionCount": 9
      }
    ]
  }
}
```

---

### GET /admin/analytics/subscriptions

Returns subscription analytics: new, renewed, churned, paused counts.

**Authentication:** JWT — `ADMIN`

**Query Parameters:** `from`, `to`, `period`, `export` (same as revenue endpoint).

**Responses:**

`200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalActive": 2018,
      "newThisPeriod": 134,
      "renewedThisPeriod": 89,
      "cancelledThisPeriod": 23,
      "pausedThisPeriod": 47,
      "renewalRatePct": 79.5,
      "deliverySuccessRatePct": 97.2
    },
    "byPlan": {
      "SINGLE": 12,
      "SEVEN_DAY": 304,
      "MONTHLY": 1702
    },
    "byZone": [
      { "zone": "MUM-BANDRA", "active": 312, "successRatePct": 98.1 }
    ]
  }
}
```

---

## 11. Webhook Endpoints

### POST /webhooks/razorpay

Receives Razorpay payment lifecycle events. This endpoint does **not** require a JWT — authentication is via Razorpay webhook signature verification.

**Authentication:** Razorpay HMAC-SHA256 webhook signature in `X-Razorpay-Signature` header.

**Verification:** `HMAC_SHA256(raw_request_body, RAZORPAY_WEBHOOK_SECRET)` must match the header value. Requests with missing or invalid signatures are rejected with `400` and logged without processing.

**Supported Events:**

| Event | Action |
|---|---|
| `payment.captured` | Update payment status to `CAPTURED`; activate subscription if not already active (idempotent). |
| `payment.failed` | Update payment status to `FAILED`. |
| `refund.processed` | Update refund record with `razorpayRefundId` and mark as processed. |
| `payout.processed` | Update payout log status to `PROCESSED`. |
| `payout.reversed` | Update payout log status to `REVERSED`; restore rider wallet balance. |

**Request Body:** Raw Razorpay webhook payload (do not parse before signature verification).

**Responses:**

`200 OK` — Event received and processed (or already processed — idempotent).
```json
{ "received": true }
```

`400 Bad Request` — Invalid signature.
```json
{ "received": false, "error": "Invalid signature" }
```

---

## 12. WebSocket Events

HomeBite uses a dedicated **Socket.IO** server at `wss://socket.homebite.in` for real-time GPS tracking and admin alerts.

**Namespace:** `/tracking` — GPS tracking for all active jobs.  
**Namespace:** `/notifications` — Real-time admin alerts.

### 12.1 Authentication

Pass the JWT access token in the Socket.IO handshake:

```javascript
const socket = io('wss://socket.homebite.in/tracking', {
  auth: { token: '<access_token>' }
});
```

Connections with missing or invalid tokens are rejected with `connect_error: "jwt invalid"`.

### 12.2 Rooms

Each active DeliveryJob has a room named `job:{jobId}`. Clients join and leave rooms to subscribe/unsubscribe to GPS updates.

### 12.3 Client → Server Events

| Event | Emitted By | Payload | Description |
|---|---|---|---|
| `join:job` | Sender, Receiver, Rider, Admin | `{ jobId: string }` | Join the GPS room for a specific job. |
| `leave:job` | Sender, Receiver, Rider | `{ jobId: string }` | Leave the GPS room. |
| `gps:update` | Rider only | `{ lat: number, lng: number }` | Rider's current GPS position. Sent every 10 seconds during `IN_TRANSIT`. |

### 12.4 Server → Client Events

| Event | Received By | Payload | Description |
|---|---|---|---|
| `gps:broadcast` | Sender, Receiver, Admin | `{ lat: number, lng: number, eta: number, timestamp: string }` | Rider's re-broadcast position. `eta` is estimated minutes to drop-off. |
| `job:status` | All room members | `{ jobId: string, status: string, timestamp: string }` | Job state transition notification. Client should invalidate cached job data. |
| `geofence:alert` | Receiver only | `{ message: string, etaMinutes: number }` | Fired once when rider is ≤10 minutes from drop-off address. |
| `alert:unassigned_jobs` | Admin (in `/notifications` room) | `{ count: number, jobs: object[] }` | Unassigned jobs at T-2 hours before pickup. |
| `alert:delivery_failed` | Admin (in `/notifications` room) | `{ jobId: string, reason: string, riderName: string }` | Job flagged as `ATTEMPTED_FAILED`. |
| `alert:dispute_opened` | Admin (in `/notifications` room) | `{ disputeId: string, senderName: string, jobId: string }` | New dispute raised by sender. |
| `alert:otp_locked` | Admin (in `/notifications` room) | `{ jobId: string, receiverName: string }` | OTP locked after 5 failed attempts. |

---

## 13. Rate Limiting

Rate limits are enforced at the API gateway per IP and per authenticated user. Exceeded limits return `HTTP 429` with a `Retry-After` header.

| Endpoint Category | Limit | Window | Per |
|---|---|---|---|
| `POST /auth/request-otp` | 3 requests | 1 hour | Phone number |
| All auth endpoints | 10 requests | 1 minute | IP address |
| Standard API endpoints | 100 requests | 1 minute | Authenticated user |
| Admin endpoints | 200 requests | 1 minute | Authenticated admin |
| Webhook endpoints | 1,000 requests | 1 minute | IP address |

**429 Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please slow down."
  }
}
```

**Headers on 429:**
```
Retry-After: 47
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1719401040
```

---

## 14. Status Code Reference

| HTTP Status | When Used |
|---|---|
| `200 OK` | Successful `GET`, `PATCH`, `DELETE`. |
| `201 Created` | Successful `POST` that creates a new resource. |
| `202 Accepted` | Request accepted and queued (e.g., cron trigger). |
| `400 Bad Request` | Validation failure, invalid OTP, business rule violation. |
| `401 Unauthorized` | Missing, invalid, or expired access token. |
| `403 Forbidden` | Authenticated but wrong role for this endpoint. |
| `404 Not Found` | Resource does not exist or does not belong to the requesting user. |
| `409 Conflict` | Duplicate resource, race condition, or state conflict. |
| `422 Unprocessable Entity` | Logically invalid request (correct format, wrong business logic). |
| `429 Too Many Requests` | Rate limit exceeded. |
| `500 Internal Server Error` | Unexpected server-side failure. |

---

## 15. Validation Rules Reference

### Phone Numbers

- 10 digits, no country code, no spaces, no dashes.
- Valid Indian mobile numbers only (starts with 6, 7, 8, or 9).
- Example: `9876543210` ✓ — `09876543210` ✗ — `+919876543210` ✗

### ObjectIds

- 24-character hexadecimal string.
- MongoDB ObjectId format.
- Example: `6660000000000000000000a1` ✓

### Pickup Time Windows

- `HH:MM` in 24-hour format.
- Start must be between `09:00` and `13:30`.
- End must be exactly 30 minutes after start.
- Valid pairs: `{ start: "11:00", end: "11:30" }` ✓ — `{ start: "14:00", end: "14:30" }` ✗

### Dates

- `YYYY-MM-DD` format for date-only fields.
- ISO 8601 UTC for datetime fields.
- Must be a valid calendar date (no Feb 30, etc.).

### Plan Types and Amounts

| Plan | Amount | Start Date | Delivery Days |
|---|---|---|---|
| `SINGLE` | ₹59 (5,900 paise) | Next available weekday | 1 |
| `SEVEN_DAY` | ₹299 (29,900 paise) | Next available weekday | 6 (Mon–Sat configurable) |
| `MONTHLY` | ₹999 (99,900 paise) | Next available weekday | 26 (Mon–Fri) |

### String Length Limits

| Field | Min | Max |
|---|---|---|
| `name` | 2 | 60 |
| `dropAddress.line1` | 1 | 200 |
| `dropAddress.deliveryNotes` | — | 200 |
| `failureNote` | — | 200 |
| `comment` (rating) | — | 150 |
| `senderNote` (dispute) | 10 | 500 |
| `reason` (cancellation) | — | 500 |

### Star Ratings

- Integer only.
- Minimum: `1`, Maximum: `5`.

### Pincodes

- Exactly 6 digits.
- Must correspond to a valid Indian pincode.

---

*End of API.md — HomeBite v1.0*

*This document must be kept in sync with the implementation. All endpoint changes require this document to be updated before the change is merged to the main branch.*
