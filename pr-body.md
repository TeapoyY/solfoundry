## Bounty T1: Bounty Countdown Timer Component (#826)

**Reward:** 100,000 FNDRY | **Tier:** T1 (Open Race)

### Implementation

**New file: `frontend/src/components/bounty/CountdownTimer.tsx`**
- Live seconds-level updates using `setInterval` (1s tick)
- Shows `DdHhMmSs` format with real-time countdown
- Urgency states:
  - **Normal**: text-muted (green)
  - **Warning** (<24h): text-status-warning (amber) + AlertTriangle icon
  - **Urgent** (<1h): text-status-error (red) + Flame icon
  - **Expired**: text-muted + strikethrough + "Expired"
- Supports `compact` mode for bounty cards and full mode for detail pages

**Modified: `BountyCard.tsx`**
- Replaced static `Clock + timeLeft()` with live `<CountdownTimer compact />`
- Also fixed the broken `timeLeft` import (was referencing nonexistent `lib/utils.ts`)

**Modified: `BountyDetail.tsx`**
- Replaced sidebar deadline display with live `<CountdownTimer />`

**New: `frontend/src/lib/animations.ts`**
- Exports `cardHover` and `fadeIn` framer-motion variants (required by BountyCard/BountyDetail)

**New: `frontend/src/lib/utils.ts`**
- Exports `timeLeft`, `timeAgo`, `formatCurrency`, `LANG_COLORS` (required utilities)

### Acceptance Criteria
- [x] Timer displays on bounty cards and detail page
- [x] Updates without page refresh (1s live ticks)
- [x] Visual urgency indicators (warning <24h, urgent <1h, expired styling)

Closes #826
