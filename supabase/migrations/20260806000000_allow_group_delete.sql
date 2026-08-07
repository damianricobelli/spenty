-- The app's server functions use the anon key, and `groups` has no DELETE
-- policy, so `deleteGroup` silently matched zero rows: children (members,
-- expenses, splits, categories) were removed but the group row survived as
-- an orphan. This mirrors the trust model already used for insert/update
-- (anyone with the link can manage the group).
--
-- Apply with: supabase db push   (or run in the SQL editor of the project)

drop policy if exists "Allow group deletion" on public.groups;
create policy "Allow group deletion"
  on public.groups
  for delete
  using (true);
