-- Agrega columna de galería multimedia a la tabla de prestadores
ALTER TABLE prestadores
  ADD COLUMN IF NOT EXISTS galeria_urls text[] DEFAULT NULL;
