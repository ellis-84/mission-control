# Eric's Mission Control

AI-powered email generator that writes in your voice, backed by your full knowledge base.

---

## Deploy to Railway

### Step 1 — Push to GitHub
1. Create a new repo on GitHub called `mission-control`
2. Upload ALL files keeping this structure:
   - index.js
   - package.json
   - nixpacks.toml
   - public/index.html

### Step 2 — Create Railway service
1. railway.app → New Project → Deploy from GitHub repo
2. Select your mission-control repo

### Step 3 — Set environment variables
Railway → your service → Variables tab:

| Variable | Value |
|---|---|
| ANTHROPIC_API_KEY | your Anthropic API key |
| DASHBOARD_PASSWORD | your chosen password |
| PORT | 3000 |

### Step 4 — Deploy
Railway auto-deploys. Open the URL, log in, you're live.

---

## Tabs

- Generate — topic + type → one email in your voice
- Voice Library — paste past emails, AI reads these for tone/style  
- Knowledge Base — paste course, Q&As, student wins, objections. Saved on server, persists forever.
