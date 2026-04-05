## Summary

Adds a real-time countdown timer component for bounty deadlines. Addresses **Bounty #826**.

### Components Added

- **BountyCountdown.tsx** (new) — Live countdown with days/hours/minutes/seconds, updates every second, color urgency indicators

### Features

- **Real-time updates** — Refreshes every second without page reload
- **Visual urgency indicators**:
  - Normal (gray): more than 24 hours remaining
  - Warning (amber): less than 24 hours
  - Urgent (red): less than 1 hour
  - Expired: shows "Expired" label
- **Two display modes**:
  - Full: `2d 05h 30m 15s` (for detail page)
  - Compact: `3d 5h` or `5h 30m` (for bounty cards)
- **Accessible**: `aria-label` and `aria-live` support

### Pages Updated

- `BountyCard.tsx` — Uses `<BountyCountdown compact />` for deadline display
- `BountyDetail.tsx` — Uses `<BountyCountdown />` in sidebar info

### Acceptance Criteria

- [x] Timer displays on bounty cards and detail page
- [x] Updates without page refresh (every second)
- [x] Visual urgency indicators (warning < 24h, urgent < 1h)

Closes #826