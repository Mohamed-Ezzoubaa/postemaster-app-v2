# Postmaster Pulse - Email IP & Domain Reputation Management

Production-ready, modern full-stack web application for Email IP & Domain Deliverability & Reputation Intelligence powered by the **Google Postmaster Tools API**, **Drizzle ORM**, **PostgreSQL** (Neon / Supabase / Postgres compatible), and **Tailwind CSS**.

---

## 🌟 Key Features

1. **Internal OAuth 2.0 & Google Postmaster Tools API Integration**
   - Route handlers for `/api/auth/google` and `/api/auth/google/callback`.
   - Scopes: `openid`, `profile`, `email`, and `https://www.googleapis.com/auth/postmaster.readonly`.
   - Secure token exchange and JWT session management stored in PostgreSQL using Drizzle ORM.
   - Demo session mode for instantaneous preview without blockers.

2. **Core Deliverability Dashboard**
   - **Monitored Domains & Sending IPs**: Comprehensive fleet tracking of SPF, DKIM, DMARC, TLS encryption, and delivery error rates.
   - **Google 0.3% Spam Threshold Monitoring**: Real-time alert boundaries highlighting safe (<0.10%) and critical (>0.30%) spam rates.
   - **Historical Trajectory Visualizer**: Interactive SVG charts with 7-day, 30-day, and 90-day timeframes displaying High, Medium, Low, and Bad reputation tiers.

3. **Automated Sync & Cron Endpoint**
   - Secured endpoint at `/api/cron/sync-reputation` using the `CRON_SECRET` header (`Authorization: Bearer <CRON_SECRET>`).
   - Pre-configured `vercel.json` for automated daily scheduling.

4. **Domain & IP Management**
   - Add new sending domains or subdomains with automatically generated Google Postmaster DNS TXT (`google-site-verification=...`) and CNAME records.
   - Track outbound MTAs, PTR reverse DNS records, and subnet volume.

5. **AI Deliverability Diagnostic Engine**
   - Audits domains against Google's 2024+ Bulk Sender Guidelines (RFC 5322, RFC 8058 One-Click Unsubscribe, SPF 10-lookup limits, and DMARC alignment).

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
# PostgreSQL / Neon Database connection string
DATABASE_URL="postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Google OAuth 2.0 Credentials (with Postmaster readonly scope)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# Application Base URL
APP_URL="http://localhost:3000"

# Session Encryption Secret (Random 32+ char string)
NEXTAUTH_SECRET="super-secret-random-jwt-key-change-in-production"

# Cron Sync Key (Passed via Authorization: Bearer <CRON_SECRET>)
CRON_SECRET="cron-sync-secret-auth-key-12345"
```

---

## 🚀 Running the Project

### Development
```bash
npm install
npm run dev
```

The application runs on `http://localhost:3000`.

### Database Schema (Drizzle ORM)
The schema is defined in `src/db/schema.ts` with tables:
- `users`: Accounts and OAuth tokens
- `monitored_domains`: Domain reputation, spam rates, SPF/DKIM/DMARC rates
- `monitored_ips`: Sending IP addresses, reverse DNS PTR, subnets
- `reputation_history`: Trailing 90 days of telemetry
- `sync_logs`: Cron and manual audit history

### Deployment to Vercel
1. Push repository to GitHub.
2. Import project in Vercel.
3. Configure Environment Variables (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `CRON_SECRET`).
4. Vercel automatically recognizes the `vercel.json` crons and executes `/api/cron/sync-reputation` daily!
