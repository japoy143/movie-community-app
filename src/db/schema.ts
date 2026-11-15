// Drizzle table definitions. Add tables here, then run `npm run db:generate`
// and `npm run db:migrate`.
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { COMMENT_MAX_LENGTH, NAME_MAX_LENGTH } from "@/lib/limits";

// ---------- Better Auth core tables ----------
// Property names must match Better Auth's field names (camelCase); the
// column names can be anything. Matches better-auth 1.7 core schema.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    ...timestamps,
  },
  (t) => [
    // Also enforced (with trimming) by databaseHooks in src/lib/auth.ts.
    check(
      "user_name_length",
      sql`char_length(${t.name}) between 1 and ${sql.raw(String(NAME_MAX_LENGTH))}`,
    ),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// Better Auth rate limiter storage (rateLimit.storage = "database").
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ---------- App rate limiting (src/lib/rate-limit.ts) ----------
// Fixed-window counters for Server Actions, e.g. "like:ip:1.2.3.4".
export const actionRateLimit = pgTable("action_rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

// ---------- Community tables ----------
// Movies are identified by their TMDB id; there is no local movies table.

// One like per movie per signed-in user, or per guest browser (visitor cookie).
export const movieLike = pgTable(
  "movie_like",
  {
    id: serial("id").primaryKey(),
    movieId: integer("movie_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Both unique indexes lead with movie_id, so they also serve count queries.
    uniqueIndex("movie_like_movie_user_uq").on(t.movieId, t.userId),
    uniqueIndex("movie_like_movie_visitor_uq").on(t.movieId, t.visitorId),
    check(
      "movie_like_one_owner",
      sql`(${t.userId} is null) <> (${t.visitorId} is null)`,
    ),
  ],
);

export const comment = pgTable(
  "comment",
  {
    id: serial("id").primaryKey(),
    movieId: integer("movie_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [
    index("comment_movie_created_idx").on(t.movieId, t.createdAt),
    check(
      "comment_body_length",
      sql`char_length(${t.body}) between 1 and ${sql.raw(String(COMMENT_MAX_LENGTH))}`,
    ),
  ],
);
