-- create users table
create table if not exists users(
id uuid primary key default gen_random_uuid(),
email varchar(255) not null unique,
master_password_hash text not null,
mfa_enabled boolean not null default false,
mfa_secret text default null,
date_created timestamptz not null default now()
);


-- create vault entries table
create table if not exists vault_entries(
entry_id uuid primary key default gen_random_uuid(),
user_id uuid not null references users(id) on delete cascade,
website_name varchar(255) not null,
website_url varchar(255) not null, 
username varchar(255) not null,
encrypted_blob text not null,
iv text not null,
date_created timestamptz not null default now(),
date_last_used timestamptz default null
);

