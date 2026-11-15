// Shared by the DB schema, Server Actions, auth hooks and client forms.
export const COMMENT_MAX_LENGTH = 1000;
export const NAME_MAX_LENGTH = 50;
/** Postgres int4 upper bound; TMDB ids and serial ids fit in it. */
export const MAX_INT4 = 2_147_483_647;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
