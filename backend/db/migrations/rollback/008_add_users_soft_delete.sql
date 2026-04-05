-- Rollback 008: Remove soft delete column from users
DROP INDEX IF EXISTS idx_users_deleted;
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
