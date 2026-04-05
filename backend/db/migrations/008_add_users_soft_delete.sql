-- Migration 008: Add soft delete support to users table
-- Replaces hard DELETE with a deleted_at timestamp so audit logs remain intact

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index so active-user lookups stay fast
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users (deleted_at) WHERE deleted_at IS NULL;
