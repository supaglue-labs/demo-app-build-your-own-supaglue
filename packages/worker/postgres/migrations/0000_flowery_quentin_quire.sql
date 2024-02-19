CREATE TABLE IF NOT EXISTS "engagement_contacts" (
	"_supaglue_application_id" text NOT NULL,
	"_supaglue_provider_name" text NOT NULL,
	"_supaglue_customer_id" text NOT NULL,
	"_supaglue_emitted_at" timestamp(3) NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp(3),
	"updated_at" timestamp(3),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"last_modified_at" timestamp(3) NOT NULL,
	"raw_data" jsonb,
	"_supaglue_unified_data" jsonb,
	CONSTRAINT "engagement_contacts_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "engagement_sequences" (
	"_supaglue_application_id" text NOT NULL,
	"_supaglue_provider_name" text NOT NULL,
	"_supaglue_customer_id" text NOT NULL,
	"_supaglue_emitted_at" timestamp(3) NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp(3),
	"updated_at" timestamp(3),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"last_modified_at" timestamp(3) NOT NULL,
	"raw_data" jsonb,
	"_supaglue_unified_data" jsonb,
	CONSTRAINT "engagement_sequences_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "engagement_users" (
	"_supaglue_application_id" text NOT NULL,
	"_supaglue_provider_name" text NOT NULL,
	"_supaglue_customer_id" text NOT NULL,
	"_supaglue_emitted_at" timestamp(3) NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp(3),
	"updated_at" timestamp(3),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"last_modified_at" timestamp(3) NOT NULL,
	"raw_data" jsonb,
	"_supaglue_unified_data" jsonb,
	CONSTRAINT "engagement_users_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "salesforce_account" (
	"_supaglue_application_id" text NOT NULL,
	"_supaglue_provider_name" text NOT NULL,
	"_supaglue_customer_id" text NOT NULL,
	"_supaglue_emitted_at" timestamp(3) NOT NULL,
	"id" text NOT NULL,
	"_supaglue_last_modified_at" timestamp(3) NOT NULL,
	"_supaglue_is_deleted" boolean DEFAULT false NOT NULL,
	"_supaglue_raw_data" jsonb,
	"_supaglue_mapped_data" jsonb,
	CONSTRAINT "salesforce_account_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "salesforce_contact" (
	"_supaglue_application_id" text NOT NULL,
	"_supaglue_provider_name" text NOT NULL,
	"_supaglue_customer_id" text NOT NULL,
	"_supaglue_emitted_at" timestamp(3) NOT NULL,
	"id" text NOT NULL,
	"_supaglue_last_modified_at" timestamp(3) NOT NULL,
	"_supaglue_is_deleted" boolean DEFAULT false NOT NULL,
	"_supaglue_raw_data" jsonb,
	"_supaglue_mapped_data" jsonb,
	CONSTRAINT "salesforce_contact_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "salesforce_opportunity" (
	"_supaglue_application_id" text NOT NULL,
	"_supaglue_provider_name" text NOT NULL,
	"_supaglue_customer_id" text NOT NULL,
	"_supaglue_emitted_at" timestamp(3) NOT NULL,
	"id" text NOT NULL,
	"_supaglue_last_modified_at" timestamp(3) NOT NULL,
	"_supaglue_is_deleted" boolean DEFAULT false NOT NULL,
	"_supaglue_raw_data" jsonb,
	"_supaglue_mapped_data" jsonb,
	CONSTRAINT "salesforce_opportunity_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_run" (
	"id" text PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 25) NOT NULL,
	"connection_id" text NOT NULL,
	"provider_config_key" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp(3),
	"completed_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT now(),
	"updated_at" timestamp(3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_state" (
	"connection_id" text NOT NULL,
	"provider_config_key" text NOT NULL,
	"state" jsonb,
	"created_at" timestamp(3) DEFAULT now(),
	"updated_at" timestamp(3) DEFAULT now()
);
