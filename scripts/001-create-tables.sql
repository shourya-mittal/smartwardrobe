CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clothes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  color TEXT,
  seasons TEXT[],
  occasions TEXT[],
  image_url TEXT,
  image_pathname TEXT,
  last_worn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE outfits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  occasion TEXT,
  weather JSONB,
  ai_generated BOOLEAN DEFAULT FALSE,
  worn_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE outfit_items (
  id SERIAL PRIMARY KEY,
  outfit_id INTEGER REFERENCES outfits(id) ON DELETE CASCADE,
  clothing_id INTEGER REFERENCES clothes(id) ON DELETE CASCADE
);