-- Crear el bucket de fotos de prestadores (público para lectura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-prestadores',
  'fotos-prestadores',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (cualquiera puede ver las fotos/videos)
CREATE POLICY "Lectura publica fotos-prestadores"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-prestadores');

-- Subida anónima (el prestador sube con la anon key)
CREATE POLICY "Subida anonima fotos-prestadores"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'fotos-prestadores');

-- Actualización anónima (para reemplazar archivos)
CREATE POLICY "Actualizacion anonima fotos-prestadores"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'fotos-prestadores')
WITH CHECK (bucket_id = 'fotos-prestadores');

-- Eliminación anónima (para borrar fotos viejas)
CREATE POLICY "Eliminacion anonima fotos-prestadores"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'fotos-prestadores');
