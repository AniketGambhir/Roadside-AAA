CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  verified BOOLEAN DEFAULT false,
  services TEXT[] DEFAULT '{}',
  price NUMERIC DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  rating NUMERIC DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  make TEXT,
  model TEXT,
  plate TEXT,
  year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  customer_name TEXT,
  phone TEXT,
  vehicle TEXT,
  service TEXT,
  description TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  mechanic_id TEXT REFERENCES users(id),
  mechanic_name TEXT,
  mechanic_phone TEXT,
  mechanic_lat DOUBLE PRECISION,
  mechanic_lng DOUBLE PRECISION,
  status TEXT DEFAULT 'Pending',
  estimated_price NUMERIC DEFAULT 0,
  final_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_updates (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES service_requests(id) ON DELETE CASCADE,
  actor_id TEXT,
  actor_name TEXT,
  status TEXT,
  note TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES service_requests(id),
  user_id TEXT REFERENCES users(id),
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'Open',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  request_id TEXT UNIQUE REFERENCES service_requests(id),
  user_id TEXT REFERENCES users(id),
  mechanic_id TEXT REFERENCES users(id),
  service TEXT,
  vehicle TEXT,
  amount NUMERIC NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON service_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_mechanic ON service_requests(mechanic_id, status);
CREATE INDEX IF NOT EXISTS idx_updates_request ON request_updates(request_id, created_at);
