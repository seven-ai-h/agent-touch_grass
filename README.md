# 🧠 MindGate
### *Your AI-powered behavioral coach — living between you and your dopamine traps*

> Built for the **Berkeley AI Hackathon**

---

## 🚨 The Problem

Doomscrolling isn't a willpower failure — it's a **design attack**.

TikTok, Instagram Reels, YouTube Shorts, and similar platforms are engineered by teams of PhDs to hijack your dopamine system. The average person picks up their phone **96 times a day**, and most of them didn't mean to. Current solutions — screen time limits, app blockers — are blunt instruments that users just override within 30 seconds.

What's missing is an **intelligent, empathetic intervention layer** that meets you where you are.

---

## 💡 The Solution

MindGate intercepts the moment of temptation — not with a wall, but with a **conversation** — and redirects you toward a version of yourself you actually want to be.

It passively learns your lifestyle, reads your calendar, analyzes what you actually watch, and deploys an AI agent at the exact moment you're about to spiral. It doesn't ban scrolling. It helps you **spend your dopamine deliberately**.

---

## ✨ Core Features

### 🔍 Lifestyle Intelligence Engine
Passively builds a behavioral model of your life using:
- **Screen time patterns** — when you scroll, how long, what triggers it
- **Location data** — home, work, commuting, gym
- **Battery + time of day** — low battery at 11pm = high vulnerability window
- **Sleep & health data** — via Apple HealthKit / Google Fit
- **Google Calendar** — knows your deadlines, meetings, and free blocks in real time

This model answers one question continuously: *"Is this person in a vulnerable state right now?"*

---

### 🤖 The Intervention Agent
When you tap TikTok, Instagram, Reddit, YouTube Shorts, or any flagged app — MindGate's AI agent appears **first**. Not a wall. A face.

The agent:
- **Checks in conversationally** — *"Hey, it's 10:47pm. You've got a 9am tomorrow. How'd today go?"*
- **Cross-references your calendar** — *"You have a midterm in 14 hours. Want to talk about that?"*
- **Reads your emotional state** — gauges stress, boredom, avoidance, or genuine rest from your response
- **Asks the right question** — *"Are you opening this because you're done, or because you're avoiding something?"*
- **Tone dial** — tough-love mode, gentle coach mode, or hype-man mode — you choose

> The friction alone stops 40–60% of mindless opens. The conversation stops most of the rest.

---

### 📅 Google Calendar Integration
The calendar is the backbone that makes all behavioral intelligence feel **personal, not generic**.

| Calendar Context | Agent Response |
|---|---|
| Free block for 3 hours | "You've got time. Want a 20min intentional scroll window with a hard stop?" |
| Meeting in 25 minutes | "You've got Dr. Chen in 25min — not enough time to scroll safely." |
| Just finished a big task | "You just wrapped your deadline. You earned a break — 15min guilt-free, then I'll check in." |
| Nothing scheduled all day | "Unstructured day detected. Want to block it out before we talk about TikTok?" |

**Scheduled Scroll Windows** — MindGate looks at your week and proactively suggests optimal scroll times, like a nutritionist planning a cheat meal rather than banning food.

**Dead Time Detection** — Calendar gaps between events are prime doomscrolling territory. MindGate pre-fills them with intentional suggestions before boredom does.

**Weekly Dopamine Budget** — Every Sunday, MindGate generates a plan: which days to protect, where to place guilt-free leisure blocks, and how to structure high-stakes days.

---

### 🎯 FYP Hobby Detection → Real World Redirect
This is the **killer feature**.

MindGate analyzes what you actually engage with on your feeds and extracts your real interests — not what you say you like, but what you actually watch. Then it makes that interest **physical and local**.

| Detected Interest | Redirect Suggestion |
|---|---|
| 🏀 Basketball clips | "There's a court 0.3mi away. Here are 3 drills for your weak hand." |
| 🍳 Cooking videos | "You have eggs and pasta at home. Here's a 20-min recipe." |
| 🎸 Guitar covers | "You haven't practiced in 4 days. Here's a 10-min exercise." |
| ✈️ Travel content | "You've watched 40 Japan videos. Here's a 30-day savings tracker." |
| 💪 Fitness content | "Your next push day is tomorrow — preview it now." |

The agent doesn't say *"go outside."* It gives you a **specific, frictionless next action.**

---

