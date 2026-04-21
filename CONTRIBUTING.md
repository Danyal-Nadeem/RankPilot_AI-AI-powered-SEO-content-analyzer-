# Contributing to RankPilot AI

Thank you for your interest in contributing! This document outlines the process for reporting bugs, suggesting features, and submitting pull requests.

---

## 🐛 Reporting Bugs

1. **Search existing issues** first to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Python/Node.js versions and OS
   - Relevant logs or screenshots

---

## 💡 Suggesting Features

1. Open a **Feature Request** issue
2. Describe the problem you're solving (not just the solution)
3. Include example use cases

---

## 🔧 Development Workflow

### Branching Strategy

```
main          ← production-ready code
feature/*     ← new features (feature/bulk-scan)
fix/*         ← bug fixes (fix/auth-token-refresh)
chore/*       ← maintenance (chore/update-deps)
```

### Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PDF export endpoint
fix: resolve token refresh race condition
chore: update Pydantic to v2
docs: add deployment guide
test: add scoring engine edge cases
refactor: extract email service from auth router
```

### PR Checklist

Before opening a PR, verify:

- [ ] Code follows existing patterns (check similar files)
- [ ] Backend: `pytest tests/ -v` passes (all 26+ tests green)
- [ ] Frontend: `npm run build` passes with no TS errors
- [ ] New features include tests
- [ ] `.env.example` updated if new env vars added
- [ ] PR description explains **what** and **why**

---

## 🧪 Running Tests

**Backend:**
```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pytest tests/ -v
```

**Frontend type-check:**
```bash
cd frontend
npm run build
```

---

## 🏗️ Project Structure Overview

```
backend/app/
├── routers/     ← HTTP endpoint definitions
├── services/    ← Business logic (keep thin routers, fat services)
├── models/      ← Pydantic models
├── core/        ← Database, config, Celery setup
└── tasks.py     ← Celery background tasks

frontend/src/
├── app/         ← Next.js pages (App Router)
├── components/  ← Reusable UI components
├── context/     ← Global state (auth)
└── lib/         ← Utilities and helpers
```

**Key conventions:**
- Routers should be thin — delegate all logic to services
- Use `HTTPException` with proper status codes (400, 401, 403, 404, 422, 500)
- Always log errors with `logger.error(...)` before raising
- Frontend API calls live in `lib/api.ts`
- Wrap async UI sections in `<ErrorBoundary>` + `<Skeleton>` patterns

---

## 📦 Adding Dependencies

**Backend:**
```bash
cd backend
pip install <package>
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install <package>
```

Always commit both the updated `requirements.txt` / `package.json` and `package-lock.json`.

---

## 📄 License

By contributing, you agree your contributions will be licensed under the MIT License.
