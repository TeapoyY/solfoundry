## Bounty T1: Bounty Countdown Timer Component

**Reward:** 100,000 $FNDRY | **Tier:** T1 (Open Race) | **Domain:** Frontend

### What was implemented

#### New component: `BountyCountdown.tsx`
A real-time countdown timer component with:
- **Live updates** — ticks every second via `setInterval`
- **Urgency states** — `normal` (>24h, muted), `warning` (<24h, amber), `urgent` (<1h, red+pulse)
- **"Expired" state** — shown when deadline passes
- **Two display modes:**
  - `compact` prop: "3d 5h" format for bounty cards
  - Full mode: "5h : 30m : 15s" for detail pages

#### Integrated into:
- `BountyCard.tsx` — compact countdown in card footer
- `BountyDetail.tsx` — full countdown in sidebar deadline row

#### Also fixes broken imports:
Creates missing `lib/animations.ts` and `lib/utils.ts` that were imported but did not exist, fixing compilation for BountyGrid, BountyCard, BountyDetail, LeaderboardTable, and PageLayout.

### Acceptance Criteria
- [x] Timer displays on bounty cards and detail page
- [x] Updates without page refresh
- [x] Visual urgency indicators (color changes at 24h and 1h)
