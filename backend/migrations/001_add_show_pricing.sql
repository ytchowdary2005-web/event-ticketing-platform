-- Run once for an existing database that was created before per-show pricing.
-- The current project already has this change applied in the working database.

ALTER TABLE shows
ADD COLUMN IF NOT EXISTS pricing_tier_id INTEGER;

UPDATE shows
SET pricing_tier_id = (SELECT MIN(id) FROM pricing_tiers)
WHERE pricing_tier_id IS NULL;

ALTER TABLE shows
ALTER COLUMN pricing_tier_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_shows_pricing_tier'
    ) THEN
        ALTER TABLE shows
        ADD CONSTRAINT fk_shows_pricing_tier
        FOREIGN KEY (pricing_tier_id)
        REFERENCES pricing_tiers(id);
    END IF;
END $$;
