-- MServicios - Migraciones de base de datos Supabase
-- Ejecutar en el SQL Editor de tu proyecto en https://supabase.com

-- 1. Agregar columna password a la tabla clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Agregar columna password a la tabla prestadores
ALTER TABLE prestadores ADD COLUMN IF NOT EXISTS password TEXT;

-- 3. Agregar columna telefono a la tabla prestadores
ALTER TABLE prestadores ADD COLUMN IF NOT EXISTS telefono TEXT;

-- 4. Asegurarse de que la tabla clientes tiene la columna email como identificador
-- (Ya debería existir, pero por las dudas)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 5. Asegurarse de que valoraciones tiene cliente_email
ALTER TABLE valoraciones ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- Verificar la estructura de las tablas:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clientes';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prestadores';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'valoraciones';
