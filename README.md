# EliteReach

Internal email marketing tool for Elite Resource Services. It's a thin, branded UI wrapped around the [Sequenzy](https://sequenzy.com) API — there's no database, no separate backend, and no data store of its own. Every contact, tag, campaign, sequence, and form lives in Sequenzy; this app just gives the ERS team a simpler, on-brand way to work with it.

## Features

- **Contacts & tags** — browse, search, add, and tag contacts; bulk tag/enroll actions; CSV import
- **Campaigns** — one-time sends with four ways to compose an email: a rich-text editor, AI generation, a drag-and-drop builder (GrapesJS), or pasted raw HTML; per-campaign From, Reply-to, CC, and BCC; a Desktop/Tablet/Mobile live preview
- **Sequences** — a visual drag-and-drop canvas (React Flow) matching Sequenzy's own automation builder: Send Email (with AI-drafted content), Delay, Wait for Event, Add/Remove Tag, Add/Remove from List, Update Subscriber, and If/Else branching steps; business-specific trigger presets (new inquiry, discovery call booked, proposal sent, client onboarded, industry leads, form subscriptions, and more) alongside a full custom/advanced trigger option; manual contact enrollment; and a way to send a test email for one step or run a live test of the whole sequence
- **Transactional email** — a one-off send tool for a specific recipient, outside campaigns/sequences, with a confirm-before-send step since it sends immediately
- **Sent emails** — a log of everything sent (campaigns, sequences, transactional), filterable by type, showing delivery/open/click/bounce status
- **Forms** — a visual drag-and-drop form builder (fields, layout, content blocks, theme colors, live preview) on top of Sequenzy's native Forms API — all 10 field types, half-width field pairing, tag/list targeting on submit, and an edit flow for forms created earlier; embeddable anywhere
- **Analytics** — send/open/click/bounce/unsub rates, bounce & complaint breakdowns, a sends-per-day trend chart, and a per-email leaderboard, all filterable by time period and email type
- **Settings** — Email Design (brand colors, style presets, typography, spacing, and colors, with a live preview), Product Info (name, logo, social links, legal details), Notifications (new subscriber / form submitted / campaign finished / weekly report), a Labels directory (every label in use across sequences and campaigns), and a Goals overview (every sequence's conversion goals and their aggregate conversions/revenue) — all reading and writing the same Sequenzy account data the team sees in Sequenzy's own dashboard
- **Auth** — signed-cookie sessions gated by an email whitelist, with two roles: admins (full access, including Settings) and senders

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.local` (not committed) with:

```
APPROVED_EMAILS=comma,separated,list@of,team,emails.com
ADMIN_EMAILS=comma,separated,admin@emails.com
COOKIE_SECRET=a-long-random-secret

SEQUENZY_API_KEY=your-sequenzy-api-key
SEQUENZY_API_BASE_URL=https://api.sequenzy.com/api/v1
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · TipTap (rich text) · GrapesJS (drag-and-drop email builder) · @dnd-kit (drag-and-drop form builder) · React Flow (sequence builder) · jose (signed session cookies)

## Deployment

Built for zero-cost hosting on [Vercel](https://vercel.com). Since there's no database, deployment is just: set the environment variables above in the Vercel project settings, then push to the connected branch.
