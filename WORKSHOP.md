# IDS Workshop — Quick Start

## Prerequisites

- Node.js 20+
- Docker Desktop (running)
- npm 10+

## Setup

```bash
npm install
npm run docker -- up        # starts Logto, PostgreSQL, RavenDB, Mailpit
npm run logto -- seed       # seeds test users & Logto config
npm run db -- init          # creates RavenDB database + reference data
npm run dev:start           # starts API (port 3000) + Web UI (port 5173)
```

## Login

| | |
|---|---|
| URL | http://localhost:5173 |
| Email | alice@acme-rv.com |
| Password | xyab12dE |

## Services

| Service | URL |
|---|---|
| Web UI | http://localhost:5173 |
| API | http://localhost:3000 |
| Logto Admin | http://localhost:3002 |
| RavenDB Studio | http://localhost:3333 |
| Mailpit | http://localhost:8025 |

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Nx |
| Backend | NestJS (TypeScript) |
| Database | RavenDB (document DB) |
| Auth | Logto (OAuth 2.0 / OIDC) |
| Frontend | React 19 + React Router 7 |
| UI | Material UI |
| Infrastructure | Docker Compose |

## Project Structure

```
apps/
  astra-apis/     NestJS backend API (port 3000)
  client-web/     React frontend (port 5173)
libs/
  shared/
    data-models/  Shared DTOs and types (@ids/data-models)
scripts/          Dev tooling (docker, db, logto, dev server)
docs/standards/   Coding standards — read before writing code
```

## Included Features

- Authentication (sign in / sign out via Logto)
- Locations (list, create, edit)
- Parts inventory (list view)

## What to Build

These features are intentionally omitted — workshop exercises:

- Parts create / edit
- Users list and detail
- Any additional domain you choose
