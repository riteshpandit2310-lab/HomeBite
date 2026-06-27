# HomeBite — MongoDB Database Design

**Document ID:** HB-DB-001  
**Version:** 1.0  
**Status:** Baseline  
**Classification:** Internal — Engineering  
**Prepared By:** Database Architecture Team  
**References:** PRD v1.0 · SRS v1.0 · ARCHITECTURE v1.0  
**Last Updated:** June 2026

---

## Document Control

| Version | Date | Author | Change Summary |
|---|---|---|---|
| 0.1 | June 2026 | DB Team | Initial draft aligned to ARCHITECTURE.md |
| 1.0 | June 2026 | DB Team | Baseline — full schemas, indexes, samples, ER diagram |

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Atlas Cluster Configuration](#2-atlas-cluster-configuration)
3. [Collections Catalogue](#3-collections-catalogue)
4. [Collection Schemas](#4-collection-schemas)
   - 4.1 [users](#41-users)
   - 4.2 [receiver_profiles](#42-receiver_profiles)
   - 4.3 [subscriptions](#43-subscriptions)
   - 4.4 [delivery_jobs](#44-delivery_jobs)
   - 4.5 [payments](#45-payments)
   - 4.6 [disputes](#46-disputes)
   - 4.7 [ratings](#47-ratings)
   - 4.8 [rider_wallets](#48-rider_wallets)
   - 4.9 [payout_logs](#49-payout_logs)
   - 4.10 [audit_logs](#410-audit_logs)
   - 4.11 [notification_logs](#411-notification_logs)
   - 4.12 [zone_configs](#412-zone_configs)
5. [Relationships](#5-relationships)
6. [Indexes](#6-indexes)
7. [ER Diagram](#7-er-diagram)
8. [Sample Documents](#8-sample-documents)
9. [Aggregation Pipelines](#9-aggregation-pipelines)
10. [Data Retention Policy](#10-data-retention-policy)
11. [Security and Encryption](#11-security-and-encryption)
12. [Migration and Seeding Strategy](#12-migration-and-seeding-strategy)

---

## 1. Database Overview

### 1.1 Design Philosophy

HomeBite's database is designed around three core reads that happen hundreds of times per day:

1. **"Give me all jobs assigned to Rider X for today"** — the foundational query for the Rider app
2. **"Which subscriptions are active for tomorrow's cron?"** — powers the entire daily delivery cycle
3. **"What is the live GPS position of the Rider on Job Y?"** — powers Sender and Receiver tracking

Every schema, index, and embedding decision is evaluated against these three queries first. Everything else is secondary.

### 1.2 Embedding vs. Referencing Decisions

MongoDB gives you a choice: embed data inside a document or reference it by ObjectId. Every decision in this design is explicit:

| Decision | Choice | Reason |
|---|---|---|
| Address in `delivery_jobs` | **Embed** | Snapshot at job creation time; address changes must not affect in-flight jobs |
| Refunds in `payments` | **Embed** | Always fetched together; max ~5 refunds per payment |
| GPS trail in `delivery_jobs` | **Embed** (capped array pattern) | Fetched together for dispute review; purged after 30 days |
| `riderProfile` in `users` | **Embed** | Always fetched together on login/job assignment |
| `receiver_profiles` in `users` | **Reference** (separate collection) | Up to 5 profiles per sender; queried independently; linked to subscriptions |
| Webhook events in `payments` | **Embed** | Audit trail; always accessed with the payment record |
| Ratings in separate collection | **Reference** | Queried independently for analytics; rolling aggregation jobs run on them |
| Payout logs separate from wallets | **Reference** | Payout history is paginated and long-lived; wallet is a live balance counter |
| `pauseWindows` in `subscriptions` | **Embed** (array) | Max 14 pause windows per subscription; always needed with subscription |

### 1.3 Database Naming

| Environment | Database Name |
|---|---|
| Production | `homebite_production` |
| Staging | `homebite_staging` |
| Development | `homebite_dev` |
| Test (CI) | `homebite_test` |

---

## 2. Atlas Cluster Configuration

```
┌──────────────────────────────────────────────────────────────────┐
│                  MongoDB Atlas Cluster                            │
│                                                                   │
│  Project:       HomeBite Production                              │
│  Cluster Name:  homebite-prod-m10                                │
│  Cloud:         AWS                                               │
│  Region:        ap-south-1 (Mumbai) ← PDPB compliance mandate   │
│  Tier:          M10 (pilot) → M30 (at 50,000 daily jobs)        │
│                                                                   │
│  Topology:      Replica Set (3 nodes)                            │
│    Primary:     1 node (read + write)                            │
│    Secondary:   2 nodes (read replica, failover)                 │
│                                                                   │
│  MongoDB Version: 7.0 LTS                                        │
│                                                                   │
│  Connection:                                                      │
│    Read Preference:  primaryPreferred                            │
│    Write Concern:    majority (w: "majority", j: true)           │
│    Read Concern:     local (default)                             │
│    Connection Pool:  min: 5, max: 50 per API instance            │
│                                                                   │
│  Security:                                                        │
│    Encryption at Rest:   AES-256 (MongoDB native)               │
│    Key Management:       AWS KMS (ap-south-1)                    │
│    Network:              VPC Peering (AWS ap-south-1)            │
│    IP Allowlist:         ECS task IPs only (no public access)    │
│    Auth:                 SCRAM-SHA-256                           │
│                                                                   │
│  Backups:                                                         │
│    Continuous PITR:      Enabled (1-second granularity)          │
│    Snapshot Schedule:    Daily at 02:00 IST                      │
│    Retention:            7 days snapshots, 30 days PITR          │
│    Cross-Region Backup:  ap-southeast-1 (Singapore) — DR copy   │
│                                                                   │
│  Monitoring:                                                      │
│    Atlas Performance Advisor: Enabled                            │
│    Real-Time Performance Panel: Enabled                          │
│    Query Profiler Threshold: 100ms                               │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Scaling Path

| Milestone | Atlas Tier | Expected Load |
|---|---|---|
| Pilot (Mumbai only) | M10 (2 vCPU, 2GB RAM) | ~200 jobs/day |
| City-scale (2–3 cities) | M20 (2 vCPU, 4GB RAM) | ~2,000 jobs/day |
| Multi-city (7 cities) | M30 (2 vCPU, 8GB RAM) | ~10,000 jobs/day |
| National scale | M50 + sharding | ~50,000+ jobs/day |

### 2.2 Sharding Strategy (for M50+ scale)

When sharding is enabled (post-MVP), the shard key choices are:

| Collection | Shard Key | Reason |
|---|---|---|
| `delivery_jobs` | `{ zone: 1, scheduledDate: 1 }` | Geographic + temporal; most queries filter on both |
| `users` | `{ _id: "hashed" }` | Even distribution; no hotspot on role or city |
| `audit_logs` | `{ timestamp: 1 }` | Time-series; range-based sharding for archival |

---

## 3. Collections Catalogue

| # | Collection | Purpose | Avg Doc Size | Est. Docs (Yr 1) | Grow Rate |
|---|---|---|---|---|---|
| 1 | `users` | All user accounts (all roles) | ~800 B | ~50,000 | Moderate |
| 2 | `receiver_profiles` | Sender's registered receivers | ~400 B | ~80,000 | Moderate |
| 3 | `subscriptions` | Delivery plans purchased by Senders | ~600 B | ~30,000 | Moderate |
| 4 | `delivery_jobs` | One per delivery per day; core operational table | ~8 KB (GPS trail) | ~500,000 | **High** |
| 5 | `payments` | Razorpay transaction records | ~1.5 KB | ~35,000 | Moderate |
| 6 | `disputes` | Delivery disputes raised by Senders | ~500 B | ~5,000 | Low |
| 7 | `ratings` | Post-delivery star ratings | ~200 B | ~400,000 | **High** |
| 8 | `rider_wallets` | Live wallet balance per Rider | ~300 B | ~3,000 | Low |
| 9 | `payout_logs` | Each payout transaction to a Rider's bank | ~400 B | ~60,000 | **High** |
| 10 | `audit_logs` | Immutable audit trail of all mutations | ~1 KB | ~2,000,000 | **Very High** |
| 11 | `notification_logs` | Record of every FCM/SMS sent | ~400 B | ~3,000,000 | **Very High** |
| 12 | `zone_configs` | Geographic zone definitions and settings | ~2 KB | ~50 | Static |

---

## 4. Collection Schemas

> **Schema notation conventions:**
> - `// TYPE` — the field's BSON type
> - `// ENCRYPTED` — AES-256-GCM encrypted at application layer before storage
> - `// HASHED` — one-way SHA-256 hash (irreversible)
> - `// ref:` — logical foreign key to another collection (no DB-enforced constraint; enforced at service layer)
> - `// EMBEDDED` — subdocument, not a reference
> - Fields marked `// REQUIRED` cannot be null in the service layer
> - Fields without a comment are optional or context-dependent

---

### 4.1 users

**Purpose:** Single collection for all roles. Role-specific fields are nested under role-specific subdocuments (`riderProfile`). This avoids collection-per-role fragmentation while keeping queries clean.

**Business rules enforced by schema:**
- `phoneHash` is unique (one account per phone)
- `role` is immutable after creation (enforced at service layer)
- `riderProfile` only populated when `role = RIDER`

```javascript
{
  // ── IDENTITY ──────────────────────────────────────────────────
  _id:             ObjectId,        // REQUIRED. MongoDB primary key.

  phoneHash:       String,          // REQUIRED. SHA-256("+91" + phone).
                                    // HASHED. Used as lookup key.
                                    // Never decryptable — for lookup only.

  phoneEncrypted:  String,          // REQUIRED. AES-256-GCM(phone).
                                    // ENCRYPTED. Decrypted only by
                                    // AuthService and NotificationService.

  name:            String,          // REQUIRED. Display name. Min 2, max 60 chars.

  role:            String,          // REQUIRED. Enum:
                                    //   SENDER | RECEIVER | RIDER
                                    //   ADMIN  | SUPER_ADMIN

  profilePhotoUrl: String,          // CDN URL (Cloudflare). Null until uploaded.

  // ── SESSION ───────────────────────────────────────────────────
  fcmTokens:       [String],        // One per registered device.
                                    // Stale tokens removed on FCM UNREGISTERED.

  status:          String,          // REQUIRED. Enum:
                                    //   ACTIVE | SUSPENDED | DEACTIVATED

  // ── WALLET REFERENCE (Sender only) ────────────────────────────
  walletBalance:   Number,          // HomeBite wallet credits in paise.
                                    // Only used for Sender refund credits.
                                    // Default: 0.

  // ── RIDER-SPECIFIC PROFILE ────────────────────────────────────
  // Populated only when role = RIDER. null for all other roles.
  riderProfile: {
    vehicleType:             String,  // Enum: BIKE | SCOOTER | CYCLE
    vehicleRegNumber:        String,  // e.g. "MH02AB1234"
    kycVerificationToken:    String,  // Token from Digio/DigiLocker vault.
                                      // Not the actual Aadhaar/PAN document.
    kycStatus:               String,  // Enum: PENDING | VERIFIED | REJECTED
    zone:                    String,  // Geographic zone code. e.g. "MUM-BANDRA"
    bankAccountId:           String,  // Razorpay fund_account ID for payouts.
    dailyJobCount:           Number,  // Jobs assigned today. Reset to 0 nightly.
    noShowCount30d:          Number,  // Escalated no-shows in rolling 30 days.
    ratingAverage:           Number,  // Rolling 30-day average. null if < 5 ratings.
    ratingCount30d:          Number,  // Count of ratings in last 30 days.
    consecutiveLowRatings:   Number,  // Resets to 0 on any rating ≥ 3.5.
  },

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:   Date,                // REQUIRED. Set at registration.
  updatedAt:   Date,                // REQUIRED. Updated on every mutation.
  lastLoginAt: Date,                // Updated on each successful OTP verify.
  deletedAt:   Date,                // Soft-delete timestamp. PII purged 30 days after.
}
```

**Mongoose Validators (enforced at application layer):**
```javascript
role:   { enum: ['SENDER','RECEIVER','RIDER','ADMIN','SUPER_ADMIN'] }
status: { enum: ['ACTIVE','SUSPENDED','DEACTIVATED'] }
name:   { minlength: 2, maxlength: 60 }
riderProfile.vehicleType: { enum: ['BIKE','SCOOTER','CYCLE'] }
riderProfile.kycStatus:   { enum: ['PENDING','VERIFIED','REJECTED'] }
```

---

### 4.2 receiver_profiles

**Purpose:** A Sender's trusted delivery destinations. Separate collection (not embedded in `users`) because each profile is independently linked to one or more subscriptions, queried by receiverProfileId, and managed independently.

**Business rules enforced by schema:**
- `senderId` is immutable (a profile cannot be transferred between senders)
- Max 5 profiles per `senderId` (enforced at service layer, not schema)
- `status = DELETED` is a soft delete; document is never truly removed while referenced by active subscriptions

```javascript
{
  _id:          ObjectId,           // REQUIRED.

  senderId:     ObjectId,           // REQUIRED. ref: users (role=SENDER).
  linkedUserId: ObjectId,           // ref: users. Populated if the receiver's
                                    // phone matches an existing HomeBite account.
                                    // null if receiver has no account.

  // ── IDENTITY ──────────────────────────────────────────────────
  name:         String,             // REQUIRED. Receiver's display name.
  relationship: String,             // REQUIRED. Enum:
                                    //   SON | DAUGHTER | HUSBAND | WIFE
                                    //   FRIEND | OTHER

  phone:        String,             // REQUIRED. ENCRYPTED (AES-256-GCM).
                                    // Decrypted only for SMS notifications.

  // ── DROP-OFF LOCATION ─────────────────────────────────────────
  dropAddress: {
    line1:         String,          // REQUIRED. Street address.
    line2:         String,          // Apartment / floor / flat number.
    city:          String,          // REQUIRED.
    pincode:       String,          // REQUIRED. 6-digit Indian PIN.
    landmark:      String,          // Optional. "Near Powai Lake gate 3".
    deliveryNotes: String,          // Optional. Max 200 chars.
                                    // "Ring bell twice. Guard will open gate."
    lat:           Number,          // REQUIRED. Geocoded on address entry.
    lng:           Number,          // REQUIRED.
  },

  // ── STATE ─────────────────────────────────────────────────────
  status:       String,             // REQUIRED. Enum: ACTIVE | PAUSED | DELETED

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:    Date,               // REQUIRED.
  updatedAt:    Date,               // REQUIRED.
}
```

---

### 4.3 subscriptions

**Purpose:** Represents a delivery plan purchased by a Sender for one Receiver. The subscription is the master record from which daily `delivery_jobs` are generated.

**Business rules enforced by schema:**
- One active subscription per `(senderId, receiverProfileId)` pair
- `status` transitions are one-directional (cannot go CANCELLED → ACTIVE)
- `pauseWindows` are non-overlapping (validated at service layer)
- `endDate` is extended, not shortened, when days are paused (SRS-BR-002)

```javascript
{
  _id:               ObjectId,      // REQUIRED.

  // ── REFERENCES ────────────────────────────────────────────────
  senderId:          ObjectId,      // REQUIRED. ref: users (role=SENDER).
  receiverProfileId: ObjectId,      // REQUIRED. ref: receiver_profiles.
  paymentId:         ObjectId,      // ref: payments. Populated after payment captured.

  // ── PLAN ──────────────────────────────────────────────────────
  planType:          String,        // REQUIRED. Enum:
                                    //   SINGLE | SEVEN_DAY | MONTHLY

  planAmount:        Number,        // REQUIRED. In paise at time of purchase.
                                    // Locked at creation. e.g. 99900 = ₹999.

  // ── SCHEDULE ──────────────────────────────────────────────────
  pickupTimeWindow: {
    start:  String,                 // REQUIRED. "HH:MM" 24h. e.g. "11:00"
    end:    String,                 // REQUIRED. "HH:MM". e.g. "11:30"
  },

  pickupAddress: {                  // Snapshot at subscription creation.
    line1:    String,               // REQUIRED.
    line2:    String,
    city:     String,               // REQUIRED.
    pincode:  String,               // REQUIRED.
    landmark: String,
    lat:      Number,               // REQUIRED.
    lng:      Number,               // REQUIRED.
  },

  activeDays: [String],             // REQUIRED. Enum values:
                                    //   MON | TUE | WED | THU | FRI | SAT
                                    // Default: ["MON","TUE","WED","THU","FRI"]

  // ── PAUSE MANAGEMENT ──────────────────────────────────────────
  pauseWindows: [{                  // Each pause extends endDate by same days.
    from:      Date,                // Inclusive start of pause.
    to:        Date,                // Inclusive end of pause.
    createdAt: Date,                // When the pause was requested.
  }],

  // ── ZONE ──────────────────────────────────────────────────────
  zone: String,                     // REQUIRED. Derived from pickupAddress pincode.
                                    // e.g. "MUM-BANDRA". Used for rider assignment.

  // ── STATE ─────────────────────────────────────────────────────
  status: String,                   // REQUIRED. Enum:
                                    //   PENDING_PAYMENT — created, not yet paid
                                    //   ACTIVE          — paid and running
                                    //   PAUSED          — all days currently paused
                                    //   CANCELLED       — terminated by Sender
                                    //   EXPIRED         — endDate passed

  cancellationReason: String,       // Free text. Captured on cancellation.
  cancelledAt:        Date,         // Timestamp of cancellation.

  // ── DATES ─────────────────────────────────────────────────────
  startDate:  Date,                 // REQUIRED. First delivery date.
  endDate:    Date,                 // REQUIRED. Last delivery date (inclusive).
                                    // Extended when days are paused.
  totalDays:  Number,               // REQUIRED. Original plan duration in weekdays.
  deliveredCount: Number,           // Incremented on each successful delivery.
  failedCount:    Number,           // Incremented on each ATTEMPTED_FAILED.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:  Date,                 // REQUIRED.
  updatedAt:  Date,                 // REQUIRED.
}
```

---

### 4.4 delivery_jobs

**Purpose:** The atomic unit of every delivery. One document is created per delivery per day by the nightly cron job. This is the highest-volume collection and the most performance-critical.

**Key design decisions:**
- Addresses are **embedded** (snapshot at job creation — address changes on sender/receiver do not affect in-flight jobs)
- GPS trail is **embedded** as an array (purged after 30 days by cleanup cron)
- `senderId` and `receiverId` are **denormalised** (copied from subscription) to avoid joins on the hot query path
- `otpHash` is bcrypt, not stored plaintext — even in the DB, the OTP is not readable

**State machine:**
```
PENDING_ASSIGNMENT → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
                                          ↘ ATTEMPTED_FAILED
```

```javascript
{
  _id:            ObjectId,         // REQUIRED.

  // ── REFERENCES (denormalised for query performance) ────────────
  subscriptionId: ObjectId,         // REQUIRED. ref: subscriptions.
  senderId:       ObjectId,         // REQUIRED. ref: users. Denormalised.
  receiverId:     ObjectId,         // REQUIRED. ref: receiver_profiles.
                                    // (or ref: users if linkedUserId exists)
  riderId:        ObjectId,         // ref: users (role=RIDER). null until assigned.

  // ── SCHEDULE ──────────────────────────────────────────────────
  scheduledDate:  Date,             // REQUIRED. Midnight IST of delivery date.
                                    // e.g. ISODate("2026-06-27T00:00:00.000+05:30")

  pickupWindow: {
    start:  String,                 // REQUIRED. "HH:MM". Copied from subscription.
    end:    String,                 // REQUIRED. "HH:MM".
  },

  // ── ADDRESSES (embedded snapshots) ────────────────────────────
  pickupAddress: {
    line1:    String,               // REQUIRED.
    line2:    String,
    city:     String,               // REQUIRED.
    pincode:  String,               // REQUIRED.
    landmark: String,
    lat:      Number,               // REQUIRED.
    lng:      Number,               // REQUIRED.
  },

  dropAddress: {
    line1:         String,          // REQUIRED.
    line2:         String,
    city:          String,          // REQUIRED.
    pincode:       String,          // REQUIRED.
    landmark:      String,
    deliveryNotes: String,
    lat:           Number,          // REQUIRED.
    lng:           Number,          // REQUIRED.
  },

  zone:           String,           // REQUIRED. e.g. "MUM-BANDRA".

  // ── OTP ───────────────────────────────────────────────────────
  otpHash:        String,           // REQUIRED. bcrypt(4-digit OTP, cost=10).
                                    // The raw OTP is NEVER stored anywhere.
  otpAttempts:    Number,           // Default: 0. Max: 5.
  otpLocked:      Boolean,          // Default: false. True after 5 failures.
  otpLockedAt:    Date,             // Timestamp when locked.

  // ── STATUS ────────────────────────────────────────────────────
  status: String,                   // REQUIRED. Enum:
                                    //   PENDING_ASSIGNMENT
                                    //   ASSIGNED
                                    //   PICKED_UP
                                    //   IN_TRANSIT
                                    //   DELIVERED
                                    //   ATTEMPTED_FAILED

  escalated:      Boolean,          // Default: false.
                                    // True when T-2hr alert sent to Admin.
  escalatedAt:    Date,

  // ── TIMESTAMPS FOR EACH STATE TRANSITION ──────────────────────
  assignedAt:     Date,
  pickedUpAt:     Date,
  deliveredAt:    Date,
  failedAt:       Date,

  // ── FAILURE DATA ──────────────────────────────────────────────
  failureReason:  String,           // Enum (when ATTEMPTED_FAILED):
                                    //   RECEIVER_NOT_PRESENT
                                    //   WRONG_ADDRESS
                                    //   GATE_BLOCKED
                                    //   OTHER
  failureNote:    String,           // Rider's free-text note. Max 200 chars.

  // ── PICKUP LOCATION AT TIME OF PICKUP ─────────────────────────
  pickedUpLocation: {
    lat: Number,
    lng: Number,
  },

  // ── DELIVERY LOCATION AT TIME OF DELIVERY ─────────────────────
  deliveredLocation: {
    lat: Number,
    lng: Number,
  },

  // ── GPS TRAIL (purged 30 days post-delivery) ──────────────────
  gpsTrail: [{
    lat:       Number,              // Rider latitude.
    lng:       Number,              // Rider longitude.
    timestamp: Date,                // UTC timestamp of GPS reading.
    accuracy:  Number,              // GPS accuracy in metres (from device).
  }],

  gpsTrailPurgedAt: Date,           // Set when GPS trail is purged by cleanup cron.

  // ── EARNINGS ──────────────────────────────────────────────────
  riderEarnings:  Number,           // In paise. e.g. 5000 = ₹50.
                                    // Credited to rider_wallets on DELIVERED.
  distanceKm:     Number,           // Calculated from pickup → drop lat/lng.
                                    // Used for earnings tier (₹40–₹60 range).

  // ── IDEMPOTENCY ───────────────────────────────────────────────
  idempotencyKey: String,           // UUID. Prevents duplicate state transitions
                                    // on network retry. Checked before any PATCH.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:  Date,                 // REQUIRED. Set by cron at 23:30 IST.
  updatedAt:  Date,                 // REQUIRED. Updated on every state change.
}
```

---

### 4.5 payments

**Purpose:** Immutable financial record for every Razorpay transaction. HomeBite never stores card/UPI data — only Razorpay's IDs and status codes.

**Design note:** Refunds are embedded as an array because there will rarely be more than 2–3 refunds per payment, and they are always fetched alongside the payment for the dispute resolution panel.

```javascript
{
  _id:                ObjectId,     // REQUIRED.

  // ── REFERENCES ────────────────────────────────────────────────
  senderId:           ObjectId,     // REQUIRED. ref: users.
  subscriptionId:     ObjectId,     // REQUIRED. ref: subscriptions.

  // ── RAZORPAY IDENTIFIERS ──────────────────────────────────────
  razorpayOrderId:    String,       // REQUIRED. UNIQUE. e.g. "order_PQx3f..."
  razorpayPaymentId:  String,       // Populated after capture. e.g. "pay_PQx..."
  razorpaySignature:  String,       // HMAC-SHA256 signature. Stored for audit.

  // ── AMOUNT ────────────────────────────────────────────────────
  amount:             Number,       // REQUIRED. In paise. e.g. 99900 = ₹999.
  currency:           String,       // REQUIRED. "INR".
  amountRefunded:     Number,       // Running total of refunded paise. Default: 0.

  // ── STATUS ────────────────────────────────────────────────────
  status: String,                   // REQUIRED. Enum:
                                    //   PENDING            — order created, not paid
                                    //   CAPTURED           — payment successful
                                    //   FAILED             — payment declined/aborted
                                    //   REFUNDED           — fully refunded
                                    //   PARTIALLY_REFUNDED — partial refund issued

  // ── REFUNDS (embedded array) ──────────────────────────────────
  refunds: [{
    _id:               ObjectId,    // Sub-document ID.
    amount:            Number,      // In paise.
    razorpayRefundId:  String,      // e.g. "rfnd_PQx3..."
    reason:            String,      // Enum:
                                    //   DELIVERY_FAILED | RIDER_NO_SHOW
                                    //   SYSTEM_ERROR | GOODWILL
    note:              String,      // Admin's free-text note.
    initiatedBy:       ObjectId,    // ref: users (role=ADMIN).
    createdAt:         Date,
  }],

  // ── WEBHOOK AUDIT TRAIL ───────────────────────────────────────
  webhookEvents: [{                 // Every Razorpay webhook received.
    event:      String,             // e.g. "payment.captured"
    payload:    Object,             // Raw Razorpay payload (sanitised — no card data).
    receivedAt: Date,
    processed:  Boolean,            // Whether this event was acted upon.
  }],

  // ── RETRY TRACKING ────────────────────────────────────────────
  failureAttempts:    Number,       // Count of failed payment attempts. Max: 3.
  lastFailureReason:  String,       // Last Razorpay error code.
  gracePeriodExpiry:  Date,         // 24h after first failure. Sub auto-cancelled after.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:          Date,         // REQUIRED.
  updatedAt:          Date,         // REQUIRED.
  capturedAt:         Date,         // Set when status → CAPTURED.
}
```

---

### 4.6 disputes

**Purpose:** One dispute per DeliveryJob. Raised by Senders within 24 hours of the delivery window. Resolved by Admin.

**Constraint:** Only one dispute per `deliveryJobId` (UNIQUE index). A second dispute attempt on the same job returns a 409 Conflict.

```javascript
{
  _id:           ObjectId,          // REQUIRED.

  // ── REFERENCES ────────────────────────────────────────────────
  deliveryJobId: ObjectId,          // REQUIRED. UNIQUE. ref: delivery_jobs.
  raisedBy:      ObjectId,          // REQUIRED. ref: users (role=SENDER).
  resolvedBy:    ObjectId,          // ref: users (role=ADMIN). null until resolved.

  // ── CLASSIFICATION (auto + admin) ────────────────────────────
  type: String,                     // REQUIRED. Enum:
                                    //   RECEIVER_ABSENT  — GPS shows rider at drop
                                    //   RIDER_NO_SHOW    — GPS shows rider never arrived
                                    //   INDETERMINATE    — inconclusive GPS data
  gpsClassification: String,        // Auto-set by system on dispute creation.
                                    // Same enum as type. Source for admin's initial view.

  // ── EVIDENCE ──────────────────────────────────────────────────
  senderNote:     String,           // Sender's description. Max 500 chars.
  riderNote:      String,           // Rider's note (from job.failureNote). Max 200 chars.
  senderEvidence: [String],         // CDN URLs of photos (future feature, nullable now).

  // ── RESOLUTION ────────────────────────────────────────────────
  status:         String,           // REQUIRED. Enum:
                                    //   OPEN | UNDER_REVIEW | RESOLVED

  resolution:     String,           // Enum (set on resolve):
                                    //   REFUND_FULL     — full amount refunded
                                    //   REFUND_PARTIAL  — partial refund issued
                                    //   NO_REFUND       — no refund granted
                                    //   RESCHEDULE      — delivery rescheduled

  resolutionNote: String,           // Admin's explanation. Max 500 chars.
  refundAmount:   Number,           // In paise. Set if resolution = REFUND_PARTIAL.
  resolvedAt:     Date,             // Timestamp of resolution.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:      Date,             // REQUIRED. Must be within 24h of job's
                                    // pickup window end (enforced at service layer).
  updatedAt:      Date,             // REQUIRED.
}
```

---

### 4.7 ratings

**Purpose:** Separate collection (not embedded in `delivery_jobs`) for two reasons: (1) rating aggregation queries run independently across many jobs; (2) a rating can be submitted from two actors (Sender and Receiver) for the same job.

```javascript
{
  _id:           ObjectId,          // REQUIRED.

  // ── REFERENCES ────────────────────────────────────────────────
  deliveryJobId: ObjectId,          // REQUIRED. ref: delivery_jobs.
  riderId:       ObjectId,          // REQUIRED. ref: users (role=RIDER). Denormalised.
  ratedBy:       ObjectId,          // REQUIRED. ref: users (Sender or Receiver).
  raterRole:     String,            // REQUIRED. Enum: SENDER | RECEIVER.

  // ── RATING DATA ───────────────────────────────────────────────
  stars:         Number,            // REQUIRED. Integer 1–5.
  comment:       String,            // Optional. Max 150 chars.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:     Date,              // REQUIRED.
}
```

**Compound Uniqueness** (enforced at service layer + sparse index):
`{ deliveryJobId, raterRole }` — one rating per rater role per job.

---

### 4.8 rider_wallets

**Purpose:** Live wallet balance for each Rider. Single source of truth for pending (unpaid) and lifetime earnings.

**Design note:** This is a **separate document from `users`** to avoid write conflicts. The `users` document is read heavily (on every auth check). The wallet document is written on every delivery completion. Separating them prevents hot-document contention.

```javascript
{
  _id:                ObjectId,     // REQUIRED.

  riderId:            ObjectId,     // REQUIRED. UNIQUE. ref: users (role=RIDER).

  // ── BALANCES ──────────────────────────────────────────────────
  pendingBalance:     Number,       // In paise. Earnings since last payout.
                                    // Default: 0.
  totalEarningsAllTime: Number,     // In paise. Cumulative. Never decremented.

  // ── TODAY'S SNAPSHOT ──────────────────────────────────────────
  todayEarnings:      Number,       // In paise. Reset to 0 at midnight IST.
  todayDeliveries:    Number,       // Count. Reset to 0 at midnight IST.
  todayDate:          Date,         // Date these snapshot fields belong to.

  // ── PAYOUT TRACKING ───────────────────────────────────────────
  lastPayoutAmount:   Number,       // In paise. Amount of last payout.
  lastPayoutAt:       Date,         // Timestamp of last successful payout.
  totalPayoutsCount:  Number,       // Total number of payouts processed.

  // ── BANK DETAILS (reference only) ────────────────────────────
  razorpayFundAccountId: String,    // Razorpay fund_account ID for payout API.
                                    // No raw bank account numbers stored here.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:          Date,         // REQUIRED. Created when rider is onboarded.
  updatedAt:          Date,         // REQUIRED. Updated on every delivery/payout.
}
```

---

### 4.9 payout_logs

**Purpose:** Immutable record of every payout transaction to a Rider's bank account. Financial audit trail (7-year retention).

```javascript
{
  _id:                 ObjectId,    // REQUIRED.

  // ── REFERENCES ────────────────────────────────────────────────
  riderId:             ObjectId,    // REQUIRED. ref: users.
  walletId:            ObjectId,    // REQUIRED. ref: rider_wallets.

  // ── PAYOUT DATA ───────────────────────────────────────────────
  amount:              Number,      // REQUIRED. In paise.
  razorpayPayoutId:    String,      // Razorpay payout ID. e.g. "pout_PQx..."
  razorpayFundAccountId: String,    // Which bank account was paid.
  mode:                String,      // REQUIRED. Enum: IMPS | NEFT | UPI
  utr:                 String,      // Bank UTR number. Populated when settled.

  // ── STATUS ────────────────────────────────────────────────────
  status:              String,      // REQUIRED. Enum:
                                    //   PROCESSING — submitted to Razorpay
                                    //   PROCESSED  — bank confirmed
                                    //   REVERSED   — payout returned by bank
                                    //   FAILED     — rejected by Razorpay

  failureReason:       String,      // Razorpay error message. null on success.

  // ── COVERAGE PERIOD ───────────────────────────────────────────
  coverageDate:        Date,        // Calendar date this payout covers.
  jobIds:              [ObjectId],  // ref: delivery_jobs. Jobs included in payout.
  jobCount:            Number,      // Count of jobs covered.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:           Date,        // REQUIRED. When payout was initiated.
  processedAt:         Date,        // When Razorpay confirmed processing.
  settledAt:           Date,        // When bank confirmed settlement (from webhook).
}
```

---

### 4.10 audit_logs

**Purpose:** Append-only immutable trail of every mutation to sensitive entities. 2-year retention, then archived to S3 cold storage. Never updated — only inserted.

```javascript
{
  _id:        ObjectId,             // REQUIRED.
  timestamp:  Date,                 // REQUIRED. UTC timestamp of the action.

  // ── ACTOR ─────────────────────────────────────────────────────
  userId:     ObjectId,             // REQUIRED. ref: users. Who did this.
  role:       String,               // REQUIRED. Actor's role at time of action.

  // ── ACTION ────────────────────────────────────────────────────
  action:     String,               // REQUIRED. Enum (examples):
                                    //   SUBSCRIPTION_CREATE
                                    //   SUBSCRIPTION_CANCEL
                                    //   SUBSCRIPTION_PAUSE
                                    //   PAYMENT_CAPTURE
                                    //   REFUND_ISSUE
                                    //   DISPUTE_CREATE
                                    //   DISPUTE_RESOLVE
                                    //   RIDER_STATUS_CHANGE
                                    //   OTP_LOCK_RESET
                                    //   USER_SUSPEND
                                    //   USER_DEACTIVATE
                                    //   JOB_MANUAL_ASSIGN

  // ── TARGET ENTITY ─────────────────────────────────────────────
  entity:     String,               // REQUIRED. Collection name.
                                    //   e.g. "subscriptions", "delivery_jobs"
  entityId:   ObjectId,             // REQUIRED. Document _id being mutated.

  // ── CHANGE RECORD ─────────────────────────────────────────────
  before:     Object,               // State before mutation. May be null (on CREATE).
                                    // PII fields MUST be excluded before storing.
  after:      Object,               // State after mutation. PII fields excluded.

  // ── REQUEST CONTEXT ───────────────────────────────────────────
  requestId:  String,               // Correlation ID from API middleware.
  ip:         String,               // Requester IP (IPv4 or IPv6).
  userAgent:  String,               // Browser/client user-agent string.
}
```

---

### 4.11 notification_logs

**Purpose:** Record of every push and SMS notification dispatched. Used for debugging, duplicate detection, and delivery rate analytics.

```javascript
{
  _id:           ObjectId,          // REQUIRED.

  // ── RECIPIENT ─────────────────────────────────────────────────
  recipientId:   ObjectId,          // REQUIRED. ref: users.
  recipientRole: String,            // REQUIRED. Enum: SENDER|RECEIVER|RIDER|ADMIN.

  // ── CHANNELS ──────────────────────────────────────────────────
  channel:       String,            // REQUIRED. Enum: FCM | SMS.
  fcmToken:      String,            // FCM device token (if channel=FCM).
  phoneNumber:   String,            // Masked: "+91XXXXXXXX10" (if channel=SMS).

  // ── CONTENT ───────────────────────────────────────────────────
  templateId:    String,            // DLT template ID (e.g. "HB-T-002").
  title:         String,            // Push notification title (FCM only).
  body:          String,            // Message body.
  data:          Object,            // Deep link payload (FCM only).

  // ── TRIGGER ───────────────────────────────────────────────────
  triggerEvent:  String,            // e.g. "JOB_PICKED_UP", "JOB_DELIVERED".
  relatedJobId:  ObjectId,          // ref: delivery_jobs (nullable).

  // ── DELIVERY STATUS ───────────────────────────────────────────
  status:        String,            // REQUIRED. Enum:
                                    //   QUEUED | SENT | DELIVERED | FAILED
  providerMsgId: String,            // FCM message_id or MSG91 request_id.
  failureReason: String,            // Provider error message on FAILED.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:     Date,              // REQUIRED. When queued.
  sentAt:        Date,              // When dispatched to provider.
  deliveredAt:   Date,              // When provider confirmed delivery.
}
```

---

### 4.12 zone_configs

**Purpose:** Static configuration for geographic zones. Defines zone boundaries, pricing tiers, and available rider pools. Updated by Super Admin via admin panel.

```javascript
{
  _id:           ObjectId,          // REQUIRED.

  // ── IDENTITY ──────────────────────────────────────────────────
  zoneCode:      String,            // REQUIRED. UNIQUE. e.g. "MUM-BANDRA".
  zoneName:      String,            // REQUIRED. e.g. "Bandra, Mumbai".
  city:          String,            // REQUIRED. e.g. "Mumbai".

  // ── GEOGRAPHY ─────────────────────────────────────────────────
  pincodes:      [String],          // List of 6-digit pincodes in this zone.
  boundaryPolygon: [{               // GeoJSON polygon for map rendering.
    lat: Number,
    lng: Number,
  }],
  centroid: {
    lat: Number,
    lng: Number,
  },

  // ── PRICING ───────────────────────────────────────────────────
  pricePerDelivery: {
    tier1: Number,                  // In paise. Distance ≤ 3km. e.g. 4000 = ₹40.
    tier2: Number,                  // In paise. Distance 3–6km. e.g. 5000 = ₹50.
    tier3: Number,                  // In paise. Distance > 6km.  e.g. 6000 = ₹60.
  },
  platformFeePercent: Number,       // % HomeBite keeps. Default: 18.

  // ── CAPACITY ──────────────────────────────────────────────────
  maxActiveRiders: Number,          // Max riders to assign in this zone per day.
  currentRiderCount: Number,        // Active riders currently assigned. Live counter.

  // ── STATE ─────────────────────────────────────────────────────
  isActive:      Boolean,           // REQUIRED. false = zone not accepting new subs.

  // ── TIMESTAMPS ────────────────────────────────────────────────
  createdAt:     Date,              // REQUIRED.
  updatedAt:     Date,              // REQUIRED.
}
```

---

## 5. Relationships

### 5.1 Relationship Types in This Design

MongoDB has no enforced foreign keys. All relationships listed below are **logical references** enforced by the application service layer, not the database engine.

### 5.2 Complete Relationship Map

```
RELATIONSHIP                          TYPE        CARDINALITY    ENFORCEMENT
─────────────────────────────────────────────────────────────────────────────
users → receiver_profiles             reference   1 : N (max 5)  Service layer
users → subscriptions (as sender)     reference   1 : N          Service layer
users → rider_wallets (as rider)      reference   1 : 1          Service layer
users → disputes (as raisedBy)        reference   1 : N          Service layer
users → ratings (as ratedBy)          reference   1 : N          Service layer
users → audit_logs (as userId)        reference   1 : N          Always written

receiver_profiles → subscriptions     reference   1 : 1          Service layer*
receiver_profiles → users (linked)    reference   0..1 : N       Optional link

subscriptions → delivery_jobs         reference   1 : N          Cron generates
subscriptions → payments              reference   1 : 1          Payment capture

delivery_jobs → disputes              reference   1 : 0..1       One per job
delivery_jobs → ratings               reference   1 : 0..2       Sender + Receiver
delivery_jobs → users (riderId)       reference   N : 1          Cron assigns
delivery_jobs → users (senderId)      reference   N : 1          Denormalised
delivery_jobs → receiver_profiles     reference   N : 1          Denormalised

payments → refunds                    embedded    1 : N (max 10) Always in payment doc

rider_wallets → payout_logs           reference   1 : N          Payout worker writes

zone_configs → subscriptions          reference   1 : N          By zone string field
zone_configs → delivery_jobs          reference   1 : N          By zone string field
zone_configs → users (riders)         reference   1 : N          By riderProfile.zone

audit_logs → any entity               polymorphic N : 1          entityId + entity name
notification_logs → users             reference   N : 1          Always written
notification_logs → delivery_jobs     reference   N : 0..1       Optional context
```

*One active subscription per receiver profile enforced by service layer (not a unique index, because cancelled/expired subs remain in history).

### 5.3 Denormalisation Rationale

Several fields are intentionally duplicated across collections:

| Duplicated Field | Source | Copied To | Why |
|---|---|---|---|
| `senderId` | `subscriptions.senderId` | `delivery_jobs.senderId` | Avoids subscription lookup on every job query; hot path |
| `receiverId` | `subscriptions.receiverProfileId` | `delivery_jobs.receiverId` | Same reason |
| `zone` | `subscriptions.zone` | `delivery_jobs.zone` | Zone is needed on job for assignment and analytics |
| `pickupAddress` | `subscriptions.pickupAddress` | `delivery_jobs.pickupAddress` | Snapshot; address changes must not affect live jobs |
| `dropAddress` | `receiver_profiles.dropAddress` | `delivery_jobs.dropAddress` | Same snapshot reason |
| `riderId` | `delivery_jobs.riderId` | `ratings.riderId` | Avoids job lookup just to find rider for aggregation |
| `planAmount` | Pricing logic | `subscriptions.planAmount` | Price lock at subscription creation |

---

## 6. Indexes

> **Index naming convention:** `{collection}_{field(s)}_{direction}_{uniqueness}`  
> All indexes listed here must be created before the application goes to production.  
> Indexes are created via `db.collection.createIndex()` or Mongoose schema index declarations.

### 6.1 users Indexes

```javascript
// Primary lookup — user login by phone
db.users.createIndex(
  { phoneHash: 1 },
  { unique: true, name: "users_phoneHash_1_unique" }
)

// Admin: filter users by role and status
db.users.createIndex(
  { role: 1, status: 1 },
  { name: "users_role_1_status_1" }
)

// Rider assignment: find active riders in a zone
db.users.createIndex(
  { "riderProfile.zone": 1, role: 1, status: 1 },
  {
    name: "users_riderZone_1_role_1_status_1",
    partialFilterExpression: { role: "RIDER" }  // Sparse: only indexes rider docs
  }
)

// Rider performance monitoring: low rating flag query
db.users.createIndex(
  { "riderProfile.consecutiveLowRatings": 1, role: 1 },
  {
    name: "users_consecutiveLowRatings_1",
    partialFilterExpression: { role: "RIDER" }
  }
)

// Soft-delete purge job: find users deleted > 30 days ago
db.users.createIndex(
  { deletedAt: 1 },
  {
    name: "users_deletedAt_1_sparse",
    sparse: true  // Only indexes docs where deletedAt exists
  }
)
```

### 6.2 receiver_profiles Indexes

```javascript
// Primary: sender fetches their own receivers
db.receiver_profiles.createIndex(
  { senderId: 1, status: 1 },
  { name: "rcvprofiles_senderId_1_status_1" }
)

// Receiver account linking: find profiles linked to a receiver user
db.receiver_profiles.createIndex(
  { linkedUserId: 1 },
  {
    name: "rcvprofiles_linkedUserId_1_sparse",
    sparse: true  // Only indexes docs where linkedUserId is set
  }
)

// Duplicate check: prevent duplicate linked receiver per sender
// (Uniqueness enforced at service layer, not here — allows historical records)
db.receiver_profiles.createIndex(
  { senderId: 1, phone: 1 },  // phone is encrypted but still unique per sender
  { name: "rcvprofiles_senderId_1_phone_1" }
)
```

### 6.3 subscriptions Indexes

```javascript
// Primary: sender views their subscriptions
db.subscriptions.createIndex(
  { senderId: 1, status: 1 },
  { name: "subs_senderId_1_status_1" }
)

// CRITICAL: nightly cron scans all active subscriptions
// This index is hit by up to 10,000 documents in a single query
db.subscriptions.createIndex(
  { status: 1, endDate: 1, startDate: 1 },
  { name: "subs_status_1_endDate_1_startDate_1" }
)

// Duplicate subscription guard: one active sub per receiver profile
db.subscriptions.createIndex(
  { receiverProfileId: 1, status: 1 },
  { name: "subs_receiverProfileId_1_status_1" }
)

// Zone-based analytics and rider assignment queries
db.subscriptions.createIndex(
  { zone: 1, status: 1 },
  { name: "subs_zone_1_status_1" }
)

// Payment reference lookup
db.subscriptions.createIndex(
  { paymentId: 1 },
  { name: "subs_paymentId_1_sparse", sparse: true }
)
```

### 6.4 delivery_jobs Indexes

> This is the most critical collection for query performance. Every index is justified by a specific, high-frequency query.

```javascript
// CRITICAL: Rider opens their app — "what are my jobs today?"
// Executed every ~60 seconds per active rider during shift
db.delivery_jobs.createIndex(
  { riderId: 1, scheduledDate: 1 },
  { name: "jobs_riderId_1_scheduledDate_1" }
)

// Sender tracking screen — "where is my job today?"
db.delivery_jobs.createIndex(
  { senderId: 1, scheduledDate: 1, status: 1 },
  { name: "jobs_senderId_1_scheduledDate_1_status_1" }
)

// Receiver incoming delivery — "is there a job for me today?"
db.delivery_jobs.createIndex(
  { receiverId: 1, scheduledDate: 1, status: 1 },
  { name: "jobs_receiverId_1_scheduledDate_1_status_1" }
)

// Admin job table — filter by status and date
db.delivery_jobs.createIndex(
  { status: 1, scheduledDate: -1 },
  { name: "jobs_status_1_scheduledDate_desc" }
)

// Admin live map — all IN_TRANSIT jobs right now
db.delivery_jobs.createIndex(
  { status: 1, scheduledDate: 1, zone: 1 },
  { name: "jobs_status_1_scheduledDate_1_zone_1" }
)

// Subscription history — all jobs generated from a subscription
db.delivery_jobs.createIndex(
  { subscriptionId: 1, scheduledDate: -1 },
  { name: "jobs_subscriptionId_1_scheduledDate_desc" }
)

// Zone analytics — delivery success rate by zone
db.delivery_jobs.createIndex(
  { zone: 1, status: 1, scheduledDate: -1 },
  { name: "jobs_zone_1_status_1_scheduledDate_desc" }
)

// Escalation checker — find non-escalated pending jobs
db.delivery_jobs.createIndex(
  { status: 1, escalated: 1, scheduledDate: 1 },
  {
    name: "jobs_status_1_escalated_1_scheduledDate_1",
    partialFilterExpression: {
      status: "PENDING_ASSIGNMENT",
      escalated: false
    }
  }
)

// GPS cleanup cron — find jobs with trails older than 30 days
db.delivery_jobs.createIndex(
  { deliveredAt: 1, gpsTrailPurgedAt: 1 },
  {
    name: "jobs_deliveredAt_1_gpsTrailPurgedAt_1_sparse",
    sparse: true,  // Only indexes delivered jobs
    partialFilterExpression: { status: "DELIVERED" }
  }
)

// Idempotency check on status update
db.delivery_jobs.createIndex(
  { idempotencyKey: 1 },
  { name: "jobs_idempotencyKey_1_unique", unique: true }
)
```

### 6.5 payments Indexes

```javascript
// Primary: webhook lookup and payment verification
db.payments.createIndex(
  { razorpayOrderId: 1 },
  { unique: true, name: "payments_razorpayOrderId_1_unique" }
)

// Secondary: lookup by Razorpay payment ID (after capture)
db.payments.createIndex(
  { razorpayPaymentId: 1 },
  { name: "payments_razorpayPaymentId_1_sparse", sparse: true }
)

// Sender payment history
db.payments.createIndex(
  { senderId: 1, createdAt: -1 },
  { name: "payments_senderId_1_createdAt_desc" }
)

// Reconciliation: find PENDING payments older than 15 minutes
db.payments.createIndex(
  { status: 1, createdAt: 1 },
  { name: "payments_status_1_createdAt_1" }
)

// Revenue analytics by date
db.payments.createIndex(
  { status: 1, capturedAt: -1 },
  { name: "payments_status_1_capturedAt_desc" }
)
```

### 6.6 disputes Indexes

```javascript
// One dispute per job — enforced by unique index
db.disputes.createIndex(
  { deliveryJobId: 1 },
  { unique: true, name: "disputes_deliveryJobId_1_unique" }
)

// Admin dispute queue — open disputes newest first
db.disputes.createIndex(
  { status: 1, createdAt: -1 },
  { name: "disputes_status_1_createdAt_desc" }
)

// Sender's dispute history
db.disputes.createIndex(
  { raisedBy: 1, createdAt: -1 },
  { name: "disputes_raisedBy_1_createdAt_desc" }
)
```

### 6.7 ratings Indexes

```javascript
// Prevent duplicate rating from same role on same job
db.ratings.createIndex(
  { deliveryJobId: 1, raterRole: 1 },
  { unique: true, name: "ratings_deliveryJobId_1_raterRole_1_unique" }
)

// 30-day rolling average calculation — most frequent aggregation query
db.ratings.createIndex(
  { riderId: 1, createdAt: -1 },
  { name: "ratings_riderId_1_createdAt_desc" }
)
```

### 6.8 rider_wallets Indexes

```javascript
// One wallet per rider
db.rider_wallets.createIndex(
  { riderId: 1 },
  { unique: true, name: "wallets_riderId_1_unique" }
)
```

### 6.9 payout_logs Indexes

```javascript
// Primary: Razorpay payout ID lookup (webhook reconciliation)
db.payout_logs.createIndex(
  { razorpayPayoutId: 1 },
  { unique: true, name: "payouts_razorpayPayoutId_1_unique", sparse: true }
)

// Rider payout history
db.payout_logs.createIndex(
  { riderId: 1, createdAt: -1 },
  { name: "payouts_riderId_1_createdAt_desc" }
)

// Coverage date lookup (one payout per rider per day)
db.payout_logs.createIndex(
  { riderId: 1, coverageDate: 1 },
  { name: "payouts_riderId_1_coverageDate_1" }
)

// Admin: processing payouts to monitor
db.payout_logs.createIndex(
  { status: 1, createdAt: -1 },
  { name: "payouts_status_1_createdAt_desc" }
)
```

### 6.10 audit_logs Indexes

```javascript
// Audit trail for a specific entity
db.audit_logs.createIndex(
  { entityId: 1, timestamp: -1 },
  { name: "audit_entityId_1_timestamp_desc" }
)

// User's action history
db.audit_logs.createIndex(
  { userId: 1, timestamp: -1 },
  { name: "audit_userId_1_timestamp_desc" }
)

// TTL index: automatically delete audit logs after 2 years
db.audit_logs.createIndex(
  { timestamp: 1 },
  {
    name: "audit_timestamp_1_TTL",
    expireAfterSeconds: 63072000  // 2 years in seconds
    // NOTE: Before records are deleted, the cleanup cron archives
    // them to S3 Glacier. The TTL fires after archival is confirmed.
  }
)
```

### 6.11 notification_logs Indexes

```javascript
// Delivery debugging: all notifications for a job
db.notification_logs.createIndex(
  { relatedJobId: 1 },
  { name: "notif_relatedJobId_1_sparse", sparse: true }
)

// Recipient history
db.notification_logs.createIndex(
  { recipientId: 1, createdAt: -1 },
  { name: "notif_recipientId_1_createdAt_desc" }
)

// Failed notification monitoring
db.notification_logs.createIndex(
  { status: 1, createdAt: -1 },
  { name: "notif_status_1_createdAt_desc" }
)

// TTL: purge notification logs older than 90 days
db.notification_logs.createIndex(
  { createdAt: 1 },
  {
    name: "notif_createdAt_1_TTL",
    expireAfterSeconds: 7776000  // 90 days
  }
)
```

### 6.12 zone_configs Indexes

```javascript
// Zone lookup by code (most common)
db.zone_configs.createIndex(
  { zoneCode: 1 },
  { unique: true, name: "zones_zoneCode_1_unique" }
)

// Filter by city for multi-city admin
db.zone_configs.createIndex(
  { city: 1, isActive: 1 },
  { name: "zones_city_1_isActive_1" }
)
```

---

## 7. ER Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     HomeBite — Entity Relationship Diagram                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

                        ┌──────────────────────────────┐
                        │          zone_configs        │
                        │  ─────────────────────────── │
                        │  PK  _id: ObjectId           │
                        │      zoneCode: String UNIQUE  │
                        │      city: String            │
                        │      pincodes: [String]      │
                        │      pricePerDelivery: {}    │
                        │      isActive: Boolean       │
                        └──────────────┬───────────────┘
                                       │ zone (string match)
               ┌───────────────────────┼───────────────────────────┐
               │                       │                           │
     ┌─────────▼──────────┐   ┌────────▼──────────────┐           │
     │       users        │   │     subscriptions     │           │
     │  ──────────────────│   │  ─────────────────────│           │
     │  PK  _id           │   │  PK  _id              │           │
     │      phoneHash UNIQ│   │  FK  senderId ────────┼──────┐    │
     │      phoneEncrypted│   │  FK  receiverProfileId│      │    │
     │      name          │   │  FK  paymentId ───────┼──┐   │    │
     │      role          │   │      planType         │  │   │    │
     │      status        │   │      pickupTimeWindow │  │   │    │
     │      fcmTokens     │   │      pickupAddress {} │  │   │    │
     │      walletBalance │   │      activeDays       │  │   │    │
     │      riderProfile{}│   │      pauseWindows []  │  │   │    │
     │      createdAt     │   │      zone             │  │   │    │
     └────────┬───────────┘   │      status           │  │   │    │
              │               │      startDate        │  │   │    │
              │               │      endDate          │  │   │    │
    ┌─────────┤               └─────────┬─────────────┘  │   │    │
    │         │                         │                 │   │    │
    │   (1:1) │ role=RIDER              │ (1:N)           │   │    │
    │         │                         │ cron generates  │   │    │
    │  ┌──────▼──────────┐    ┌─────────▼─────────────┐  │   │    │
    │  │  rider_wallets  │    │     delivery_jobs      │  │   │    │
    │  │  ──────────────-│    │  ─────────────────────-│  │   │    │
    │  │  PK  _id        │    │  PK  _id               │  │   │    │
    │  │  FK  riderId────┤    │  FK  subscriptionId    │  │   │    │
    │  │      pending    │    │  FK  senderId ─────────┼──┼───┘    │
    │  │      Balance    │    │  FK  receiverId        │  │        │
    │  │      totalEarn..│    │  FK  riderId ──────────┼──┘        │
    │  │      todayEarn. │    │      scheduledDate     │           │
    │  │      lastPayout │    │      pickupWindow {}   │           │
    │  └──────┬──────────┘    │      pickupAddress {}  │           │
    │         │               │      dropAddress {}    │           │
    │   (1:N) │               │      zone ─────────────┼───────────┘
    │         │               │      otpHash           │
    │  ┌──────▼──────────┐    │      otpAttempts       │
    │  │   payout_logs   │    │      status            │
    │  │  ─────────────  │    │      gpsTrail []       │
    │  │  PK  _id        │    │      riderEarnings     │
    │  │  FK  riderId    │    │      idempotencyKey    │
    │  │  FK  walletId───┘    └────────────┬───────────┘
    │  │      amount          ┌────────────┼────────────┐
    │  │      status          │            │            │
    │  │      payoutId        │ (1:0..1)   │ (1:0..2)   │ (N:1)
    │  │      coverageDate    │            │            │
    │  └─────────────────┘    │            │            │
    │                    ┌────▼───┐  ┌─────▼────┐ ┌────▼────────────┐
    │                    │disputes│  │ ratings  │ │notification_logs│
    │                    │ ───────│  │ ─────────│ │ ────────────────│
    │                    │PK _id  │  │PK _id    │ │PK _id           │
    │                    │FK deliv│  │FK delivJ │ │FK recipientId   │
    │                    │  JobId │  │FK riderId│ │FK relatedJobId  │
    │                    │FK raise│  │FK ratedBy│ │   channel       │
    │                    │  dBy   │  │  stars   │ │   templateId    │
    │                    │FK resol│  │  comment │ │   status        │
    │                    │  vedBy │  │  raterRole│ │  createdAt     │
    │                    │ type   │  └──────────┘ └─────────────────┘
    │                    │ status │
    │                    │resolut.│
    │                    └────────┘
    │
    │  ┌──────────────────────────────────────────────────┐
    │  │              receiver_profiles                   │
    │  │  ────────────────────────────────────────────── │
    │  │  PK  _id                                        │
    │  │  FK  senderId ───────────────────────────────┐  │
    │  │  FK  linkedUserId ───────────────────────────┼──┼──► users
    │  │      name                                    │  │
    │  │      relationship                            │  │
    │  │      phone (ENCRYPTED)                       │  │
    │  │      dropAddress {}                          │  │
    │  │      status                                  │  │
    └──┼──────────────────────────────────────────────┘  │
       │                                                  │
       └──────────────────────────► users (senderId)      │
                                                          │
    ┌─────────────────────────────────────────────────────▼──────┐
    │                      payments                              │
    │  ─────────────────────────────────────────────────────────-│
    │  PK  _id                                                   │
    │  FK  senderId ──────────────────────────────────────────► users
    │  FK  subscriptionId ───────────────────────────────────► subscriptions
    │      razorpayOrderId  UNIQUE                               │
    │      razorpayPaymentId                                     │
    │      amount                                                │
    │      status                                                │
    │      refunds [EMBEDDED] ──────────────────────────────────┐│
    │        { _id, amount, razorpayRefundId,                   ││
    │          reason, initiatedBy, createdAt }                 ││
    │      webhookEvents [EMBEDDED] ────────────────────────────┘│
    └────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │                      audit_logs                             │
    │  ──────────────────────────────────────────────────────────-│
    │  PK  _id                                                    │
    │  FK  userId ───────────────────────────────────────────► users
    │      action  (e.g. SUBSCRIPTION_CANCEL)                     │
    │      entity  (collection name — polymorphic)                │
    │      entityId (polymorphic FK — not enforced by DB)         │
    │      before {}  /  after {}                                 │
    │      timestamp  [TTL: 2 years]                              │
    └─────────────────────────────────────────────────────────────┘

LEGEND
  ──► One-to-One reference (FK field on one side)
  ──┬► One-to-Many reference
  {}  Embedded subdocument
  []  Embedded array
  PK  Primary key (_id)
  FK  Logical foreign key (application-enforced)
  UNIQUE: Unique index enforced at DB level
  ENCRYPTED: AES-256-GCM at application layer
  TTL: MongoDB TTL index auto-expires documents
```

---

## 8. Sample Documents

### 8.1 users — Sender

```json
{
  "_id": { "$oid": "6660000000000000000000a1" },
  "phoneHash": "a94f3b8c...d7e2f1a9",
  "phoneEncrypted": "AES256GCM:iv=abc123...:ct=xyz789...",
  "name": "Priya Mehta",
  "role": "SENDER",
  "profilePhotoUrl": "https://cdn.homebite.in/photos/6660000000000000000000a1.jpg",
  "fcmTokens": [
    "dJnk0Xm4...fCvB9z2R"
  ],
  "status": "ACTIVE",
  "walletBalance": 45000,
  "riderProfile": null,
  "createdAt": { "$date": "2026-05-01T07:30:00.000Z" },
  "updatedAt": { "$date": "2026-06-25T08:00:00.000Z" },
  "lastLoginAt": { "$date": "2026-06-27T06:45:00.000Z" },
  "deletedAt": null
}
```

### 8.2 users — Rider

```json
{
  "_id": { "$oid": "6660000000000000000000b1" },
  "phoneHash": "e7f2c4a1...8b3d9e0f",
  "phoneEncrypted": "AES256GCM:iv=def456...:ct=qrs012...",
  "name": "Raju Sharma",
  "role": "RIDER",
  "profilePhotoUrl": "https://cdn.homebite.in/photos/6660000000000000000000b1.jpg",
  "fcmTokens": [
    "xK9pL3mW...hQvR7t4N"
  ],
  "status": "ACTIVE",
  "walletBalance": null,
  "riderProfile": {
    "vehicleType": "BIKE",
    "vehicleRegNumber": "MH02AB1234",
    "kycVerificationToken": "DIGIO-KYC-TOKEN-7f3a2b1c",
    "kycStatus": "VERIFIED",
    "zone": "MUM-BANDRA",
    "bankAccountId": "fa_PQx3fZmKtW9aBC",
    "dailyJobCount": 6,
    "noShowCount30d": 0,
    "ratingAverage": 4.8,
    "ratingCount30d": 42,
    "consecutiveLowRatings": 0
  },
  "createdAt": { "$date": "2026-04-15T09:00:00.000Z" },
  "updatedAt": { "$date": "2026-06-27T11:44:00.000Z" },
  "lastLoginAt": { "$date": "2026-06-27T09:30:00.000Z" },
  "deletedAt": null
}
```

### 8.3 receiver_profiles

```json
{
  "_id": { "$oid": "6660000000000000000000c1" },
  "senderId": { "$oid": "6660000000000000000000a1" },
  "linkedUserId": { "$oid": "6660000000000000000000a2" },
  "name": "Arjun Mehta",
  "relationship": "SON",
  "phone": "AES256GCM:iv=ghi789...:ct=tuv345...",
  "dropAddress": {
    "line1": "Hostel Block-C, Room 204",
    "line2": "IIT Bombay Campus",
    "city": "Mumbai",
    "pincode": "400076",
    "landmark": "Near Gymkhana Ground",
    "deliveryNotes": "Ring the intercom at the main gate. Guard will let you in. Room 204 is on the second floor.",
    "lat": 19.1334,
    "lng": 72.9133
  },
  "status": "ACTIVE",
  "createdAt": { "$date": "2026-05-01T07:45:00.000Z" },
  "updatedAt": { "$date": "2026-05-01T07:45:00.000Z" }
}
```

### 8.4 subscriptions

```json
{
  "_id": { "$oid": "6660000000000000000000d1" },
  "senderId": { "$oid": "6660000000000000000000a1" },
  "receiverProfileId": { "$oid": "6660000000000000000000c1" },
  "paymentId": { "$oid": "6660000000000000000000e1" },
  "planType": "MONTHLY",
  "planAmount": 99900,
  "pickupTimeWindow": {
    "start": "11:00",
    "end": "11:30"
  },
  "pickupAddress": {
    "line1": "42, Pali Hill Road",
    "line2": "Ground Floor",
    "city": "Mumbai",
    "pincode": "400050",
    "landmark": "Opposite Bandra Fort",
    "lat": 19.0596,
    "lng": 72.8295
  },
  "activeDays": ["MON", "TUE", "WED", "THU", "FRI"],
  "pauseWindows": [
    {
      "from": { "$date": "2026-06-28T00:00:00.000Z" },
      "to": { "$date": "2026-06-29T00:00:00.000Z" },
      "createdAt": { "$date": "2026-06-26T18:30:00.000Z" }
    }
  ],
  "zone": "MUM-BANDRA",
  "status": "ACTIVE",
  "cancellationReason": null,
  "cancelledAt": null,
  "startDate": { "$date": "2026-06-02T00:00:00.000Z" },
  "endDate": { "$date": "2026-07-04T00:00:00.000Z" },
  "totalDays": 26,
  "deliveredCount": 18,
  "failedCount": 0,
  "createdAt": { "$date": "2026-06-01T10:30:00.000Z" },
  "updatedAt": { "$date": "2026-06-27T11:44:00.000Z" }
}
```

### 8.5 delivery_jobs — Active (IN_TRANSIT)

```json
{
  "_id": { "$oid": "6660000000000000000000f1" },
  "subscriptionId": { "$oid": "6660000000000000000000d1" },
  "senderId": { "$oid": "6660000000000000000000a1" },
  "receiverId": { "$oid": "6660000000000000000000c1" },
  "riderId": { "$oid": "6660000000000000000000b1" },
  "scheduledDate": { "$date": "2026-06-27T00:00:00.000+05:30" },
  "pickupWindow": {
    "start": "11:00",
    "end": "11:30"
  },
  "pickupAddress": {
    "line1": "42, Pali Hill Road",
    "line2": "Ground Floor",
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
    "landmark": "Near Gymkhana Ground",
    "deliveryNotes": "Ring the intercom at the main gate.",
    "lat": 19.1334,
    "lng": 72.9133
  },
  "zone": "MUM-BANDRA",
  "otpHash": "$2b$10$3Xn...bcryptHash...Kj9pQ",
  "otpAttempts": 0,
  "otpLocked": false,
  "otpLockedAt": null,
  "status": "IN_TRANSIT",
  "escalated": false,
  "escalatedAt": null,
  "assignedAt": { "$date": "2026-06-26T18:00:00.000Z" },
  "pickedUpAt": { "$date": "2026-06-27T11:06:00.000Z" },
  "deliveredAt": null,
  "failedAt": null,
  "pickedUpLocation": {
    "lat": 19.0594,
    "lng": 72.8297
  },
  "deliveredLocation": null,
  "failureReason": null,
  "failureNote": null,
  "gpsTrail": [
    { "lat": 19.0594, "lng": 72.8297, "timestamp": { "$date": "2026-06-27T11:06:10.000Z" }, "accuracy": 5 },
    { "lat": 19.0621, "lng": 72.8341, "timestamp": { "$date": "2026-06-27T11:06:20.000Z" }, "accuracy": 6 },
    { "lat": 19.0678, "lng": 72.8412, "timestamp": { "$date": "2026-06-27T11:06:30.000Z" }, "accuracy": 4 },
    { "lat": 19.0754, "lng": 72.8530, "timestamp": { "$date": "2026-06-27T11:06:40.000Z" }, "accuracy": 5 },
    { "lat": 19.0851, "lng": 72.8672, "timestamp": { "$date": "2026-06-27T11:06:50.000Z" }, "accuracy": 8 }
  ],
  "gpsTrailPurgedAt": null,
  "riderEarnings": 5000,
  "distanceKm": 11.2,
  "idempotencyKey": "f8a3c291-1234-4abc-9def-000000f1a2b3",
  "createdAt": { "$date": "2026-06-26T18:00:00.000Z" },
  "updatedAt": { "$date": "2026-06-27T11:06:10.000Z" }
}
```

### 8.6 delivery_jobs — Delivered

```json
{
  "_id": { "$oid": "6660000000000000000000f0" },
  "subscriptionId": { "$oid": "6660000000000000000000d1" },
  "senderId": { "$oid": "6660000000000000000000a1" },
  "receiverId": { "$oid": "6660000000000000000000c1" },
  "riderId": { "$oid": "6660000000000000000000b1" },
  "scheduledDate": { "$date": "2026-06-26T00:00:00.000+05:30" },
  "pickupWindow": { "start": "11:00", "end": "11:30" },
  "pickupAddress": { "line1": "42, Pali Hill Road", "city": "Mumbai", "pincode": "400050", "lat": 19.0596, "lng": 72.8295 },
  "dropAddress": { "line1": "Hostel Block-C, Room 204", "city": "Mumbai", "pincode": "400076", "lat": 19.1334, "lng": 72.9133 },
  "zone": "MUM-BANDRA",
  "otpHash": "$2b$10$7Lp...bcryptHash...Mn2kR",
  "otpAttempts": 1,
  "otpLocked": false,
  "status": "DELIVERED",
  "escalated": false,
  "assignedAt": { "$date": "2026-06-25T18:00:00.000Z" },
  "pickedUpAt": { "$date": "2026-06-26T11:08:00.000Z" },
  "deliveredAt": { "$date": "2026-06-26T11:44:00.000Z" },
  "failedAt": null,
  "pickedUpLocation": { "lat": 19.0596, "lng": 72.8294 },
  "deliveredLocation": { "lat": 19.1335, "lng": 72.9132 },
  "gpsTrail": [
    { "lat": 19.0596, "lng": 72.8294, "timestamp": { "$date": "2026-06-26T11:08:10.000Z" }, "accuracy": 4 }
  ],
  "gpsTrailPurgedAt": null,
  "riderEarnings": 5000,
  "distanceKm": 11.2,
  "idempotencyKey": "a1b2c3d4-5678-90ab-cdef-000000f0a1b2",
  "createdAt": { "$date": "2026-06-25T18:00:00.000Z" },
  "updatedAt": { "$date": "2026-06-26T11:44:00.000Z" }
}
```

### 8.7 payments

```json
{
  "_id": { "$oid": "6660000000000000000000e1" },
  "senderId": { "$oid": "6660000000000000000000a1" },
  "subscriptionId": { "$oid": "6660000000000000000000d1" },
  "razorpayOrderId": "order_PQx3fZmKtW9aBCD",
  "razorpayPaymentId": "pay_PQx3gHnLuX0bEFG",
  "razorpaySignature": "a3f7e2b1c4d5...hmac_sha256_hex",
  "amount": 99900,
  "currency": "INR",
  "amountRefunded": 0,
  "status": "CAPTURED",
  "refunds": [],
  "webhookEvents": [
    {
      "event": "order.paid",
      "payload": { "order_id": "order_PQx3fZmKtW9aBCD", "payment_id": "pay_PQx3gHnLuX0bEFG", "amount": 99900 },
      "receivedAt": { "$date": "2026-06-01T10:31:00.000Z" },
      "processed": true
    }
  ],
  "failureAttempts": 0,
  "lastFailureReason": null,
  "gracePeriodExpiry": null,
  "createdAt": { "$date": "2026-06-01T10:30:00.000Z" },
  "updatedAt": { "$date": "2026-06-01T10:31:00.000Z" },
  "capturedAt": { "$date": "2026-06-01T10:31:00.000Z" }
}
```

### 8.8 disputes

```json
{
  "_id": { "$oid": "6660000000000000000001a1" },
  "deliveryJobId": { "$oid": "6660000000000000000000f2" },
  "raisedBy": { "$oid": "6660000000000000000000a1" },
  "resolvedBy": null,
  "type": "RIDER_NO_SHOW",
  "gpsClassification": "RIDER_NO_SHOW",
  "senderNote": "The rider marked attempted-failed but I was home the entire morning. The bell was not rung.",
  "riderNote": "No one answered the intercom. Waited 5 minutes.",
  "senderEvidence": [],
  "status": "UNDER_REVIEW",
  "resolution": "PENDING",
  "resolutionNote": null,
  "refundAmount": null,
  "resolvedAt": null,
  "createdAt": { "$date": "2026-06-24T14:30:00.000Z" },
  "updatedAt": { "$date": "2026-06-24T15:00:00.000Z" }
}
```

### 8.9 ratings

```json
{
  "_id": { "$oid": "6660000000000000000002a1" },
  "deliveryJobId": { "$oid": "6660000000000000000000f0" },
  "riderId": { "$oid": "6660000000000000000000b1" },
  "ratedBy": { "$oid": "6660000000000000000000a2" },
  "raterRole": "RECEIVER",
  "stars": 5,
  "comment": "Super fast delivery! Food was still warm.",
  "createdAt": { "$date": "2026-06-26T12:10:00.000Z" }
}
```

### 8.10 rider_wallets

```json
{
  "_id": { "$oid": "6660000000000000000003a1" },
  "riderId": { "$oid": "6660000000000000000000b1" },
  "pendingBalance": 30000,
  "totalEarningsAllTime": 1247500,
  "todayEarnings": 30000,
  "todayDeliveries": 6,
  "todayDate": { "$date": "2026-06-27T00:00:00.000+05:30" },
  "lastPayoutAmount": 192500,
  "lastPayoutAt": { "$date": "2026-06-26T18:05:00.000Z" },
  "totalPayoutsCount": 48,
  "razorpayFundAccountId": "fa_PQx3fZmKtW9aBC",
  "createdAt": { "$date": "2026-04-15T09:00:00.000Z" },
  "updatedAt": { "$date": "2026-06-27T11:44:00.000Z" }
}
```

### 8.11 payout_logs

```json
{
  "_id": { "$oid": "6660000000000000000004a1" },
  "riderId": { "$oid": "6660000000000000000000b1" },
  "walletId": { "$oid": "6660000000000000000003a1" },
  "amount": 192500,
  "razorpayPayoutId": "pout_PQx9kLmRtX1cFGH",
  "razorpayFundAccountId": "fa_PQx3fZmKtW9aBC",
  "mode": "IMPS",
  "utr": "260612345678",
  "status": "PROCESSED",
  "failureReason": null,
  "coverageDate": { "$date": "2026-06-26T00:00:00.000+05:30" },
  "jobIds": [
    { "$oid": "6660000000000000000000f0" },
    { "$oid": "6660000000000000000000f3" },
    { "$oid": "6660000000000000000000f4" }
  ],
  "jobCount": 3,
  "createdAt": { "$date": "2026-06-26T18:05:00.000Z" },
  "processedAt": { "$date": "2026-06-26T18:05:30.000Z" },
  "settledAt": { "$date": "2026-06-26T18:07:45.000Z" }
}
```

### 8.12 audit_logs

```json
{
  "_id": { "$oid": "6660000000000000000005a1" },
  "timestamp": { "$date": "2026-06-25T09:15:00.000Z" },
  "userId": { "$oid": "6660000000000000000000a1" },
  "role": "SENDER",
  "action": "SUBSCRIPTION_PAUSE",
  "entity": "subscriptions",
  "entityId": { "$oid": "6660000000000000000000d1" },
  "before": {
    "pauseWindows": [],
    "status": "ACTIVE"
  },
  "after": {
    "pauseWindows": [
      { "from": "2026-06-28", "to": "2026-06-29", "createdAt": "2026-06-26T18:30:00Z" }
    ],
    "status": "ACTIVE",
    "endDate": "2026-07-04"
  },
  "requestId": "req_7f3a2b1c-1234-5678-abcd-ef0123456789",
  "ip": "117.195.x.x",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"
}
```

### 8.13 zone_configs

```json
{
  "_id": { "$oid": "6660000000000000000006a1" },
  "zoneCode": "MUM-BANDRA",
  "zoneName": "Bandra, Mumbai",
  "city": "Mumbai",
  "pincodes": ["400050", "400051", "400052", "400053", "400054"],
  "boundaryPolygon": [
    { "lat": 19.0500, "lng": 72.8200 },
    { "lat": 19.0700, "lng": 72.8200 },
    { "lat": 19.0700, "lng": 72.8450 },
    { "lat": 19.0500, "lng": 72.8450 }
  ],
  "centroid": {
    "lat": 19.0596,
    "lng": 72.8295
  },
  "pricePerDelivery": {
    "tier1": 4000,
    "tier2": 5000,
    "tier3": 6000
  },
  "platformFeePercent": 18,
  "maxActiveRiders": 20,
  "currentRiderCount": 7,
  "isActive": true,
  "createdAt": { "$date": "2026-05-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-06-15T10:00:00.000Z" }
}
```

---

## 9. Aggregation Pipelines

### 9.1 Nightly Cron — Active Subscriptions for Tomorrow

Runs at 23:30 IST. Finds all subscriptions that should generate a job for the next day.

```javascript
const tomorrow = new Date(); // Set to next calendar day midnight IST
const dayOfWeek = ['SUN','MON','TUE','WED','THU','FRI','SAT'][tomorrow.getDay()];

db.subscriptions.aggregate([
  // Stage 1: Filter active subscriptions within date range
  {
    $match: {
      status: "ACTIVE",
      startDate: { $lte: tomorrow },
      endDate:   { $gte: tomorrow },
      activeDays: dayOfWeek,
    }
  },
  // Stage 2: Filter out subscriptions with a pause window covering tomorrow
  {
    $match: {
      $or: [
        { pauseWindows: { $size: 0 } },
        {
          pauseWindows: {
            $not: {
              $elemMatch: {
                from: { $lte: tomorrow },
                to:   { $gte: tomorrow }
              }
            }
          }
        }
      ]
    }
  },
  // Stage 3: Project only fields needed for job generation
  {
    $project: {
      _id: 1,
      senderId: 1,
      receiverProfileId: 1,
      pickupTimeWindow: 1,
      pickupAddress: 1,
      zone: 1
    }
  }
]);
// Expected: array of subscription stubs. Each becomes one DeliveryJob.
```

### 9.2 Rider's 30-Day Rolling Rating Average

Called after every new rating to update `users.riderProfile.ratingAverage`.

```javascript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

db.ratings.aggregate([
  {
    $match: {
      riderId: ObjectId("6660000000000000000000b1"),
      raterRole: "RECEIVER",           // Only receiver ratings count
      createdAt: { $gte: thirtyDaysAgo }
    }
  },
  {
    $group: {
      _id: "$riderId",
      averageStars:  { $avg: "$stars" },
      totalRatings:  { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      ratingAverage: { $round: ["$averageStars", 1] },
      ratingCount30d: "$totalRatings"
    }
  }
]);
// Result: { ratingAverage: 4.8, ratingCount30d: 42 }
// Written back to users.riderProfile via updateOne()
```

### 9.3 Admin Revenue Dashboard — Daily Breakdown

```javascript
db.payments.aggregate([
  {
    $match: {
      status: "CAPTURED",
      capturedAt: {
        $gte: new Date("2026-06-01T00:00:00.000Z"),
        $lte: new Date("2026-06-30T23:59:59.999Z")
      }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: "%Y-%m-%d", date: "$capturedAt", timezone: "+05:30" }
      },
      grossRevenue:      { $sum: "$amount" },
      transactionCount:  { $sum: 1 },
      avgOrderValue:     { $avg: "$amount" }
    }
  },
  {
    $sort: { "_id": 1 }
  },
  {
    $project: {
      date: "$_id",
      grossRevenuePaise: "$grossRevenue",
      grossRevenueINR:   { $divide: ["$grossRevenue", 100] },
      transactionCount:  1,
      avgOrderValueINR:  { $divide: ["$avgOrderValue", 100] }
    }
  }
]);
```

### 9.4 Delivery Success Rate by Zone (Last 30 Days)

```javascript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

db.delivery_jobs.aggregate([
  {
    $match: {
      scheduledDate: { $gte: thirtyDaysAgo },
      status: { $in: ["DELIVERED", "ATTEMPTED_FAILED"] }
    }
  },
  {
    $group: {
      _id: "$zone",
      total:     { $sum: 1 },
      delivered: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] } },
      failed:    { $sum: { $cond: [{ $eq: ["$status", "ATTEMPTED_FAILED"] }, 1, 0] } }
    }
  },
  {
    $project: {
      zone: "$_id",
      total: 1,
      delivered: 1,
      failed: 1,
      successRatePct: {
        $round: [
          { $multiply: [{ $divide: ["$delivered", "$total"] }, 100] },
          1
        ]
      }
    }
  },
  { $sort: { successRatePct: -1 } }
]);
```

### 9.5 GPS Dispute Classification

Called when a dispute is created. Analyses the gpsTrail to auto-classify.

```javascript
// Given: job._id and job.dropAddress.lat/lng
// Business rule: within 200m = RECEIVER_ABSENT; never within 500m = RIDER_NO_SHOW

db.delivery_jobs.aggregate([
  {
    $match: { _id: ObjectId("6660000000000000000000f2") }
  },
  {
    $project: {
      gpsTrail: 1,
      dropLat: "$dropAddress.lat",
      dropLng: "$dropAddress.lng"
    }
  },
  {
    $project: {
      // Calculate min distance from drop in each GPS point using Haversine
      // (Simplified: MongoDB $geoNear preferred in production for accuracy)
      trailCount: { $size: "$gpsTrail" },
      dropLat: 1,
      dropLng: 1,
      gpsTrail: 1
    }
  }
]);
// In production: use $geoNear or calculate Haversine in the service layer
// using the full gpsTrail array, classifying based on minimum distance achieved.
```

### 9.6 Subscription Churn Report

```javascript
db.subscriptions.aggregate([
  {
    $match: {
      updatedAt: {
        $gte: new Date("2026-06-01T00:00:00.000Z"),
        $lte: new Date("2026-06-30T23:59:59.999Z")
      }
    }
  },
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: null,
      statuses: {
        $push: { status: "$_id", count: "$count" }
      },
      total: { $sum: "$count" }
    }
  }
]);
// Result helps calculate: activation rate, churn rate, renewal rate
```

---

## 10. Data Retention Policy

| Collection | Retention Rule | Action | Who Triggers |
|---|---|---|---|
| `delivery_jobs.gpsTrail` | 30 days from `deliveredAt` | Array field set to `[]`; `gpsTrailPurgedAt` stamped | Nightly cleanup cron at 02:00 IST |
| `delivery_jobs` (record) | 2 years | Archived to S3, then deleted | Annual archival job |
| `payments` (record) | 7 years (financial compliance) | Archived to S3 Glacier | 7-year archival job |
| `refunds` (embedded) | Same as parent `payments` | Archived with parent | Same |
| `disputes` | 3 years | Archived to S3 | 3-year archival job |
| `ratings` | 2 years | Archived to S3 | 2-year archival job |
| `payout_logs` | 7 years (financial compliance) | Archived to S3 Glacier | 7-year archival job |
| `audit_logs` | 2 years | TTL index auto-deletes (after S3 archival confirmed) | MongoDB TTL |
| `notification_logs` | 90 days | TTL index auto-deletes | MongoDB TTL |
| `users` (PII fields) | PII purged 30 days after `deletedAt` | `phoneEncrypted`, `name` set to null | Soft-delete cleanup cron |
| `users` (record) | Anonymised record kept forever | For payment audit trail referential integrity | Never fully deleted |
| `zone_configs` | Permanent | Never deleted | N/A |

### GPS Purge Cron Query

```javascript
// Runs nightly at 02:00 IST
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

db.delivery_jobs.updateMany(
  {
    status: { $in: ["DELIVERED", "ATTEMPTED_FAILED"] },
    deliveredAt: { $lte: thirtyDaysAgo },
    gpsTrailPurgedAt: { $exists: false }  // Not already purged
  },
  {
    $set: {
      gpsTrail: [],
      gpsTrailPurgedAt: new Date()
    }
  }
);
```

---

## 11. Security and Encryption

### 11.1 Encryption Layers

```
Layer 1: MongoDB Atlas — encryption at rest
  Algorithm: AES-256
  Key Management: AWS KMS (ap-south-1)
  Scope: entire database (all collections, all fields)

Layer 2: Application-level — field encryption for PII
  Algorithm: AES-256-GCM
  Key Storage: AWS Secrets Manager (not in MongoDB)
  Fields encrypted before storage:
    users.phoneEncrypted          ← full phone number
    receiver_profiles.phone       ← receiver's phone number
  Purpose: Even if DB dump is stolen, phone numbers are unreadable
           without the application key (stored separately in KMS)

Layer 3: One-way hashing for lookups
  Algorithm: SHA-256
  Fields:
    users.phoneHash               ← lookup key for login
  Purpose: Fast indexed lookup without storing decryptable phone

Layer 4: bcrypt for OTPs
  Algorithm: bcrypt, cost factor 10
  Fields:
    delivery_jobs.otpHash         ← 4-digit delivery OTP
  Purpose: OTP cannot be read even by HomeBite engineers or DB admins
```

### 11.2 Fields That Are NEVER Stored in MongoDB

| Data | Why Not Stored | Where It Lives |
|---|---|---|
| Raw phone number (plaintext) | PII; replaced by hash + encrypted form | Only in memory during request |
| UPI PIN / card number / CVV | PCI; not HomeBite's responsibility | Razorpay only |
| Raw OTP value | Bcrypt hash stored instead | SMS to user; request context only |
| Aadhaar / PAN images | KYC vault compliance | Digio / DigiLocker |
| JWT refresh token value | Stored in Redis, not Mongo | Redis (30-day TTL) |
| AWS KMS keys | Key management system | AWS KMS only |
| API secrets (Razorpay, FCM) | Credential security | AWS Secrets Manager |

### 11.3 Sensitive Field Exclusions in Audit Logs

When capturing `before` and `after` states in `audit_logs`, the following fields are stripped before insertion:

```javascript
const EXCLUDED_FROM_AUDIT = [
  'phoneHash',
  'phoneEncrypted',
  'phone',           // receiver_profiles
  'otpHash',
  'fcmTokens',
  'kycVerificationToken',
  'razorpaySignature',
];

function sanitiseForAudit(doc) {
  const sanitised = { ...doc };
  EXCLUDED_FROM_AUDIT.forEach(field => delete sanitised[field]);
  return sanitised;
}
```

---

## 12. Migration and Seeding Strategy

### 12.1 Migration Tool

All schema changes use **migrate-mongo** (compatible with Mongoose). Each migration is a timestamped file in `/migrations/`.

```
migrations/
├── 20260501_001_create_collections_and_indexes.js
├── 20260510_002_add_zone_to_delivery_jobs.js
├── 20260515_003_add_rider_noshow_count.js
└── 20260601_004_add_gps_accuracy_field.js
```

### 12.2 Index Creation Migration (Initial)

```javascript
// migrations/20260501_001_create_collections_and_indexes.js

module.exports = {
  async up(db) {
    // users
    await db.collection('users').createIndex({ phoneHash: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1, status: 1 });
    await db.collection('users').createIndex(
      { "riderProfile.zone": 1, role: 1, status: 1 },
      { partialFilterExpression: { role: "RIDER" } }
    );

    // subscriptions
    await db.collection('subscriptions').createIndex({ senderId: 1, status: 1 });
    await db.collection('subscriptions').createIndex({ status: 1, endDate: 1, startDate: 1 });
    await db.collection('subscriptions').createIndex({ receiverProfileId: 1, status: 1 });

    // delivery_jobs
    await db.collection('delivery_jobs').createIndex({ riderId: 1, scheduledDate: 1 });
    await db.collection('delivery_jobs').createIndex({ senderId: 1, scheduledDate: 1, status: 1 });
    await db.collection('delivery_jobs').createIndex({ receiverId: 1, scheduledDate: 1, status: 1 });
    await db.collection('delivery_jobs').createIndex({ status: 1, scheduledDate: -1 });
    await db.collection('delivery_jobs').createIndex({ subscriptionId: 1, scheduledDate: -1 });
    await db.collection('delivery_jobs').createIndex({ idempotencyKey: 1 }, { unique: true });

    // payments
    await db.collection('payments').createIndex({ razorpayOrderId: 1 }, { unique: true });
    await db.collection('payments').createIndex({ senderId: 1, createdAt: -1 });

    // disputes
    await db.collection('disputes').createIndex({ deliveryJobId: 1 }, { unique: true });
    await db.collection('disputes').createIndex({ status: 1, createdAt: -1 });

    // ratings
    await db.collection('ratings').createIndex(
      { deliveryJobId: 1, raterRole: 1 }, { unique: true }
    );
    await db.collection('ratings').createIndex({ riderId: 1, createdAt: -1 });

    // rider_wallets
    await db.collection('rider_wallets').createIndex({ riderId: 1 }, { unique: true });

    // audit_logs
    await db.collection('audit_logs').createIndex({ entityId: 1, timestamp: -1 });
    await db.collection('audit_logs').createIndex(
      { timestamp: 1 }, { expireAfterSeconds: 63072000 }
    );

    // notification_logs TTL
    await db.collection('notification_logs').createIndex(
      { createdAt: 1 }, { expireAfterSeconds: 7776000 }
    );

    // zone_configs
    await db.collection('zone_configs').createIndex({ zoneCode: 1 }, { unique: true });
  },

  async down(db) {
    // Drop all indexes (except _id)
    const collections = [
      'users','subscriptions','delivery_jobs','payments',
      'disputes','ratings','rider_wallets','audit_logs',
      'notification_logs','zone_configs'
    ];
    for (const col of collections) {
      await db.collection(col).dropIndexes();
    }
  }
};
```

### 12.3 Development Seed Script

```javascript
// scripts/seed.js — Creates one complete scenario for local development
// Persona: Priya (Sender) → Subscription → Tomorrow's Job → Raju (Rider)

async function seed(db) {
  // 1. Create Rider
  const riderId = new ObjectId();
  await db.collection('users').insertOne({
    _id: riderId, name: "Raju Sharma", role: "RIDER", status: "ACTIVE",
    phoneHash: sha256("+919876500001"),
    phoneEncrypted: encrypt("+919876500001"),
    fcmTokens: ["test-fcm-rider"],
    riderProfile: {
      vehicleType: "BIKE", vehicleRegNumber: "MH02AB1234",
      kycStatus: "VERIFIED", zone: "MUM-BANDRA",
      dailyJobCount: 0, ratingAverage: 4.8, ratingCount30d: 10,
      consecutiveLowRatings: 0
    },
    createdAt: new Date(), updatedAt: new Date()
  });

  // 2. Create Sender
  const senderId = new ObjectId();
  await db.collection('users').insertOne({
    _id: senderId, name: "Priya Mehta", role: "SENDER", status: "ACTIVE",
    phoneHash: sha256("+919876500002"),
    phoneEncrypted: encrypt("+919876500002"),
    fcmTokens: ["test-fcm-sender"],
    walletBalance: 0,
    createdAt: new Date(), updatedAt: new Date()
  });

  // 3. Create Receiver Profile
  const receiverId = new ObjectId();
  await db.collection('receiver_profiles').insertOne({
    _id: receiverId, senderId, name: "Arjun Mehta",
    relationship: "SON", phone: encrypt("+919876500003"),
    dropAddress: { line1: "IIT Hostel Block-C", city: "Mumbai", pincode: "400076", lat: 19.1334, lng: 72.9133 },
    status: "ACTIVE", createdAt: new Date(), updatedAt: new Date()
  });

  // 4. Create Payment
  const paymentId = new ObjectId();
  await db.collection('payments').insertOne({
    _id: paymentId, senderId,
    razorpayOrderId: "order_SEED001", razorpayPaymentId: "pay_SEED001",
    amount: 99900, currency: "INR", amountRefunded: 0,
    status: "CAPTURED", refunds: [], webhookEvents: [],
    createdAt: new Date(), capturedAt: new Date(), updatedAt: new Date()
  });

  // 5. Create Subscription
  const subscriptionId = new ObjectId();
  const today = new Date(); today.setHours(0,0,0,0);
  const endDate = new Date(today); endDate.setDate(endDate.getDate() + 30);
  await db.collection('subscriptions').insertOne({
    _id: subscriptionId, senderId, receiverProfileId: receiverId, paymentId,
    planType: "MONTHLY", planAmount: 99900,
    pickupTimeWindow: { start: "11:00", end: "11:30" },
    pickupAddress: { line1: "42 Pali Hill Road", city: "Mumbai", pincode: "400050", lat: 19.0596, lng: 72.8295 },
    activeDays: ["MON","TUE","WED","THU","FRI"],
    pauseWindows: [], zone: "MUM-BANDRA",
    status: "ACTIVE", startDate: today, endDate,
    totalDays: 26, deliveredCount: 0, failedCount: 0,
    createdAt: new Date(), updatedAt: new Date()
  });

  // 6. Create Tomorrow's DeliveryJob
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  await db.collection('delivery_jobs').insertOne({
    _id: new ObjectId(), subscriptionId, senderId, receiverId, riderId,
    scheduledDate: tomorrow,
    pickupWindow: { start: "11:00", end: "11:30" },
    pickupAddress: { line1: "42 Pali Hill Road", city: "Mumbai", pincode: "400050", lat: 19.0596, lng: 72.8295 },
    dropAddress: { line1: "IIT Hostel Block-C", city: "Mumbai", pincode: "400076", lat: 19.1334, lng: 72.9133 },
    zone: "MUM-BANDRA",
    otpHash: await bcrypt.hash("7429", 10),  // Test OTP: 7429
    otpAttempts: 0, otpLocked: false,
    status: "ASSIGNED", escalated: false,
    assignedAt: new Date(), gpsTrail: [], riderEarnings: 5000, distanceKm: 11.2,
    idempotencyKey: new ObjectId().toString(),
    createdAt: new Date(), updatedAt: new Date()
  });

  // 7. Create Rider Wallet
  await db.collection('rider_wallets').insertOne({
    _id: new ObjectId(), riderId, pendingBalance: 0, totalEarningsAllTime: 0,
    todayEarnings: 0, todayDeliveries: 0, todayDate: today,
    totalPayoutsCount: 0,
    createdAt: new Date(), updatedAt: new Date()
  });

  console.log("Seed complete. Test OTP for tomorrow's job: 7429");
}
```

---

*End of DATABASE.md — HomeBite v1.0*

*This document must be kept in sync with the Mongoose model files in `/apps/web/src/models/`. Any schema change requires a corresponding migration file and an update to this document.*