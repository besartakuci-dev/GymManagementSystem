-- Migration 001 (UP): extend Membership_Plans with storefront columns.
--
-- Adds: Features (JSON), IsActive, IsPopular, SortOrder, CreatedAt, UpdatedAt.
-- Idempotent: a sentinel check on the `Features` column means running this against
-- an already-extended schema (e.g. a fresh `npm run db:setup`) is a safe no-op.
-- Run with:     npm run db:migrate          (node scripts/migrate.js up)
-- Reverse with: npm run db:migrate:down     (runs 001_extend_membership_plans.down.sql)

SET @needs_migration := (
  SELECT COUNT(*) = 0
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'Membership_Plans'
    AND COLUMN_NAME  = 'Features'
);

SET @ddl := IF(@needs_migration,
  'ALTER TABLE Membership_Plans
     ADD COLUMN Features  JSON      NULL                               AFTER Description,
     ADD COLUMN IsActive  BOOLEAN   NOT NULL DEFAULT TRUE              AFTER Features,
     ADD COLUMN IsPopular BOOLEAN   NOT NULL DEFAULT FALSE             AFTER IsActive,
     ADD COLUMN SortOrder INT       NOT NULL DEFAULT 0                 AFTER IsPopular,
     ADD COLUMN CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER SortOrder,
     ADD COLUMN UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER CreatedAt,
     ADD INDEX idx_plans_active_sort (IsActive, SortOrder)',
  'SELECT ''Membership_Plans already extended — skipping ALTER'' AS notice');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill storefront metadata for the originally-seeded plans. Guarded so it only
-- fills rows still holding default/empty values — safe to re-run and a no-op on a
-- DB that was already seeded with this data via 02_gym_seed_data_simple.sql.
UPDATE Membership_Plans SET SortOrder = PlanID WHERE SortOrder = 0;
UPDATE Membership_Plans SET IsPopular = TRUE   WHERE PlanName = 'Standard';

UPDATE Membership_Plans
   SET Features = JSON_ARRAY('Full gym floor access', 'Open 06:00-22:00', 'Locker room')
 WHERE PlanName = 'Bazik'    AND (Features IS NULL OR JSON_LENGTH(Features) = 0);
UPDATE Membership_Plans
   SET Features = JSON_ARRAY('Everything in Bazik', 'Unlimited group classes', 'Starter workout plan')
 WHERE PlanName = 'Standard' AND (Features IS NULL OR JSON_LENGTH(Features) = 0);
UPDATE Membership_Plans
   SET Features = JSON_ARRAY('Everything in Standard', 'Priority class booking', '1 personal training session / month')
 WHERE PlanName = 'Premium'  AND (Features IS NULL OR JSON_LENGTH(Features) = 0);
UPDATE Membership_Plans
   SET Features = JSON_ARRAY('Everything in Standard', '12 months at a reduced rate', 'Save 60 EUR per year')
 WHERE PlanName = 'Vjetor'   AND (Features IS NULL OR JSON_LENGTH(Features) = 0);
