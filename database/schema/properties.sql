CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY,
  price NUMERIC(12,2) NOT NULL,
  location TEXT NOT NULL,
  bedrooms INT NOT NULL,
  agent_id UUID NOT NULL
);
