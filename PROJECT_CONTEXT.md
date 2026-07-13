# Project Context

Durable quick reference for future repository work. Keep implementation details in source code; update this file only when architecture, routes, commands, or major behavior changes.

## Repository

- GitHub: `https://github.com/sofmega/DalaranSiege`
- Local path: `D:\dalaranS`
- Main branch: `main`
- Production frontend: `https://dalaran-siege.vercel.app`
- Backend: `backend/`
- Angular frontend: `frontend/`

## Backend

- Spring Boot 4, Java 21, Maven Wrapper
- Main class: `com.dalaran.dalarans.DalaranSApplication`
- Local port: `8081`
- Persistence: JPA with Supabase PostgreSQL
- Schema management: Flyway migrations in `backend/src/main/resources/db/migration/`
- Catalog source files: `backend/src/main/resources/data/{heroes,items,shops}.json`
- Flyway V3 seeds the catalog into PostgreSQL; services read through JPA repositories.

Important public endpoints:

```text
GET  /api/health
GET  /api/v1/heroes
GET  /api/items
GET  /api/items?shopId={shopId}
GET  /api/shops
GET  /api/builds?heroId={heroId}
POST /api/builds
PUT  /api/builds/{buildId}
DELETE /api/builds/{buildId}
POST /api/builds/{buildId}/vote
GET  /api/compositions
GET  /api/compositions/{compositionId}
POST /api/compositions
DELETE /api/compositions/{compositionId}
POST /api/compositions/{compositionId}/vote
GET  /api/auth/me
```

Current production catalog counts: 18 heroes, 73 items, and 7 shops.

### Hero build item slots

Build create/update requests use:

```json
{
  "earlyItemIds": [],
  "coreItemIds": [],
  "optionalItemIds": []
}
```

- Each section permits at most 6 slots.
- Duplicate item IDs are valid and must preserve quantity and order.
- Legacy `itemIds` is accepted as Core Build when section fields are absent.
- Responses expose `earlyItems`, `coreItems`, and `optionalItems`; the legacy `items`/`itemIds` representation remains a Core Build alias for frontend compatibility.
- `build_items` identifies slots by `(build_id, section, position)`. Do not add uniqueness on `(build_id, item_id, section)` because duplicate items are intentional.
- Existing pre-section items were migrated to `CORE` by V7. V8 removed the constraint that prevented duplicate item slots.
- A user can create at most 4 builds per hero.

Never modify a Flyway migration that may already be applied. Add a new versioned migration; changing an applied file causes checksum validation failures.

### Community compositions

- Compositions are public to list and view; authenticated users can create, vote, and delete only their own compositions.
- Ownership always comes from the validated JWT subject. The browser does not submit an owner ID.
- Each user may own at most 4 compositions in total.
- A composition contains 1 to 6 unique heroes, and `composition_heroes.position` preserves their selected order.
- Names are trimmed and limited to 3–80 characters. Notes are optional, trimmed, and limited to 2000 characters.
- V9 adds `compositions`, `composition_heroes`, and `composition_votes`, including database constraints, indexes, cascade deletion, RLS policies, and a database-enforced ownership limit.
- Composition voting uses the same `-1`, `0`, and `1` toggle/update behavior as build voting.

### Backend commands

```powershell
cd D:\dalaranS\backend
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
```

## Frontend

- Angular 21
- Local port: `4201`
- `frontend/proxy.conf.json` proxies `/api` to `http://localhost:8081`.
- Supabase Auth manages browser sessions; the access token is sent to protected backend endpoints.
- Google login redirects through Supabase and returns to `window.location.origin`.
- Theme state is managed by `ThemeService`; light is the default and the saved choice uses localStorage key `dalaran-theme`.
- Vercel Web Analytics is initialized in `frontend/src/main.ts`.

Routes:

```text
/                                      Home, heroes, shops, and items
/auth                                  Authentication
/compositions                          Public composition list/create
/compositions/:compositionId           Public composition detail
/items/:id                             Item detail and crafting tree
/heroes/:id/build                      Hero community build list/create/edit
/heroes/:heroId/builds/:buildId        Full build detail
```

Notable UI behavior:

- Item cards open detail pages in a new tab and show rich information only on mouse hover.
- Item total cost is calculated recursively from recipe cost and requirements, with cycle protection.
- Item detail pages map shop IDs to names and render a nested crafting tree.
- Build list cards show a compact Core Build preview; detail pages show all three sections.
- Composition cards preview heroes in saved order; authenticated owners can create up to four and delete their own entries.
- Duplicate build item slots are rendered and tracked by position rather than item ID.
- Dynamic SEO metadata is handled by `SeoService`; `robots.txt` and the sitemap are generated/deployed from `frontend/public/`.

### Frontend commands

```powershell
cd D:\dalaranS\frontend
npm start
npm test
npm run build
```

The production build runs `scripts/generate-sitemap.mjs` before Angular compilation. It reads backend catalog JSON so item and hero detail URLs remain synchronized with the catalog.

## Deployment and secrets

See `DEPLOYMENT.md` for Cloud Run, Vercel, Supabase, Google OAuth, analytics, SEO, and production verification details.

Never commit `.env` files, database passwords, Supabase service-role/secret keys, Google OAuth client secrets, or access tokens.
