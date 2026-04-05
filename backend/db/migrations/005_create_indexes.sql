CREATE INDEX idx_records_user_id   ON financial_records(user_id);
CREATE INDEX idx_records_date      ON financial_records(date);
CREATE INDEX idx_records_category  ON financial_records(category);
CREATE INDEX idx_records_type      ON financial_records(type);
CREATE INDEX idx_records_deleted   ON financial_records(deleted_at);