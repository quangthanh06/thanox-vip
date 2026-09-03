create table if not exists access_keys (
  id text primary key,
  key_hash text not null unique,
  key_last4 text not null,
  type text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  device_limit integer not null default 1,
  label text,
  permissions text not null default '[]',
  created_by text,
  last_used_at timestamptz,
  note text
);
create index if not exists access_keys_status_idx on access_keys (status);
create index if not exists access_keys_type_idx on access_keys (type);

create table if not exists thanox_sessions (
  id text primary key,
  token_hash text not null unique,
  key_id text not null references access_keys (id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked boolean not null default false
);
create index if not exists thanox_sessions_key_idx on thanox_sessions (key_id);

create table if not exists audit_logs (
  id text primary key,
  at timestamptz not null default now(),
  actor text,
  action text not null,
  target text,
  result text not null
);
create index if not exists audit_logs_at_idx on audit_logs (at desc);
