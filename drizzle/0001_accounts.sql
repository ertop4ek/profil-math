CREATE TABLE profile_accounts (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE profile_codes (
  token TEXT PRIMARY KEY,
  account_id TEXT UNIQUE NOT NULL REFERENCES profile_accounts(id),
  digest TEXT NOT NULL,
  expires INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE profile_sessions (
  digest TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES profile_accounts(id),
  expires INTEGER NOT NULL
);
CREATE TABLE profile_auth_limits (
  bucket TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
