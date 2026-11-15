---
name: db-change
description: Change the Postgres schema (add/alter/drop tables or columns) via Drizzle migrations. Use whenever src/db/schema.ts needs to change.
---

1. Edit table definitions in `src/db/schema.ts` (Drizzle `pgTable` from `drizzle-orm/pg-core`).
2. Run `npm run typecheck`.
3. Run `npm run db:generate`, then read the new SQL file in `drizzle/`. Flag anything destructive (DROP, column type changes, NOT NULL added without a default on an existing table) and confirm with the user before going on.
4. Run `npm run db:migrate` to apply it to the database in `DATABASE_URL` (`.env.local`). If `DATABASE_URL` isn't set, stop and ask.
5. Never use `db:push`, and never hand-edit an applied migration. Fix mistakes with a new migration.
6. Tell the user which migration files to commit (the SQL file plus `drizzle/meta/`).
