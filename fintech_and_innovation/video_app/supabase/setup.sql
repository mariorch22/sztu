begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-app-clips', 'video-app-clips', true, 26214400, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;

drop policy if exists "Video app list clips" on storage.objects;
create policy "Video app list clips"
on storage.objects for select to anon
using (bucket_id = 'video-app-clips' and storage.foldername(name) = array['clips']);

drop policy if exists "Video app upload clips" on storage.objects;
create policy "Video app upload clips"
on storage.objects for insert to anon
with check (
  bucket_id = 'video-app-clips'
  and storage.foldername(name) = array['clips']
  and storage.extension(name) in ('mp4', 'webm')
);

commit;
