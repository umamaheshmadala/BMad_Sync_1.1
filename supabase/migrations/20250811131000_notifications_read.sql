-- Add read_at to notifications for read/unread tracking
alter table if exists public.notifications
  add column if not exists read_at timestamptz;


