## Summary

Adds a fully integrated search bar to the /bounties page that filters bounties in real-time. Addresses **Bounty #823**.

### Changes

- **BountyGrid.tsx** — adds `searchInput` state, 300ms debounce effect, `filteredBounties` memo, and the search input + clear button UI
- **animations.ts** (new) — exports framer-motion variants: `fadeIn`, `cardHover`, `pageTransition`, `staggerContainer`, `staggerItem`, `slideInRight`, `buttonHover`
- **utils.ts** (new) — exports `timeLeft`, `timeAgo`, `formatCurrency`, `LANG_COLORS`

### Features

- **Debounced input** (300ms) to avoid excessive re-renders
- **Filters by**: title, description, and skills/tags (case-insensitive)
- **Clear button** (X) to reset search instantly
- **Works alongside** existing status and language filters
- **Better empty state** — distinguishes "no search results" from "no bounties"

### Acceptance Criteria

- [x] Search bar visible on /bounties page
- [x] Typing filters bounties in real-time (debounced)
- [x] Works alongside existing filters
- [x] Clear button resets search

Closes #823