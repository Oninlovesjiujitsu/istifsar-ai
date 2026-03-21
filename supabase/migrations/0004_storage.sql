insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'document-scans',
  'document-scans',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/webp'
  ]
)
on conflict (id) do nothing;

create policy "document-scans: tier_3+ can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'document-scans'
    and public.is_tier('tier_3')
  );

create policy "document-scans: owner and tier_1+ can read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'document-scans'
    and (
      owner = auth.uid()
      or public.is_tier('tier_1')
    )
  );

create policy "document-scans: owner can delete pending"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'document-scans'
    and owner = auth.uid()
  );
