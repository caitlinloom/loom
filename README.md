# Loom

> Deep compatibility, beautifully woven.

A paid dating app built with React Native (Expo), Supabase, and Stripe. No free tier, no ads, no algorithmic manipulation — just 100 questions and an honest match score.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native + Expo SDK 51, Expo Router v3 |
| Auth | Supabase Phone OTP |
| Database | Supabase (Postgres + RLS) |
| Storage | Supabase Storage (`profile-photos` bucket) |
| Realtime chat | Supabase Realtime (postgres_changes) |
| Payments | Stripe Subscriptions + PaymentSheet |
| Backend logic | Supabase Edge Functions (Deno) |
| Fonts | Libre Baskerville (serif), JetBrains Mono |

---

## Project structure

```
loom/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout — font loading, auth gate
│   ├── index.tsx               # Splash
│   ├── (auth)/                 # signup, verify (OTP)
│   ├── (onboarding)/           # subscribe, profile, preferences, questions
│   └── (app)/                  # Tab navigator → browse, chat, settings
│       ├── browse/             # Discover feed + user detail
│       ├── chat/               # Conversations list + chat room
│       └── settings/
├── components/                 # Design-system UI primitives
├── constants/
│   ├── design.ts               # Color / font / spacing tokens
│   └── questions.ts            # All 100 questions (canonical)
├── hooks/
│   ├── useAuth.ts              # Session, profile, onboarding step
│   └── useProfile.ts           # Supabase write helpers
├── lib/
│   ├── supabase.ts             # Client + typed table helpers
│   └── stripe.ts               # Stripe init + PaymentSheet helper
├── types/index.ts              # Shared TypeScript types
└── supabase/
    ├── migrations/001_initial.sql   # Full schema + RLS + triggers
    └── functions/
        ├── calculate-compatibility/ # Pairwise scoring engine
        ├── create-subscription/     # Stripe subscription + PaymentSheet
        └── stripe-webhook/          # Keeps subscription status in sync
```

---

## Getting started

### 1. Prerequisites

- Node 20+
- Expo CLI: `npm i -g expo-cli`
- Supabase CLI: `brew install supabase/tap/supabase`
- A Stripe account (live or test mode)

### 2. Clone & install

```bash
git clone <your-repo>
cd loom
npm install
```

### 3. Supabase setup

```bash
supabase login
supabase init          # if not already done
supabase link --project-ref YOUR_PROJECT_REF

# Apply the schema
supabase db push

# Create the profile-photos storage bucket (public)
# Do this in the Supabase dashboard → Storage → New bucket
# Name: profile-photos, Public: true
# Then add the three storage RLS policies listed at the bottom of 001_initial.sql
```

### 4. Stripe setup

1. Create a product in Stripe with a **$25.99/month** recurring price.
2. Copy the **Price ID** (starts with `price_`).
3. In the Stripe dashboard → Developers → Webhooks, add an endpoint:
   ```
   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
   ```
   Enable these events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **webhook signing secret** (`whsec_...`).

### 5. Environment variables

```bash
cp .env.example .env
# Fill in EXPO_PUBLIC_* values
```

### 6. Edge Function secrets

```bash
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 7. Deploy Edge Functions

```bash
supabase functions deploy calculate-compatibility
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
```

### 8. Run the app

```bash
# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android

# Expo Go (limited — Stripe native module won't work)
npx expo start
```

---

## Onboarding flow

```
auth/signup  →  auth/verify (OTP)
             ↓
(onboarding) subscribe   [step 0 → 1]  Stripe PaymentSheet
             profile     [step 1 → 2]  Photos, DOB, location, identity
             preferences [step 2 → 3]  Hard filters (gender, age, distance…)
             questions   [step 3 → 4]  100 questions → triggers compatibility calc
             ↓
(app)        browse / chat / settings
```

`profiles.onboarding_step` is the source of truth. The root layout reads it on every app open and redirects accordingly, so a user who uninstalls mid-onboarding resumes at the right step.

---

## Compatibility algorithm

Scores are computed server-side in the `calculate-compatibility` Edge Function after a user completes all questions. The algorithm:

1. For each question answered by **both** users, compute similarity:
   - **Scale (0–9):** `1 - |a - b| / 9`
   - **Choice (0–n):** `1 - |a - b| / (n - 1)`
2. Multiply similarity by the question's weight (1, 2, or 3).
3. Sum weighted scores ÷ total possible weight → overall `[0, 100]`.
4. Repeat per category for the dimension breakdown.

Scores are symmetric (A→B = B→A) and cached in `compatibility_scores`. Only pairs with `overall ≥ 70` appear in the Discover feed.

---

## Key design decisions

- **No swipe UI.** Users browse a scored grid and tap into full profiles before deciding.
- **Mutual-like trigger.** A Postgres trigger automatically creates a `matches` row when two users both like each other, eliminating any race condition.
- **Realtime chat.** Supabase's `postgres_changes` channel powers live message delivery without a separate WebSocket server.
- **RLS everywhere.** Users can only read their own answers, preferences, and subscription — profiles and photos are public-readable.
- **Subscription gate.** `onboarding_step` is reset to `0` by the webhook if a subscription lapses, forcing the paywall on next open.
