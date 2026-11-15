-- Foto dei piatti, loghi e copertine: bucket pubblico in lettura, scrittura solo nella cartella del proprio locale.
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (public.is_admin() or public.member_role(((storage.foldername(name))[1])::uuid) = 'titolare'));
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (public.is_admin() or public.member_role(((storage.foldername(name))[1])::uuid) = 'titolare'));
