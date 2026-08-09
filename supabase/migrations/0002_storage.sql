-- ============================================================
-- Storage bucket for logos / brand assets / progress photos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- Users can only upload/update/delete inside their own folder (userId/...)
create policy "brand assets: user can upload own"
on storage.objects for insert
with check (
  bucket_id = 'brand-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "brand assets: user can update own"
on storage.objects for update
using (
  bucket_id = 'brand-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "brand assets: user can delete own"
on storage.objects for delete
using (
  bucket_id = 'brand-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read (bucket is public — logos need to render without auth on login screen etc.)
create policy "brand assets: public read"
on storage.objects for select
using (bucket_id = 'brand-assets');
