-- Enable necessary extensions
create extension if not exists "pgcrypto";

-- Create logs table
create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  entry_type text not null check (entry_type in ('daily_work', 'goal_progress', 'learning', 'win', 'help_given', 'feedback_received', 'leave')),
  title text not null check (char_length(title) <= 200),
  todos jsonb,
  description text,
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better query performance
create index idx_logs_user_date on public.logs (user_id, date desc);
create index idx_logs_user_entry_type on public.logs (user_id, entry_type);
create index idx_logs_deadline on public.logs (user_id, deadline) where deadline is not null;

-- Enable Row Level Security
alter table public.logs enable row level security;

-- Create RLS policies
-- Policy: Users can view only their own logs
create policy "Users can view their own logs"
  on public.logs
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert only their own logs
create policy "Users can insert their own logs"
  on public.logs
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update only their own logs
create policy "Users can update their own logs"
  on public.logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete only their own logs
create policy "Users can delete their own logs"
  on public.logs
  for delete
  using (auth.uid() = user_id);

-- Create a function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger set_updated_at
  before update on public.logs
  for each row
  execute function public.handle_updated_at();
