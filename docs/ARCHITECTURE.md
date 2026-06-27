# HomeBite — Software Architecture Document

**Document ID:** HB-ARCH-001  
**Version:** 1.0  
**Status:** Baseline  
**Classification:** Internal — Engineering  
**Prepared By:** Architecture Team  
**References:** PRD v1.0 (HB-PRD-001) · SRS v1.0 (HB-SRS-001)  
**Last Updated:** June 2026

---

## Document Control

| Version | Date | Author | Change Summary |
|---|---|---|---|
| 0.1 | June 2026 | Architecture Team | Initial draft |
| 1.0 | June 2026 | Architecture Team | Baseline — all sections complete |

### Architecture Decision Record

Every significant design choice in this document follows this format:

> **ADR-xxx:** Decision title  
> **Context:** Why a decision was needed  
> **Decision:** What was chosen  
> **Rationale:** Why this was chosen over alternatives  
> **Consequences:** What this implies for the rest of the system

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Authentication Flow](#4-authentication-flow)
5. [Database Architecture](#5-database-architecture)
6. [API Communication](#6-api-communication)
7. [Socket.IO Architecture](#7-socketio-architecture)
8. [Payment Architecture](#8-payment-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Cross-Cutting Concerns](#10-cross-cutting-concerns)
11. [Architecture Decision Records](#11-architecture-decision-records)

---

## 1. High-Level Architecture

### 1.1 System Context

HomeBite is a three-sided platform: Senders (family members) buy delivery subscriptions; Riders collect and deliver tiffins; Receivers confirm receipt via OTP. An Admin/Ops team oversees the entire operation.

The system is built on a **layered, event-driven architecture** with a clear separation between:

- **Client layer** — four distinct frontends for four distinct user contexts
- **API layer** — a stateless RESTful backend with a separate real-time gateway
- **Service layer** — background workers, queues, cron scheduler, and notification fanout
- **Data layer** — primary MongoDB store, Redis cache/queue, and CDN for static assets
- **External layer** — Razorpay, Google Maps, Firebase FCM, MSG91, KYC vault

### 1.2 Full System Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                             CLIENT LAYER                                         ║
║                                                                                  ║
║  ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐ ║
║  │  Sender App  │  │  Receiver App   │  │  Rider PWA   │  │  Admin Dashboard │ ║
║  │  (Next.js)   │  │  (Next.js)      │  │  (Next.js)   │  │  (Next.js)       │ ║
║  │  /sender/*   │  │  /receiver/*    │  │  /rider/*    │  │  /admin/*        │ ║
║  └──────┬───────┘  └────────┬────────┘  └──────┬───────┘  └────────┬─────────┘ ║
╚═════════╪══════════════════╪═══════════════════╪════════════════════╪════════════╝
          │                  │                   │                    │
          │         HTTPS REST + Cookie          │                    │
          │                  │    WebSocket (WSS)│                    │
╔═════════╪══════════════════╪═══════════════════╪════════════════════╪════════════╗
║         ▼                  ▼                   ▼                    ▼            ║
║                     EDGE / GATEWAY LAYER                                         ║
║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
║  │          Vercel Edge Network  +  AWS ALB (ap-south-1)                      │  ║
║  │   TLS Termination · Rate Limiting · CORS · Security Headers · Routing      │  ║
║  └──────────────────────────────┬─────────────────────────────────────────────┘  ║
╚════════════════════════════════╪════════════════════════════════════════════════╝
                                 │
          ┌──────────────────────┴──────────────────────┐
          │                                             │
╔═════════▼═══════════════════╗           ╔════════════▼═════════════════════════╗
║    REST API SERVER          ║           ║    REAL-TIME SERVER (Socket.IO)      ║
║    Next.js App Router       ║           ║    Node.js + Socket.IO               ║
║    (Stateless · Horizontal) ║           ║    (Stateful · Sticky Sessions)      ║
║                             ║           ║                                      ║
║  ┌────────────────────────┐ ║           ║  ┌──────────────────────────────┐   ║
║  │   Route Handlers       │ ║           ║  │  Room: job:{jobId}           │   ║
║  │   Middleware Stack     │ ║           ║  │  • Rider (emit GPS)          │   ║
║  │   Service Layer        │ ║           ║  │  • Sender (receive GPS)      │   ║
║  │   Repository Layer     │ ║           ║  │  • Receiver (receive GPS)    │   ║
║  └────────────────────────┘ ║           ║  └──────────────────────────────┘   ║
╚════════════╪════════════════╝           ╚═══════════╪════════════════════════╝
             │                                        │
╔════════════╪════════════════════════════════════════╪════════════════════════╗
║            ▼             SERVICE LAYER              ▼                        ║
║  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────────────┐  ║
║  │  BullMQ Workers  │  │  Cron Service  │  │  Notification Dispatcher   │  ║
║  │  (Notifications) │  │  (Job Gen 23:30│  │  (FCM + SMS fanout)        │  ║
║  │  (Payouts)       │  │   IST nightly) │  └────────────────────────────┘  ║
║  │  (Reconcile)     │  └────────────────┘                                   ║
║  └──────────────────┘                                                        ║
╚════════════╪════════════════════════════════════════════════════════════════╝
             │
╔════════════╪════════════════════════════════════════════════════════════════╗
║            ▼              DATA LAYER                                        ║
║  ┌─────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  ║
║  │   MongoDB Atlas     │  │   Redis (ElastiCache) │  │   Cloudflare CDN  │  ║
║  │   M10 · ap-south-1  │  │   r7g.large           │  │   Static Assets   │  ║
║  │   AES-256 at rest   │  │   JWT Store           │  │   Profile Photos  │  ║
║  │   Daily backups     │  │   BullMQ Queues       │  └───────────────────┘  ║
║  │   PITR enabled      │  │   GPS Cache           │                          ║
║  └─────────────────────┘  │   OTP Rate Limiters   │                          ║
║                            └──────────────────────┘                          ║
╚════════════════════════════════════════════════════════════════════════════╝
             │
╔════════════╪═════════════════════════════════════════════════════════════════╗
║            ▼              EXTERNAL SERVICES                                  ║
║  ┌──────────┐ ┌───────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐  ║
║  │ Razorpay │ │ Google Maps   │ │ Firebase │ │   MSG91    │ │  Digio /  │  ║
║  │ Payments │ │ Geocoding     │ │   FCM    │ │   (SMS)    │ │  DigiLocke│  ║
║  │ Payouts  │ │ Directions    │ │   Push   │ │  + Twilio  │ │  r (KYC)  │  ║
║  │ Refunds  │ │ Maps JS API   │ │ Notifs   │ │  fallback  │ └───────────┘  ║
║  └──────────┘ └───────────────┘ └──────────┘ └────────────┘                 ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

### 1.3 Architectural Principles

| Principle | Implementation |
|---|---|
| **Stateless API** | Every REST request carries a JWT; no server-side session. Enables horizontal scaling. |
| **Single Source of Truth** | MongoDB is the system of record. Redis holds ephemeral cache only — nothing in Redis that can't be rebuilt from Mongo. |
| **Queue-first for async work** | Notifications, payouts, and cron tasks are always enqueued, never called inline. Prevents request blocking and enables retry. |
| **Fail loud, fail fast** | Cron failures alert PagerDuty immediately. Payment failures are logged with full context. No silent failures. |
| **Defense in depth** | Validation at client, API gateway, middleware, and service layer. Never trust a single layer. |
| **Data locality** | All data stored in `ap-south-1` (Mumbai) per PDPB compliance. |
| **Graceful degradation** | Google Maps failure → show address text. FCM failure → SMS fallback. GPS loss → last known position. |

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG for Sender and public pages; RSC reduces JS bundle; single repo for all 4 apps |
| Language | TypeScript 5 | Type safety across client/server boundary; catches integration bugs at compile time |
| Styling | Tailwind CSS | Utility-first; mobile-first responsive out of the box; tiny production bundle |
| State Management | Zustand (client) + React Query (server state) | Zustand for UI state (modals, nav); React Query for data fetching, caching, and background refetch |
| Maps | Google Maps JavaScript API | Required by SRS-INT-006; smooth marker animation |
| Real-time | Socket.IO client | Paired with Socket.IO server; auto-reconnect, event-based |
| Forms | React Hook Form + Zod | Schema-driven validation; matches server-side Zod schemas |
| PWA | next-pwa | Service Worker for Rider app install, offline job list caching |
| Icons | Lucide React | Tree-shakable; consistent icon set |

### 2.2 Monorepo Structure

```
homebite/
├── apps/
│   ├── web/                          # Next.js — all 4 user-facing apps
│   │   ├── app/
│   │   │   ├── (public)/             # Landing, login, register
│   │   │   │   ├── page.tsx
│   │   │   │   └── auth/
│   │   │   │       ├── login/page.tsx
│   │   │   │       └── register/page.tsx
│   │   │   │
│   │   │   ├── sender/               # Sender dashboard (protected)
│   │   │   │   ├── layout.tsx        # Sender shell + nav
│   │   │   │   ├── page.tsx          # Dashboard home
│   │   │   │   ├── receivers/
│   │   │   │   │   ├── page.tsx      # List receivers
│   │   │   │   │   └── new/page.tsx  # Add receiver form
│   │   │   │   ├── subscriptions/
│   │   │   │   │   ├── new/page.tsx  # 4-step booking flow
│   │   │   │   │   └── [id]/page.tsx # Manage subscription
│   │   │   │   └── track/[jobId]/    # Live tracking view
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── receiver/             # Receiver dashboard (protected)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Incoming delivery
│   │   │   │   ├── otp/[jobId]/      # OTP display screen
│   │   │   │   │   └── page.tsx
│   │   │   │   └── history/page.tsx
│   │   │   │
│   │   │   ├── rider/                # Rider PWA (protected)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Job list today
│   │   │   │   ├── jobs/[jobId]/     # Active job screen
│   │   │   │   │   └── page.tsx
│   │   │   │   └── earnings/page.tsx
│   │   │   │
│   │   │   ├── admin/                # Admin dashboard (protected)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Live operations map
│   │   │   │   ├── jobs/page.tsx     # Job table with filters
│   │   │   │   ├── riders/page.tsx   # Rider management
│   │   │   │   ├── disputes/page.tsx # Dispute resolution
│   │   │   │   └── analytics/page.tsx
│   │   │   │
│   │   │   └── api/                  # Next.js API Routes (Backend)
│   │   │       ├── auth/
│   │   │       ├── sender/
│   │   │       ├── receiver/
│   │   │       ├── rider/
│   │   │       ├── admin/
│   │   │       └── payments/
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # Primitive components (Button, Input, Card)
│   │   │   ├── maps/                 # TrackingMap, RouteMap, DisputeGPSMap
│   │   │   ├── notifications/        # Toast, Alert, NotificationBell
│   │   │   ├── forms/                # ReceiverForm, SubscriptionForm
│   │   │   └── shared/               # RoleGuard, LoadingSpinner, ErrorBoundary
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSocket.ts          # Socket.IO connection + room join
│   │   │   ├── useGPS.ts             # Geolocation API wrapper (Rider)
│   │   │   ├── useTrackingMap.ts     # Google Maps + Socket data fusion
│   │   │   └── useAuth.ts            # JWT refresh + session
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance with interceptors
│   │   │   ├── socket.ts             # Socket.IO client singleton
│   │   │   ├── auth.ts               # Token storage + refresh logic
│   │   │   └── maps.ts               # Google Maps loader + utilities
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.ts          # Zustand: user role, tokens
│   │   │   ├── trackingStore.ts      # Zustand: current GPS position
│   │   │   └── jobStore.ts           # Zustand: active job state
│   │   │
│   │   ├── public/
│   │   │   ├── manifest.json         # PWA manifest (Rider)
│   │   │   └── sw.js                 # Service Worker (next-pwa generated)
│   │   │
│   │   └── next.config.ts
│   │
│   └── socket-server/                # Standalone Socket.IO server (Node.js)
│       ├── src/
│       │   ├── index.ts
│       │   ├── middleware/
│       │   ├── handlers/
│       │   └── rooms/
│       └── package.json
│
├── packages/
│   ├── types/                        # Shared TypeScript types
│   │   ├── user.types.ts
│   │   ├── job.types.ts
│   │   ├── subscription.types.ts
│   │   └── payment.types.ts
│   │
│   ├── schemas/                      # Shared Zod schemas (client + server)
│   │   ├── auth.schema.ts
│   │   ├── receiver.schema.ts
│   │   └── job.schema.ts
│   │
│   └── utils/                        # Pure utilities
│       ├── otp.ts
│       ├── distance.ts               # Haversine formula for geofence
│       └── formatters.ts
│
├── turbo.json                        # Turborepo build pipeline
├── package.json
└── tsconfig.base.json
```

### 2.3 Role-Based App Partitioning

Each role gets an isolated Next.js layout with its own navigation, guards, and data context. Role isolation is enforced at three levels:

```
Level 1: URL structure      /sender/* | /receiver/* | /rider/* | /admin/*
Level 2: Layout middleware  Checks JWT role claim; redirects if mismatched
Level 3: API middleware     Server validates role on every API route
```

```typescript
// middleware.ts — Next.js Edge Middleware
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { role } = verifyJWT(token); // Edge-compatible JWT verify

  const path = request.nextUrl.pathname;

  const roleRouteMap = {
    SENDER:     '/sender',
    RECEIVER:   '/receiver',
    RIDER:      '/rider',
    ADMIN:      '/admin',
    SUPER_ADMIN:'/admin',
  };

  const expectedPrefix = roleRouteMap[role];
  if (!path.startsWith(expectedPrefix) && !path.startsWith('/auth')) {
    return NextResponse.redirect(new URL(expectedPrefix, request.url));
  }
}
```

### 2.4 Data Fetching Strategy

| Data Type | Strategy | Reason |
|---|---|---|
| Initial page data (jobs, subscriptions) | React Query `useQuery` + SSR prefetch | Fast initial paint; stale-while-revalidate |
| Live GPS position | Socket.IO event → Zustand store → map marker | Sub-second updates; no HTTP polling overhead |
| Notifications | FCM foreground message handler → Toast | Push-based; no polling |
| Mutations (pickup, OTP submit) | React Query `useMutation` + optimistic update | Instant UI response; roll back on error |
| Rider job list (offline) | PWA Service Worker cache (stale-while-revalidate) | Rider may have spotty 4G |

### 2.5 Rider PWA — Offline Strategy

```
Cache Strategy: Network-first with cache fallback

Resources cached by Service Worker:
  - /rider page shell (HTML)
  - /rider/jobs/today API response (stale-while-revalidate, 60s TTL)
  - All JS/CSS bundles (cache-first, content-hash busting)
  - Google Maps tile cache (limited, browser-managed)

Actions queued offline:
  - Mark Picked Up (stored in IndexedDB queue)
  - OTP Submit (stored in IndexedDB queue)
  - Both flushed and retried on reconnect with idempotency key
```

### 2.6 State Architecture

```
┌─────────────────────────────────────────────────┐
│                 Client State Layers              │
│                                                  │
│  React Query Cache (server state)                │
│  ┌────────────────────────────────────────────┐  │
│  │  /sender/receivers          TTL: 5 min     │  │
│  │  /rider/jobs/today          TTL: 60s       │  │
│  │  /receiver/jobs/active      TTL: 10s       │  │
│  │  /admin/jobs                TTL: 30s       │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Zustand Store (ephemeral UI state)              │
│  ┌────────────────────────────────────────────┐  │
│  │  authStore    { userId, role, tokenExpiry }│  │
│  │  trackingStore{ lat, lng, jobId, eta }     │  │
│  │  jobStore     { activeJob, otpAttempts }   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Socket.IO Event Stream (real-time)              │
│  ┌────────────────────────────────────────────┐  │
│  │  'gps:update' → trackingStore.setPosition  │  │
│  │  'job:status' → React Query invalidation   │  │
│  │  'admin:alert'→ notification toast         │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. Backend Architecture

### 3.1 Technology Stack

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Async I/O; same language as frontend; large ecosystem |
| Framework | Next.js App Router (API Routes) | Collocated with frontend; Vercel deployment; Edge Runtime for middleware |
| Language | TypeScript 5 | Shared types with frontend via monorepo packages |
| ORM / ODM | Mongoose 8 | Schema validation + hooks for MongoDB; mature ecosystem |
| Validation | Zod | Shared schemas with frontend; runtime type safety |
| Queue | BullMQ + Redis | Reliable job queue; retry with backoff; job prioritisation |
| Scheduler | node-cron inside BullMQ | Cron trigger → BullMQ job → worker processes |
| Logging | Pino | Structured JSON logs; low overhead; Vercel compatible |
| Monitoring | Sentry (errors) + Grafana Cloud (metrics) | Error tracking + performance dashboards |
| Testing | Jest + Supertest | Unit + integration testing |

### 3.2 API Server Internal Architecture

```
Request
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE STACK (in order)                   │
│                                                                  │
│  1. TLS Termination          (at ALB / Vercel edge)             │
│  2. Rate Limiter             (Redis-backed; per IP + per user)  │
│  3. CORS                     (allowlist: homebite.in domains)   │
│  4. Security Headers         (HSTS, CSP, X-Frame-Options)       │
│  5. Request Logger           (Pino; excludes PII fields)        │
│  6. JWT Authenticator        (verify access token → attach user)│
│  7. Role Guard               (check route allowed roles)        │
│  8. Input Validator          (Zod schema parse → 400 on fail)   │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTE HANDLER LAYER                         │
│                                                                  │
│  /api/auth/*          AuthController                            │
│  /api/sender/*        SenderController                          │
│  /api/receiver/*      ReceiverController                        │
│  /api/rider/*         RiderController                           │
│  /api/admin/*         AdminController                           │
│  /api/payments/*      PaymentController                         │
│  /api/webhooks/*      WebhookController  (no auth; sig verify)  │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│                                                                  │
│  AuthService          OtpService             TokenService        │
│  SubscriptionService  JobAssignmentService   OtpValidationSvc   │
│  PaymentService       RefundService          NotificationSvc     │
│  TrackingService      GeofenceService        DisputeService      │
│  EarningsService      RiderService           AdminService        │
│                                                                  │
│  Services contain all business logic and business rule          │
│  enforcement. They never access MongoDB directly.               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REPOSITORY LAYER                             │
│                                                                  │
│  UserRepository          ReceiverProfileRepository              │
│  SubscriptionRepository  DeliveryJobRepository                  │
│  PaymentRepository       DisputeRepository                      │
│  RiderRepository         AuditLogRepository                     │
│                                                                  │
│  Repositories contain all MongoDB queries. Services call        │
│  repositories. Repositories call Mongoose models.               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                            │
│                                                                  │
│  MongooseModels     RedisClient     BullMQProducer              │
│  RazorpayClient     FCMClient       SMS91Client                 │
│  GoogleMapsClient   KYCClient                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Background Worker Architecture

Workers run as a **separate Node.js process** (not inside Next.js API routes). This is critical: long-running workers must not block the API server event loop.

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKER PROCESS (separate Node.js)            │
│                                                                  │
│  BullMQ Queue: 'notifications'                                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Jobs: push_notification | sms_notification         │        │
│  │  Concurrency: 20                                    │        │
│  │  Retry: 3 attempts, exponential backoff (1s, 2s, 4s)│        │
│  │  On failure: Dead Letter Queue → Slack alert        │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  BullMQ Queue: 'payouts'                                        │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Jobs: rider_payout                                 │        │
│  │  Concurrency: 5 (rate-limited by Razorpay)         │        │
│  │  Scheduled: daily at 18:00 IST via cron trigger    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  BullMQ Queue: 'job-generation'                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Jobs: generate_daily_jobs                          │        │
│  │  Scheduled: nightly at 23:30 IST                   │        │
│  │  Retry: 3 attempts; PagerDuty alert on final fail  │        │
│  │  Timeout: 8 minutes (hard kill)                    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  BullMQ Queue: 'reconciliation'                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Jobs: payment_reconcile                            │        │
│  │  Scheduled: every 30 minutes                       │        │
│  │  Checks: PENDING payments > 15 minutes old         │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  BullMQ Queue: 'cleanup'                                        │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Jobs: purge_gps_trails, purge_stale_fcm_tokens    │        │
│  │  Scheduled: nightly at 02:00 IST                   │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Nightly Job Generation — Detailed Flow

This is the most critical backend process. Every missed run costs real deliveries.

```
23:30 IST — Cron triggers 'generate_daily_jobs' BullMQ job
     │
     ▼
JobGenerationWorker.process()
     │
     ├─► Query MongoDB: all Subscriptions where
     │     status = ACTIVE
     │     AND startDate ≤ tomorrow ≤ endDate
     │     AND tomorrow.dayOfWeek IN activeDays
     │     AND tomorrow NOT IN any pauseWindow
     │
     ├─► For each qualifying subscription (batched, 100 at a time):
     │     │
     │     ├─► Generate 4-digit OTP (crypto.randomInt(1000, 9999))
     │     ├─► Hash OTP with bcrypt (cost 10)
     │     ├─► Find available Rider in same zone
     │     │     (ACTIVE status, jobCount < 15 for tomorrow)
     │     ├─► Create DeliveryJob document (atomic upsert)
     │     ├─► If rider found: status = ASSIGNED, riderId = rider._id
     │     │   If no rider:   status = PENDING_ASSIGNMENT
     │     └─► Enqueue notification: 'rider_route_ready' → notifications queue
     │
     ├─► After all jobs created:
     │     ├─► Query: all jobs with status = PENDING_ASSIGNMENT
     │     └─► Enqueue admin alert: 'unassigned_jobs_exist'
     │
     └─► Log: { jobsCreated, jobsAssigned, jobsUnassigned, durationMs }
         If durationMs > 480,000 (8 min): PagerDuty alert
```

### 3.5 Escalation Worker — T-2 Hour Check

```
Every minute: Escalation checker runs
     │
     ▼
Query: DeliveryJobs where
  status = PENDING_ASSIGNMENT
  AND pickupWindow.start ≤ (now + 2 hours)
  AND escalated != true
     │
     ▼
For each result:
  ├─► Mark job.escalated = true
  ├─► Enqueue admin push notification
  └─► Add to Admin dashboard 'Needs Attention' queue
```

---

## 4. Authentication Flow

### 4.1 Token Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    TOKEN DESIGN                                  │
│                                                                  │
│  ACCESS TOKEN (JWT)                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Header:  { alg: "HS256", typ: "JWT" }                  │  │
│  │  Payload: {                                              │  │
│  │    sub: "userId",        ← MongoDB _id                  │  │
│  │    role: "SENDER",       ← User role                    │  │
│  │    aud: "homebite-api",  ← Audience claim               │  │
│  │    iat: 1719400000,      ← Issued at                    │  │
│  │    exp: 1719400900,      ← Expires in 15 minutes        │  │
│  │    jti: "uuid-v4"        ← Token ID (for revocation)    │  │
│  │  }                                                       │  │
│  │  NO PII: no phone, name, or address in payload          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Storage: HttpOnly, Secure, SameSite=Strict cookie              │
│                                                                  │
│  REFRESH TOKEN                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Format: 256-bit random hex string (NOT a JWT)          │  │
│  │  Storage: Redis key: refresh:{token} → userId           │  │
│  │  TTL: 30 days                                           │  │
│  │  Rotation: new refresh token issued on every use        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Storage: HttpOnly, Secure, SameSite=Strict cookie              │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Registration Flow

```
Client                          API Server                  Redis        MongoDB       MSG91
  │                                │                          │              │             │
  │── POST /api/auth/request-otp ─►│                          │              │             │
  │   { phone: "9876543210" }       │                          │              │             │
  │                                │── Check rate limit ──────►│              │             │
  │                                │   GET otp:rate:9876...   │              │             │
  │                                │◄─ count (0) ─────────────│              │             │
  │                                │── INCR + EXPIRE(1hr) ───►│              │             │
  │                                │── Generate 6-digit OTP   │              │             │
  │                                │── SETEX otp:9876...:val  │              │             │
  │                                │   (value=bcrypt(OTP),    │              │             │
  │                                │    TTL=600s) ────────────►│              │             │
  │                                │── Send SMS ──────────────────────────────────────────►│
  │◄── 200 { message: "OTP sent" }─│                          │              │             │
  │                                │                          │              │             │
  │── POST /api/auth/verify-otp ──►│                          │              │             │
  │   { phone, otp, name, role }   │                          │              │             │
  │                                │── GET otp:9876...:val ──►│              │             │
  │                                │◄─ storedHash ────────────│              │             │
  │                                │── bcrypt.compare(otp, hash)             │             │
  │                                │── DEL otp:9876...:val ──►│              │             │
  │                                │── Upsert User ───────────────────────────►            │
  │                                │   { phone (encrypted),   │              │             │
  │                                │     name, role }         │              │             │
  │                                │◄─ user._id ──────────────────────────────             │
  │                                │── Sign JWT (15 min)      │              │             │
  │                                │── Generate refresh token │              │             │
  │                                │── SETEX refresh:{token} ─►              │             │
  │                                │   → userId (30 days)     │              │             │
  │◄── 200 Set-Cookie:             │                          │              │             │
  │    access_token=JWT;           │                          │              │             │
  │    refresh_token=TOKEN         │                          │              │             │
```

### 4.3 Request Authentication Flow (Per Request)

```
Incoming Request
      │
      ▼
Extract access_token from HttpOnly cookie
      │
      ├─► Token missing? → 401 Unauthorized
      │
      ▼
jwt.verify(token, JWT_SECRET, { audience: 'homebite-api' })
      │
      ├─► Invalid signature? → 401 Unauthorized
      ├─► Expired?           → 401 { code: "TOKEN_EXPIRED" }
      │                         ↑ Client silently calls /api/auth/refresh
      ▼
Attach { userId, role } to request context
      │
      ▼
Role Guard: Does route allow req.user.role?
      │
      ├─► No  → 403 Forbidden
      ▼
      Yes → Pass to route handler
```

### 4.4 Silent Token Refresh Flow

```
Client (Axios Interceptor)          API Server                    Redis
       │                                │                            │
       │── Any API request ────────────►│                            │
       │◄── 401 { code: TOKEN_EXPIRED}──│                            │
       │                                                             │
       │── POST /api/auth/refresh ──────►│                           │
       │   (refresh_token cookie sent)  │                            │
       │                                │── GET refresh:{token} ────►│
       │                                │◄─ userId ─────────────────│
       │                                │── Verify user still ACTIVE │
       │                                │── DEL refresh:{token} ────►│
       │                                │── Generate new access JWT  │
       │                                │── Generate new refresh tok │
       │                                │── SETEX refresh:{new} ────►│
       │◄── 200 Set-Cookie (new tokens)─│                            │
       │                                │                            │
       │── Retry original request ──────►│                           │
```

### 4.5 Login Flow (Returning User)

Identical to registration flow (request-otp → verify-otp) except:
- `verify-otp` finds existing user by `phoneHash` instead of creating one
- No `name` or `role` required in the payload (fetched from DB)
- Role is confirmed from DB, not accepted from client

### 4.6 Logout Flow

```
Client                    API Server                Redis
  │                           │                       │
  │── POST /api/auth/logout──►│                       │
  │   (sends both cookies)    │                       │
  │                           │── DEL refresh:{token}►│
  │                           │── Blacklist jti in    │
  │                           │   Redis (until exp)   │
  │◄── 200 Clear-Cookie ──────│                       │
  │   (access_token, refresh) │                       │
```

---

## 5. Database Architecture

### 5.1 MongoDB Atlas Configuration

```
┌───────────────────────────────────────────────────────────┐
│              MongoDB Atlas Cluster                          │
│              Region: ap-south-1 (Mumbai)                   │
│              Tier: M10 (pilot) → M30 (scale)              │
│                                                            │
│  Replica Set: 3 nodes (1 primary, 2 secondary)            │
│  Read Preference: primaryPreferred (failover to secondary) │
│  Write Concern: majority                                   │
│  Journal: enabled                                          │
│  Encryption at Rest: AES-256 (MongoDB native)             │
│  Key Management: AWS KMS                                   │
│  Backups: Continuous (PITR), daily snapshots (7-day)      │
└───────────────────────────────────────────────────────────┘
```

### 5.2 Collection Design

```
DATABASE: homebite_production

Collections:
├── users
├── receiver_profiles
├── subscriptions
├── delivery_jobs
├── payments
├── disputes
├── ratings
├── rider_wallets
├── payout_logs
└── audit_logs
```

### 5.3 Full Schema Definitions

#### users
```javascript
{
  _id:             ObjectId,           // Primary key
  phoneHash:       String,             // SHA-256(phone) — for lookup
  phoneEncrypted:  String,             // AES-256-GCM(phone) — for display
  name:            String,
  role:            String,             // SENDER | RECEIVER | RIDER | ADMIN | SUPER_ADMIN
  profilePhotoUrl: String,             // CDN URL
  fcmTokens:       [String],           // One per device
  status:          String,             // ACTIVE | SUSPENDED | DEACTIVATED
  createdAt:       Date,
  lastLoginAt:     Date,

  // Rider-only fields
  riderProfile: {
    vehicleType:        String,        // BIKE | SCOOTER | CYCLE
    vehicleRegNumber:   String,
    kycVerificationToken: String,      // Token from Digio/DigiLocker
    kycStatus:          String,        // PENDING | VERIFIED | REJECTED
    zone:               String,        // Geographic zone code
    dailyJobCount:      Number,        // Reset nightly
    ratingAverage:      Number,        // Rolling 30-day
    ratingCount:        Number,
    consecutiveLowRatings: Number,     // Reset on any >3.5 rating
  }
}

Indexes:
  { phoneHash: 1 }                     UNIQUE  — user lookup by phone
  { role: 1, status: 1 }              — rider assignment queries
  { "riderProfile.zone": 1, status: 1 } — zone-based rider search
```

#### receiver_profiles
```javascript
{
  _id:          ObjectId,
  senderId:     ObjectId,              // ref: users
  linkedUserId: ObjectId,              // ref: users (nullable)
  name:         String,
  relationship: String,               // SON | DAUGHTER | HUSBAND | WIFE | FRIEND | OTHER
  phone:        String,               // AES-256-GCM encrypted
  dropAddress: {
    line1:         String,
    city:          String,
    pincode:       String,
    landmark:      String,
    deliveryNotes: String,
    lat:           Number,
    lng:           Number,
  },
  status:       String,               // ACTIVE | PAUSED | DELETED
  createdAt:    Date,
  updatedAt:    Date,
}

Indexes:
  { senderId: 1 }                     — sender fetches own receivers
  { linkedUserId: 1 }                 — receiver fetches own incoming
```

#### subscriptions
```javascript
{
  _id:                ObjectId,
  senderId:           ObjectId,        // ref: users
  receiverProfileId:  ObjectId,        // ref: receiver_profiles
  planType:           String,          // SINGLE | SEVEN_DAY | MONTHLY
  pickupTimeWindow: {
    start: String,                     // "HH:MM" e.g. "11:00"
    end:   String,                     // "HH:MM" e.g. "11:30"
  },
  pickupAddress: {
    line1: String, city: String, pincode: String,
    lat: Number, lng: Number,
  },
  activeDays:         [String],        // ["MON","TUE","WED","THU","FRI"]
  status:             String,          // PENDING_PAYMENT | ACTIVE | PAUSED | CANCELLED | EXPIRED
  startDate:          Date,
  endDate:            Date,
  pauseWindows:       [{ from: Date, to: Date }],
  zone:               String,          // Geo zone for rider assignment
  paymentRef:         ObjectId,        // ref: payments
  createdAt:          Date,
  updatedAt:          Date,
}

Indexes:
  { senderId: 1, status: 1 }          — sender dashboard
  { status: 1, endDate: 1 }          — cron: find active subscriptions
  { receiverProfileId: 1 }           — prevent duplicate subscription check
  { zone: 1, status: 1 }             — zone analytics
```

#### delivery_jobs
```javascript
{
  _id:            ObjectId,
  subscriptionId: ObjectId,            // ref: subscriptions
  senderId:       ObjectId,            // ref: users (denormalized for query perf)
  receiverId:     ObjectId,            // ref: users or receiver_profiles
  riderId:        ObjectId,            // ref: users (nullable until assigned)
  scheduledDate:  Date,                // YYYY-MM-DD midnight IST
  pickupWindow: { start: String, end: String },
  pickupAddress:  { ...address with lat/lng },
  dropAddress:    { ...address with lat/lng },
  zone:           String,
  otpHash:        String,              // bcrypt(4-digit OTP, 10)
  otpAttempts:    Number,              // default 0; max 5
  otpLocked:      Boolean,            // true after 5 failures
  status:         String,             // PENDING_ASSIGNMENT | ASSIGNED | PICKED_UP
                                      // | IN_TRANSIT | DELIVERED | ATTEMPTED_FAILED
  escalated:      Boolean,            // true if T-2hr alert sent
  pickedUpAt:     Date,
  deliveredAt:    Date,
  failureReason:  String,             // RECEIVER_NOT_PRESENT | WRONG_ADDRESS | GATE_BLOCKED | OTHER
  failureNote:    String,
  riderEarnings:  Number,             // In paise
  gpsTrail: [{                        // Purged after 30 days
    lat:       Number,
    lng:       Number,
    timestamp: Date,
  }],
  idempotencyKey: String,             // Prevents duplicate state transitions
  createdAt:      Date,
  updatedAt:      Date,
}

Indexes:
  { riderId: 1, scheduledDate: 1 }    — rider's jobs for today (CRITICAL)
  { senderId: 1, scheduledDate: 1 }   — sender tracking
  { receiverId: 1, scheduledDate: 1 } — receiver incoming
  { status: 1, scheduledDate: 1 }     — admin job table
  { subscriptionId: 1 }               — subscription → jobs
  { zone: 1, status: 1, scheduledDate: 1 } — zone analytics
  { scheduledDate: 1, deliveredAt: 1 }  — GPS cleanup job
```

#### payments
```javascript
{
  _id:                 ObjectId,
  senderId:            ObjectId,
  subscriptionId:      ObjectId,
  razorpayOrderId:     String,         // UNIQUE index
  razorpayPaymentId:   String,
  amount:              Number,         // In paise (e.g. 99900 = ₹999)
  currency:            String,         // "INR"
  status:              String,         // PENDING | CAPTURED | FAILED | REFUNDED | PARTIALLY_REFUNDED
  refunds: [{
    amount:            Number,
    razorpayRefundId:  String,
    reason:            String,
    initiatedBy:       ObjectId,       // ref: users (Admin)
    createdAt:         Date,
  }],
  webhookEvents: [{                    // All Razorpay webhook events
    event:     String,
    payload:   Object,
    receivedAt: Date,
  }],
  createdAt:           Date,
  updatedAt:           Date,
}

Indexes:
  { razorpayOrderId: 1 }              UNIQUE
  { senderId: 1, createdAt: -1 }      — sender payment history
  { status: 1, createdAt: -1 }        — reconciliation queries
```

#### disputes
```javascript
{
  _id:            ObjectId,
  deliveryJobId:  ObjectId,
  raisedBy:       ObjectId,            // ref: users (Sender)
  type:           String,             // RECEIVER_ABSENT | RIDER_NO_SHOW | INDETERMINATE
  senderNote:     String,
  riderNote:      String,
  gpsClassification: String,          // Auto-classified by GPS analysis
  status:         String,             // OPEN | UNDER_REVIEW | RESOLVED
  resolution:     String,             // PENDING | REFUND_FULL | REFUND_PARTIAL | NO_REFUND | RESCHEDULE
  resolvedBy:     ObjectId,           // ref: users (Admin)
  resolvedAt:     Date,
  resolutionNote: String,
  createdAt:      Date,               // Must be within 24h of job pickup window end
  updatedAt:      Date,
}

Indexes:
  { deliveryJobId: 1 }               UNIQUE (one dispute per job)
  { status: 1, createdAt: -1 }       — admin dispute queue
```

#### audit_logs (append-only)
```javascript
{
  _id:         ObjectId,
  timestamp:   Date,
  userId:      ObjectId,              // Who performed the action
  role:        String,
  action:      String,                // e.g. "SUBSCRIPTION_CANCEL", "DISPUTE_RESOLVE"
  entity:      String,                // Collection name
  entityId:    ObjectId,
  before:      Object,                // Previous state (for mutations)
  after:       Object,                // New state
  ip:          String,
  userAgent:   String,
}

Indexes:
  { entityId: 1, timestamp: -1 }     — audit trail for specific entity
  { userId: 1, timestamp: -1 }       — user's action history
  { timestamp: 1 }                   — TTL index for 2-year retention
```

### 5.4 Redis Key Schema

```
Namespace design: {service}:{type}:{identifier}

AUTH
  otp:reg:{phoneHash}           → { hash: string }            TTL: 600s
  otp:rate:{phoneHash}          → counter (INCR)              TTL: 3600s
  refresh:{tokenValue}          → userId                      TTL: 30 days
  blacklist:jti:{jti}           → "1"                         TTL: until JWT exp

GPS (Real-time)
  gps:job:{jobId}               → { lat, lng, ts }            TTL: 2 hours
  gps:geofence:{jobId}          → "triggered" | none          TTL: 4 hours

RATE LIMITING
  rl:api:{userId}               → counter                     TTL: 60s (sliding)
  rl:api:ip:{ip}                → counter                     TTL: 60s (sliding)
  rl:otp:delivery:{jobId}       → attempt counter             TTL: 4 hours

JOB ASSIGNMENT
  zone:riders:{zone}:{date}     → SET of riderId              TTL: 24 hours
  rider:jobcount:{riderId}:{date} → counter                   TTL: 24 hours

CRON
  cron:lock:job-generation      → "locked"                    TTL: 10 minutes
    (prevents duplicate cron runs if multiple instances start)
```

### 5.5 Entity Relationship Diagram

```
users (1) ────────────── (N) receiver_profiles
   │                              │
   │                              │ (1)
   │                              │
   │  (1)                        (N)
   └──────────── subscriptions ──►│
                      │
                      │ (1)
                      │
                     (N)
               delivery_jobs
                 │      │
                 │      │
                (1)    (1)
               users   users
              (rider) (sender)
                 │
                 │ (1)
                (0..1)
               disputes
                   │
                   │ (1)
                  (0..1)
               payments
                   │
                  (N)
              refunds (embedded)

ratings ──► delivery_jobs (1:1)
rider_wallets ──► users (1:1, rider only)
payout_logs ──► rider_wallets (N:1)
audit_logs ──► any entity (N:N, polymorphic)
```

---

## 6. API Communication

### 6.1 REST API Design Principles

- **RESTful resource naming:** Nouns, not verbs. `/api/sender/subscriptions`, not `/api/createSubscription`
- **HTTP method semantics:** GET (read), POST (create), PUT (full replace), PATCH (partial update), DELETE (remove)
- **Versioning:** URL path: `/api/v1/...` — enables non-breaking evolution
- **Idempotency:** Mutation endpoints accept `X-Idempotency-Key` header; stored in Redis for 24 hours
- **Pagination:** Cursor-based for all list endpoints: `?cursor=lastId&limit=20`

### 6.2 Complete API Route Table

#### Authentication (`/api/v1/auth`)

| Method | Path | Description | Auth | Body / Response |
|---|---|---|---|---|
| POST | `/auth/request-otp` | Send OTP to phone | Public | `{ phone }` → `{ message }` |
| POST | `/auth/verify-otp` | Verify OTP, issue tokens | Public | `{ phone, otp, name?, role? }` → Sets cookies |
| POST | `/auth/refresh` | Refresh access token | Cookie (refresh) | → Sets new access cookie |
| POST | `/auth/logout` | Invalidate session | JWT | → Clears cookies |
| GET | `/auth/me` | Get current user profile | JWT | → `{ user }` |
| PATCH | `/auth/profile` | Update name / photo | JWT | `{ name?, photoUrl? }` → `{ user }` |

#### Sender (`/api/v1/sender`)

| Method | Path | Description | Auth | Notes |
|---|---|---|---|---|
| GET | `/sender/receivers` | List receiver profiles | SENDER | |
| POST | `/sender/receivers` | Create receiver profile | SENDER | Max 5 |
| GET | `/sender/receivers/:id` | Get one receiver profile | SENDER | |
| PATCH | `/sender/receivers/:id` | Update receiver profile | SENDER | |
| DELETE | `/sender/receivers/:id` | Delete receiver profile | SENDER | Blocked if active job |
| GET | `/sender/subscriptions` | List subscriptions | SENDER | |
| POST | `/sender/subscriptions` | Create subscription | SENDER | Triggers payment flow |
| GET | `/sender/subscriptions/:id` | Get subscription detail | SENDER | |
| PATCH | `/sender/subscriptions/:id/pause` | Pause subscription | SENDER | `{ from, to }` |
| PATCH | `/sender/subscriptions/:id/resume` | Resume subscription | SENDER | |
| DELETE | `/sender/subscriptions/:id` | Cancel subscription | SENDER | Triggers refund calc |
| GET | `/sender/jobs` | Delivery history | SENDER | Paginated |
| GET | `/sender/jobs/:id/tracking` | Get active job tracking info | SENDER | Returns job + rider GPS |
| POST | `/sender/jobs/:id/dispute` | Raise a dispute | SENDER | Within 24h |
| POST | `/sender/jobs/:id/rate` | Rate rider | SENDER | After delivery |

#### Receiver (`/api/v1/receiver`)

| Method | Path | Description | Auth | Notes |
|---|---|---|---|---|
| GET | `/receiver/jobs/active` | Get today's active delivery | RECEIVER | |
| GET | `/receiver/jobs/:id/otp` | Get OTP for active job | RECEIVER | Only if job is IN_TRANSIT |
| GET | `/receiver/jobs` | Delivery history | RECEIVER | Paginated |
| POST | `/receiver/jobs/:id/rate` | Rate rider | RECEIVER | After delivery |
| POST | `/receiver/jobs/:id/report` | Report issue | RECEIVER | |

#### Rider (`/api/v1/rider`)

| Method | Path | Description | Auth | Notes |
|---|---|---|---|---|
| GET | `/rider/jobs/today` | Get today's assigned jobs | RIDER | Sorted by geo cluster |
| GET | `/rider/jobs/:id` | Get specific job detail | RIDER | |
| PATCH | `/rider/jobs/:id/pickup` | Mark tiffin as picked up | RIDER | State: ASSIGNED→PICKED_UP |
| POST | `/rider/jobs/:id/deliver` | Submit OTP, complete delivery | RIDER | Validates OTP hash |
| PATCH | `/rider/jobs/:id/fail` | Flag failed delivery | RIDER | Requires reason code |
| GET | `/rider/earnings` | Earnings summary | RIDER | Daily + monthly |
| GET | `/rider/earnings/history` | Per-job earnings log | RIDER | Paginated |
| POST | `/rider/payouts/request` | Request payout | RIDER | After 18:00 IST |
| GET | `/rider/payouts` | Payout history | RIDER | |

#### Payments (`/api/v1/payments`)

| Method | Path | Description | Auth | Notes |
|---|---|---|---|---|
| POST | `/payments/create-order` | Create Razorpay order | SENDER | Returns `{ orderId, amount }` |
| POST | `/payments/verify` | Verify signature, activate sub | SENDER | HMAC-SHA256 verify |
| GET | `/payments` | Payment history | SENDER | |
| POST | `/webhooks/razorpay` | Razorpay event webhook | Public (sig verified) | |

#### Admin (`/api/v1/admin`)

| Method | Path | Description | Auth | Notes |
|---|---|---|---|---|
| GET | `/admin/jobs` | Job list with filters | ADMIN | Filter by status/date/zone |
| GET | `/admin/jobs/live` | All IN_TRANSIT jobs with GPS | ADMIN | For live map |
| PATCH | `/admin/jobs/:id/assign` | Assign job to rider | ADMIN | |
| GET | `/admin/jobs/:id/gps-trail` | GPS trail for dispute | ADMIN | |
| GET | `/admin/disputes` | List all disputes | ADMIN | |
| GET | `/admin/disputes/:id` | Dispute detail | ADMIN | |
| POST | `/admin/disputes/:id/resolve` | Resolve dispute | ADMIN | Triggers refund if needed |
| GET | `/admin/riders` | List all riders | ADMIN | Filter by status |
| POST | `/admin/riders` | Onboard new rider | ADMIN | |
| PATCH | `/admin/riders/:id/status` | Change rider status | ADMIN | |
| GET | `/admin/riders/:id` | Rider detail + history | ADMIN | |
| POST | `/admin/cron/trigger-job-gen` | Manual cron trigger | SUPER_ADMIN | Emergency use only |
| GET | `/admin/analytics/revenue` | Revenue dashboard | ADMIN | |
| GET | `/admin/analytics/subscriptions` | Subscription metrics | ADMIN | |

### 6.3 Standard Response Envelope

All API responses use a consistent envelope:

```typescript
// Success
{
  "success": true,
  "data": { ... },              // Resource or list
  "meta": {                     // Present on paginated responses
    "cursor": "lastObjectId",
    "hasMore": true,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": {
    "code":    "SUBSCRIPTION_DUPLICATE",  // Machine-readable constant
    "message": "An active subscription already exists for this receiver.",
    "field":   "receiverProfileId"        // Optional: which input failed
  }
}
```

### 6.4 HTTP Client Architecture (Frontend)

```typescript
// lib/api.ts — Axios singleton with interceptors

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,           // Send HttpOnly cookies
  timeout: 10_000,
});

// Request interceptor: attach idempotency key for mutations
api.interceptors.request.use((config) => {
  if (['post','put','patch','delete'].includes(config.method!)) {
    config.headers['X-Idempotency-Key'] = crypto.randomUUID();
  }
  return config;
});

// Response interceptor: silent token refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 &&
        error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
        !originalRequest._retry) {

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
          refreshQueue.forEach(cb => cb(''));
          refreshQueue = [];
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        refreshQueue.push(() => resolve(api(originalRequest)));
      });
    }
    return Promise.reject(error);
  }
);
```

---

## 7. Socket.IO Architecture

> **ADR-001:** Why Socket.IO over native WebSocket or SSE  
> **Context:** We need bidirectional real-time GPS from Rider to Sender/Receiver, plus server-to-client admin alerts.  
> **Decision:** Socket.IO with a dedicated Node.js server.  
> **Rationale:** Auto-reconnect, room-based broadcasting, namespace isolation, Redis adapter for horizontal scaling. Native WebSocket requires building all of this from scratch. SSE is unidirectional — can't receive GPS from Rider.  
> **Consequences:** Requires a separate server (cannot use Vercel serverless). A standalone Node.js process is deployed on AWS EC2/ECS.

### 7.1 Server Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               Socket.IO Server (socket-server/)                  │
│               Node.js 20 LTS · Port 3001                        │
│                                                                  │
│  Namespaces:                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /tracking          GPS tracking for all active jobs     │   │
│  │  /notifications     Admin real-time alerts               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Redis Adapter (ioredis):                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  socket.io-redis-adapter                                 │   │
│  │  Enables broadcasting across multiple Socket.IO instances│   │
│  │  (horizontal scaling via AWS ECS)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Authentication Middleware:                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Extract JWT from handshake auth token                   │   │
│  │  Verify signature                                        │   │
│  │  Attach { userId, role } to socket.data                  │   │
│  │  Reject unauthenticated connections                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Room Architecture

Each active DeliveryJob gets its own Socket.IO room. Participants join and leave programmatically.

```
Room: "job:{jobId}"
    │
    ├─► Members:
    │     - Rider (1) — emits GPS updates, receives status confirmations
    │     - Sender (1) — receives GPS updates
    │     - Receiver (1) — receives GPS updates, receives 10-min alert
    │     - Admin (0..N) — reads-only for dispute review
    │
    ├─► Events emitted by Rider:
    │     'gps:update'   { lat, lng, timestamp }
    │     'job:pickup'   { jobId, timestamp }     (after API call succeeds)
    │
    ├─► Events emitted by Server:
    │     'gps:broadcast'  { lat, lng, eta, timestamp }  (to Sender + Receiver)
    │     'job:status'     { status, timestamp }           (to all room members)
    │     'geofence:alert' { message: "10 minutes away" }  (to Receiver only)
    │
    └─► Room lifecycle:
          Created: when job status → IN_TRANSIT (Rider taps "Mark Picked Up")
          Closed:  when job status → DELIVERED or ATTEMPTED_FAILED
```

### 7.3 GPS Data Flow — Step by Step

```
Rider Device (10-second interval)
     │
     │  socket.emit('gps:update', { lat: 19.075, lng: 72.877, ts: Date.now() })
     ▼
Socket.IO Server — /tracking namespace
     │
     ├─► Validate: socket.data.role === 'RIDER'
     ├─► Validate: socket.data.userId matches job.riderId
     │
     ├─► SETEX gps:job:{jobId} 120 { lat, lng, ts }     [Redis — 2min TTL]
     │
     ├─► Append to MongoDB (bulk write, every 5 updates batched):
     │     db.delivery_jobs.updateOne(
     │       { _id: jobId },
     │       { $push: { gpsTrail: { lat, lng, timestamp: ts } } }
     │     )
     │
     ├─► Calculate ETA via Google Maps Directions API (every 60s, cached)
     │
     ├─► Check geofence: if distanceTo(dropAddress) < ~2km:
     │     Call Directions API to get exact minute ETA
     │     If ETA < 10 min AND geofence not yet triggered:
     │       SET gps:geofence:{jobId} "triggered"  TTL: 4 hours
     │       Enqueue FCM push to Receiver: "10 minutes away"
     │       Enqueue SMS to Receiver phone
     │
     └─► io.to("job:{jobId}").emit('gps:broadcast', {
           lat, lng,
           eta: calculatedETA,
           timestamp: ts,
         })
              │
              ├─► Received by Sender client
              │     → Zustand: trackingStore.setPosition({ lat, lng })
              │     → Google Maps: animateMarker(lat, lng)
              │     → UI: update ETA display
              │
              └─► Received by Receiver client
                    → Same as above
                    → If 'geofence:alert': show "Get ready" banner
```

### 7.4 Client-Side Socket Connection

```typescript
// lib/socket.ts — Singleton socket client

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let trackingSocket: Socket | null = null;

export function getTrackingSocket(): Socket {
  if (!trackingSocket) {
    const { accessToken } = useAuthStore.getState();

    trackingSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL + '/tracking', {
      auth: { token: accessToken },   // JWT sent on handshake
      transports: ['websocket'],      // Skip long-polling
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
    });

    trackingSocket.on('connect_error', (err) => {
      if (err.message === 'jwt expired') {
        // Trigger token refresh, then reconnect
        refreshAccessToken().then(() => trackingSocket?.connect());
      }
    });
  }
  return trackingSocket;
}

// Usage in Rider app — hooks/useRiderGPS.ts
export function useRiderGPS(jobId: string) {
  const socket = getTrackingSocket();

  useEffect(() => {
    socket.emit('join:job', { jobId });       // Join the job room

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        socket.emit('gps:update', {
          lat: coords.latitude,
          lng: coords.longitude,
          ts: Date.now(),
        });
      }, null, { enableHighAccuracy: true, maximumAge: 5000 });
    }, 10_000);

    return () => {
      clearInterval(intervalId);
      socket.emit('leave:job', { jobId });
    };
  }, [jobId, socket]);
}

// Usage in Sender/Receiver app — hooks/useTrackingMap.ts
export function useTrackingMap(jobId: string) {
  const socket = getTrackingSocket();
  const setPosition = useTrackingStore(s => s.setPosition);

  useEffect(() => {
    socket.emit('join:job', { jobId });       // Read-only join

    socket.on('gps:broadcast', (data) => {
      setPosition(data);                       // → map marker updates
    });

    socket.on('job:status', (data) => {
      queryClient.invalidateQueries(['job', jobId]);
    });

    return () => {
      socket.off('gps:broadcast');
      socket.off('job:status');
      socket.emit('leave:job', { jobId });
    };
  }, [jobId]);
}
```

### 7.5 Admin Real-Time Alerts

```
Namespace: /notifications
Room: "admin"  (all Admin + Super Admin users join on login)

Server emits to room "admin":
  'alert:unassigned_jobs'  { count: N, jobs: [...] }
  'alert:delivery_failed'  { jobId, reason, riderName }
  'alert:dispute_opened'   { disputeId, senderName, jobId }
  'alert:otp_locked'       { jobId, receiverName }

Client (Admin dashboard):
  Shows toast notification
  Increments alert counter badge in sidebar
  Updates "Needs Attention" panel via React Query invalidation
```

---

## 8. Payment Architecture

### 8.1 Payment Flow Overview

```
HomeBite never touches card numbers, CVVs, or UPI PINs.
All sensitive payment data lives exclusively in Razorpay.
HomeBite only stores: order_id, payment_id, amount, status.
```

### 8.2 Subscription Payment — Full Sequence

```
Sender Browser                 HomeBite API              Razorpay          MongoDB
     │                              │                       │                  │
     │ 1. POST /payments/create-order                       │                  │
     │    { subscriptionId }        │                       │                  │
     │ ────────────────────────────►│                       │                  │
     │                              │ 2. POST /v1/orders    │                  │
     │                              │    { amount: 99900,   │                  │
     │                              │      currency: "INR", │                  │
     │                              │      receipt: subId } │                  │
     │                              │ ─────────────────────►│                  │
     │                              │◄── { order_id, ... } ─│                  │
     │                              │                       │                  │
     │                              │ 3. Create Payment doc │                  │
     │                              │    { status: PENDING, │                  │
     │                              │      razorpayOrderId }│                  │
     │                              │ ──────────────────────────────────────►  │
     │                              │                       │                  │
     │◄── { orderId, amount,        │                       │                  │
     │      keyId (public) } ───────│                       │                  │
     │                              │                       │                  │
     │ 4. Open Razorpay checkout    │                       │                  │
     │    modal (client-side JS)    │                       │                  │
     │ ─────────────────────────────────────────────────►   │                  │
     │                              │     User pays via UPI/card               │
     │◄──────────────────────────── ─────────────────────── │                  │
     │ 5. Razorpay returns:         │                       │                  │
     │    { payment_id,             │                       │                  │
     │      order_id,               │                       │                  │
     │      signature }             │                       │                  │
     │                              │                       │                  │
     │ 6. POST /payments/verify     │                       │                  │
     │    { payment_id, order_id,   │                       │                  │
     │      signature }             │                       │                  │
     │ ────────────────────────────►│                       │                  │
     │                              │ 7. HMAC-SHA256 verify │                  │
     │                              │    (server-side only) │                  │
     │                              │                       │                  │
     │                              │── If INVALID: 400 ────────────────────►  │
     │                              │   Log tamper attempt  │                  │
     │                              │                       │                  │
     │                              │── If VALID:           │                  │
     │                              │   Update Payment CAPTURED               │
     │                              │   Activate Subscription                 │
     │                              │ ──────────────────────────────────────►  │
     │                              │   Enqueue SMS receipt notification       │
     │                              │   Enqueue FCM receipt notification       │
     │◄── 200 { subscriptionId,     │                       │                  │
     │         status: "active" } ──│                       │                  │
```

### 8.3 Webhook Reconciliation Flow

Razorpay also sends webhook events independently of the frontend flow. This is the safety net.

```
Razorpay Servers                  HomeBite /api/v1/webhooks/razorpay
       │                                       │
       │── POST { event: "payment.captured",   │
       │          payload: { ... },            │
       │          X-Razorpay-Signature: hmac } │
       │ ─────────────────────────────────────►│
       │                                       │
       │                                       │ 1. Verify HMAC-SHA256
       │                                       │    using webhook secret
       │                                       │    (separate from API secret)
       │                                       │
       │                                       │── Invalid sig → 400, log, ignore
       │                                       │
       │                                       │ 2. Find Payment by razorpayOrderId
       │                                       │
       │                                       │ 3. Store event in payment.webhookEvents[]
       │                                       │    (idempotent — check event already stored)
       │                                       │
       │                                       │ 4. Apply state machine:
       │                                       │    payment.captured → activate subscription
       │                                       │    payment.failed   → mark payment FAILED
       │                                       │    refund.processed → update refund record
       │                                       │
       │◄── 200 OK ────────────────────────────│
```

### 8.4 Refund Flow (Admin-Initiated)

```
Admin Browser              HomeBite API              Razorpay            MongoDB
     │                          │                       │                   │
     │ POST /admin/disputes/:id/resolve                  │                   │
     │ { resolution: "REFUND_FULL" }                     │                   │
     │ ─────────────────────────►│                       │                   │
     │                          │── Validate Admin role  │                   │
     │                          │── Load Payment record  │                   │
     │                          │── Calculate refund amt │                   │
     │                          │                        │                   │
     │                          │── POST /v1/payments/   │                   │
     │                          │   {paymentId}/refund   │                   │
     │                          │   { amount, notes }    │                   │
     │                          │ ──────────────────────►│                   │
     │                          │◄── { id: refundId } ───│                   │
     │                          │                        │                   │
     │                          │── Update Payment doc   │                   │
     │                          │   Add refund entry     │                   │
     │                          │   Update Dispute       │                   │
     │                          │   Write AuditLog       │                   │
     │                          │ ──────────────────────────────────────────►│
     │                          │── Enqueue refund SMS to Sender             │
     │◄── 200 { dispute } ──────│                        │                   │
```

### 8.5 Rider Payout Flow

```
18:00 IST — BullMQ cron triggers 'rider_payout' jobs
     │
     ▼
PayoutWorker.process()
     │
     ├─► Query: all RiderWallets where pendingBalance > 0
     │          AND lastPayoutDate < today
     │
     ├─► For each rider (concurrency: 5):
     │     │
     │     ├─► POST /v1/payouts (Razorpay X API)
     │     │   {
     │     │     account_number: "RAZORPAYX...",
     │     │     amount: pendingBalance,
     │     │     currency: "INR",
     │     │     mode: "IMPS",
     │     │     purpose: "payout",
     │     │     fund_account: {
     │     │       account_type: "bank_account",
     │     │       bank_account: { rider.bankDetails }
     │     │     }
     │     │   }
     │     │
     │     ├─► On success:
     │     │     wallet.pendingBalance = 0
     │     │     wallet.lastPayoutDate = today
     │     │     Create PayoutLog record
     │     │     Enqueue SMS to rider: "₹{amount} credited"
     │     │
     │     └─► On failure:
     │           Log with full context
     │           Retry in 30 minutes (up to 3 retries)
     │           Alert Admin if all retries fail
```

### 8.6 Payment Security Controls

| Control | Implementation |
|---|---|
| Signature verification | HMAC-SHA256 server-side before any state change |
| No raw card data | Razorpay handles PCI scope; HomeBite stores zero card data |
| Webhook idempotency | Check `payment.webhookEvents[]` before processing event |
| API key storage | Environment variables only; never logged, never in source |
| Test/Prod isolation | Separate Razorpay accounts; test keys block in prod |
| Refund authorisation | Admin role only; logged to AuditLog |
| Amount validation | Server calculates amount; never trusts client-sent amount |

---

## 9. Deployment Architecture

### 9.1 Infrastructure Overview

```
Region: AWS ap-south-1 (Mumbai)  — mandated by PDPB
All services run within this single region.
No cross-region data transfer for user PII.
```

### 9.2 Full Deployment Diagram

```
Internet
    │
    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        Cloudflare                                     │
│   DNS · DDoS Protection · WAF · CDN (static assets)                  │
│   Edge Cache: JS/CSS/images (cache-first, content-hash keys)          │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
┌──────────────────────────┐      ┌───────────────────────────────────┐
│     Vercel (Next.js)     │      │      AWS (ap-south-1)              │
│                          │      │                                   │
│  Next.js App (SSR/SSG)   │      │  ┌────────────────────────────┐  │
│  - Sender pages          │      │  │   AWS ALB                  │  │
│  - Receiver pages        │      │  │   Application Load Balancer│  │
│  - Rider PWA             │      │  │   Health checks: /health   │  │
│  - Admin dashboard       │      │  └──────────────┬─────────────┘  │
│  - Next.js API routes    │      │                 │                  │
│                          │      │    ┌────────────┴─────────────┐   │
│  Edge Middleware (RBAC)  │      │    │                          │   │
│  Vercel KV (rate limits) │      │    ▼                          ▼   │
│                          │      │  ┌───────────────┐  ┌──────────────┐│
│  Environments:           │      │  │  Socket.IO    │  │  Worker      ││
│  - Production (main)     │      │  │  Server       │  │  Process     ││
│  - Staging (staging)     │      │  │  (ECS Fargate)│  │  (ECS Fargate││
│  - Preview (PR branches) │      │  │  2 instances  │  │  1 instance) ││
└──────────────────────────┘      │  └───────────────┘  └──────────────┘│
                                  │        │                    │        │
                                  │        └──────────┬─────────┘        │
                                  │                   │                   │
                                  │  ┌────────────────▼──────────────┐   │
                                  │  │   AWS ElastiCache (Redis)      │   │
                                  │  │   r7g.large · Cluster mode     │   │
                                  │  │   RDB snapshots every 15 min   │   │
                                  │  └───────────────────────────────┘   │
                                  │                                       │
                                  │  ┌────────────────────────────────┐   │
                                  │  │   MongoDB Atlas (ap-south-1)   │   │
                                  │  │   M10 → M30 upgrade path       │   │
                                  │  │   3-node replica set           │   │
                                  │  │   PITR + daily backups         │   │
                                  │  └────────────────────────────────┘   │
                                  │                                       │
                                  │  ┌────────────────────────────────┐   │
                                  │  │   AWS S3 (ap-south-1)          │   │
                                  │  │   Profile photos               │   │
                                  │  │   Exported CSVs (admin)        │   │
                                  │  │   Audit log archives           │   │
                                  │  └────────────────────────────────┘   │
                                  └───────────────────────────────────────┘
```

### 9.3 ECS Fargate Configuration

#### Socket.IO Server Task
```yaml
Family: homebite-socket-server
CPU:    512 (0.5 vCPU)
Memory: 1024 MB
Desired Count: 2          # 2 instances for HA
Min: 1 / Max: 6           # Auto-scales on connection count

Container:
  Image: {ECR}/homebite-socket:latest
  Port:  3001
  Environment:
    REDIS_URL:        (from AWS Secrets Manager)
    JWT_SECRET:       (from AWS Secrets Manager)
    MONGODB_URI:      (from AWS Secrets Manager)
  HealthCheck:
    Command: curl -f http://localhost:3001/health
    Interval: 30s
    Retries: 3
```

#### Worker Process Task
```yaml
Family: homebite-workers
CPU:    256 (0.25 vCPU)
Memory: 512 MB
Desired Count: 1          # Single worker; Redis queues ensure no duplicate processing

Container:
  Image: {ECR}/homebite-worker:latest
  Environment:
    REDIS_URL:           (from Secrets Manager)
    MONGODB_URI:         (from Secrets Manager)
    RAZORPAY_KEY_ID:     (from Secrets Manager)
    RAZORPAY_KEY_SECRET: (from Secrets Manager)
    FCM_SERVICE_ACCOUNT: (from Secrets Manager)
    MSG91_AUTH_KEY:      (from Secrets Manager)
```

### 9.4 CI/CD Pipeline

```
Developer pushes to feature branch
     │
     ▼
GitHub Actions — PR Pipeline
  ├─► Type check (tsc --noEmit)
  ├─► Lint (ESLint)
  ├─► Unit tests (Jest)
  ├─► Integration tests (Supertest + MongoDB Memory Server)
  ├─► Build check (next build)
  └─► Vercel Preview Deploy → Preview URL in PR comment

Merge to staging branch
     │
     ▼
GitHub Actions — Staging Pipeline
  ├─► All PR checks +
  ├─► E2E tests (Playwright against Vercel staging)
  ├─► Docker build: socket-server + worker
  ├─► Push to ECR (staging tag)
  ├─► ECS Deploy to staging cluster
  └─► Smoke test: curl staging.homebite.in/health

Merge to main (after staging approval)
     │
     ▼
GitHub Actions — Production Pipeline
  ├─► All staging checks +
  ├─► Docker build (production tag)
  ├─► Push to ECR (production + git-sha tag)
  ├─► Vercel production deploy
  ├─► ECS rolling deploy (socket-server, worker)
  │     minHealthyPercent: 50
  │     maxPercent: 200
  └─► Sentry release: new release + source maps upload
```

### 9.5 Environment Configuration

```
Environment variables managed via:
  - Vercel Dashboard (Next.js)
  - AWS Secrets Manager (ECS containers)
  - GitHub Actions Secrets (CI/CD)

Never in:
  - Source code
  - Docker images
  - Git history
  - Application logs

Required secrets:

  JWT_SECRET               256-bit random string (rotated quarterly)
  REFRESH_TOKEN_SECRET     256-bit random string
  MONGODB_URI              Atlas connection string
  REDIS_URL                ElastiCache endpoint
  RAZORPAY_KEY_ID          Razorpay public key
  RAZORPAY_KEY_SECRET      Razorpay private key (never client-side)
  RAZORPAY_WEBHOOK_SECRET  Razorpay webhook signing secret
  FCM_SERVICE_ACCOUNT_JSON Firebase service account JSON
  MSG91_AUTH_KEY           MSG91 API key
  GOOGLE_MAPS_API_KEY      Server-side (backend geocoding + directions)
  NEXT_PUBLIC_GOOGLE_MAPS_KEY  Client-side (Maps JS API, restricted by referrer)
  PHONE_ENCRYPTION_KEY     32-byte key for AES-256-GCM phone encryption
  AWS_KMS_KEY_ID           For MongoDB Atlas encryption key management
  PAGERDUTY_INTEGRATION_KEY  For cron failure alerts
```

### 9.6 Monitoring and Observability Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                           │
│                                                                  │
│  Logs                                                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Pino (structured JSON) → CloudWatch Logs              │     │
│  │  Log groups:                                           │     │
│  │    /homebite/api         API request/response logs     │     │
│  │    /homebite/workers     Background job logs           │     │
│  │    /homebite/socket      Socket.IO connection logs     │     │
│  │    /homebite/cron        Job generation logs           │     │
│  │  Sensitive fields NEVER logged: OTP, phone, JWT        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  Errors                                                          │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Sentry                                                │     │
│  │  - Next.js: @sentry/nextjs                            │     │
│  │  - Workers: @sentry/node                              │     │
│  │  - Source maps uploaded on each release               │     │
│  │  - PII scrubbing: filter phone, address fields        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  Metrics + Alerting                                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Grafana Cloud (free tier)                             │     │
│  │  Metrics sources:                                      │     │
│  │    CloudWatch → Grafana (via plugin)                   │     │
│  │    Vercel Analytics → API latency, error rates         │     │
│  │    MongoDB Atlas → query perf, connections             │     │
│  │    Redis → memory, hit rate, connected clients         │     │
│  │                                                        │     │
│  │  Alerts (PagerDuty):                                   │     │
│  │    - Cron job completion > 8 minutes                   │     │
│  │    - API error rate > 1%                               │     │
│  │    - Payment reconciliation job failure                │     │
│  │    - ECS task restart (3 restarts in 5 min)            │     │
│  │    - Redis memory > 80%                                │     │
│  │    - MongoDB connections > 80% of pool                 │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  Uptime Monitoring                                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  UptimeRobot (free tier) — every 5 minutes             │     │
│  │  Checks: homebite.in / socket:3001/health / API /health│     │
│  │  Alert: SMS + email to on-call engineer                │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 9.7 Disaster Recovery Plan

| Scenario | RTO | RPO | Response |
|---|---|---|---|
| Vercel Next.js outage | 5 min | 0 | Vercel auto-redeploys; fallback to last deployment |
| Socket.IO server crash | 2 min | 0 | ECS replaces task automatically; clients auto-reconnect |
| Worker process crash | 5 min | 0 | ECS replaces; BullMQ jobs remain in Redis queue |
| Redis failure | 10 min | 15 min | ElastiCache Multi-AZ failover; restore from RDB snapshot |
| MongoDB Atlas failure | 30 sec | 0 | Atlas replica set automatic failover to secondary |
| Cron job failure | 30 min | 24 hr | PagerDuty alert; Admin triggers manual cron via `/admin` |
| Razorpay outage | N/A | N/A | Subscriptions cannot be created; existing ones unaffected |
| Full region failure | 4 hr | 1 hr | Manual DNS switch to ap-southeast-1; Atlas global cluster restore |

---

## 10. Cross-Cutting Concerns

### 10.1 Error Handling Strategy

```
Layer        │  Responsibility
─────────────┼──────────────────────────────────────────────────────
Client        │  - React Error Boundary wraps each major route
              │  - Axios response interceptor catches all API errors
              │  - User sees friendly message; Sentry captures detail
              │
API Middleware │  - Uncaught errors caught by global error handler
              │  - Returns standard error envelope (Section 6.3)
              │  - No stack trace or DB error in response
              │  - Full error + context logged to Pino → CloudWatch
              │
Services      │  - Throw typed errors: AppError, ValidationError, etc.
              │  - Business rule violations throw BusinessRuleError
              │
Workers       │  - BullMQ handles retry automatically
              │  - Dead Letter Queue after max retries
              │  - PagerDuty alert on DLQ entry
              │
Cron          │  - Wrapped in try/catch; full context logged
              │  - BullMQ retry × 3, then PagerDuty
              │  - Lock key prevents duplicate execution
```

### 10.2 Logging Standards

```typescript
// Every log entry includes these fields:
{
  level:      "info" | "warn" | "error",
  timestamp:  "2026-06-27T11:30:00.000Z",
  service:    "api" | "worker" | "socket" | "cron",
  requestId:  "uuid",           // Correlation ID (injected by middleware)
  userId:     "objectId",       // Redacted if not authenticated
  role:       "SENDER",
  action:     "SUBSCRIPTION_CREATE",
  entityId:   "objectId",
  durationMs: 142,
  // NO: phone, OTP, JWT, address, card data
}
```

### 10.3 Security Checklist

- [x] TLS 1.3 enforced; 1.0/1.1 disabled
- [x] JWT stored in HttpOnly, Secure, SameSite=Strict cookies
- [x] Refresh tokens rotated on every use
- [x] OTP hashed with bcrypt before storage
- [x] Phone numbers encrypted with AES-256-GCM
- [x] RBAC at middleware layer, not just UI
- [x] Zod input validation on all API inputs
- [x] Razorpay signature verified server-side only
- [x] Webhook idempotency via stored event tracking
- [x] Rate limiting per IP and per user
- [x] No PII in JWT payload
- [x] No PII in logs
- [x] No card data stored
- [x] KYC documents in external vault only
- [x] GPS data purged after 30 days
- [x] Audit log for all sensitive mutations
- [x] Security headers on all responses
- [x] CSP disallows inline scripts
- [x] API keys in environment variables only

---

## 11. Architecture Decision Records

**ADR-001: Socket.IO vs. native WebSocket vs. SSE**  
Chosen: Socket.IO with dedicated Node.js server  
Reason: Room-based broadcasting, Redis adapter for horizontal scaling, auto-reconnect, bidirectional for GPS emission from Rider  

**ADR-002: Next.js monolith vs. microservices**  
Chosen: Next.js monorepo (monolith with modular layers)  
Reason: 3–5 engineer team; microservices adds operational overhead; clear module boundaries allow future extraction; Vercel deployment simplicity  

**ADR-003: MongoDB vs. PostgreSQL**  
Chosen: MongoDB Atlas (mandated by SRS-CON-003)  
Reason: GPS trail array naturally fits document model; flexible schema for rider profile variations; Atlas M10 within budget  

**ADR-004: HttpOnly cookies vs. localStorage for JWT**  
Chosen: HttpOnly, Secure, SameSite=Strict cookies  
Reason: localStorage is XSS-vulnerable; cookies with correct attributes are XSS-safe; CSRF mitigated by SameSite=Strict  

**ADR-005: BullMQ vs. cron-on-serverless vs. AWS EventBridge**  
Chosen: BullMQ on dedicated worker process  
Reason: Vercel serverless functions have 15s timeout — incompatible with 5-min cron; BullMQ gives retry, DLQ, monitoring; Redis already in stack  

**ADR-006: Cloudflare WAF + CDN vs. AWS CloudFront**  
Chosen: Cloudflare (free tier for WAF + CDN)  
Reason: Budget constraint (SRS-CON-005); Cloudflare free tier includes DDoS protection, CDN, and basic WAF; integrates with Vercel via custom domain  

**ADR-007: Razorpay X vs. manual bank transfer for rider payouts**  
Chosen: Razorpay X Payouts API  
Reason: Automated IMPS/NEFT; same platform as payment collection; compliance handled by Razorpay; no manual banking operations  

**ADR-008: Redis for GPS cache vs. writing every point to MongoDB directly**  
Chosen: Redis cache + batched MongoDB writes  
Reason: 10s interval × 500 active jobs = 50 MongoDB writes/second — unsustainable; Redis SET is O(1) microseconds; batch to MongoDB every 5 updates  

---

*End of ARCHITECTURE.md — HomeBite v1.0*

*This document must be updated whenever a significant architectural decision is changed. All updates require sign-off from Lead Engineer and Architecture Team.*