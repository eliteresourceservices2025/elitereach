# EliteReach

Internal email marketing tool for Elite Resource Services. It's a thin, branded UI wrapped around the [Sequenzy](https://sequenzy.com) API — there's no database, no separate backend, and no data store of its own. Every contact, tag, campaign, sequence, and form lives in Sequenzy; this app just gives the ERS team a simpler, on-brand way to work with it.

## Features

- **Contacts & tags** — browse, search, add, and tag contacts; bulk tag/enroll actions; CSV import
- **Campaigns** — one-time sends with four ways to compose an email: a rich-text editor, AI generation, a drag-and-drop builder (GrapesJS), or pasted raw HTML
- **Sequences** — automated multi-step email drips triggered by contact activity (e.g. new signup, tag added)
- **Forms** — newsletter signup and contact/inquiry forms, embeddable on the ERS website, with staff email notifications on new inquiries
- **Analytics** — send/open/click/bounce/unsub rates, bounce & complaint breakdowns, a sends-per-day trend chart, and a per-email leaderboard, all filterable by time period and email type
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

# Public URL of this app once deployed — used to register inquiry-form
# staff-notification webhooks. Sequenzy can't reach localhost, so webhook
# registration is skipped while this is set to a local address.
APP_BASE_URL=https://your-deployed-url.vercel.app
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · TipTap (rich text) · GrapesJS (drag-and-drop builder) · jose (signed session cookies)

## Deployment

Built for zero-cost hosting on [Vercel](https://vercel.com). Since there's no database, deployment is just: set the environment variables above in the Vercel project settings, then push to the connected branch. Remember to update `APP_BASE_URL` to the real production URL after the first deploy — inquiry-form staff notifications depend on it.
