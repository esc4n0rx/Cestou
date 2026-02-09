-- 004_market_rls.sql
-- RLS policies for shopping lists and inventory

alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Users can read own shopping lists" on public.shopping_lists;
create policy "Users can read own shopping lists"
on public.shopping_lists
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own shopping lists" on public.shopping_lists;
create policy "Users can insert own shopping lists"
on public.shopping_lists
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own shopping lists" on public.shopping_lists;
create policy "Users can update own shopping lists"
on public.shopping_lists
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own shopping lists" on public.shopping_lists;
create policy "Users can delete own shopping lists"
on public.shopping_lists
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own shopping list items" on public.shopping_list_items;
create policy "Users can read own shopping list items"
on public.shopping_list_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own shopping list items" on public.shopping_list_items;
create policy "Users can insert own shopping list items"
on public.shopping_list_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own shopping list items" on public.shopping_list_items;
create policy "Users can update own shopping list items"
on public.shopping_list_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own shopping list items" on public.shopping_list_items;
create policy "Users can delete own shopping list items"
on public.shopping_list_items
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own inventory items" on public.inventory_items;
create policy "Users can read own inventory items"
on public.inventory_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own inventory items" on public.inventory_items;
create policy "Users can insert own inventory items"
on public.inventory_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own inventory items" on public.inventory_items;
create policy "Users can update own inventory items"
on public.inventory_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own inventory items" on public.inventory_items;
create policy "Users can delete own inventory items"
on public.inventory_items
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own inventory movements" on public.inventory_movements;
create policy "Users can read own inventory movements"
on public.inventory_movements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own inventory movements" on public.inventory_movements;
create policy "Users can insert own inventory movements"
on public.inventory_movements
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.shopping_lists to authenticated;
grant select, insert, update, delete on public.shopping_list_items to authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select, insert on public.inventory_movements to authenticated;
