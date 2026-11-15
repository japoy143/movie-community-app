CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_body_length" CHECK (char_length("comment"."body") between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "movie_like" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer NOT NULL,
	"user_id" text,
	"visitor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movie_like_one_owner" CHECK (("movie_like"."user_id" is null) <> ("movie_like"."visitor_id" is null))
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_like" ADD CONSTRAINT "movie_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_movie_created_idx" ON "comment" USING btree ("movie_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_like_movie_user_uq" ON "movie_like" USING btree ("movie_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_like_movie_visitor_uq" ON "movie_like" USING btree ("movie_id","visitor_id");