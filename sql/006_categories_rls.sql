-- 006_categories_rls.sql
-- RLS policies for shopping categories

alter table public.shopping_categories enable row level security;

drop policy if exists "Users can read own shopping categories" on public.shopping_categories;
create policy "Users can read own shopping categories"
on public.shopping_categories
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own shopping categories" on public.shopping_categories;
create policy "Users can insert own shopping categories"
on public.shopping_categories
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own shopping categories" on public.shopping_categories;
create policy "Users can update own shopping categories"
on public.shopping_categories
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own shopping categories" on public.shopping_categories;
create policy "Users can delete own shopping categories"
on public.shopping_categories
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.shopping_categories to authenticated;
