-- 012: Buat bucket Storage privat untuk foto atlet (atlet-photos)
-- Jalankan di Supabase SQL Editor (sama seperti migrasi lain).
-- Bucket privat: akses file HANYA lewat backend (signed URL 5 menit),
-- tidak bisa diakses publik langsung.

INSERT INTO storage.buckets (id, name, public)
VALUES ('atlet-photos', 'atlet-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy RLS agar bucket aman dari akses publik:
-- seluruh akses lewat service-role backend sudah bypass RLS, jadi policy
-- di bawah hanya mencegah akses anonim langsung ke storage.
DROP POLICY IF EXISTS "atlet_photos_private_read" ON storage.objects;
CREATE POLICY "atlet_photos_private_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'atlet-photos' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "atlet_photos_private_write" ON storage.objects;
CREATE POLICY "atlet_photos_private_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'atlet-photos' AND (SELECT auth.role()) = 'authenticated');
