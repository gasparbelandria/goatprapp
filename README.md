# GOATPR

**Track it. Beat it. Share it.**

Platform for tracking personal records in sports and fitness. Log your PRs, compete on your school's leaderboard, and challenge friends.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Google OAuth 2.0 + JWT |
| Email | Resend |
| Language | TypeScript 5 |
| Fonts | Space Grotesk + Inter + JetBrains Mono |

---

## Local development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A Supabase project with the schema applied
- A Google OAuth 2.0 Client ID

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file at the root:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
RESEND_API_KEY=
```

### 3. Google OAuth

In [Google Cloud Console](https://console.cloud.google.com) → Credentials → your OAuth 2.0 Client:

- Add `http://localhost:3000` to **Authorized JavaScript origins**
- Add `http://localhost:3000/api/auth/google` to **Authorized redirect URIs**

### 4. Run the dev server

```bash
npm run dev
```

Opens at `http://localhost:3000`.

### 5. Build for production

```bash
npm run build
npm start
```

### 6. Lint

```bash
npm run lint
```

---

## License

Private. All rights reserved.
