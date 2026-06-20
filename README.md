# MindGate
**An AI agent that stops you from doomscrolling — by actually talking to you.**

Built at the UC Berkeley AI Hackathon 2026.

---

## The problem

You open TikTok. You didn't mean to. You just unlocked your phone to check the time and now it's 40 minutes later and you're watching someone parallel park a van.

This isn't a willpower problem. Every platform you're trying to quit has a team of engineers whose full-time job is to make sure you don't. Existing tools — screen time limits, app blockers — you tap through in about three seconds and immediately feel worse.

MindGate does something different. It gets in the way and asks what's actually going on.

---

## What it does

MindGate is a Chrome extension. When you try to open a flagged site — TikTok, Instagram, Reddit, YouTube Shorts — it intercepts before the page loads and opens a conversation with an AI agent instead.

The agent isn't generic. It knows things:

- What's on your Google Calendar today and tomorrow
- What time it is and where you are
- How low your battery is
- When you last closed this exact tab

So instead of "are you sure?", it says:

> *"It's 11pm. You have a CS161 final in 9 hours and you've averaged 5.2 hours of sleep this week. You closed TikTok 8 minutes ago. What's actually going on?"*

Most of the time, that's enough. You know what's going on. You just needed someone to say it out loud.

When you want a redirect instead, the agent looks at what you actually watch — basketball clips, cooking videos, music production content — and suggests something specific. Not "go outside." Directions to the court two blocks away and three drills to run through.

---

## Features

**Morning planning agent** — every morning, a scheduled job pulls your calendar, spots your highest-risk windows, and sends a push notification with a rough plan before you've touched your phone.

**Vulnerability scoring** — the backend combines time of day, battery level, location, calendar context, and recent tab history into a score from 0 to 100. A 20 gets a light check-in. A 90 gets a specific, firm response. The agent doesn't treat 2pm on a free Tuesday the same as 11:30pm before a deadline.

**Google Calendar integration** — the agent reads your actual events. It knows about the deadline tomorrow. It knows you just got out of a three-hour work block. It can also write back to your calendar: if you commit to a leisure window, it creates a real event and stands down when you open a flagged site during it.

**FYP hobby detection** — content classification builds a weighted profile of what you actually engage with, not what you say you like. The redirect suggestion comes from that.

**Scroll audit dashboard** — weekly view: total time in flagged apps, vulnerability score across the day, interventions taken vs. skipped, and the gap chart. Hours of basketball content watched this week. Minutes you played basketball. The gap is usually uncomfortable.

**Tone modes** — tough love, gentle coach, or hype man. Same data, completely different conversation. You set it during onboarding.

---

## How the agent works

Every interception bundles what it knows about that moment and sends it to a Claude-powered backend:

```json
{
  "user": {
    "identity": "I am an athlete and a builder",
    "tone": "tough_love",
    "hobby_profile": { "basketball": 0.34, "music": 0.28 }
  },
  "moment": {
    "app": "tiktok.com",
    "time": "23:14",
    "vulnerability_score": 87,
    "battery": 23,
    "last_session": "closed 8 mins ago"
  },
  "calendar": {
    "next_event": "CS161 Final — 9:00am (9hr 46min away)",
    "leisure_block_active": false
  },
  "health": {
    "avg_sleep_this_week": 5.2
  }
}
```

Claude reads the full context and generates a response that only makes sense for this person at this moment. Not a template. A conversation.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + JavaScript (Vite) |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Python + FastAPI |
| AI agent | Claude API (claude-sonnet-4) |
| Calendar | Google Calendar API |
| Local recommendations | Google Maps API |
| ML scoring | scikit-learn + pandas |
| Database | Supabase |
| Browser interception | Chrome Extension (Manifest V3) |
| Push notifications | Web Push API + VAPID |
| Deployment | Vercel (frontend) · Railway (backend) |

---

## Setup

```bash
git clone https://github.com/your-username/mindgate.git
cd mindgate

# Frontend
cd frontend
npm install
npm run dev

# Backend
cd ../backend
pip install -r requirements.txt
uvicorn main:app --reload

# Chrome extension
# Open chrome://extensions → enable developer mode → load unpacked → point at /extension
```

### Environment variables

```env
ANTHROPIC_API_KEY=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_MAPS_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

---

## The demo

Laptop. 11pm. User types tiktok.com.

Extension intercepts. Agent: *"11pm, CS161 final in 9 hours, 23% battery. You closed this tab 8 minutes ago."*

User: *"I just need a break."*

Agent: *"You've watched two hours of basketball content today and haven't left your apartment. Willard Park is open until midnight, 6 minutes away. I'll send directions and a drill. Or 15 minutes right now with a hard stop. Up to you."*

User picks the court.

---

## Tracks

- **Ddoski's World** (primary) — digital wellbeing as social impact
- **Anthropic prize** — built with Claude Code, addressing a genuine health problem

---

## What's next

The extension covers browser doomscrolling on desktop. Native iOS using the Screen Time API is the obvious next move — the backend, agent, and scoring engine are already built for it. It's a new surface, not a new product.
