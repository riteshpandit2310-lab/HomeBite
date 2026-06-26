# HomeBite — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Author:** Product Team  
**Last Updated:** June 2026  

---

## Table of Contents

1. [Vision](#1-vision)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [User Roles](#6-user-roles)
7. [User Flows](#7-user-flows)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Business Rules](#10-business-rules)
11. [MVP Features](#11-mvp-features)
12. [Future Features](#12-future-features)
13. [Success Metrics](#13-success-metrics)

---

## 1. Vision

> **"Make every family feel like they live around the corner — no matter how far apart they are."**

HomeBite is a hyper-local, home-to-kin logistics platform that allows families to send homemade food to their loved ones through a network of verified delivery partners.

HomeBite is **not** a restaurant marketplace. There are no menus, no chefs, no cloud kitchens. The platform is a trust-first delivery pipeline — the sender is a mother, a wife, a spouse — and the food is already cooked and packed. HomeBite's only job is to get it there reliably, safely, and with dignity.

We believe homemade food is an act of love. Our mission is to make that act distance-proof.

---

## 2. Problem Statement

### The Core Gap

In India alone, over 40 million students and working professionals live away from their families in cities. A significant number of them depend on expensive or unhealthy outside food because their families cannot reach them daily.

Mothers, spouses, and family members who cook at home have no reliable, affordable, and trustworthy way to send that food to a son in a hostel, a husband at an office campus, or a daughter in a PG accommodation. Existing options fail them:

| Current Option | Why It Fails |
|---|---|
| Zomato / Swiggy | Designed for restaurants, not home kitchens. No pickup-from-home feature. |
| Auto-rickshaw / informal rider | Unreliable, no tracking, no accountability, no OTP-based delivery confirmation. |
| Public transport / courier | Not designed for perishable food. No time guarantees. |
| Friends / neighbours | Not scalable, creates social obligation, no daily reliability. |

### The Human Cost

- Students eat poor-quality canteen or fast food daily, affecting health and academic performance.
- Working professionals skip lunch or spend disproportionately on food delivery.
- Family members feel helpless — they can cook, but they cannot send.
- The emotional bond that home food represents gets eroded with distance.

### The Opportunity

HomeBite addresses this gap by building a **scheduled, subscription-based, home pickup and delivery network** optimised for daily homemade food — not restaurants, not packages, not documents. Just tiffins.

---

## 3. Target Users

### Primary Markets (Launch)

- Tier 1 and Tier 2 Indian cities with dense student and IT professional populations.
- Cities: Mumbai, Pune, Bengaluru, Hyderabad, Chennai, Delhi NCR, Ahmedabad.

### User Segments

**Segment A — The Sending Family (Demand Side)**
- Mothers aged 35–60 with a child studying or working in another part of the city.
- Spouses (predominantly wives) whose partners work in office parks or industrial areas.
- Families with elderly members who need food sent to care facilities or rented rooms.

**Segment B — The Receiving Member (Beneficiary)**
- College students living in PGs, hostels, or rented apartments.
- Working professionals in IT parks, business districts, or distant offices.
- Patients in hospitals or care homes.

**Segment C — Delivery Partners (Supply Side)**
- Freelance riders (bikes/cycles) looking for a predictable morning income stream.
- Existing delivery partners from other platforms seeking supplemental income.
- Local logistics micro-entrepreneurs managing small fleets.

---

## 4. User Personas

---

### Persona 1: Priya Mehta — The Sender

**"I cook for my son every day. I just wish I could actually give it to him."**

| Attribute | Detail |
|---|---|
| Age | 48 |
| Location | Bandra West, Mumbai |
| Occupation | Homemaker |
| Tech Comfort | Moderate — uses WhatsApp, Paytm, and Swiggy |
| Income (household) | ₹60,000–₹1,20,000/month |

**Context:** Priya's son Arjun moved to a college hostel in Powai. She cooks lunch every day — rice, dal, sabzi, roti — and it breaks her heart that it goes to waste or that Arjun eats "garbage from outside." She tried sending food via a local auto driver once; it arrived late and spilled.

**Goals:**
- Send freshly cooked food to Arjun every weekday by 12:30 PM.
- Know that the food arrived safely.
- Pause deliveries when Arjun comes home for weekends.

**Frustrations:**
- No reliable, everyday home-pickup service exists.
- Worried about a stranger handling food from her kitchen.
- Doesn't want to deal with complex apps or multiple steps daily.

**Key Need:** Schedule it once, trust it every day.

---

### Persona 2: Arjun Mehta — The Receiver

**"I want mom's food. Not biryani from an app."**

| Attribute | Detail |
|---|---|
| Age | 20 |
| Location | IIT Hostel, Powai, Mumbai |
| Occupation | Engineering student |
| Tech Comfort | High — native smartphone user |
| Budget | Dependent on family |

**Context:** Arjun lives in a hostel on a modest monthly allowance. He misses homemade food and his health has suffered. He orders food delivery 4–5 times a week, spending ₹4,000–₹6,000 a month on food that doesn't feel like home.

**Goals:**
- Receive mom's food every weekday without hassle.
- Know when the rider is close so he can step out or buzz the gate.
- Confirm delivery without friction.

**Frustrations:**
- Doesn't want to chase or call the rider.
- Hostel gate has security — the rider needs to reach a specific handover point.
- Gets anxious when tracking is unavailable.

**Key Need:** Real-time visibility and a dead-simple OTP handoff.

---

### Persona 3: Raju Sharma — The Delivery Partner

**"I finish my main job by 10. Give me 3 hours of morning pickups and I'm happy."**

| Attribute | Detail |
|---|---|
| Age | 29 |
| Location | Malad, Mumbai |
| Occupation | Delivery rider (primary: e-commerce), HomeBite (secondary) |
| Tech Comfort | High — uses multiple rider apps |
| Income Goal | ₹500–₹800/day supplemental |

**Context:** Raju already does e-commerce deliveries for the day, but his morning slot between 10 AM and 1 PM is idle. He wants predictable, clustered pickups — not random order-by-order chaos. He values a platform that respects his time and gives him a fixed route in advance.

**Goals:**
- Receive tomorrow's route the night before.
- Pick up multiple tiffins from the same neighbourhood in one sweep.
- Get instant wallet credit on OTP-confirmed delivery.

**Frustrations:**
- Unpredictable order flow on other platforms.
- Disputes about delivery that he can't resolve.
- Apps that are slow or crash on 4G.

**Key Need:** Predictable route, fair pay, instant settlement.

---

### Persona 4: Admin / Operations Manager

**"I need to see every delivery, every day, and intervene before something goes wrong."**

| Attribute | Detail |
|---|---|
| Age | 32 |
| Occupation | HomeBite Operations Lead |
| Tech Comfort | High |

**Goals:**
- Monitor all active deliveries on a live dashboard.
- Auto-assign unassigned jobs to available riders.
- Resolve disputes between senders and riders.
- Manage rider onboarding, verification, and ratings.

---

## 5. User Stories

### Sender Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| S-01 | Sender | Register and add my receiver's details (name, phone, address) | The rider knows exactly where to drop the tiffin |
| S-02 | Sender | Choose a daily pickup time window | The rider arrives when my food is ready |
| S-03 | Sender | Buy a subscription plan (daily / weekly / monthly) | I pay once and don't have to book every day |
| S-04 | Sender | Pause my subscription for specific days | I don't waste money when my son is visiting home |
| S-05 | Sender | Track the rider live on a map | I know the food is on its way |
| S-06 | Sender | Get a notification when my tiffin is delivered | I have peace of mind without calling my son |
| S-07 | Sender | Manage multiple receivers under one account | I can send lunch to my son and dinner to my husband |
| S-08 | Sender | Rate the rider after each delivery | The platform maintains quality |
| S-09 | Sender | See my full delivery history | I can track attendance and missed deliveries |
| S-10 | Sender | Contact support if a delivery fails | I can resolve issues without losing money |

### Receiver Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| R-01 | Receiver | Get a push notification when the rider is 10 minutes away | I can be ready at the gate or lobby |
| R-02 | Receiver | See the rider's live location on a map | I'm not left waiting and wondering |
| R-03 | Receiver | Confirm delivery using a 4-digit OTP | The rider can only mark it delivered when I'm present |
| R-04 | Receiver | See who is sending me food today | I know it's from home and feel connected |
| R-05 | Receiver | View my delivery history | I can track how many meals I've received |
| R-06 | Receiver | Report a damaged or missed delivery | Issues get resolved fairly |

### Delivery Partner Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| D-01 | Rider | See all my pickups for tomorrow the night before | I can plan my route and morning |
| D-02 | Rider | See pickup and drop addresses clustered on a map | I can optimise my route myself |
| D-03 | Rider | Mark a tiffin as "Picked Up" with a tap | The sender gets notified instantly |
| D-04 | Rider | Enter the receiver's OTP to complete delivery | Delivery is confirmed and I get paid |
| D-05 | Rider | See my daily and monthly earnings in real time | I can track my income without calling support |
| D-06 | Rider | Flag a failed delivery (no one at home, wrong address) | I am not penalised for issues outside my control |
| D-07 | Rider | Access a support chat for disputes | Problems are resolved without app reinstalls or calls |

### Admin Stories

| ID | As an... | I want to... | So that... |
|---|---|---|---|
| A-01 | Admin | See all active delivery jobs on a live map | I can monitor operations in real time |
| A-02 | Admin | Assign unassigned jobs to available riders | No delivery falls through the cracks |
| A-03 | Admin | Review and resolve sender-rider disputes | Platform trust is maintained |
| A-04 | Admin | Onboard and verify new riders (ID, vehicle, bank) | Only trustworthy partners deliver food |
| A-05 | Admin | Suspend or deactivate accounts | The platform stays safe |
| A-06 | Admin | View aggregate metrics (deliveries, revenue, churn) | Data-driven decisions are possible |

---

## 6. User Roles

| Role | Description | Access Level |
|---|---|---|
| **Sender** | Family member who schedules and pays for deliveries | Own dashboard, receivers, subscriptions, live tracking |
| **Receiver** | Person who receives the tiffin | Incoming delivery view, OTP, history, ratings |
| **Delivery Partner (Rider)** | Verified individual who picks up and drops tiffins | Assigned jobs, route map, earnings, status updates |
| **Admin** | HomeBite operations team member | Full platform visibility, dispute resolution, rider management |
| **Super Admin** | Platform owner / CTO | All admin access + system configuration, pricing, partner config |

---

## 7. User Flows

### Flow 1: Sender Onboarding & First Booking

```
[Land on HomeBite] 
    → [Register with phone / OTP]
    → [Set up profile: name, home address]
    → [Add Receiver: name, relationship, phone, drop address]
    → [Choose pickup time window: 10:30 AM – 12:30 PM]
    → [Choose subscription plan: Today / 7-day / Monthly]
    → [Review order summary]
    → [Pay via Razorpay / UPI]
    → [Subscription activated] → [Confirmation screen]
    → [Sender dashboard shows upcoming delivery]
```

### Flow 2: Daily Delivery Cycle (System-Generated)

```
[Midnight cron job runs]
    → [Scans all active subscriptions for today]
    → [Creates DeliveryJob per subscription]
    → [Assigns job to nearest available rider in that zone]
    → [Generates 4-digit OTP per job]
    → [Rider notified: tomorrow's route is ready]
```

### Flow 3: Day-of Delivery (Rider)

```
[Rider opens app at pickup time]
    → [Sees job list sorted by pickup address cluster]
    → [Navigates to Sender's address]
    → [Taps "Mark Picked Up" on arrival]
    → [Sender gets notification: "Rider picked up your tiffin"]
    → [Rider navigates to Receiver's address]
    → [Receiver gets "Rider is 10 min away" notification]
    → [Rider arrives → asks Receiver for OTP]
    → [Rider enters OTP in app]
    → [Job status → Delivered]
    → [Sender gets notification: "Delivered at 11:44 AM"]
    → [Rider earnings updated instantly]
```

### Flow 4: Receiver Delivery Experience

```
[Receiver gets push notification: "Your tiffin is on the way"]
    → [Opens app → sees rider on live map]
    → [Gets "10 min away" alert]
    → [Goes to gate / lobby]
    → [Sees 4-digit OTP on screen]
    → [Shows OTP to rider]
    → [OTP entered by rider → delivery confirmed]
    → [Receiver sees "Delivered" status]
    → [Option to rate the rider]
```

### Flow 5: Sender Pauses Subscription

```
[Sender dashboard]
    → [Tap receiver card → "Manage subscription"]
    → [Tap "Pause"]
    → [Select date range: e.g., Sat Jun 28 – Mon Jun 30]
    → [Confirm]
    → [No DeliveryJob generated for paused dates]
    → [Subscription resumes automatically]
```

### Flow 6: Dispute — Failed Delivery

```
[Rider flags: "Receiver not present"]
    → [Job marked: Attempted — Not Delivered]
    → [Sender and Receiver notified]
    → [Sender can: raise dispute / accept failed delivery]
    → [Admin reviews: rider location at delivery time, timestamps]
    → [Resolution: refund / retry / no action]
```

---

## 8. Functional Requirements

### 8.1 Authentication & Accounts

| ID | Requirement |
|---|---|
| FR-01 | Phone number + OTP-based login for all roles |
| FR-02 | Separate onboarding flows for Sender, Receiver, and Rider |
| FR-03 | Password-free authentication (OTP only) for Sender and Receiver |
| FR-04 | Role-based routing post-login (Sender → /sender, Rider → /rider, Admin → /admin) |
| FR-05 | Profile management: name, photo, linked phone numbers |

### 8.2 Sender — Receiver Management

| ID | Requirement |
|---|---|
| FR-06 | Sender can add up to 5 receiver profiles per account |
| FR-07 | Each receiver profile stores: name, relationship, phone number, drop-off address, building/flat notes |
| FR-08 | Receiver profiles can be edited, paused, or deleted |
| FR-09 | Sender can link an existing HomeBite user as a receiver (by phone number) |

### 8.3 Subscription & Booking

| ID | Requirement |
|---|---|
| FR-10 | Subscription plans: Single Trip, 7-Day Pass, Monthly Plan |
| FR-11 | Sender sets one pickup time window per receiver (e.g., 11:00–11:30 AM) |
| FR-12 | Subscription applies on weekdays only by default; weekends configurable |
| FR-13 | Sender can pause subscription for specific date ranges without cancellation |
| FR-14 | Subscription can be renewed, upgraded, or cancelled at any time |
| FR-15 | Refund policy: pro-rated refund for unused days on cancellation |

### 8.4 Payment

| ID | Requirement |
|---|---|
| FR-16 | Payment via Razorpay: UPI, debit/credit card, net banking, wallets |
| FR-17 | Razorpay order created on backend; signature verified before subscription activation |
| FR-18 | Payment receipts sent via SMS and in-app notification |
| FR-19 | Failed payments trigger a retry flow with a 24-hour grace window |
| FR-20 | Admin can issue full or partial refunds from the admin dashboard |

### 8.5 Job Generation (Backend)

| ID | Requirement |
|---|---|
| FR-21 | A cron job runs every night at 11:30 PM to generate DeliveryJobs for the next day |
| FR-22 | Jobs are generated only for active, non-paused subscriptions |
| FR-23 | Each job gets a unique 4-digit OTP assigned at creation |
| FR-24 | Jobs are auto-assigned to riders based on zone and availability |
| FR-25 | Unassigned jobs at T-2 hours trigger an admin alert |

### 8.6 Rider App

| ID | Requirement |
|---|---|
| FR-26 | Rider sees their full job list for the day, sorted by pickup address cluster |
| FR-27 | Each job card shows: sender address, receiver address, pickup window, receiver name |
| FR-28 | "Mark Picked Up" button updates job status and notifies the sender |
| FR-29 | OTP input field for delivery confirmation; validates against stored OTP |
| FR-30 | Rider can flag a job as "Attempted — Failed" with a mandatory reason code |
| FR-31 | Rider earnings shown in real time; breakdown by job and date |
| FR-32 | Rider wallet balance shown; payout request to bank account (once daily) |

### 8.7 Live Tracking

| ID | Requirement |
|---|---|
| FR-33 | Rider's GPS location updated every 10 seconds while a job is active |
| FR-34 | Sender and Receiver can view rider's live location on a map |
| FR-35 | "10 minutes away" push notification sent to Receiver (geofence-based trigger) |
| FR-36 | Tracking is only active between "Picked Up" and "Delivered" status |

### 8.8 Notifications

| ID | Requirement |
|---|---|
| FR-37 | Push notification to Sender: rider is on the way, tiffin picked up, tiffin delivered |
| FR-38 | Push notification to Receiver: tiffin on the way, rider 10 min away, delivered |
| FR-39 | SMS fallback for all critical notifications (for users without app installed) |
| FR-40 | Rider notified night before with next day's route summary |
| FR-41 | Admin alerted for: unassigned jobs, failed deliveries, and disputes opened |

### 8.9 Ratings & Reviews

| ID | Requirement |
|---|---|
| FR-42 | Receiver can rate the rider (1–5 stars) after each delivery |
| FR-43 | Sender can rate the overall delivery experience |
| FR-44 | Rider rating shown on their profile; affects job allocation priority |
| FR-45 | Riders with rating below 3.5 for 7 consecutive deliveries are flagged for review |

### 8.10 Admin Dashboard

| ID | Requirement |
|---|---|
| FR-46 | Live map showing all in-progress deliveries |
| FR-47 | Table view of all DeliveryJobs with status filters |
| FR-48 | Manual job assignment / reassignment to riders |
| FR-49 | Rider management: onboard, verify, suspend, deactivate |
| FR-50 | Dispute resolution panel with delivery timeline and GPS trail |
| FR-51 | Revenue dashboard: daily/weekly/monthly with export to CSV |
| FR-52 | Subscription analytics: new, renewed, churned, paused |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| ID | Requirement |
|---|---|
| NFR-01 | Page load time < 2 seconds on 4G connection |
| NFR-02 | Rider GPS updates processed and broadcast within 5 seconds |
| NFR-03 | Cron job for job generation must complete within 5 minutes for up to 10,000 subscriptions |
| NFR-04 | API response time < 300ms for 95th percentile of requests |
| NFR-05 | Platform must handle 50,000 concurrent users without degradation |

### 9.2 Reliability

| ID | Requirement |
|---|---|
| NFR-06 | 99.9% uptime SLA (max ~8.7 hours downtime per year) |
| NFR-07 | Cron job must have automatic retry with failure alerts |
| NFR-08 | Payment processing failures must be logged and retried without data loss |
| NFR-09 | Graceful degradation: if maps fail, address text remains visible |

### 9.3 Security

| ID | Requirement |
|---|---|
| NFR-10 | All API endpoints authenticated via JWT with expiry and refresh tokens |
| NFR-11 | Phone numbers stored hashed; visible only to authorised roles |
| NFR-12 | Razorpay webhook signature verified server-side before any state changes |
| NFR-13 | OTPs expire after delivery completion or 4 hours, whichever comes first |
| NFR-14 | Rider GPS data retained for 30 days only; then purged |
| NFR-15 | All data encrypted in transit (TLS 1.3) and at rest (AES-256) |
| NFR-16 | Rate limiting on OTP generation: max 5 attempts per delivery |

### 9.4 Scalability

| ID | Requirement |
|---|---|
| NFR-17 | Architecture must support horizontal scaling of API servers |
| NFR-18 | MongoDB Atlas with sharding enabled for DeliveryJob and User collections |
| NFR-19 | CDN used for all static assets |
| NFR-20 | Queue-based architecture (e.g., BullMQ / Redis) for job generation and notifications |

### 9.5 Accessibility & Usability

| ID | Requirement |
|---|---|
| NFR-21 | Mobile-first responsive design; all key flows usable on a 360px screen |
| NFR-22 | WCAG 2.1 AA compliance for colour contrast and tap target sizes |
| NFR-23 | Support for Hindi language in UI (MVP+1 feature) |
| NFR-24 | App must function on Android 8+ and iOS 13+ |
| NFR-25 | Offline state handled gracefully with user-friendly error messages |

### 9.6 Compliance

| ID | Requirement |
|---|---|
| NFR-26 | PDPB (India Personal Data Protection) compliant data handling |
| NFR-27 | Payment data handled exclusively via Razorpay; no raw card data stored |
| NFR-28 | Rider onboarding collects government ID (Aadhaar/PAN) stored per KYC norms |

---

## 10. Business Rules

### Subscription & Billing

- BR-01: A subscription is activated only after successful payment verification.
- BR-02: A paused subscription does not generate DeliveryJobs for paused dates; no refund is issued for pauses — those days roll forward or are credited.
- BR-03: Cancellation before the 15th of the month: 50% refund of remaining days. After the 15th: no refund (credit to wallet only).
- BR-04: A sender must have at least one active receiver profile to initiate a subscription.
- BR-05: One subscription = one receiver. Multiple receivers require separate subscriptions.

### Delivery & OTP

- BR-06: A DeliveryJob can only be marked "Delivered" if the correct 4-digit OTP is entered.
- BR-07: OTP is visible only to the Receiver (not the Sender or Rider before handoff).
- BR-08: If an OTP is entered incorrectly 3 times, the job is flagged and the rider must contact support.
- BR-09: A job not marked Picked Up by T+30 minutes past pickup window is auto-escalated to Admin.
- BR-10: A rider can handle a maximum of 15 jobs per shift to maintain food quality and timing.

### Rider Rules

- BR-11: A rider must complete background verification (ID check) before being assigned any job.
- BR-12: Rider payout is processed once daily at 6 PM for all OTP-confirmed deliveries.
- BR-13: A rider who fails to show for 3 confirmed jobs in a 30-day period is placed on review.
- BR-14: Rider earnings are ₹40–₹60 per delivery depending on distance tier. HomeBite takes 15–20% platform fee.
- BR-15: Riders cannot see the Sender's phone number unless they are actively on the job.

### Dispute Resolution

- BR-16: A dispute must be raised within 24 hours of the delivery window.
- BR-17: If GPS log confirms rider was at the receiver's location and OTP was not entered, it is classified as "Receiver Absent" — no refund.
- BR-18: If GPS log does not show rider at location, it is classified as "Rider Failure" — full refund or rescheduled delivery.
- BR-19: Admin has final authority on all dispute outcomes.

### Food Safety (Platform Policy)

- BR-20: HomeBite does not inspect, certify, or take liability for food quality. The platform only delivers; the sender is responsible for food safety.
- BR-21: HomeBite strongly recommends Senders use sealed tiffin containers. Riders are instructed not to open food containers under any circumstance.
- BR-22: HomeBite does not require FSSAI licensing at MVP since it is a logistics platform, not a food business. This will be reviewed as the platform scales.

---

## 11. MVP Features

The MVP is scoped to validate the core loop: **a Sender schedules a daily pickup → a Rider collects and delivers → a Receiver confirms with OTP.**

### MVP Scope

| Feature Area | Included in MVP |
|---|---|
| Sender registration & profile | ✅ |
| Add up to 2 receivers | ✅ |
| 3 subscription plans (Single / 7-day / Monthly) | ✅ |
| Razorpay payment integration | ✅ |
| Midnight cron job for daily job generation | ✅ |
| OTP-based delivery confirmation | ✅ |
| Rider job list & status updates | ✅ |
| Live GPS tracking (sender + receiver view) | ✅ |
| Push notifications (FCM) | ✅ |
| SMS fallback via Twilio / MSG91 | ✅ |
| Rider earnings dashboard | ✅ |
| Basic admin dashboard (job list, manual assign) | ✅ |
| Subscription pause | ✅ |
| Delivery history (sender and receiver) | ✅ |
| Star rating of rider | ✅ |

### Out of MVP Scope

| Feature | Reason Deferred |
|---|---|
| Hindi / regional language UI | Post-MVP localisation sprint |
| In-app chat between sender and rider | Phone call sufficient for MVP |
| Referral and loyalty programme | Needs retention data first |
| Bulk scheduling (office tiffin groups) | B2B vertical, separate product |
| Rider fleet management (multi-rider business) | Complexity; single-rider MVP first |
| Insurance for lost / damaged tiffin containers | Partnership negotiation needed |
| Auto-routing / route optimisation engine | Manual ordering sufficient for pilot |

---

## 12. Future Features

### Phase 2 (3–6 months post-launch)

- **In-app rider chat:** Masked phone / chat so sender can send instructions without sharing real number.
- **Smart route optimisation:** Auto-cluster pickups for riders by neighbourhood, reduce travel time by 30%.
- **Multi-language support:** Hindi, Marathi, Kannada, Telugu UI.
- **Subscription gifting:** A sender can gift a 1-month subscription to a family member.
- **Recurring pause templates:** "Pause every Saturday and Sunday" set once.

### Phase 3 (6–12 months post-launch)

- **HomeBite for Offices (B2B):** HR teams or group leaders can subscribe for 10–50 employees, enabling bulk tiffin delivery to office premises.
- **Tiffin container tracking:** QR-coded containers that get scanned at pickup and drop, reducing disputes about the wrong tiffin being delivered.
- **Rider fleet accounts:** Allow a partner to register multiple riders under one business account.
- **Delivery window guarantee SLA:** Premium plans with guaranteed delivery ± 15 minutes or money back.
- **Family dashboard:** A single view where parents can see all their children's delivery status across different cities.

### Phase 4 (12–24 months)

- **HomeBite Verified Home Chefs (optional):** Allow trusted community cooks to be listed for families who want homemade food but have no sender. (This is a significant model shift and requires FSSAI licensing.)
- **Tiffin analytics for senders:** "Arjun received 22 of 26 meals this month" — meal consistency tracking.
- **Insurance partnership:** Container loss or food spoilage insurance (₹2–₹5/delivery add-on).
- **API for housing societies:** Integrate with housing society apps so the guard gate can digitally release the rider.

---

## 13. Success Metrics

### Activation Metrics (First 30 days)

| Metric | Target |
|---|---|
| Senders who complete first booking | > 60% of registrations |
| Subscriptions activated after payment | > 90% |
| First-delivery success rate | > 95% |

### Engagement & Retention Metrics

| Metric | Target |
|---|---|
| Monthly subscription renewal rate | > 70% |
| Daily delivery success rate (OTP confirmed) | > 97% |
| Average sender NPS | > 55 |
| Average rider retention (month 1 → month 3) | > 65% |

### Business Metrics (Month 6)

| Metric | Target |
|---|---|
| Active subscriptions | 2,000+ |
| Daily deliveries | 1,500+ |
| Gross revenue per month | ₹20L+ |
| Average revenue per subscription | ₹900/month |
| Platform take rate | 18% net of rider payout |

---

*Document ends.*

---

**Revision History**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | June 2026 | Product Team | Initial draft |
