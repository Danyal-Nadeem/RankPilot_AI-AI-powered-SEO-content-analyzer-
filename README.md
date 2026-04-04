# 🚀 RankPilot AI

**AI-powered SEO content analysis platform** — analyze URLs or raw content, get AI-generated improvement suggestions, research keywords, track competitor domains, and manage everything from a centralized dashboard.

> Built for content creators, marketing agencies, and SaaS teams who need Ahrefs + SEMrush + ChatGPT in one place.

---

## ✨ Features

| Phase | Feature |
|-------|---------|
| ✅ 1 | **URL Scraper** — extract title, meta, headings, body text, links, images |
| ✅ 2 | **SEO Scoring Engine** — 7-category weighted audit (title, meta, readability, headings, keywords, images, links) |
| ✅ 3 | **AI Suggestions** — Claude-powered content improvement & full article rewrite |
| ✅ 4 | **Auth System** — JWT access/refresh tokens, email verification |
| ✅ 5 | **Competitor Analysis** — side-by-side comparison dashboard |
| ✅ 6 | **Keyword Research** — LSI keywords, intent classification, search volume estimates |
| ✅ 7 | **Report History** — paginated dashboard with search/filter/sort |
| ✅ 8 | **PDF Export** — branded PDF with score charts via ReportLab |
| ✅ 9 | **Bulk URL Scanning** — queue up to 20 URLs via Celery + Upstash Redis |
| ✅ 10 | **Email Notifications** — Resend API / SMTP + weekly digest cron via Celery Beat |

---

## 🏗️ Architecture

```
RankPilot AI
├── backend/          ← FastAPI (Python 3.13)
│   ├── app/
│   │   ├── routers/       ← API route handlers (auth, scrape, score, ai, bulk, ...)
│   │   ├── services/      ← Business logic (scraper, scoring_engine, ai_suggestions, email, ...)
│   │   ├── models/        ← Pydantic models (user, scrape, score, keyword, ...)
│   │   ├── core/          ← DB, config, celery, indexes
│   │   └── tasks.py       ← Celery task definitions
│   ├── tests/             ← Pytest unit tests
│   ├── Procfile           ← Railway deployment
│   └── requirements.txt
│
└── frontend/         ← Next.js 16 (TypeScript)
    ├── src/
    │   ├── app/           ← Next.js App Router pages
    │   ├── components/    ← Reusable UI components
    │   ├── context/       ← Auth context + state
    │   └── lib/           ← Utilities, API client
    └── vercel.json        ← Vercel deployment
```

**Data flow:**
```
Browser → Next.js → FastAPI → (MongoDB Atlas | Upstash Redis)
                 ↘ Celery Worker → Claude API / Resend API
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4 |
| **UI Components** | shadcn/ui, Radix, Recharts, Lucide Icons |
| **Toast** | Sonner |
| **Backend** | FastAPI, Python 3.13, Uvicorn |
| **Database** | MongoDB Atlas (free M0 cluster) |
| **Cache/Queue** | Upstash Redis (serverless, `rediss://` TLS) |
| **Background Jobs** | Celery 5 + Celery Beat |
| **AI** | Anthropic Claude (`claude-3-5-haiku-20241022`) |
| **Email** | Resend API (primary) / SMTP (fallback) |
| **PDF** | ReportLab |
| **Auth** | JWT (access 15min + refresh 7d) |
| **Validation** | Pydantic v2, Zod |
| **Testing** | Pytest 9 |
| **Deployment** | Railway (backend) + Vercel (frontend) |

---

## ⚡ Local Development Setup

