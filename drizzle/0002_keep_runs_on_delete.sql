ALTER TABLE "evaluation_runs" DROP CONSTRAINT "evaluation_runs_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "evaluation_runs" ALTER COLUMN "submission_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "evaluation_runs" ADD CONSTRAINT "evaluation_runs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;