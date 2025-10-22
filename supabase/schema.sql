-- USERS/PROFIEL
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles owner rw"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- KLANTEN
create table if not exists clients (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  hourly_rate numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);
alter table clients enable row level security;
create policy "clients owner rw"
  on clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- URENREGISTRATIE
create table if not exists time_entries (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id bigint references clients(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  seconds int generated always as (
    case when ended_at is null then null
         else extract(epoch from (ended_at - started_at))::int end
  ) stored,
  note text,
  created_at timestamptz default now()
);
create index if not exists idx_time_entries_user_time on time_entries(user_id, started_at desc);
alter table time_entries enable row level security;
create policy "time owner rw"
  on time_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- WEEKPLANNING / AGENDA
create table if not exists planning_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id bigint references clients(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  link text,
  created_at timestamptz default now()
);
create index if not exists idx_planning_user_time on planning_events(user_id, starts_at desc);
alter table planning_events enable row level security;
create policy "planning owner rw"
  on planning_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- TAKEN
create table if not exists tasks (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  priority int default 2,
  due_date date,
  done boolean default false,
  created_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "tasks owner rw"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- FACTURATIE
create table if not exists invoices (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id bigint references clients(id) on delete set null,
  number text unique,
  issue_date date default current_date,
  due_date date,
  total_ex_vat numeric(12,2) default 0,
  vat_rate numeric(5,2) default 21,
  paid boolean default false,
  created_at timestamptz default now()
);
alter table invoices enable row level security;
create policy "invoices owner rw"
  on invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists invoice_items (
  id bigserial primary key,
  invoice_id bigint not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) default 1,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);
alter table invoice_items enable row level security;
create policy "items via parent owner"
  on invoice_items for all
  using (exists (
    select 1 from invoices i
    where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from invoices i
    where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
  ));
