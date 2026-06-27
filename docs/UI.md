

# HomeBite — Product Requirements Document **Version:** 1.0 **Status:** Draft **Author:** Product Team **Last Updated:** June 2026 --- ## Table of Contents 1. [Vision](#1-vision) 2. [Problem Statement](#2-problem-statement) 3. [Target Users](#3-target-users) 4. [User Person

pasted


# HomeBite — Software Requirements Specification (SRS) **Document ID:** HB-SRS-001 **Version:** 1.0 **Status:** Baseline **Classification:** Internal — Confidential **Prepared By:** Business Analysis Team **Reviewed Against:** PRD v1.0 (HB-PRD-001) **Last Updated:** June 2026

pasted


# HomeBite — Software Architecture Document **Document ID:** HB-ARCH-001 **Version:** 1.0 **Status:** Baseline **Classification:** Internal — Engineering **Prepared By:** Architecture Team **References:** PRD v1.0 (HB-PRD-001) · SRS v1.0 (HB-SRS-001) **Last Updated:** June 2026

pasted


# HomeBite — MongoDB Database Design **Document ID:** HB-DB-001 **Version:** 1.0 **Status:** Baseline **Classification:** Internal — Engineering **Prepared By:** Database Architecture Team **References:** PRD v1.0 · SRS v1.0 · ARCHITECTURE v1.0 **Last Updated:** June 2026 ---

pasted

Read all documentation.
Generate complete REST APIs.
Include:
- Request
- Response
- Validation
- Status Codes
- Authentication
- Error Handling
Save as API.md.

08:18

Check available skills
Check available skills
Now I'll generate the complete API.md based on all four documents.


Created a file, read a file
Created a file, read a file
Here's what's covered in the API spec, derived from all four documents:

15 sections, covering the complete surface area of HomeBite:

Auth — OTP request/verify, JWT refresh, logout, profile management
Sender — Receiver profiles (CRUD), subscriptions (create, pause, resume, cancel), delivery history, live tracking, disputes, ratings
Receiver — Active delivery view, OTP retrieval, history, ratings, issue reporting
Rider — Today's job list, mark picked up, OTP delivery confirmation, failed delivery flagging, earnings, payout requests
Payments — Razorpay order creation, signature verification, payment history
Admin — Live ops map, job management table (with CSV export), manual assignment, GPS trail viewer, dispute resolution, rider management (onboard/suspend/deactivate), analytics dashboards, emergency cron trigger
Webhooks — Razorpay event handling with HMAC-SHA256 verification
WebSocket — Socket.IO events for real-time GPS broadcasting and admin alerts
Every endpoint includes the full request body, field-level validation rules, success response, all relevant error responses with typed error codes, and the business rules that drive the behavior — all sourced directly from the PRD, SRS, Architecture, and DB documents.


Api
Document · MD 
Design every page.
Landing
Authentication
Dashboard
Create Delivery
Track Delivery
Profile
Admin
Responsive Design
Dark Mode
Save as UI.md.

08:24

Check frontend design skill
Check frontend design skill
Now I have the design guidance. Let me plan the design system for HomeBite then build the full UI.md.


Check output directory
Check output directory
Now I'll build the comprehensive UI.md. HomeBite is a warm, trust-first family logistics product — the design should feel domestic and human, not cold/tech. I'll lean into an identity rooted in tiffin culture: warm saffron and deep slate, rounded forms, hand-feel typography.


Creating comprehensive HomeBite UI Design Specification
Creating comprehensive HomeBite UI Design Specification

Creating comprehensive HomeBite UI Design Specification
UI.md
Done

Claude Fable 5 is currently unavailable.
Learn more(opens in new tab)




Claude is AI and can make mistakes. Please double-check responses.


Ui · MD
# HomeBite — UI Design Specification
 
**Document ID:** HB-UI-001  
**Version:** 1.0  
**Status:** Baseline  
**Classification:** Internal — Design & Engineering  
**References:** PRD v1.0 · SRS v1.0 · API v1.0  
**Last Updated:** June 2026
 
---
 
## Table of Contents
 
