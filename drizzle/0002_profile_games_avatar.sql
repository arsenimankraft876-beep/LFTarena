ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
--> statement-breakpoint
ALTER TABLE "participant_profiles" ADD COLUMN IF NOT EXISTS "games" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
UPDATE "participant_profiles" SET "games" = jsonb_build_array("game") WHERE "games" = '[]'::jsonb OR "games" IS NULL;
