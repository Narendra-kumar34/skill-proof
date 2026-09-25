CREATE TYPE "public"."evaluation_run_outcome" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "evaluation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"outcome" "evaluation_run_outcome" DEFAULT 'running' NOT NULL,
	"error_code" text,
	"latency_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "evaluation_runs" ADD CONSTRAINT "evaluation_runs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_runs" ADD CONSTRAINT "evaluation_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evaluation_runs_user_started_idx" ON "evaluation_runs" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "evaluation_runs_started_idx" ON "evaluation_runs" USING btree ("started_at");