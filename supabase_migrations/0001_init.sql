create table if not exists profiles (
	id uuid primary key default gen_random_uuid(),
	email text unique,
	stripe_customer_id text,
	subscribed boolean default false,
	created_at timestamp with time zone default now()
);

create table if not exists checks (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references profiles(id) on delete set null,
	image_url text not null,
	label text not null,
	reason text not null,
	confidence numeric not null,
	created_at timestamp with time zone default now()
);

create index if not exists idx_checks_user_created on checks(user_id, created_at desc);




