CREATE TABLE IF NOT EXISTS "sync_run" (
	"id" text PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 25) NOT NULL,
	"created_at" timestamp(3) DEFAULT now(),
	"updated_at" timestamp(3) DEFAULT now(),
	"customer_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"started_at" timestamp(3),
	"initial_state" jsonb,
	"metrics" jsonb,
	"completed_at" timestamp(3),
	"final_state" jsonb,
	status varchar GENERATED ALWAYS AS (CASE WHEN completed_at IS NOT NULL THEN 'COMPLETED' ELSE 'STARTED' END) STORED,
	"duration" interval GENERATED ALWAYS AS (completed_at - started_at) STORED
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_state" (
	"customer_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"state" jsonb,
	"created_at" timestamp(3) DEFAULT now(),
	"updated_at" timestamp(3) DEFAULT now(),
	CONSTRAINT "sync_state_pkey" PRIMARY KEY("customer_id","provider_name")
);
