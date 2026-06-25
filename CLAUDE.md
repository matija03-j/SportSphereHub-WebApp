# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

SportSphere Hub is a two-part app, each with its own `package.json` and toolchain. There is no root-level package manifest — run commands from inside `backend/` or `frontend/`.

- `backend/` — Express 5 + TypeScript REST API, persistence via Mongoose 9 / MongoDB driver 7.
- `frontend/` — Angular 20 SPA (standalone components, signals, no NgModules).

The full SportSphere Hub system is implemented (auth + three roles: athlete, employee, admin). See `README.md` for setup/run/seed and demo credentials, and `sportsphere-claude-code-prompt.md` / the PDF for the original spec.

**Backend** (`backend/src/`): layered as `config/` (env, db), `models/` (Mongoose schemas), `middleware/` (auth/JWT, validate, multer upload, error), `controllers/`, `routes/` (mounted under `/api` via `routes/index.ts`), `utils/` (password regex, JWT, date rules, mailer). Business rules live server-side in controllers/utils.

**Frontend** (`frontend/src/app/`): `core/` (services, `auth.service`, JWT interceptor, `guards.ts` role guards, `models.ts`), `shared/` (header/footer layout, `facility-search`, `weekly-calendar`), `features/{public,athlete,employee,admin}/` (lazy `loadComponent` routes in `app.routes.ts`, guarded by role).

**Critical:** the app must never create collections — `config/db.ts` sets Mongoose `autoCreate:false`/`autoIndex:false`; only `seed/seed.js` creates collections/indexes. Keep it that way.

## Commands

### Backend (`cd backend`)
- `npm run build` — compile TypeScript (`tsc`) to `dist/`.
- `npm run serve` (or `npm start`) — run the compiled server from `dist/server.js` on port 4000.
- `npm run dev` — nodemon + ts-node with auto-restart on `src/` changes (no rebuild needed).
- `npm run seed` — drop & recreate the DB with demo data (run independently; see README warning).
- When using `serve` (not `dev`), you must `npm run build` after editing `src/` — `serve` alone uses stale `dist/`.

### Frontend (`cd frontend`)
- `npm start` (`ng serve`) — dev server at `http://localhost:4200/` with live reload.
- `npm run build` — production build into `dist/`.
- `npm run watch` — rebuild on change using the `development` configuration.
- `npm test` (`ng test`) — Karma + Jasmine unit tests (Chrome launcher).
- Run a single spec by temporarily switching its `describe`/`it` to `fdescribe`/`fit`, or scope by file with `ng test --include='**/app.spec.ts'`.
- Scaffold code with `ng generate component <name>` (also `directive`, `pipe`, etc.).

## Conventions

- **Backend TS**: `strict` mode, compiles to `es5` / `commonjs`. Output dir is `dist/`; never edit `dist/` directly.
- **Frontend**: Angular standalone-component style — components declare their own `imports`, app-wide providers live in `app.config.ts`, routes in `app.routes.ts`. Prefer signals for component state (see `App` using `signal`).
- **Formatting**: Prettier config lives in `frontend/package.json` — `printWidth: 100`, `singleQuote: true`, Angular parser for `.html`.

## Notes

- The MongoDB MCP server is configured for this project; use it for inspecting/querying the database once the backend connects to Mongo.
- Frontend and backend are not yet wired together (no HTTP client calls, no CORS origin config beyond the `cors` dependency being present). When connecting them, the backend listens on `4000` and the frontend dev server on `4200`.
