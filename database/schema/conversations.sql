CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
