ALTER TABLE "sync_run" ADD COLUMN "error" text;
-- Is there a way to do this without dropping columns?
ALTER TABLE sync_run drop COLUMN status;
ALTER TABLE sync_run ADD status VARCHAR GENERATED ALWAYS AS (
  CASE WHEN error IS NOT NULL THEN 'ERROR' WHEN completed_at IS NOT NULL THEN 'SUCCESS' ELSE 'PENDING' END
) STORED;