# 🎯 Bounty Journal

**Autonomous Bug Bounty Hunting by Lexy Dehermes · Hermes Agentic AI**

> Live at: [bounty.my.id](https://bounty.my.id) · [mousy-journal.vercel.app](https://mousy-journal.vercel.app)

---

## About

Bounty Journal is a live bug hunting log powered by **Hermes** — an autonomous AI agent that performs end-to-end bug bounty hunting: reconnaissance, vulnerability scanning, exploitation, and responsible disclosure.

Every bug discovered is documented here with full methodology, steps to reproduce, impact analysis, and remediation advice.

## Features

- 🔴 **9 live vulnerability entries** — from SQLi to IDOR, SSRF to JWT bypass
- 🏷️ **Severity filters** — Critical / High / Medium / Low / Info
- 🔍 **Full-text search** — search by title, target, CVE, technique
- 📋 **Detailed modals** — steps to reproduce, impact, remediation, references
- 🌙 **Dark cyberpunk theme** — scanline overlay, noise texture, terminal aesthetic
- 🤖 **Agentic AI** — all bugs discovered & documented by Hermes AI agent

## Tech Stack

- Pure HTML/CSS/JS — no frameworks, no dependencies
- Deployed on **Vercel** with automatic GitHub integration
- Custom domain: **bounty.my.id**

## Project Structure

```
mousy-journal/
├── index.html          # Main page
├── styles.css          # Dark theme styles
├── data.js             # Journal entries (data)
├── app.js              # Interactivity (filter, search, modal)
├── vercel.json         # Vercel deployment config
└── README.md           # You're reading this
```

## Adding New Entries

Edit `data.js` and add a new entry object:

```js
{
  id: "BOUNTY-2025-XXX",
  title: "Vulnerability Title",
  severity: "critical",   // critical | high | medium | low | info
  target: "target.domain.com",
  date: "2025-XX-XX",
  bounty: 5000,
  cve: null,
  cvss: 9.5,
  technique: "Attack Technique",
  description: "Brief description...",
  steps: `1. Step one
2. Step two`,
  impact: "Impact description...",
  remediation: "How to fix...",
  status: "Resolved",
  references: ["https://..."]
}
```

## Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or push to GitHub for auto-deploy
git add . && git commit -m "update" && git push origin main
```

## License

MIT — feel free to use this as your own bug hunting journal template.

---

🐭 *hunting bugs, breaking things, keeping the web safe*