1. [Design System](#1-design-system)
   - 1.1 [Philosophy](#11-philosophy)
   - 1.2 [Color Tokens](#12-color-tokens)
   - 1.3 [Typography](#13-typography)
   - 1.4 [Spacing & Layout Grid](#14-spacing--layout-grid)
   - 1.5 [Border Radius & Elevation](#15-border-radius--elevation)
   - 1.6 [Motion](#16-motion)
   - 1.7 [Dark Mode](#17-dark-mode)
   - 1.8 [Responsive Breakpoints](#18-responsive-breakpoints)
   - 1.9 [Core Components](#19-core-components)
2. [Landing Page](#2-landing-page)
3. [Authentication Pages](#3-authentication-pages)
4. [Sender Dashboard](#4-sender-dashboard)
5. [Create Delivery Pages](#5-create-delivery-pages)
6. [Track Delivery Pages](#6-track-delivery-pages)
7. [Receiver Dashboard](#7-receiver-dashboard)
8. [Rider Dashboard](#8-rider-dashboard)
9. [Profile Pages](#9-profile-pages)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Shared UI Patterns](#11-shared-ui-patterns)
12. [Empty & Error States](#12-empty--error-states)
13. [Notification Patterns](#13-notification-patterns)
---
 
## 1. Design System
 
### 1.1 Philosophy
 
HomeBite is a **trust-first logistics product** built around one of the most intimate acts in Indian family life — a mother packing a tiffin for her child. The UI must feel like it belongs in a home kitchen, not a logistics control room.
 
**Visual identity anchor:** The dabba (tiffin container) itself. Layered, warm, sealed tight, carried with love. The design language borrows this: stacked layers, warm ochre-to-rust gradients, round container-like cards, and typography with personality and warmth.
 
**Three design commitments:**
1. **Warmth over efficiency.** Every screen reminds the sender this is love, not logistics.
2. **Clarity over cleverness.** Mothers aged 35–60 are the primary users. Nothing is buried.
3. **Confidence under pressure.** Riders see clean, unambiguous job states. Admins see signal before noise.
**The signature element:** A persistent warm gradient horizon bar — saffron → rust — that appears at the top of every authenticated screen. It is the tiffin lid: the colour of daal, roti, and turmeric. It makes HomeBite immediately recognisable across all four app surfaces.
 
---
 
### 1.2 Color Tokens
 
#### Primitive Palette
 
```
--hb-saffron-50:   #FFF8EE
--hb-saffron-100:  #FFEFD0
--hb-saffron-200:  #FFD990
--hb-saffron-300:  #FFBD4A
--hb-saffron-400:  #FFA011
--hb-saffron-500:  #F08000   ← Primary brand / CTA
--hb-saffron-600:  #C96600
--hb-saffron-700:  #A34E00
--hb-saffron-800:  #7D3A00
--hb-saffron-900:  #5C2900
 
--hb-rust-400:     #E05A2B
--hb-rust-500:     #C44420   ← Secondary accent / gradient terminus
--hb-rust-600:     #A33318
 
--hb-slate-50:     #F6F7F9
--hb-slate-100:    #ECEEF2
--hb-slate-200:    #D5D9E0
--hb-slate-300:    #B0B7C3
--hb-slate-400:    #8691A4
--hb-slate-500:    #5F6B80
--hb-slate-600:    #404D62
--hb-slate-700:    #2C3649
--hb-slate-800:    #1D2535
--hb-slate-900:    #111827   ← Primary text
--hb-slate-950:    #080D16   ← Dark mode surface
 
--hb-green-400:    #34C97A
--hb-green-500:    #22A360   ← Delivered / Success
--hb-green-100:    #E6F9EE
 
--hb-red-400:      #F25959
--hb-red-500:      #D93B3B   ← Error / Failed
--hb-red-100:      #FDEAEA
 
--hb-amber-400:    #F5C842
--hb-amber-500:    #E0AD1A   ← Warning / In Transit
--hb-amber-100:    #FEFBE7
 
--hb-white:        #FFFFFF
--hb-black:        #000000
```
 
#### Semantic Tokens (Light Mode)
 
```
/* Surfaces */
--surface-page:        var(--hb-slate-50)
--surface-card:        var(--hb-white)
--surface-card-raised: var(--hb-white)
--surface-overlay:     rgba(17, 24, 39, 0.55)
--surface-input:       var(--hb-white)
--surface-input-focus: var(--hb-saffron-50)
 
/* Brand gradient — the tiffin lid */
--gradient-lid:        linear-gradient(135deg, #F08000 0%, #C44420 100%)
--gradient-lid-soft:   linear-gradient(135deg, #FFA011 0%, #E05A2B 100%)
 
/* Text */
--text-primary:        var(--hb-slate-900)
--text-secondary:      var(--hb-slate-600)
--text-tertiary:       var(--hb-slate-400)
--text-on-brand:       var(--hb-white)
--text-link:           var(--hb-saffron-600)
 
/* Borders */
--border-default:      var(--hb-slate-200)
--border-strong:       var(--hb-slate-300)
--border-brand:        var(--hb-saffron-400)
--border-focus:        var(--hb-saffron-500)
 
/* Interactive */
--brand-primary:       var(--hb-saffron-500)
--brand-primary-hover: var(--hb-saffron-600)
--brand-primary-press: var(--hb-saffron-700)
--brand-secondary:     var(--hb-rust-500)
 
/* Status */
--status-delivered-bg:  var(--hb-green-100)
--status-delivered-text: var(--hb-green-500)
--status-intransit-bg:  var(--hb-amber-100)
--status-intransit-text: var(--hb-amber-500)
--status-failed-bg:     var(--hb-red-100)
--status-failed-text:   var(--hb-red-500)
--status-assigned-bg:   var(--hb-slate-100)
--status-assigned-text: var(--hb-slate-600)
 
/* Rider star rating */
--star-filled:  var(--hb-saffron-400)
--star-empty:   var(--hb-slate-200)
```
 
---
 
### 1.3 Typography
 
**Display face:** `Fraunces` (variable, Google Fonts) — A quirky, warm Old Style serif with optical size axis. Used for hero headlines and large numbers. The slightly imperfect letterforms signal handmade, domestic, human.
 
**Body face:** `Plus Jakarta Sans` (variable, Google Fonts) — A contemporary geometric humanist sans with round terminals that match the rounded card aesthetic. Excellent legibility at small sizes on 4G phones.
 
**Mono/Data face:** `JetBrains Mono` — OTP display, time values, route distances. The structured contrast against warm body type creates a deliberate "delivery manifest" feel.
 
#### Type Scale
 
```
/* Display — Fraunces */
--text-display-2xl:  font-size: 64px;  line-height: 68px;  font-weight: 600;
--text-display-xl:   font-size: 48px;  line-height: 52px;  font-weight: 600;
--text-display-lg:   font-size: 36px;  line-height: 40px;  font-weight: 600;
 
/* Heading — Plus Jakarta Sans */
--text-h1:  font-size: 28px;  line-height: 34px;  font-weight: 700;
--text-h2:  font-size: 22px;  line-height: 28px;  font-weight: 700;
--text-h3:  font-size: 18px;  line-height: 24px;  font-weight: 600;
--text-h4:  font-size: 15px;  line-height: 20px;  font-weight: 600;
 
/* Body — Plus Jakarta Sans */
--text-body-lg:  font-size: 16px;  line-height: 24px;  font-weight: 400;
--text-body-md:  font-size: 14px;  line-height: 20px;  font-weight: 400;
--text-body-sm:  font-size: 13px;  line-height: 18px;  font-weight: 400;
--text-body-xs:  font-size: 12px;  line-height: 16px;  font-weight: 400;
 
/* Label — Plus Jakarta Sans */
--text-label-lg:  font-size: 14px;  font-weight: 600;  letter-spacing: 0.01em;
--text-label-md:  font-size: 12px;  font-weight: 600;  letter-spacing: 0.02em;
--text-label-sm:  font-size: 11px;  font-weight: 600;  letter-spacing: 0.04em; text-transform: uppercase;
 
/* Mono — JetBrains Mono */
--text-mono-lg:  font-size: 24px;  font-weight: 500;  letter-spacing: 0.12em;
--text-mono-md:  font-size: 16px;  font-weight: 500;  letter-spacing: 0.08em;
--text-mono-sm:  font-size: 13px;  font-weight: 400;  letter-spacing: 0.06em;
```
 
---
 
### 1.4 Spacing & Layout Grid
 
```
/* Base unit: 4px */
--space-0:    0px
--space-1:    4px
--space-2:    8px
--space-3:    12px
--space-4:    16px
--space-5:    20px
--space-6:    24px
--space-8:    32px
--space-10:   40px
--space-12:   48px
--space-16:   64px
--space-20:   80px
--space-24:   96px
 
/* Layout */
--content-max-width:  1200px
--content-padding-x:  24px   /* Mobile: 16px */
 
/* Grid */
Mobile:   1 column,   16px gutter, 16px margin
Tablet:   8 columns,  20px gutter, 24px margin
Desktop:  12 columns, 24px gutter, 48px margin
```
 
---
 
### 1.5 Border Radius & Elevation
 
```
/* Border Radius */
--radius-sm:    6px    /* Badges, tags, small inputs */
--radius-md:    10px   /* Buttons, form inputs */
--radius-lg:    14px   /* Cards */
--radius-xl:    20px   /* Modals, drawers, big cards */
--radius-2xl:   28px   /* Feature cards, hero elements */
--radius-full:  9999px /* Pills, avatar frames */
 
/* Elevation (box-shadow) */
--shadow-xs:   0 1px 2px rgba(0,0,0,0.04)
--shadow-sm:   0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md:   0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)
--shadow-lg:   0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)
--shadow-xl:   0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)
--shadow-brand: 0 4px 16px rgba(240,128,0,0.32)
```
 
---
 
### 1.6 Motion
 
All animations respect `prefers-reduced-motion: reduce`.
 
```
/* Durations */
--duration-fast:    120ms
--duration-normal:  220ms
--duration-slow:    380ms
--duration-lazy:    520ms
 
/* Easing */
--ease-standard:  cubic-bezier(0.4, 0.0, 0.2, 1)  /* Most UI transitions */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1) /* Elements entering screen */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1)   /* Elements leaving screen */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1) /* Micro-interactions */
 
/* Core transitions */
Button hover:      background-color 120ms ease-standard
Card hover:        transform 220ms ease-spring, box-shadow 220ms ease-standard
GPS marker:        transform 400ms ease-decelerate (interpolated between GPS updates)
Status badge:      background-color 220ms ease-standard
Page entry:        opacity 220ms ease-decelerate, translateY(8px→0) 220ms ease-decelerate
Modal entry:       opacity 220ms ease-decelerate, scale(0.96→1) 220ms ease-spring
Drawer entry:      translateX(100%→0) 320ms ease-decelerate
Toast entry:       translateY(100%→0) 220ms ease-spring
```
 
---
 
### 1.7 Dark Mode
 
Triggered by `prefers-color-scheme: dark` or a manual toggle persisted in `localStorage`. The dark surface uses `--hb-slate-950` base, not pure black — the tiffin-lid gradient remains unchanged, anchoring brand identity in both modes.
 
```
/* Dark mode semantic overrides */
--surface-page:        #0D1017   /* Slightly warmer than pure black */
--surface-card:        #161C27
--surface-card-raised: #1E2535
--surface-input:       #1E2535
--surface-input-focus: #27303F
 
--text-primary:        #F0F2F5
--text-secondary:      #9AA5B8
--text-tertiary:       #5F6B80
--text-link:           var(--hb-saffron-300)
 
--border-default:      #252E3F
--border-strong:       #2E3A4E
--border-focus:        var(--hb-saffron-400)
 
--status-delivered-bg:  rgba(34, 163, 96, 0.15)
--status-intransit-bg:  rgba(224, 173, 26, 0.15)
--status-failed-bg:     rgba(217, 59, 59, 0.15)
--status-assigned-bg:   rgba(95, 107, 128, 0.15)
 
/* Gradient unchanged */
--gradient-lid: linear-gradient(135deg, #F08000 0%, #C44420 100%)
```
 
---
 
### 1.8 Responsive Breakpoints
 
```
--bp-xs:   375px   /* Small phones (iPhone SE) */
--bp-sm:   480px   /* Large phones */
--bp-md:   768px   /* Tablets */
--bp-lg:   1024px  /* Laptop */
--bp-xl:   1280px  /* Desktop */
--bp-2xl:  1440px  /* Wide desktop */
 
/* Mobile-first approach: design for 375px, then enhance upward */
```
 
---
 
### 1.9 Core Components
 
#### Button
 
```
Primary (Filled):
  background: var(--gradient-lid)
  color: white
  height: 48px          /* Mobile touch target */
  padding: 0 24px
  border-radius: var(--radius-md)
  font: var(--text-label-lg) / Plus Jakarta Sans
  box-shadow: var(--shadow-brand)
  hover: brightness(1.08), translateY(-1px)
  active: brightness(0.96), translateY(0)
  disabled: opacity 0.45, no shadow, cursor not-allowed
 
Secondary (Outlined):
  background: transparent
  border: 1.5px solid var(--border-strong)
  color: var(--text-primary)
  [same sizing as primary]
 
Ghost:
  background: transparent
  color: var(--brand-primary)
  no border
  hover: background var(--hb-saffron-50)
 
Destructive:
  background: var(--hb-red-500)
  color: white
 
Icon Button:
  width: 44px, height: 44px
  border-radius: var(--radius-md)
  background: var(--surface-card)
  border: 1px solid var(--border-default)
 
Loading state: Spinner replaces label, button width locked (no layout shift)
```
 
#### Input Field
 
```
Container:
  height: 52px
  border: 1.5px solid var(--border-default)
  border-radius: var(--radius-md)
  background: var(--surface-input)
  padding: 0 16px
  transition: border-color var(--duration-fast)
 
Focus:
  border-color: var(--border-focus)
  background: var(--surface-input-focus)
  box-shadow: 0 0 0 3px rgba(240,128,0,0.14)
 
Error:
  border-color: var(--hb-red-500)
  box-shadow: 0 0 0 3px rgba(217,59,59,0.12)
 
Label: Floating label (animates above on focus/filled)
  font: var(--text-body-sm)
  color: var(--text-tertiary) → var(--brand-primary) on focus
 
Helper text: 12px, slate-400, 4px below input
Error text: 12px, red-500, with ⚠ icon prefix
```
 
#### Card
 
```
Base Card:
  background: var(--surface-card)
  border: 1px solid var(--border-default)
  border-radius: var(--radius-lg)
  padding: 20px
  box-shadow: var(--shadow-sm)
 
Interactive Card:
  cursor: pointer
  hover: box-shadow var(--shadow-md), translateY(-2px)
  transition: var(--duration-normal) var(--ease-spring)
 
Status Card (Delivery Job):
  Left border: 3px solid [status color]
  OR left colored stripe for visual scanning
 
Metric Card:
  background: var(--surface-card)
  border-radius: var(--radius-xl)
  padding: 24px
  display: flex, column
  Large number in Fraunces, label in Jakarta Sans
```
 
#### Status Badge
 
```
Size: height 24px, padding 0 10px, border-radius var(--radius-full)
Font: var(--text-label-sm)
 
Variants:
  DELIVERED:          bg var(--status-delivered-bg),    text var(--status-delivered-text)
  IN_TRANSIT:         bg var(--status-intransit-bg),    text var(--status-intransit-text)
  ASSIGNED:           bg var(--status-assigned-bg),     text var(--status-assigned-text)
  PENDING_ASSIGNMENT: bg var(--hb-slate-100),           text var(--hb-slate-500)
  ATTEMPTED_FAILED:   bg var(--status-failed-bg),       text var(--status-failed-text)
 
Dot indicator: 6px circle in status color, 4px left of label text
```
 
#### Navigation — Sender/Receiver (Mobile)
 
```
Bottom tab bar:
  position: fixed, bottom: 0
  height: 64px + safe-area-inset-bottom
  background: var(--surface-card) with backdrop-blur(12px)
  border-top: 1px solid var(--border-default)
  display: grid, 4 columns (Sender) / 3 columns (Receiver)
 
Tab item:
  icon (24px) + label (11px, label-sm)
  active: icon uses --gradient-lid fill, label color brand-primary
  inactive: slate-400
 
Desktop side nav:
  width: 240px
  Logo at top (32px height)
  Nav items: 44px height, 12px 16px padding
  Active: background saffron-50, left border 3px saffron-500
```
 
#### Avatar
 
```
Sizes:
  xs: 24px    sm: 32px    md: 40px    lg: 48px    xl: 64px
 
Shape: circle (border-radius full)
Fallback: initials in Fraunces, background gradient by first letter of name
Border on active rider: 2px solid saffron-400 with pulse animation
```
 
#### OTP Display (Receiver)
 
```
Container:
  background: var(--gradient-lid)
  border-radius: var(--radius-2xl)
  padding: 32px
  text-align: center
 
Digits: 4 individual boxes, each:
  width: 64px, height: 80px
  background: rgba(255,255,255,0.20)
  border-radius: var(--radius-lg)
  font: var(--text-display-xl) Fraunces, color: white
  margin: 0 6px
 
Label: "Show this to your rider" — 14px white 80% opacity
Countdown bar: bottom, white 40% → 0% over expiry period
```
 
#### Map Component
 
```
Container:
  border-radius: var(--radius-xl)
  overflow: hidden
  height: 320px (mobile), 420px (desktop)
  border: 1px solid var(--border-default)
 
Rider marker:
  40px × 40px circle
  background: var(--gradient-lid)
  icon: motorcycle (white, 20px)
  box-shadow: var(--shadow-lg)
  border: 2px white
  pulse ring: expanding circle, saffron-400 10% opacity
 
Pickup pin: green circle, 32px
Drop pin: rust-500 circle, 32px
Route line: dashed, saffron-300, 2px weight
 
ETA chip:
  Floating over map bottom-left
  background: var(--surface-card)
  border-radius: var(--radius-full)
  padding: 8px 14px
  font: JetBrains Mono, 16px
  box-shadow: var(--shadow-md)
```
 
---
 
## 2. Landing Page
 
**Route:** `/`  
**Audience:** First-time visitors (primarily Senders / mothers aged 35–60)  
**Single job:** Convert a visitor into a subscriber in under 60 seconds of reading.
 
### 2.1 Layout Overview
 
```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR                                                  │
│  [Logo]              [How it works] [₹59 per delivery]  │
│                                        [Get Started →]  │
├─────────────────────────────────────────────────────────┤
│  HERO                                                    │
│                                                          │
│  "Your kitchen.                                          │
│   Their doorstep."                          [Tiffin      │
│                                              Illustration│
│  Your son is 40 km away. He eats             + GPS      │
│  outside every day. Send him your food.      dot trail] │
│                                                          │
│  [Send food this week →]   [See how it works]           │
│                                                          │
│  ✓ Pickup from home  ✓ OTP delivery  ✓ Live tracking   │
├─────────────────────────────────────────────────────────┤
│  TRUST BAR                                               │
│  [Lock icon] Background-verified riders                  │
│  [Shield]    OTP-confirmed every delivery                │
│  [Map pin]   Live location from pickup to drop           │
├─────────────────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                                  │
│  ① Schedule → ② Rider picks up → ③ Son confirms OTP    │
├─────────────────────────────────────────────────────────┤
│  RECEIVER TESTIMONIALS (Arjun-type quotes)               │
├─────────────────────────────────────────────────────────┤
│  PLANS SECTION                                           │
│  ₹59 / trip     ₹299 / week     ₹999 / month            │
├─────────────────────────────────────────────────────────┤
│  FAQ                                                     │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                  │
└─────────────────────────────────────────────────────────┘
```
 
### 2.2 Navbar
 
**Desktop:**
```
┌────────────────────────────────────────────────────────────────┐
│  [🍱 HomeBite]        How it works   Pricing   For Riders     │
│                                           [Log in]  [Get started →] │
└────────────────────────────────────────────────────────────────┘
```
 
Specs:
- Height: 64px. `position: sticky; top: 0`. `backdrop-filter: blur(16px)`. `background: rgba(surface-page, 0.85)`.
- Logo: `🍱` emoji + "HomeBite" in Fraunces 600, 22px, saffron-600.
- Nav links: Plus Jakarta Sans 14px, slate-600. Hover: saffron-600. No underline.
- "Log in": Ghost button. "Get started": Primary button, compact (height 40px).
- Scroll behaviour: add `box-shadow: var(--shadow-sm)` after 64px scroll.
**Mobile:**
- Logo + hamburger menu icon only.
- Drawer from right (320px wide) with all nav links stacked.
- "Get started" full-width primary button at bottom of drawer.
### 2.3 Hero Section
 
**Desktop (two-column, 55/45 split):**
```
┌─────────────────────────────┬───────────────────────────────┐
│                             │                               │
│  [eyebrow]                  │      ┌──────────────────┐    │
│  Home delivery for families │      │  🍱  Tiffin      │    │
│                             │      │  illustration    │    │
│  "Your kitchen.             │      │  + animated      │    │
│   Their doorstep."          │      │  route dots      │    │
│                             │      └──────────────────┘    │
│  [body copy, 18px, 2 lines] │                               │
│                             │   ┌─────────────────────────┐│
│  [Send food this week →]    │   │ Today's delivery        ││
│  [Watch how it works ▶]     │   │ ✓ Picked up 11:06 AM   ││
│                             │   │ ● In transit            ││
│  ─────────────────          │   │ ETA: 11 min             ││
│  ✓ ✓ ✓ [trust chips]        │   └─────────────────────────┘│
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘
```
 
Specs:
- Headline: Fraunces 600, 56px desktop / 38px mobile. Weight: `opsz` axis at maximum for richness.
- The quote marks (`"…"`) use a slightly larger size (72px) and saffron-300 colour, overlapping the first letter — a typographic signature.
- Illustration: SVG of a tiffin with an animated dotted path from a house icon (left) to a hostel icon (right). Path draws on page load (stroke-dashoffset animation, 1.2s ease-decelerate). Subtle, not cartoonish.
- Floating "Today's delivery" card: Mini tracking card with live-looking status. Has a subtle green pulse dot. Appears after 400ms delay on load.
- Background: `var(--surface-page)` with a very subtle radial gradient from top-right: `rgba(240,128,0,0.06)`.
- CTA button: Full gradient-lid primary button, 52px height, shadow-brand.
**Mobile — stacked:**
- Illustration at top, headline below, CTA below that.
- Floating tracking card hidden on mobile; replace with trust chips row.
### 2.4 Trust Bar
 
```
┌────────────────────────────────────────────────────────┐
│  bg: var(--hb-slate-900)  [dark strip, full width]    │
│                                                        │
│  [🔒 Verified riders]   [📍 Live tracking]   [✅ OTP] │
│  Background-checked      Map, start to end    Signed   │
│  before first delivery   no guessing          receipt  │
└────────────────────────────────────────────────────────┘
```
 
Specs:
- Background: `var(--hb-slate-900)`. Text: white.
- Each item: icon (24px, saffron-400) + bold label (14px white) + sub-label (12px slate-400).
- Three columns on desktop, stacked vertically with dividers on mobile.
- Height: 96px desktop, auto mobile.
### 2.5 How It Works
 
Three steps. Real sequence, not decoration — numbered because the order genuinely matters.
 
```
┌──────────────────────────────────────────────────────────────┐
│  How HomeBite works                                          │
│  [Fraunces 36px]                                             │
│                                                              │
│  ┌─────────────┐  ──→  ┌─────────────┐  ──→  ┌───────────┐ │
│  │ ①           │       │ ②           │       │ ③         │ │
│  │ You schedule│       │ Rider        │       │ They show │ │
│  │ a pickup    │       │ collects    │       │ the OTP   │ │
│  │ time        │       │ from your  │       │ & receive │ │
│  │             │       │ doorstep   │       │ your food │ │
│  │ [clock icon]│       │ [rider icon]│       │ [tiffin ✓]│ │
│  └─────────────┘       └─────────────┘       └───────────┘ │
│                                                              │
│  On each step card:                                          │
│  - Illustrated icon (60px, saffron-400)                      │
│  - Step number: Fraunces 72px, saffron-100, behind icon      │
│  - Title: Plus Jakarta Sans 18px 600                         │
│  - Body: 14px slate-600, 2 lines max                         │
└──────────────────────────────────────────────────────────────┘
```
 
Connector arrow between cards: `→` in saffron-300, hidden on mobile (stacked vertically).
 
### 2.6 Pricing Section
 
```
┌──────────────────────────────────────────────────────────────┐
│  Simple, honest pricing                                      │
│  No hidden fees. Pause anytime. Cancel anytime.              │
│                                                              │
│  ┌────────────┐  ┌────────────────────┐  ┌────────────────┐ │
│  │  Single    │  │  Weekly       ★    │  │  Monthly       │ │
│  │  Trip      │  │  Most popular      │  │  Best value    │ │
│  │            │  │                    │  │                │ │
│  │  ₹59       │  │  ₹299              │  │  ₹999          │ │
│  │  per trip  │  │  6 deliveries      │  │  26 deliveries │ │
│  │            │  │                    │  │  (~₹38/trip)   │ │
│  │ [Try once] │  │ [Start this week]  │  │ [Subscribe]    │ │
│  └────────────┘  └────────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```
 
Specs:
- "Weekly" card: has a `box-shadow: var(--shadow-xl)` and `border: 2px solid var(--hb-saffron-400)`. Slightly scaled up (`scale: 1.04`).
- Price: Fraunces 48px, slate-900.
- Unit label: 14px, slate-500.
- Each card includes: list of 3–4 features (checkmarks in saffron-400).
### 2.7 Footer
 
```
┌────────────────────────────────────────────────────────────┐
│  bg: var(--hb-slate-900)                                   │
│                                                            │
│  [🍱 HomeBite]              [Product]  [Company]  [Legal]  │
│  Making home food            How it works  About us  Terms │
│  distance-proof.             Pricing       Careers   Privacy│
│                              For Riders               FAQ  │
│                                                            │
│  Made with ❤ in India · © 2026 HomeBite Technologies      │
└────────────────────────────────────────────────────────────┘
```
 
---
 
## 3. Authentication Pages
 
**Routes:** `/auth/login`, `/auth/register`  
**Shared layout:** Centred card, max-width 440px, full-page gradient behind.
 
### 3.1 Page Background
 
```
Full viewport:
  background: linear-gradient(160deg,
    var(--hb-saffron-50) 0%,
    var(--hb-white) 50%,
    var(--hb-slate-50) 100%
  )
 
Dark mode:
  background: linear-gradient(160deg,
    rgba(240,128,0,0.08) 0%,
    var(--surface-page) 50%
  )
```
 
### 3.2 Auth Card
 
```
┌─────────────────────────────────────────┐
│                                         │
│              🍱 HomeBite                │
│     [Fraunces 24px, saffron-600]        │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Welcome back                           │
│  [h1, Fraunces 28px]                    │
│                                         │
│  Enter your phone number to log in      │
│  [body-md, slate-500]                   │
│                                         │
│  Mobile number                          │
│  ┌──────────────────────────────────┐  │
│  │ 🇮🇳 +91  │  98765 43210          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Send OTP →]   ← primary, full width   │
│                                         │
│  ─────────────────────────────────────  │
│  New to HomeBite? Register here         │
│  [text-link, slate-500 + saffron link]  │
│                                         │
└─────────────────────────────────────────┘
 
Card:
  background: var(--surface-card)
  border-radius: var(--radius-2xl)
  padding: 40px 36px
  box-shadow: var(--shadow-xl)
  border: 1px solid var(--border-default)
  max-width: 440px
  margin: 0 auto
```
 
### 3.3 OTP Verification Step
 
Appears inline in the same card after phone submission (animated slide-up of new content).
 
```
┌─────────────────────────────────────────┐
│                                         │
│   ← Back to phone number               │
│                                         │
│  Check your messages                    │
│  [Fraunces 26px]                        │
│                                         │
│  We sent a 6-digit code to             │
│  +91 98765 •••••                        │
│  [body-md, slate-500]                   │
│                                         │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │ 4│ │ 8│ │ 2│ │  │ │  │ │  │       │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘       │
│  [OTP digit inputs, auto-advance]       │
│                                         │
│  [Verify & continue →]  full-width btn  │
│                                         │
│  Resend code  ·  Expires in 09:43       │
│  [slate-400, resend active at 0:00]     │
│                                         │
└─────────────────────────────────────────┘
```
 
OTP input specs:
- 6 individual `<input type="tel" maxlength="1">` fields.
- Width: 48px, Height: 56px each. Gap: 8px.
- `border-radius: var(--radius-md)`.
- Active digit: `border-color: var(--border-focus)` with focus glow.
- Filled digit: background saffron-50.
- Auto-advance to next on input. Backspace returns to previous.
- On mobile: numeric keyboard opens.
- On paste: distributes digits across all 6 inputs automatically.
Countdown timer: Shown as `MM:SS`. When reaches 00:00, "Resend code" activates and timer hides.
 
### 3.4 Registration — Role & Name Step
 
Appears after first OTP verification for new users.
 
```
┌─────────────────────────────────────────┐
│                                         │
│  One last step                          │
│  [Fraunces 26px]                        │
│                                         │
│  What's your name?                      │
│  ┌──────────────────────────────────┐  │
│  │  Priya Mehta                     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  I am joining as a…                    │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ 👩 Sender    │  │ 🎓 Receiver  │   │
│  │ I send food  │  │ I receive    │   │
│  │ to my family │  │ food at work │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  [Create account →]   full-width btn   │
│                                         │
└─────────────────────────────────────────┘
```
 
Role selector cards:
- Width: equal 50/50. Height: 100px.
- Unselected: `border: 1.5px solid var(--border-default)`, `background: var(--surface-card)`.
- Selected: `border: 2px solid var(--brand-primary)`, `background: var(--hb-saffron-50)`. Inner checkmark badge top-right.
- "Rider" option deliberately not shown here — riders are onboarded by Admin only.
---
 
## 4. Sender Dashboard
 
**Route:** `/sender`  
**Purpose:** Overview of all receivers, today's delivery status, quick actions.
 
### 4.1 Shell Layout
 
```
Desktop:
┌──────────────────────────────────────────────────────────────┐
│  [Gradient lid bar — 4px, full width]                        │
├──────────┬───────────────────────────────────────────────────┤
│  SIDE    │  TOP BAR                                          │
│  NAV     │  "Good morning, Priya 👋"          [🔔] [Avatar] │
│  240px   ├───────────────────────────────────────────────────┤
│          │  MAIN CONTENT                                     │
│  🏠 Home │                                                   │
│  📦 Orders│                                                  │
│  👤 Receivers│                                               │
│  💳 Plans │                                                  │
│  ⚙ Profile│                                                  │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
 
Mobile: Bottom tab bar (Home, Orders, Receivers, Profile)
```
 
Gradient lid bar: Height 4px. `background: var(--gradient-lid)`. Spans 100% width. Fixed at top.
 
### 4.2 Dashboard Home Content
 
```
┌──────────────────────────────────────────────────────────┐
│  GREETING + DATE                                         │
│  Good morning, Priya                  Friday, 27 Jun     │
│  [h1, Fraunces 28px]                  [label-md, slate]  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  QUICK STATS ROW (4 metric cards)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Active   │ │ Today    │ │ This     │ │ Wallet     │ │
│  │ Plans    │ │ Status   │ │ Month    │ │ Balance    │ │
│  │          │ │          │ │          │ │            │ │
│  │    2     │ │ ✓ Deliv. │ │ 18/20   │ │  ₹225      │ │
│  │ [Fraunces│ │ [green]  │ │ meals   │ │ [credits]  │ │
│  │  36px]   │ │          │ │         │ │            │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  TODAY'S DELIVERIES                                      │
│  "Today"                           [See all history →]  │
│  [h2, Fraunces 22px]                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ● IN TRANSIT                                     │   │
│  │ Arjun Mehta · IIT Hostel, Powai                  │   │
│  │ Raju Sharma · ★ 4.8 · ETA 11 min                │   │
│  │                            [Track live →]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ✓ DELIVERED                                      │   │
│  │ Raj (Husband) · Cyber City, Gurgaon              │   │
│  │ Delivered at 12:44 PM                            │   │
│  │                               [Rate rider →]     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  RECEIVERS                                               │
│  "Your family members"              [+ Add receiver]    │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ 👦 Arjun Mehta       │  │ 👨 Raj Mehta             │ │
│  │ Son · Powai, Mumbai  │  │ Husband · Gurgaon, Delhi │ │
│  │ Monthly plan ✓ Active│  │ Weekly plan ✓ Active     │ │
│  │ [Manage]  [Track]    │  │ [Manage]  [Track]        │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Today's delivery card specs:
- Left border: 3px solid `status color`.
- Status badge at top-left.
- Receiver name: `--text-h4` Jakarta Sans.
- Rider row: avatar (32px) + name + star rating in one line.
- "Track live" button: Ghost, compact (36px height).
- Card hover: lifts with shadow-md.
Receiver mini-cards:
- Two columns on desktop, single column on mobile.
- Plan status: coloured dot + text ("Monthly · 18 days left").
- "Add receiver" button: dashed border card with + icon — acts as the 6th slot indicator.
### 4.3 Delivery History View
 
**Route:** `/sender/orders`
 
```
┌──────────────────────────────────────────────────────────┐
│  Delivery history                    [Filter ▼] [Export] │
│  [h1, Fraunces 28px]                                     │
│                                                          │
│  [Tab row: All  |  Delivered  |  Failed  |  In transit] │
│  [Tab underline: saffron-500 on active]                  │
│                                                          │
│  JUNE 2026                                               │
│  [Month group label: label-sm, slate-400, uppercase]     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Fri 27  Arjun  ● IN TRANSIT      ETA: 11 min    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Thu 26  Arjun  ✓ DELIVERED       11:44 AM  ★ 5  │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Wed 25  Arjun  ✓ DELIVERED       11:38 AM  ★ 5  │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Tue 24  Arjun  ✗ FAILED          Rider absent    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Load more]                                             │
└──────────────────────────────────────────────────────────┘
```
 
Row specs: 56px height. Date (mono-sm), receiver name, status badge, time/ETA at right edge. Tap to expand inline for detail.
 
---
 
## 5. Create Delivery Pages
 
**Routes:** `/sender/subscriptions/new` (4-step flow)  
**Pattern:** Linear multi-step wizard with a progress indicator.
 
### 5.1 Progress Indicator
 
```
┌──────────────────────────────────────────────────────────┐
│  ①──────────②──────────③──────────④                     │
│  Receiver  Schedule   Plan      Payment                  │
│                                                          │
│  Step indicator:                                         │
│  - Completed: filled circle (saffron-500), check icon   │
│  - Active: filled circle (saffron-500) with pulse ring  │
│  - Upcoming: empty circle, border slate-300             │
│  - Connector line: slate-200 → saffron-500 (progress)  │
└──────────────────────────────────────────────────────────┘
```
 
Back/Next navigation:
- "Back" Ghost button (left). "Continue →" Primary button (right).
- Both in a sticky footer bar on mobile (fixed bottom 64px + safe area).
### 5.2 Step 1 — Choose Receiver
 
```
┌──────────────────────────────────────────────────────────┐
│  Who are you sending food to?                            │
│  [Fraunces 26px]                                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ● Arjun Mehta                                    │   │
│  │   Son · IIT Hostel, Powai                        │   │
│  │   No active plan                                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Raj Mehta                                      │   │
│  │   Husband · Cyber City, Gurgaon                  │   │
│  │   ✓ Weekly plan active — tap to manage instead   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ + Add a new receiver                             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│                                    [Continue →]          │
└──────────────────────────────────────────────────────────┘
```
 
Selection: Radio-style cards. Selected: `border: 2px solid saffron-500`, `background: saffron-50`. Receiver with active plan is shown greyed with a tooltip "Already has an active plan."
 
### 5.3 Step 2 — Set Schedule
 
```
┌──────────────────────────────────────────────────────────┐
│  When should we pick up?                                 │
│  [Fraunces 26px]                                         │
│                                                          │
│  Pickup address (your home)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 42, Pali Hill Road, Bandra West, Mumbai 400050   │   │
│  │ [Edit]                                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Pickup time window                                      │
│  "We'll arrive within this 30-minute slot"               │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ 09:00  │ │ 10:00  │ │ 11:00  │ │ 12:00  │           │
│  │ – 9:30 │ │ –10:30 │ │ –11:30 │ │ –12:30 │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│             [2 more slots ▼]                             │
│                                                          │
│  Delivery days                                           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                  │
│  │Mon│ │Tue│ │Wed│ │Thu│ │Fri│ │Sat│                  │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                  │
│  (Mon–Fri selected by default, tap to toggle)            │
│                                                          │
│  [Back]                              [Continue →]        │
└──────────────────────────────────────────────────────────┘
```
 
Time slot chips: 100px × 56px. Selected: gradient-lid background, white text. Unselected: card background, slate-600.
 
Day toggle chips: 44px × 44px circles. Selected: saffron-500 fill. Sun is not shown (not available).
 
### 5.4 Step 3 — Choose Plan
 
```
┌──────────────────────────────────────────────────────────┐
│  Choose your plan                                        │
│  [Fraunces 26px]                                         │
│                                                          │
│  Starting Monday, 30 June 2026                           │
│  [body-md, slate-500]                                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Single trip                          ₹59        │   │
│  │  One delivery · Perfect to try                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ● Monthly plan                       ₹999/month  │   │
│  │  26 weekday deliveries               ★ Best value │   │
│  │  ≈ ₹38 per delivery · Pause anytime              │   │
│  │  ✓ Live tracking  ✓ OTP confirmed  ✓ History      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Weekly pass                         ₹299/week   │   │
│  │  6 deliveries over one week                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Cancellation: 50% refund before day 15.                 │
│  Pause: free, anytime. Roll forward, no loss.            │
│                                                          │
│  [Back]                              [Continue →]        │
└──────────────────────────────────────────────────────────┘
```
 
### 5.5 Step 4 — Payment & Confirmation
 
```
┌──────────────────────────────────────────────────────────┐
│  Review & pay                                            │
│  [Fraunces 26px]                                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ORDER SUMMARY                                   │   │
│  │  Receiver:  Arjun Mehta (Son)                    │   │
│  │  Pickup:    11:00 – 11:30 AM, Mon–Fri            │   │
│  │  Plan:      Monthly (26 deliveries)               │   │
│  │  Starts:    Monday, 30 June 2026                  │   │
│  │  ─────────────────────────────────               │   │
│  │  Total:     ₹999.00                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Pay ₹999 with UPI/Card →]   ← Opens Razorpay modal    │
│                                                          │
│  Secured by Razorpay  [🔒 icon]                         │
│  By paying, you agree to our Terms of Service.           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
### 5.6 Success Screen
 
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│           [Animated checkmark — saffron-500]             │
│                                                          │
│       Your subscription is active!                       │
│       [Fraunces 32px, center]                            │
│                                                          │
│   Arjun will get his first tiffin on                     │
│   Monday, 30 June at 11:00 – 11:30 AM                   │
│   [body-lg, slate-600, center]                           │
│                                                          │
│   We'll notify you the moment a rider is assigned        │
│   and again when the food is delivered.                  │
│                                                          │
│   [Go to dashboard →]   [Add another receiver]          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Animation: SVG checkmark draws in with stroke-dashoffset (400ms). Circle scales from 0.8→1 (spring easing). Confetti: 6 small tiffin-orange and rust squares scatter outward from the checkmark on completion.
 
---
 
## 6. Track Delivery Pages
 
**Routes:** `/sender/track/[jobId]`, `/receiver/track/[jobId]`  
**Purpose:** Live GPS tracking with status timeline.
 
### 6.1 Sender Track View
 
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                Arjun's tiffin           [Share]  │
│                        Today · 11:00–11:30 AM             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │          [GOOGLE MAPS EMBED — 320px]             │   │
│  │                                                  │   │
│  │    [House pin]                                   │   │
│  │       - - - - [Rider dot] - - -                  │   │
│  │                              [Hostel pin]        │   │
│  │                                                  │   │
│  │  ┌─────────────────────┐                        │   │
│  │  │ 🏍  ETA  11 min     │  ← floating chip       │   │
│  │  └─────────────────────┘                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  RIDER CARD                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Avatar 48px]  Raju Sharma         ★ 4.8       │   │
│  │  Honda Activa · MH02 AB1234                      │   │
│  │                                                  │   │
│  │  📦 Picked up at 11:06 AM from your address     │   │
│  │  📍 Currently near Khar Station                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  STATUS TIMELINE                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ✓  Subscription activated          Jun 1        │   │
│  │  ✓  Rider assigned                  Yesterday    │   │
│  │  ✓  Picked up from your home        11:06 AM ●   │   │
│  │  ○  In transit                      ← now        │   │
│  │  ○  Delivered to Arjun                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Rate yesterday's delivery instead →]  ← ghost link     │
└──────────────────────────────────────────────────────────┘
```
 
Status timeline specs:
- Vertical line connecting nodes. Completed: saffron-400. Active: animated pulse. Pending: slate-200.
- Timeline node: 10px circle. Completed: saffron-500 fill. Active: saffron-500 with expanding ring. Pending: white + border.
Real-time updates: Socket.IO `gps:broadcast` event updates the rider marker position. Smooth interpolated movement between coordinates (CSS `transition: transform 400ms ease-decelerate` on marker).
 
### 6.2 Receiver Track View
 
Identical map and rider card, but:
- Shows OTP section below rider card when status is `IN_TRANSIT`.
- Does not show pickup address or sender name.
```
│  YOUR OTP                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │   [gradient-lid background]                      │   │
│  │                                                  │   │
│  │   Show this to your rider                        │   │
│  │                                                  │   │
│  │    ┌────┐ ┌────┐ ┌────┐ ┌────┐                 │   │
│  │    │  7 │ │  4 │ │  2 │ │  9 │                 │   │
│  │    └────┘ └────┘ └────┘ └────┘                 │   │
│  │                                                  │   │
│  │    [════════════════════ progress bar]           │   │
│  │    Expires in  3h 42m                           │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
```
 
### 6.3 Delivered State
 
After delivery is confirmed:
 
```
│           ✓ Delivered!                                    │
│    Your tiffin arrived at 11:44 AM                        │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │  How was Raju's delivery?                         │   │
│  │                                                   │   │
│  │  ☆ ☆ ☆ ☆ ☆   [star rating tap area]             │   │
│  │                                                   │   │
│  │  [Write a note]  ← optional textarea              │   │
│  │                                                   │   │
│  │  [Submit rating]                                  │   │
│  └───────────────────────────────────────────────────┘   │
```
 
Stars: 36px each, 8px gap. Tap selects and animates fill from left to right (scale spring). Selected: star-filled (saffron-400). Empty: star-empty (slate-200).
 
---
 
## 7. Receiver Dashboard
 
**Route:** `/receiver`
 
```
┌──────────────────────────────────────────────────────────┐
│  [Gradient lid bar]                                      │
│  Hi, Arjun 👋                          [🔔]  [Avatar]   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  TODAY'S TIFFIN                                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │   From Priya Mehta (Mom)                         │   │
│  │   [Fraunces 22px, slate-900]                     │   │
│  │                                                  │   │
│  │   [MINI MAP — 180px height]                      │   │
│  │   Rider: Raju · ETA 11 min                       │   │
│  │                                                  │   │
│  │   [Track live →]                                 │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  YOUR OTP                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [gradient card with 4-digit OTP]                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  PAST DELIVERIES                                         │
│  This month: 18 meals from Priya Mehta                   │
│                                                          │
│  [calendar heatmap: 26 cells, green if delivered]        │
│  Mon Tue Wed Thu Fri                                     │
│  ●   ●   ●   ●   ●   Week 1                             │
│  ●   ●   ●   ●   ●   Week 2                             │
│  ●   ●   ●   ●   ✗   Week 3  ← failed day (red)         │
│  ●   ●   ○   ○   ○   This week (upcoming = empty)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Calendar heatmap: Each cell 32×32px. Delivered: `hb-green-500`. Failed: `hb-red-400`. Upcoming: `hb-slate-200`. Today: ring border saffron-400. Tap a cell for date detail.
 
No active delivery state: Full-card illustration of a tiffin with text "No delivery today. Ask your family to schedule one for you." + a "Share HomeBite" button.
 
---
 
## 8. Rider Dashboard
 
**Route:** `/rider`  
**Design priority:** Fast scanning, zero ambiguity, large tap targets. Riders use this on 5-inch Android phones, often one-handed, sometimes while waiting at a pickup point.
 
### 8.1 Rider Home — Job List
 
```
┌──────────────────────────────────────────────────────────┐
│  [Gradient lid bar]                                      │
│  Today's jobs                         [🗺 Map view]     │
│  Friday, 27 June                       6 jobs · ₹300    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  EARNINGS STRIP                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Done    │  │ Pending  │  │ Today    │               │
│  │   4     │  │    2     │  │  ₹200    │               │
│  └─────────┘  └──────────┘  └──────────┘               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │  11:00–11:30 AM  ·  IN TRANSIT                   │   │
│  │                                                   │   │
│  │  PICKUP:  42 Pali Hill, Bandra      [navigate]   │   │
│  │  DROP:    IIT Hostel, Powai         [navigate]   │   │
│  │                                                   │   │
│  │  For: Arjun Mehta (Son of Priya)                 │   │
│  │  Distance: 11.2 km                               │   │
│  │                                                   │   │
│  │  [Enter OTP to deliver →]    ← primary large btn │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  11:00–11:30 AM  ·  ASSIGNED                     │   │
│  │                                                   │   │
│  │  PICKUP:  12 Linking Rd, Bandra     [navigate]   │   │
│  │  DROP:    Andheri West, Veera       [navigate]   │   │
│  │                                                   │   │
│  │  For: Deepika Sharma (Wife of Raj)               │   │
│  │                                                   │   │
│  │  [Mark Picked Up →]          ← primary btn       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Show 4 more jobs ▼]                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Job card specs:
- Height: auto (approx 140px). Full width. `border-radius: var(--radius-lg)`.
- Left status stripe: 4px wide, full height, status color.
- Primary action button: 52px, full width within card. Gradient-lid.
- "Navigate" link: Opens Google Maps deep link. Ghost, compact.
- Cards sorted: In-transit first, then Assigned (by pickup cluster), then Delivered at bottom (collapsed, tap to expand).
### 8.2 OTP Entry Screen
 
Appears when rider taps "Enter OTP to deliver" on an IN_TRANSIT job:
 
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                   Delivering to Arjun Mehta     │
│                            IIT Hostel, Powai             │
│                                                          │
│  Ask the receiver for their 4-digit code                 │
│  [body-lg, center, slate-600]                            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │ │
│  │  │      │  │      │  │      │  │      │          │ │
│  │  │      │  │      │  │      │  │      │          │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘          │ │
│  │  [large OTP input — 72px digits, numeric kbd]      │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Confirm delivery →]        ← full-width primary btn   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  Can't get the OTP?                                      │
│  [Contact support]     [Mark as failed]                  │
│  [ghost links, slate-500]                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Wrong OTP feedback: Cards shake (translateX keyframe: 0→-8px→8px→-4px→4px→0, 300ms). Counter updates: "2 attempts remaining."
 
### 8.3 Delivery Confirmed Screen
 
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   [Animated checkmark — large, saffron-500]             │
│                                                          │
│   Delivered!                                             │
│   [Fraunces 40px, center]                                │
│                                                          │
│   ₹50 added to your wallet                              │
│   [h3, green-500, center]                                │
│                                                          │
│   Arjun Mehta · IIT Hostel, Powai                       │
│   11:44 AM                                               │
│                                                          │
│   [Next job →]   or   [All done for now]                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
### 8.4 Rider Earnings Page
 
**Route:** `/rider/earnings`
 
```
┌──────────────────────────────────────────────────────────┐
│  Your earnings                                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │   WALLET BALANCE                                 │   │
│  │   ₹300.00 pending                                │   │
│  │   [Fraunces 48px, saffron-600]                   │   │
│  │                                                  │   │
│  │   [Request payout →]  Available after 6:00 PM   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐                     │
│  │ Today  │  │ Week   │  │ Month  │                     │
│  │ ₹300   │  │ ₹1,850 │  │ ₹8,400 │                    │
│  └────────┘  └────────┘  └────────┘                     │
│                                                          │
│  TODAY'S BREAKDOWN                                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Arjun Mehta · 11.2 km       ₹50  ✓ Delivered  │   │
│  │  Deepika Sharma · 8.4 km     ₹45  ✓ Delivered  │   │
│  │  [+ 4 more]                                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  PAYOUT HISTORY                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Jun 26   ₹1,925  IMPS  UTR: 2606123456  ✓     │   │
│  │  Jun 25   ₹2,100  IMPS  UTR: 2505987654  ✓     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
---
 
## 9. Profile Pages
 
**Routes:** `/sender/profile`, `/receiver/profile`, `/rider/profile`
 
### 9.1 Profile View
 
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                Profile                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Avatar 80px]   Priya Mehta                     │   │
│  │  [Edit photo]    +91 98765 •••••                 │   │
│  │                  SENDER · since May 2026          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ACCOUNT                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Full name          Priya Mehta        [Edit]    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Mobile             +91 98765 •••••              │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  HomeBite wallet    ₹225.00 credits    [Use]     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  PREFERENCES                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Dark mode                     [toggle]          │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Notifications                 [Manage →]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  SUPPORT                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Help & FAQs                            [→]      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Terms of Service                       [→]      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Privacy Policy                         [→]      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Log out]   ← Ghost button, slate-600, center          │
│                                                          │
│  v1.0.0 · HomeBite Technologies Pvt. Ltd.               │
│  [label-xs, slate-300, center]                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
List row specs: Height 52px. Label (body-md, slate-900) left. Value or action right. Row tap state: background saffron-50.
 
Toggle: iOS-style pill toggle. Off: slate-300. On: gradient-lid. Width 44px, height 26px.
 
### 9.2 Receiver Management (Sender)
 
**Route:** `/sender/receivers`
 
```
┌──────────────────────────────────────────────────────────┐
│  My receivers                          [+ Add receiver]  │
│  [Fraunces 24px]                                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Avatar]  Arjun Mehta                           │   │
│  │            Son · IIT Hostel, Powai               │   │
│  │            Monthly plan · 8 days remaining       │   │
│  │                                                  │   │
│  │  [Manage plan]  [Edit profile]  [⋯ More]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Avatar]  Raj Mehta                             │   │
│  │            Husband · Cyber City, Gurgaon         │   │
│  │            Weekly pass · Renews Mon 30 Jun       │   │
│  │                                                  │   │
│  │  [Manage plan]  [Edit profile]  [⋯ More]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  + Add a receiver                               │   │
│  │  Send food to someone new                       │   │
│  └──────────────────────────────────────────────────┘   │
│  (3 of 5 slots used)                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
"⋯ More" opens a bottom sheet with: Pause deliveries / View history / Delete profile.
 
### 9.3 Subscription Manage Screen
 
**Route:** `/sender/subscriptions/[id]`
 
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                Arjun's plan                     │
│                                                          │
│  PLAN STATUS                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ✓ ACTIVE                                        │   │
│  │  Monthly plan · ₹999/month                       │   │
│  │  Jun 2 → Jul 4, 2026                             │   │
│  │  18 of 26 deliveries used                        │   │
│  │  ████████████░░░░░  [progress bar, saffron]      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  SCHEDULE                                                │
│  Pickup: 11:00 – 11:30 AM, Mon–Fri                      │
│  From: 42 Pali Hill Road, Bandra West                    │
│                                                          │
│  UPCOMING PAUSES                                         │
│  Sat 28 – Sun 29 Jun (2 days)   [Remove]                │
│                                                          │
│  [+ Pause more days →]                                  │
│                                                          │
│  ACTIONS                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Cancel subscription]    ← red destructive btn  │   │
│  │  50% refund if cancelled before Jul 2            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Progress bar: `height: 8px`, `border-radius: full`, `background: saffron-500` over `saffron-100`. Animated fill on mount.
 
Pause calendar: Calendar picker in bottom sheet. Tap range to select. Paused dates highlighted in rust-100.
 
---
 
## 10. Admin Dashboard
 
**Route:** `/admin`  
**Audience:** Operations team, not public. Information density is prioritised.  
**Design adjustment:** Admin uses the same type system and tokens, but sidebar is always visible (minimum viewport 1024px), cards are denser, and tables replace card-based layouts.
 
### 10.1 Admin Shell
 
```
┌──────────┬───────────────────────────────────────────────┐
│ SIDE NAV │  TOP BAR                                       │
│ 240px    │  [Search jobs, riders...] [🔔 4] [Avatar]     │
│          ├───────────────────────────────────────────────┤
│ 🗺 Live  │                                                │
│ 📋 Jobs  │  MAIN CONTENT                                  │
│ 🙋 Riders│                                                │
│ ⚖ Disputes│                                               │
│ 📊 Analytics│                                             │
│ ⚙ Settings│                                               │
│          │                                                │
│ Status:  │                                                │
│ ● Online │                                                │
│ v1.0.0   │                                                │
└──────────┴───────────────────────────────────────────────┘
```
 
Alert badge on "Disputes": Count of open disputes. Red circle, white number.
 
### 10.2 Live Operations Map
 
**Route:** `/admin` (default tab)
 
```
┌──────────────────────────────────────────────────────────┐
│  ALERT STRIP (if issues exist)                           │
│  ⚠ 2 jobs unassigned — pickup in 90 min   [Assign now]  │
│  [amber-100 bg, amber-700 text, full width]              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STAT ROW                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Active   │ │ In       │ │ Delivered│ │ Failed   │   │
│  │ Today    │ │ Transit  │ │ Today    │ │ Today    │   │
│  │ 84       │ │ 12       │ │ 66       │ │ 2        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  LIVE MAP                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  [Google Maps — full width, 500px height]        │   │
│  │                                                  │   │
│  │  🟠  Rider markers (moving, animated)            │   │
│  │  🔵  Assigned (pickup point)                     │   │
│  │  🟢  Delivered (faded, small)                    │   │
│  │  🔴  Failed (attention)                          │   │
│  │                                                  │   │
│  │  [Zone filter chips: All | MUM-BANDRA | ...]    │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  JOB CLICK DETAIL (side panel, slides in from right)     │
│  ┌──────────────────────────────┐                        │
│  │ Job #f1      IN TRANSIT     │                        │
│  │ Rider: Raju Sharma ★4.8    │                        │
│  │ From: Priya M.              │                        │
│  │ To: Arjun M, Powai          │                        │
│  │ ETA: 11 min                 │                        │
│  │ [Reassign] [View detail →]  │                        │
│  └──────────────────────────────┘                        │
└──────────────────────────────────────────────────────────┘
```
 
### 10.3 Jobs Table
 
**Route:** `/admin/jobs`
 
```
┌──────────────────────────────────────────────────────────┐
│  All jobs                            [Filter ▼] [Export] │
│                                                          │
│  FILTER BAR                                              │
│  Status: [All ▼]  Date: [Today ▼]  Zone: [All ▼]        │
│  Rider: [All ▼]   [Search by sender/receiver...]         │
│                                                          │
│  TABS                                                    │
│  [All 84]  [Needs attention 2]  [In transit 12]         │
│  [Delivered 66]  [Failed 2]                             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ DATE     SENDER        RECEIVER    RIDER   STATUS │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Jun 27   Priya Mehta   Arjun M.   Raju S  ●     │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Jun 27   Sunita K.     Rohan K.   Vikram N ✓    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Jun 27   Meena R.      Neha R.    [unassigned]   │   │
│  │                                   [Assign →]     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Showing 1–20 of 84  [← 1  2  3  4  5 →]               │
└──────────────────────────────────────────────────────────┘
```
 
Table specs:
- Row height: 52px. Zebra striping: odd rows `surface-card`, even rows `surface-page`.
- Status column: badge (same component as everywhere else).
- "Needs attention" rows: amber-50 row background. `⚠` icon in status cell.
- Clickable rows: expand to inline detail, or open side drawer.
- Bulk select (checkboxes at left) → bulk assign action appears in floating action bar at bottom.
### 10.4 Dispute Resolution Panel
 
**Route:** `/admin/disputes`
 
```
┌──────────────────────────────────────────────────────────┐
│  Disputes                                                │
│  [Filter: Open | Under Review | Resolved]               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ DISPUTE #1a1 · OPEN         Jun 24 · RIDER_NO_SHOW│  │
│  │                                                  │   │
│  │ Sender: Priya Mehta · "Rider didn't come"        │   │
│  │ Rider: Raju Sharma · "No one answered"           │   │
│  │ GPS: Rider never within 500m of drop address     │   │
│  │                                                  │   │
│  │ [View GPS trail]   [Full details →]              │   │
│  │                    [Resolve →]                   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```
 
Dispute detail drawer (right-side):
 
```
┌──────────────────────────────────┐
│ Dispute #1a1              [Close] │
│ RIDER_NO_SHOW (GPS classified)   │
│                                  │
│ [MAP: GPS trail plotted]         │
│ Closest approach: 820m           │
│                                  │
│ TIMELINE                         │
│ 11:00 Job started                │
│ 11:55 Rider flagged "no one home"│
│                                  │
│ OTP attempts: 0                  │
│                                  │
│ RESOLUTION                       │
│ ○ Full refund (₹999)             │
│ ○ Partial refund [____]          │
│ ○ No refund                      │
│ ○ Reschedule                     │
│                                  │
│ Admin note:                      │
│ [textarea]                       │
│                                  │
│ [Confirm resolution →]           │
└──────────────────────────────────┘
```
 
### 10.5 Rider Management
 
**Route:** `/admin/riders`
 
```
┌──────────────────────────────────────────────────────────┐
│  Riders                [+ Onboard rider]  [Filter ▼]    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [Avatar] Raju Sharma        ★ 4.8   ACTIVE ●    │   │
│  │          MUM-BANDRA · Bike · VERIFIED            │   │
│  │          42 deliveries this month                │   │
│  │          [View] [Manage status ▼]               │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ [Avatar] Meena Pillai       ★ 3.4   UNDER REVIEW│   │
│  │          MUM-ANDHERI · Scooter · VERIFIED        │   │
│  │          ⚠ 7 consecutive low ratings             │   │
│  │          [View] [Manage status ▼]               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
`UNDER_REVIEW` rows: amber-50 background. Status badge: amber.
 
### 10.6 Analytics Dashboard
 
**Route:** `/admin/analytics`
 
```
┌──────────────────────────────────────────────────────────┐
│  Analytics          [Date range ▼]  [Export CSV]         │
│  Jun 1 – Jun 27, 2026                                    │
│                                                          │
│  REVENUE                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Gross revenue: ₹4,87,620       [line chart →]    │   │
│  │ Platform take: ₹87,772 (18%)                     │   │
│  │ Avg. order:   ₹937.73                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Daily revenue line chart — 28 data points]             │
│  [saffron-400 line, filled with saffron-50 below]        │
│                                                          │
│  SUBSCRIPTIONS                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Active     │ │ New this   │ │ Churn      │           │
│  │ 2,018      │ │ month 134  │ │ rate 1.8%  │           │
│  └────────────┘ └────────────┘ └────────────┘           │
│                                                          │
│  [Donut chart: SINGLE 0.6% / SEVEN_DAY 15.1% / MONTHLY 84.3%] │
│                                                          │
│  DELIVERY SUCCESS BY ZONE                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ MUM-BANDRA     98.1%  ████████████████████░      │   │
│  │ MUM-ANDHERI    96.8%  ███████████████████░░      │   │
│  │ MUM-POWAI      97.4%  ███████████████████░░      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
 
Chart specs:
- Line chart: Recharts / Chart.js. Y-axis: revenue in ₹. X-axis: dates. Tooltip: show exact value + day.
- Donut chart: 3 segments (SINGLE, SEVEN_DAY, MONTHLY). saffron-200 / saffron-500 / rust-500.
- Zone bar chart: Horizontal bars. saffron-400 fill. Width proportional to success rate. Percentages right-aligned.
---
 
## 11. Shared UI Patterns
 
### 11.1 Notification Bell & Drawer
 
```
Bell icon (top-right, all authenticated screens):
  [🔔] with red badge (count) when unread exist
 
Notification drawer (full-screen mobile, 480px side-panel desktop):
┌──────────────────────────────────────────────────┐
│  Notifications                [Mark all read]    │
│                                                  │
│  TODAY                                           │
│  ┌──────────────────────────────────────────────┐│
│  │ ✓ Tiffin delivered to Arjun  · 11:44 AM     ││
│  │   IIT Hostel, Powai · Raju Sharma            ││
│  └──────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────┐│
│  │ 📦 Rider picked up from home  · 11:06 AM    ││
│  │   Raju Sharma is on his way                  ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  YESTERDAY                                       │
│  [collapsed, tap to expand]                      │
└──────────────────────────────────────────────────┘
```
 
Unread notifications: white background. Read: slate-50 background. Row height: auto (min 64px).
 
### 11.2 Bottom Sheet
 
Used for: pause picker, action menus, "⋯ More" on receiver cards.
 
```
[Overlay: rgba(0,0,0,0.5) backdrop, tap to dismiss]
 
┌──────────────────────────────────────────────────┐
│   ────  [drag handle]                            │
│                                                  │
│  [Content varies — action list or form]          │
│                                                  │
│                                [Cancel]          │
└──────────────────────────────────────────────────┘
 
Animation: slides up from bottom (translateY(100%→0))
border-radius: var(--radius-2xl) top-left and top-right only
background: var(--surface-card)
max-height: 85vh, overflow-y: auto
```
 
### 11.3 Confirmation Dialogs
 
```
┌──────────────────────────────────────────────────┐
│  [surface-card, border-radius xl, shadow-xl]     │
│  Max-width: 400px, centered                      │
│                                                  │
│  Cancel subscription?                            │
│  [h3, Fraunces]                                  │
│                                                  │
│  You'll receive a 50% refund (₹225) credited    │
│  to your HomeBite wallet.                        │
│  [body-md, slate-600]                            │
│                                                  │
│  [Keep subscription]  [Yes, cancel]              │
│  [secondary / outlined]  [destructive]           │
│                                                  │
└──────────────────────────────────────────────────┘
```
 
### 11.4 Toast Notifications
 
```
Position: bottom-center (mobile), top-right (desktop)
Width: 360px max, auto-height
border-radius: var(--radius-lg)
box-shadow: var(--shadow-xl)
 
Types:
  Success: left border 4px green-500, ✓ icon
  Error:   left border 4px red-500,   ✗ icon
  Info:    left border 4px saffron-400, ℹ icon
 
Auto-dismiss: 4 seconds. Progress bar at bottom depletes.
Dismiss: tap × or swipe down.
```
 
### 11.5 Loading States
 
**Skeleton screens** (not spinners) for list content:
 
```
Skeleton line:
  background: linear-gradient(90deg,
    var(--hb-slate-100) 0%,
    var(--hb-slate-200) 50%,
    var(--hb-slate-100) 100%
  )
  background-size: 200% 100%
  animation: shimmer 1.4s ease-in-out infinite
 
Dark mode: slate-800 → slate-700 → slate-800
```
 
Button loading: spinner (20px) replaces text. Width locked to prevent layout shift.
 
Page transitions: `opacity: 0 → 1` + `translateY: 6px → 0px` in 200ms on route change.
 
---
 
## 12. Empty & Error States
 
### 12.1 Empty States
 
Every empty screen acts as a directive, not a dead end.
 
**No deliveries today (Sender):**
```
[Illustration: tiffin with dotted outline, not filled]
"Nothing scheduled today"
"Your next delivery is on Monday."
[body-md, slate-500, center]
[Schedule a delivery →]
```
 
**No receivers yet:**
```
[Illustration: empty address card]
"Add the first person you cook for"
"Once you add a receiver, you can start scheduling deliveries."
[+ Add a receiver]
```
 
**No deliveries this month (Receiver):**
```
[Illustration: tiffin at rest]
"No tiffins yet this month"
"Ask your family to set up a HomeBite plan for you."
[Share HomeBite with family →]
```
 
**Admin — no disputes:**
```
[Illustration: balance scale, balanced]
"All clear"
"No open disputes."
[label-md, slate-400]
```
 
Illustration style: Simple, flat, using brand colors. SVG. Not photographs. Max dimensions: 120×120px.
 
### 12.2 Error States
 
**Network error:**
```
[Icon: wifi off, slate-400, 48px]
"No connection"
"Check your internet and try again."
[Retry]
```
 
**GPS unavailable on tracking screen:**
```
[Map shows last known position, greyed]
[Banner over map:]
"Location updating…  Last seen 2 min ago"
[amber-100 background, amber-700 text]
```
 
**OTP locked:**
```
[Icon: lock, red-400, 48px]
"OTP locked"
"Too many incorrect attempts. Contact HomeBite support."
[Contact support] [Call rider]
```
 
**Payment failed:**
```
[Icon: credit card ✗, red-400]
"Payment failed"
"Your card was not charged. Check your payment details and try again."
[Try again] [Use a different method]
```
 
**404 page:**
```
[Full-page, centered]
[Fraunces 120px "404", saffron-100, light]
"This page went missing"
"Like a tiffin without a rider."
[Go home →]
```
 
---
 
## 13. Notification Patterns
 
### 13.1 Push Notification Visual Templates
 
All push notifications carry HomeBite's orange icon (🍱 on white circle background).
 
| Trigger | Title | Body |
|---|---|---|
| Rider assigned | "Rider assigned for Arjun" | "Raju Sharma will pick up tomorrow at 11:00 AM." |
| Tiffin picked up | "Tiffin picked up 📦" | "Raju Sharma is on his way to IIT Hostel. Track now." |
| Tiffin delivered | "Delivered ✓" | "Arjun's tiffin arrived at 11:44 AM. Rate your rider?" |
| 10 min away (Receiver) | "Almost there 🏍" | "Your tiffin is 10 minutes away. Head to the gate." |
| Delivery failed | "Delivery attempt failed" | "Arjun's tiffin couldn't be delivered. Tap for details." |
| Subscription expiring | "Plan expiring soon" | "Arjun's monthly plan expires in 3 days. Renew now." |
| Payout processed (Rider) | "₹300 credited ✓" | "Your earnings have been transferred to your bank account." |
 
### 13.2 In-App Notification Anatomy
 
```
┌──────────────────────────────────────────────────┐
│  [Status icon 24px]                              │
│                                                  │
│  [Title — label-lg, text-primary]    [Time]      │
│  [Body — body-sm, text-secondary]                │
│                                                  │
│  [Action link if applicable — saffron-600]       │
└──────────────────────────────────────────────────┘
```
 
### 13.3 SMS Template Copy
 
| Template ID | Message |
|---|---|
| HB-T-001 | `Your HomeBite OTP is {OTP}. Valid for 10 minutes. Do not share.` |
| HB-T-002 | `{RIDER} picked up {RECEIVER}'s tiffin at {TIME}. Track: {LINK}` |
| HB-T-003 | `Delivered! {RECEIVER}'s tiffin arrived at {TIME}. - HomeBite` |
| HB-T-004 | `Your tiffin from {SENDER} is on the way. OTP to receive: see app.` |
| HB-T-005 | `Delivery attempt failed for {RECEIVER}. Tap to resolve: {LINK}` |
| HB-T-006 | `Your plan for {RECEIVER} expires in {N} days. Renew: {LINK}` |
| HB-T-007 | `Payment of Rs.{AMOUNT} received for HomeBite. Ref: {REF}` |
 
---
 
## Appendix A: Responsive Behaviour Summary
 
| Component | 375px (Mobile) | 768px (Tablet) | 1280px (Desktop) |
|---|---|---|---|
| Navigation | Bottom tab bar (4 items) | Bottom tab bar | Left sidebar (240px) |
| Hero (Landing) | Stacked, illustration above fold | Two-column 50/50 | Two-column 55/45 |
| Stat cards | 2×2 grid | 4 in one row | 4 in one row |
| Receiver cards | Single column | Two columns | Three columns |
| Job list (Rider) | Single column, full width | Single column, 600px max | Two columns |
| Admin tables | Hidden (not supported < 1024px) | Scrollable table | Full table |
| OTP display | Full screen card | Centred card 440px | Centred card 440px |
| Map | 280px height | 380px height | 480px height |
| Side drawer | Full screen (100vw) | 480px | 480px |
| Wizard steps | Steps indicator condensed (dots) | Full labels | Full labels |
 
---
 
## Appendix B: Accessibility Checklist
 
- All interactive elements: minimum tap target 44×44px.
- Colour contrast ratios: body text 4.5:1 minimum, large text 3:1 minimum.
- All form inputs: explicit `<label>` elements, not placeholder-only.
- All images: `alt` text. Decorative images: `alt=""`.
- Focus order: logical reading order. Focus ring: 3px saffron-400 offset ring.
- No information conveyed by color alone (status badges have icons + text).
- OTP inputs: `autocomplete="one-time-code"` on the first digit field.
- Map: keyboard-navigable controls. Screen reader: announces route summary as text.
- Reduced motion: all entrance animations disabled. GPS marker position still updates, but without interpolation.
- Dark mode: supported via `prefers-color-scheme` (system) and manual toggle.
- Language: default `lang="en"`. Hindi support (`lang="hi"`) planned for post-MVP.
---
 
## Appendix C: Font Loading Strategy
 
```html
<!-- Preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 
<!-- Critical: Plus Jakarta Sans (body) — subset to Latin -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
 
<!-- Non-critical: Fraunces (display) — only above-fold, loaded async -->
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap"
  media="print" onload="this.media='all'">
 
<!-- Mono: JetBrains Mono — loaded async, only where used -->
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
  media="print" onload="this.media='all'">
 
<!-- Fallback for JS-off: -->
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
</noscript>
```
 
System font fallback stack:
```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont,
  'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
```
 
---
 
*End of UI.md — HomeBite v1.0*
 
*This document is the authoritative reference for all visual design decisions. Any deviation requires sign-off from the Design Lead. UI implementation should reference this document and the API.md together for complete context.*
 
