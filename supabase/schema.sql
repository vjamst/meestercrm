-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  hourly_rate numeric(10, 2),
  notes text
);

-- Time entries
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  client_id uuid references public.clients (id) on delete set null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_seconds integer not null,
  billable boolean default true,
  hourly_rate numeric(10, 2),
  synced_invoice_id uuid references public.invoices (id)
);

-- Planning entries
create table if not exists public.planning_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  notes text,
  external_url text,
  source text default 'manual'
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  description text,
  deadline date,
  priority text default 'high',
  status text default 'open'
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  client_id uuid references public.clients (id) on delete set null,
  invoice_number text not null,
  issue_date date not null,
  due_date date,
  status text default 'concept',
  notes text,
  total_amount numeric(12, 2) default 0,
  pdf_path text,
  sent_at timestamptz
);

-- Invoice items
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) default 0,
  unit_price numeric(12, 2) default 0,
  time_entry_id uuid references public.time_entries (id)
);

-- Email logs
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  invoice_id uuid references public.invoices (id) on delete set null,
  recipient text not null,
  subject text,
  status text,
  provider_response jsonb
);

-- Indexes
create index if not exists idx_clients_user on public.clients (user_id);
create index if not exists idx_time_entries_user on public.time_entries (user_id, start_time);
create index if not exists idx_planning_entries_user on public.planning_entries (user_id, start_time);
create index if not exists idx_tasks_user on public.tasks (user_id, deadline);
create index if not exists idx_invoices_user on public.invoices (user_id, issue_date);
create index if not exists idx_invoice_items_invoice on public.invoice_items (invoice_id);
create index if not exists idx_email_logs_user on public.email_logs (user_id, created_at);

-- Row Level Security
alter table public.clients enable row level security;
alter table public.time_entries enable row level security;
alter table public.planning_entries enable row level security;
alter table public.tasks enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.email_logs enable row level security;

-- Policies
create policy if not exists "Users can manage their clients" on public.clients
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can manage their time entries" on public.time_entries
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can manage their planning" on public.planning_entries
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can manage their tasks" on public.tasks
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can manage their invoices" on public.invoices
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Users can view and add invoice items" on public.invoice_items
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

create policy if not exists "Users can read their email logs" on public.email_logs
  using (user_id = auth.uid());

create policy if not exists "Users can insert email logs" on public.email_logs
  for insert with check (user_id = auth.uid());

-- Helper view for outstanding amounts (optional)
create or replace view public.invoice_overview as
select
  i.id,
  i.user_id,
  i.invoice_number,
  i.issue_date,
  i.due_date,
  i.status,
  i.total_amount,
  c.name as client_name
from public.invoices i
left join public.clients c on c.id = i.client_id;
