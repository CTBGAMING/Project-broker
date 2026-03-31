-- Contractor portal upgrades: milestones, photos, messaging, notifications, payout requests, reviews
-- Run in Supabase SQL editor.

create table if not exists public.project_milestones (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.project_photos (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  url text not null,
  kind text not null default 'progress',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  sender_id uuid not null,
  recipient_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_project_idx on public.messages(project_id, created_at);
create index if not exists messages_recipient_idx on public.messages(recipient_id, created_at);

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null,
  type text,
  title text,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at);

create table if not exists public.payout_requests (
  id bigserial primary key,
  contractor_id uuid not null,
  amount numeric not null,
  status text not null default 'requested',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payout_requests_contractor_idx on public.payout_requests(contractor_id, created_at);

create table if not exists public.reviews (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  contractor_id uuid not null,
  reviewer_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(project_id, reviewer_id)
);
create index if not exists reviews_contractor_idx on public.reviews(contractor_id, created_at);

-- =====================
-- RLS (recommended)
-- =====================
alter table public.project_milestones enable row level security;
alter table public.project_photos enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payout_requests enable row level security;
alter table public.reviews enable row level security;

-- Milestones: customer or awarded contractor can read; contractor can insert/update.
create policy if not exists "milestones_read_customer_or_contractor" on public.project_milestones
for select using (
  exists(select 1 from public.projects p
    where p.id = project_milestones.project_id
      and (p.owner_id = auth.uid() or p.awarded_contractor_id = auth.uid())
  )
);

create policy if not exists "milestones_write_contractor_only" on public.project_milestones
for insert with check (
  created_by = auth.uid()
  and exists(select 1 from public.projects p
    where p.id = project_milestones.project_id
      and p.awarded_contractor_id = auth.uid()
  )
);

create policy if not exists "milestones_update_contractor_only" on public.project_milestones
for update using (
  exists(select 1 from public.projects p
    where p.id = project_milestones.project_id
      and p.awarded_contractor_id = auth.uid()
  )
);

-- Photos: customer or awarded contractor can read; contractor can insert.
create policy if not exists "photos_read_customer_or_contractor" on public.project_photos
for select using (
  exists(select 1 from public.projects p
    where p.id = project_photos.project_id
      and (p.owner_id = auth.uid() or p.awarded_contractor_id = auth.uid())
  )
);

create policy if not exists "photos_write_contractor_only" on public.project_photos
for insert with check (
  created_by = auth.uid()
  and exists(select 1 from public.projects p
    where p.id = project_photos.project_id
      and p.awarded_contractor_id = auth.uid()
  )
);

-- Messages: sender/recipient can read; sender can insert.
create policy if not exists "messages_read_participants" on public.messages
for select using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy if not exists "messages_insert_sender" on public.messages
for insert with check (sender_id = auth.uid());

-- Notifications: user can read/update own; inserts allowed (tighten later with service role if you want).
create policy if not exists "notifications_read_own" on public.notifications
for select using (user_id = auth.uid());

create policy if not exists "notifications_update_own" on public.notifications
for update using (user_id = auth.uid());

create policy if not exists "notifications_insert_any" on public.notifications
for insert with check (true);

-- Payout requests: contractor can read/insert own (updates should be admin/service role only).
create policy if not exists "payout_read_own" on public.payout_requests
for select using (contractor_id = auth.uid());

create policy if not exists "payout_insert_own" on public.payout_requests
for insert with check (contractor_id = auth.uid());

-- Reviews: contractor and reviewer can read; customer can insert for completed projects they own.
create policy if not exists "reviews_read_contractor_or_reviewer" on public.reviews
for select using (contractor_id = auth.uid() or reviewer_id = auth.uid());

create policy if not exists "reviews_insert_customer_completed" on public.reviews
for insert with check (
  reviewer_id = auth.uid()
  and exists(
    select 1 from public.projects p
    where p.id = reviews.project_id
      and p.owner_id = auth.uid()
      and p.awarded_contractor_id = reviews.contractor_id
      and p.status = 'completed'
  )
);

-- =====================
-- Optional triggers (server-side notifications)
-- =====================
create or replace function public.notify_project_awarded()
returns trigger as $$
begin
  if new.awarded_contractor_id is not null and (old.awarded_contractor_id is distinct from new.awarded_contractor_id) then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.awarded_contractor_id,
      'award',
      'You won a project 🎉',
      coalesce('Project awarded: ' || new.project_name, 'A project was awarded to you.'),
      '/dashboard/contractor'
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_project_awarded on public.projects;
create trigger trg_notify_project_awarded
after update of awarded_contractor_id on public.projects
for each row execute function public.notify_project_awarded();

create or replace function public.notify_message_received()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.recipient_id,
    'message',
    'New message',
    'You have a new message on a project.',
    '/dashboard/contractor'
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_message_received on public.messages;
create trigger trg_notify_message_received
after insert on public.messages
for each row execute function public.notify_message_received();
