CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id UUID,
  ip_address VARCHAR(50),
  request_id VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW()
);