### Prerequisites
- Python 3.11+ and `pip`
- Node.js 18+ and `npm`
- [MongoDB Atlas](https://cloud.mongodb.com) free M0 cluster
- [Upstash Redis](https://upstash.com) free serverless instance

### 1. Clone the repo

```bash
git clone https://github.com/your-username/RankPilot_AI.git
cd RankPilot_AI
```

### 2. Backend setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# → Fill in MONGODB_URL, REDIS_URL, ANTHROPIC_API_KEY, RESEND_API_KEY

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at → **http://localhost:8000/docs**

### 3. Frontend setup

```bash
cd frontend

npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

App available at → **http://localhost:3000**

### 4. Start Celery worker (for bulk scan & email jobs)

```bash
cd backend
venv\Scripts\activate

# Worker
celery -A app.core.celery_app worker --loglevel=info

# Beat scheduler (weekly digest cron) — separate terminal
celery -A app.core.celery_app beat --loglevel=info
```

---

## 🧪 Running Tests

```bash
cd backend
venv\Scripts\activate
pytest tests/ -v
```

**26 unit tests** covering:
- `count_syllables` — phoneme counting edge cases
- `calculate_flesch_reading_ease` — readability scoring
- `score_title_tag` — SEO title analysis
- `score_meta_description` — meta tag scoring
- `generate_seo_audit` — full audit integration

---

## 🌍 Environment Variables

See [`.env.example`](./backend/.env.example) for a complete reference.

### Backend (required)

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB Atlas SRV connection string (e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`) |
| `MONGODB_DB_NAME` | Database name (default: `rankpilot`) |
| `REDIS_URL` | Upstash Redis TLS URL (e.g. `rediss://default:xxx@xxx.upstash.io:6379`) |
| `JWT_SECRET_KEY` | Secret for signing access tokens — use a long random string |
| `JWT_REFRESH_SECRET_KEY` | Secret for signing refresh tokens |
| `ANTHROPIC_API_KEY` | Claude API key from [console.anthropic.com](https://console.anthropic.com) |

### Backend (optional — for email)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key — free 3000 emails/month at [resend.com](https://resend.com) |
| `SMTP_HOST` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASSWORD` | SMTP password or App Password |
| `SMTP_FROM` | Sender address (default: `noreply@rankpilot.ai`) |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `https://rankpilot-backend.up.railway.app`) |

---

## 🚀 Deployment

### Backend → Railway

1. Create a new project on [Railway.app](https://railway.app)
2. Connect your GitHub repo → select the `backend/` directory (or set root to `/backend`)
3. Add all environment variables from the table above in Railway → Variables
4. Railway auto-detects the `Procfile` and runs:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. *(Optional)* Add a second service for the Celery worker with start command:
   ```
   celery -A app.core.celery_app worker --loglevel=info
   ```

### Frontend → Vercel

1. Import your repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add `NEXT_PUBLIC_API_URL` → your Railway backend URL
4. Vercel auto-detects Next.js and deploys

---

## 📡 API Reference

Interactive Swagger UI is available at `/docs` when the backend is running.

Key endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/auth/verify` | Verify email with token |
| `GET` | `/auth/me` | Get current user profile |
| `POST` | `/scrape/` | Scrape a URL |
| `POST` | `/score/` | Run SEO audit on scraped page |
| `POST` | `/ai/suggestions` | Generate AI content suggestions |
| `POST` | `/competitor/compare` | Compare two domains |
| `GET` | `/keyword/research` | Run keyword research |
| `GET` | `/reports/history` | Paginated report history |
| `GET` | `/reports/{id}/export-pdf` | Export report as PDF |
| `POST` | `/bulk/scan` | Submit bulk URL scan job |
| `GET` | `/bulk/{job_id}/status` | Poll bulk job progress |
| `GET` | `/stats/aggregate` | Dashboard aggregate stats |

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          ← Pydantic settings (env vars)
│   │   ├── database.py        ← MongoDB + Redis connection manager
│   │   ├── celery_app.py      ← Celery + Beat config
│   │   ├── indexes.py         ← MongoDB index creation
│   │   └── security.py        ← JWT helpers
│   ├── models/
│   │   ├── user.py            ← User document model
│   │   ├── scrape.py          ← ScrapedPage model
│   │   ├── score.py           ← ScoreBreakdown, ScoreResponse
│   │   └── keyword.py         ← KeywordResult model
│   ├── routers/
│   │   ├── auth.py            ← /auth/* endpoints
│   │   ├── scrape.py          ← /scrape/* endpoints
│   │   ├── score.py           ← /score/* endpoints
│   │   ├── ai.py              ← /ai/* endpoints
│   │   ├── competitor.py      ← /competitor/* endpoints
│   │   ├── keyword.py         ← /keyword/* endpoints
│   │   ├── reports.py         ← /reports/* + PDF export
│   │   └── bulk.py            ← /bulk/* endpoints
│   ├── services/
│   │   ├── scraper.py         ← BeautifulSoup URL scraper
│   │   ├── scoring_engine.py  ← SEO scoring algorithms
│   │   ├── ai_suggestions.py  ← Claude integration
│   │   ├── competitor.py      ← Competitor comparison logic
│   │   ├── keyword_service.py ← Keyword research logic
│   │   ├── pdf_service.py     ← ReportLab PDF generation
│   │   └── email.py           ← Resend/SMTP email dispatch
│   ├── tasks.py               ← Celery task definitions
│   └── main.py                ← FastAPI app factory
├── tests/
│   └── test_scoring_engine.py ← 26 unit tests
├── requirements.txt
├── Procfile
├── railway.json
└── .env.example

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Landing page
│   │   ├── login/page.tsx     ← Login
│   │   ├── signup/page.tsx    ← Registration
│   │   ├── dashboard/page.tsx ← Main dashboard
│   │   └── keywords/page.tsx  ← Keyword research
│   ├── components/
│   │   ├── scrape-form.tsx    ← URL input + analysis trigger
│   │   ├── score-dashboard.tsx← Score breakdown UI
│   │   ├── ai-suggestions.tsx ← AI suggestions panel
│   │   ├── competitor-*.tsx   ← Competitor analysis UI
│   │   ├── bulk-scan.tsx      ← Bulk URL scanner UI
│   │   ├── error-boundary.tsx ← React error boundary
│   │   ├── skeletons.tsx      ← Loading skeleton components
│   │   └── navbar.tsx         ← Top navigation bar
│   ├── context/
│   │   └── auth-context.tsx   ← Auth state + token management
│   └── lib/
│       └── utils.ts           ← cn(), API helpers
├── vercel.json
└── package.json
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT © 2024 RankPilot AI