### 📊 The Scroll Audit Dashboard
A brutally honest weekly report:
- Total time scrolled vs. time spent on meaningful activity
- Your **dopamine debt score** — how much you borrowed from tomorrow's focus
- Side-by-side: *"You watched 2.3 hours of basketball content. You played basketball for 0 minutes."*
- Intervention success rate over time — showing you actually improving

Making the invisible visible is itself behavior-changing.

---

### 🧠 Vulnerability Prediction (Proactive Mode)
MindGate sends a **preemptive nudge** before you even reach for your phone.

Trigger conditions:
- Stationary for 45+ minutes → boredom incoming
- 11pm, haven't wound down → late-night scroll incoming
- Just exited a stressful calendar event → stress-scroll incoming
- Finished a task with no next action queued → void incoming

*"You just wrapped a 2-hour work block. High-risk zone. Want me to queue your next task or suggest a 10-min walk?"*

---

### 💬 Accountability Buddy System
- Pair with a friend also using MindGate
- Both get notified if the other breaks a streak
- Shared scroll-free challenges with real stakes (pushups owed, coffee buys, etc.)
- Built on **social commitment devices** — the strongest behavior change tool in psychology

---

### 🎮 Identity-Based Streak System
Most streak systems are about the streak. MindGate's is about **who you're becoming**.

Instead of *"Day 14 streak 🔥"*, it says:

> *"You've chosen your real life over your feed 14 times. That's who you are now."*

Tied to an **identity card** you define at onboarding: *I am an athlete / builder / artist / student* — every redirect reinforces that self-image.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Mobile Shell | React Native (iOS focus for demo) |
| AI Intervention Agent | Claude API (claude-sonnet-4) |
| Calendar Integration | Google Calendar API |
| Feed & Hobby Analysis | On-device Screen Time API + content classification |
| Health & Location | Apple HealthKit / Google Fit / CoreLocation |
| Local Activity Mapping | Claude + Google Maps API |
| Dashboard | Recharts / D3 |
| Backend | Node.js + Express |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  MindGate App                   │
│                                                 │
│  ┌─────────────┐    ┌──────────────────────┐    │
│  │  Lifestyle  │    │   Google Calendar    │    │
│  │ Intelligence│◄───│     Integration      │    │
│  │   Engine    │    └──────────────────────┘    │
│  └──────┬──────┘                                │
│         │ Vulnerability Score                   │
│         ▼                                       │
│  ┌─────────────┐    ┌──────────────────────┐    │
│  │    App      │    │    Claude AI Agent   │    │
│  │ Interceptor │───►│  (Intervention Layer)│    │
│  └─────────────┘    └──────────┬───────────┘    │
│                                │                │
│         ┌──────────────────────┤                │
│         ▼                      ▼                │
│  ┌─────────────┐    ┌──────────────────────┐    │
│  │  FYP Hobby  │    │   Scroll Audit &     │    │
│  │  Detector   │    │     Dashboard        │    │
│  └──────┬──────┘    └──────────────────────┘    │
│         │                                       │
│         ▼                                       │
│  ┌─────────────┐                                │
│  │  Real World │                                │
│  │  Redirect   │ (Google Maps + drills)         │
│  └─────────────┘                                │
└─────────────────────────────────────────────────┘
```

---

## 🎬 Hackathon Demo Flow

1. **User taps TikTok at 11pm**
2. **MindGate intercepts** — AI agent appears, checks in warmly
3. **Agent reads the calendar** — *"You have a midterm at 9am"*
4. **User admits they haven't finished studying** — agent reflects it back, offers a 25-min Pomodoro
5. **User wants a break first** — agent detects basketball interest, finds a court open until midnight, delivers a drill
6. **Dashboard moment** — *"You've saved 1h 20min this week. You played ball twice."*

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/mindgate.git
cd mindgate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys (see below)

# Run the app
npm run start
```

### Environment Variables

```env
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_CALENDAR_API_KEY=your_google_calendar_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 🔑 API Keys Required

| Service | Purpose | Link |
|---|---|---|
| Anthropic (Claude) | AI intervention agent | [console.anthropic.com](https://console.anthropic.com) |
| Google Calendar API | Schedule awareness | [Google Cloud Console](https://console.cloud.google.com) |
| Google Maps API | Local activity recommendations | [Google Cloud Console](https://console.cloud.google.com) |


---

> *"MindGate isn't a productivity app. It's a mirror that shows you who you said you wanted to be — and makes it easier to get there than to scroll."*