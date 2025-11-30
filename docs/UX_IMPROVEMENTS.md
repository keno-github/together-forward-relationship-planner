# Together Forward - UX Improvements Roadmap

## Priority 1: Luna's Daily Brief (Returning User Experience)

### Concept
A personalized welcome-back experience that appears once per day/session when a returning user logs in.

### Features
- **Warm Greeting**: "Welcome back, Sarah & James" with time-appropriate message
- **Quick Snapshot Dashboard**:
  - Tasks due today/this week
  - Milestones approaching deadlines
  - Budget status (on track/needs attention)
  - Overall progress percentage change since last visit
- **Smart Suggestion**: "Today, focus on..." - AI-powered recommendation based on priorities
- **Partner Activity**: "James completed 2 tasks yesterday" - keeps couples connected
- **Quick Actions**: One-tap access to most relevant next steps

### UX Behavior
- Slides in as a modal/panel on first visit of the day
- Can be dismissed with "Got it" or "Show me later"
- Accessible anytime via notification bell icon in navbar
- Remembers dismissal (localStorage) to not annoy users

### Technical Implementation
- Create `LunaDailyBrief.js` component
- Track last visit timestamp in localStorage/Supabase
- Generate insights via existing Luna AI services
- Add notification icon to NavBar for on-demand access

### Design Notes
- Use warm design system (copper, sage, charcoal)
- Playfair Display for headings
- Subtle animations (fade in, slide up)
- Mobile-friendly from the start

---

## Priority 2: Activity Feed

### Concept
A living timeline showing recent activity across all dreams, making the app feel alive and collaborative.

### Features
- Partner task completions
- Budget updates
- Milestone achievements
- Luna insights and suggestions
- Timestamp and relative time ("2 hours ago")

---

## Priority 3: Momentum & Gamification

### Features
- Daily/weekly activity streaks
- Progress celebrations (confetti on milestones)
- Achievement badges
- "X days until Phase 1 complete" countdowns

---

## Priority 4: Smart Context Awareness

### Features
- "Continue where you left off" prompts
- Remember last viewed milestone/task
- Suggest unfinished actions
- Time-of-day appropriate suggestions

---

## Notes
- All new features should be mobile-first
- Maintain warm, editorial design aesthetic
- Luna should feel like a helpful companion, not intrusive
