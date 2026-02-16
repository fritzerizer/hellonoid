# hellonoid.com

**The humanoid robot database** — GSMArena for humanoid robots.

Specs, comparisons, news, and more for every humanoid robot on the market.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Supabase** (PostgreSQL) for production database
- **Vercel** for hosting

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The site works with local seed data by default — no Supabase needed for development.

## Pages

- `/` — Home with featured robots + latest news
- `/robots` — All robots with filters
- `/robots/[slug]` — Individual robot with full specs
- `/compare` — Side-by-side comparison (2–4 robots)
- `/news` — News feed

## Database

SQL migration in `supabase/migrations/001_initial_schema.sql`. Run against your Supabase project when ready.

## Robots Included

Tesla Optimus Gen 2 · 1X NEO · Figure 02 · Unitree H1 · Unitree G1 · Boston Dynamics Atlas (Electric) · Agility Digit · Apptronik Apollo · Sanctuary AI Phoenix · Xiaomi CyberOne
