-- Migration 001 (DOWN): revert Membership_Plans back to its original 6-column shape.
--
-- Drops the storefront columns and index added by the UP migration. Idempotent: a
-- sentinel check means running it when the columns are already absent is a no-op.
-- Note: this is a destructive revert — the data held in those columns is discarded.

SET @has_features := (
  SELECT COUNT(*) > 0
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'Membership_Plans'
    AND COLUMN_NAME  = 'Features'
);

SET @ddl := IF(@has_features,
  'ALTER TABLE Membership_Plans
     DROP INDEX idx_plans_active_sort,
     DROP COLUMN Features,
     DROP COLUMN IsActive,
     DROP COLUMN IsPopular,
     DROP COLUMN SortOrder,
     DROP COLUMN CreatedAt,
     DROP COLUMN UpdatedAt',
  'SELECT ''Membership_Plans has no extended columns — nothing to revert'' AS notice');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
