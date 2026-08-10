-- 007: Buat bucket Storage privat untuk dokumen SK (sk-documents)
-- Jalankan di Supabase SQL Editor (sama seperti migrasi lain).
-- Bucket privat: akses file HANYA lewat backend (signed URL 5 menit),
-- tidak bisa diakses publik langsung.

INSERT INTO storage.buckets (id, name, public)
VALUES ('sk-documents', 'sk-documents', false)
ON CONFLICT (id) DO NOTHING;

-- (Opsional) Policy RLS agar bucket aman dari akses publik:
-- seluruh akses lewat service-role backend sudah bypass RLS, jadi policy
-- di bawah hanya mencegah akses anonim langsung ke storage.
DROP POLICY IF EXISTS "sk_documents_private_read" ON storage.objects;
CREATE POLICY "sk_documents_private_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'sk-documents' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "sk_documents_private_write" ON storage.objects;
CREATE POLICY "sk_documents_private_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sk-documents' AND (SELECT auth.role()) = 'authenticated');
