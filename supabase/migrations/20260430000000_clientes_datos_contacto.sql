-- Datos básicos requeridos para clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono TEXT;
