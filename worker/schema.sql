DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In a real app, hash this!
  display_name TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

DROP TABLE IF EXISTS history;
CREATE TABLE history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string of the song generation result
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
