-- ============================================================
-- DAILY WORK LOG SCHEMA (NEXT.JS + SUPABASE)
-- Includes soft delete + secure Row Level Security (RLS)
-- ============================================================

-- Enable necessary extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Table: public.logs
-- ============================================================
create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  entry_type text not null check (entry_type in (
    'daily_work', 'goal_progress', 'learning', 'win',
    'help_given', 'feedback_received', 'leave'
  )),
  title text not null check (char_length(title) <= 200),
  todos jsonb,
  description text,
  deadline timestamptz,
  deleted_at timestamptz default null,       -- soft delete timestamp
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Indexes for query performance
-- ============================================================
create index idx_logs_user_date on public.logs (user_id, date desc);
create index idx_logs_user_entry_type on public.logs (user_id, entry_type);
create index idx_logs_deadline on public.logs (user_id, deadline) where deadline is not null;
create index idx_logs_deleted on public.logs (user_id, deleted_at) where deleted_at is null;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.logs enable row level security;
alter table public.logs force row level security;

-- ------------------------
-- SELECT Policy
-- ------------------------
create policy "Users can view their own active logs"
  on public.logs
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- ------------------------
-- INSERT Policy
-- ------------------------
create policy "Users can insert their own logs"
  on public.logs
  for insert
  with check (auth.uid() = user_id);

-- ------------------------
-- UPDATE Policy
-- (Allows edit, soft delete, and restore)
-- Note: The with check clause must allow the updated row state
-- ------------------------
create policy "Users can update their own logs"
  on public.logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Trigger Function: auto-update 'updated_at'
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();

  -- If soft deleted, align updated_at with deleted_at
  if new.deleted_at is distinct from old.deleted_at and new.deleted_at is not null then
    new.updated_at = new.deleted_at;
  end if;

  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Trigger: set updated_at before update
-- ============================================================
create trigger set_updated_at
  before update on public.logs
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- ✅ Notes:
-- - Soft delete = update logs set deleted_at = now() where id = ...
-- - Restore     = update logs set deleted_at = null where id = ...
-- - Normal SELECT hides deleted rows (deleted_at IS NULL)
-- ============================================================
