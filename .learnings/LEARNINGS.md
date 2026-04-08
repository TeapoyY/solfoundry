# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## 2026-04-03

### Bounty Platforms Beyond Algora

**Category**: knowledge_gap

**Learning**:
- Bug bounty platforms (HackerOne, Bugcrowd) are for security, not code features
- Code/Feature bounty platforms:
  - **Algora.io** - Currently using, code features
  - **BountyHub (bountyhub.dev)** - Code + features, GitHub OAuth
  - **BountySource** - Code + bugs, GitHub OAuth
  - **FreedomSponsors** - Open source funding
  - **CoderBounty** - Code bounties

**Research file**: `.learnings/bounty-platforms.md`

**Source**: TP request to investigate bounty platforms

---

## 2026-04-03 Evening

### BountyHub.dev is PRIMARY - NOT Algora

**Category**: correction

**Learning**:
- TP explicitly instructed: "try bountyhub.dev rather than the algora"
- BountyHub.io domain expired, use bountyhub.dev
- Update cron jobs and skills to use BountyHub.dev first
- Algora is secondary - only for specialized bounties

**Action Items**:
- [x] Updated HEARTBEAT.md with BountyHub.dev priority
- [x] Updated bounty-platforms.md
- [ ] Update cron job if exists
- [ ] Update any bounty-hunt skills

**URLs**:
- BountyHub: https://www.bountyhub.dev/en/bounties
- Algora: https://algora.io/dashboard/bounties

**Source**: TP explicit instruction

---

## 2026-04-04 Early Morning

### Bounty Hunt + Claude Code 规则

**Category**: process improvement

**Learning**:
- TP instructed: "when solve the bounty use Claude Code to develope as well"
- Bounty hunt should use Claude Code for implementation
- Install dev skills to both Claude Code and myself

**Bounty Hunt Process**:
1. Find bounty on BountyHub.dev
2. Claim with `/attempt #ISSUE`
3. Use Claude Code to develop: `claude --permission-mode bypassPermissions --print "fix issue..."`
4. Submit PR
5. Update learnings file

**Source**: TP instruction

---

## 2026-04-02

### Self-Improving Agent - MUST USE FOR ALL TASKS

**Category**: best_practice

**Learning**:
- Self-improving-agent skill MUST be applied to ALL tasks
- BEFORE task: Read `.learnings/LEARNINGS.md` and `.learnings/ERRORS.md`
- AFTER task: Log result to appropriate `.learnings/` file
- User explicitly requested: "执行所有任务都要记得使用这个skill"

**Files**:
- `.learnings/LEARNINGS.md` - corrections, insights, best practices
- `.learnings/ERRORS.md` - failures, errors
- `.learnings/FEATURE_REQUESTS.md` - user requests

**Source**: TP request + self-improving-agent skill

---

## 2026-04-02

### Bounty Hunt - Quality First

**Category**: best_practice

**Learning**: 
- Bounty hunt PRs must contain ACTUAL CODE, not just IMPLEMENTATION.md
- Quality > Speed: One perfect PR > 10 bad PRs
- Always claim bounty BEFORE implementing using `/attempt #ISSUENUMBER`

**Source**: bounty-hunt-skill

**See Also**: ERRORS.md - SPLURT PRs

---

### Claiming Bounties

**Category**: best_practice

**Learning**:
- Claim format: `/attempt #ISSUENUMBER` (preferred if no other format shown)
- Do NOT @ mention others in claim comments
- Follow the SAME format as other claimers in the issue
- Reference the issue in your claim

**Source**: bounty-hunt-skill

---

## 2026-04-02 (evening)

### Algora Bounty Landscape

**Category**: insight

**Learning**:
- Algora bounties at https://console.algora.io/bounties
- Many bounties appear on Algora but don't have corresponding GitHub issues (or issues are deleted/closed)
- deskflow maintainers explicitly said "We are not accepting bounties" due to low-quality AI-generated PRs
- Coolify bounties with "Core Team Only" or "⏸️ Hold" labels are not accessible
- Archestra bounties are VERY crowded (20+ claims on a $500 bounty)
- ProjectDiscovery and Keep bounties all have multiple claims
- ZIO bounties are Scala and very complex
- Best strategy: find newer repos with smaller bounties ($50-$200) with 0 claims

**Source**: bounty-hunt-skill (subagent evening session)

---

### Finding Valid Bounties on Algora

**Category**: best_practice

**Learning**:
- Navigate to https://console.algora.io/bounties to find open bounties
- Filter by skills (JavaScript/TypeScript) for accessible repos
- Check GitHub issue directly - many are resolved or have many claims
- Check for "Core Team Only" and "⏸️ Hold" labels - not accessible
- Use GitHub search `label:"💎 Bounty" is:issue is:open no:assignee` for unclaimed issues

**Source**: bounty-hunt-skill (subagent evening session)

---

## 2026-04-08

### HEARTBEAT.md Cleanup - Keep Active Only

**Category**: best_practice
**Source**: TP request to streamline HEARTBEAT.md

**Learning**:
- HEARTBEAT.md should contain ONLY active tasks with current status
- Old iteration records (dev-aiphone-iter1-iter32) belong in .learnings/ as compressed summaries
- Version history of fixed bugs doesn't belong in heartbeat (already in git history)
- Rule: if something is DONE, compress into learning entry and remove from heartbeat

**Key historical learnings from HEARTBEAT.md**:
- Capacitor/Vite apps need `base: './'` in vite.config.ts for filesystem access
- AI Phone Agent: `getCallCapablePhoneAccounts()` requires system signature — use SharedPreferences instead
- AI Phone Agent: `webView.addJavascriptInterface()` must be explicitly called to expose Java objects
- APK keystore: `ai-phone-agent-release.keystore`, alias=aiphonagent, storepass=android123

**Promote to MEMORY.md**: Capacitor/Vite path issue, APK signing config

---

## 2026-04-08

### Bounty Label ≠ Real Money - Always Verify Amount

**Category**: best_practice
**Source**: TP correction on bounty verification

**Learning**:
- `bounty` GitHub label is used loosely — many are internal积分 systems, not real money
- Must check for actual $ dollar amounts or verified tradeable tokens (e.g., FNDRY)
- FNDRY = SolFoundry platform token — value depends on listing status
- Rule: Only pursue bounties with explicit $ amounts or verified tradeable tokens
- Always `gh pr list --author TeapoyY` to verify submitted PRs (subagent can fabricate reports)

**Real money indicators**: $XX amount in issue body, payment channel mentioned, verified on exchange
**Fake bounty indicators**: Only `bounty` label, internal积分/积分/徽章, no dollar amount
