-- 005_categories.sql
-- Customizable shopping categories per user

create table if not exists public.shopping_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '🛒',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, name)
);

create index if not exists shopping_categories_user_position_idx
on public.shopping_categories (user_id, position);

drop trigger if exists set_shopping_categories_updated_at on public.shopping_categories;
create trigger set_shopping_categories_updated_at
before update on public.shopping_categories
for each row
execute function public.set_updated_at();
