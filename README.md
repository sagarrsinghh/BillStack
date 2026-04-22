# BillStack

BillStack is a full-stack billing and invoice management system for managing customers, items, and GST-aware invoice generation.

This project includes:

- `logiedge-frontend`: Vite + React frontend
- `logiedge-backend`: Express + MySQL backend

## Project structure

```text
.
|-- logiedge-frontend/
|-- logiedge-backend/
|-- .gitignore
|-- .gitattributes
`-- README.md
```

## GitHub readiness

This repository is prepared for GitHub with:

- root-level ignore rules for dependencies, build output, logs, editor files, and secrets
- committed `.env.example` templates for safe setup
- line-ending normalization via `.gitattributes`
- package lockfiles kept in source control for reproducible installs

## Security notes

- Never commit real `.env` files or API/database credentials.
- Keep only placeholder values in `.env.example`.
- If any secret was previously committed, rotate it before publishing the repository.
- If `node_modules` was ever tracked, remove it from Git before pushing:

```bash
git rm -r --cached logiedge-backend/node_modules
```

## Environment setup

### Backend

Create `logiedge-backend/.env` from `logiedge-backend/.env.example` and set:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL`
- `DB_SSL_REJECT_UNAUTHORIZED`
- `CORS_ORIGIN`

### Frontend

Create `logiedge-frontend/.env` from `logiedge-frontend/.env.example` and set:

- `VITE_API_BASE_URL`

Suggested local value:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Local development

### 1. Install dependencies

```bash
cd logiedge-backend
npm install

cd ../logiedge-frontend
npm install
```

### 2. Start backend

```bash
cd logiedge-backend
npm run dev
```

### 3. Start frontend

```bash
cd logiedge-frontend
npm run dev
```

## Useful scripts

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

### Backend

- `npm run dev`
- `npm start`

## Before pushing to GitHub

Run this checklist:

1. Confirm no real secrets exist in any tracked file.
2. Confirm `.env` files are not staged.
3. Confirm `node_modules` is not tracked.
4. Confirm the app starts locally with the example setup.
5. Commit source code, lockfiles, docs, and `.env.example` files only.
