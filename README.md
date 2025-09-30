# RankPilot AI — AI-Powered SEO Content Analysis Platform

RankPilot AI is a comprehensive, centralized SEO audit, content scoring, AI rewriting, and competitor analysis platform.

## Project Structure

```text
RankPilot AI/
├── backend/       # FastAPI Backend (Python 3.11)
├── frontend/      # Next.js 16 Frontend (App Router, TypeScript, Tailwind CSS, shadcn/ui)
├── shared/        # Shared types and utilities
```

## Features

- **SEO Content Auditing**: Analyze raw content or web URLs for search performance and ranking criteria.
- **AI Rewriting & Suggestions**: Actionable recommendations and direct paraphrasing/rewriting via AI.
- **Competitor Analysis**: Compare SEO scores and structures against target competitor domains.
- **Keyword Tracking**: Single dashboard for rank tracking and target keyword performance.

## Getting Started

### Prerequisites

- MongoDB Atlas Account (Free tier)
- Upstash Redis Account (Free tier)
- Node.js 18+ & npm
- Python 3.11+

### Database & Cache Setup

This project connects to cloud-hosted databases. You do not need to run local Docker containers.
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free serverless database on [Upstash Redis](https://upstash.com).
3. Record your connection URIs to populate your environment variables.

### Backend Setup

1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment setup and edit as needed:
   ```bash
   cp .env.example .env
   ```
5. Enter your MongoDB Atlas connection string and Upstash Redis secure URL inside `backend/.env`.
6. Run development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
