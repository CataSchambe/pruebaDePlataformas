-- =====================================================================
-- Esquema de la base de datos (TiDB Cloud / compatible con MySQL)
-- Opción 1: TiDB Cloud Console -> tu cluster -> SQL Editor -> pegar y ejecutar
-- Opción 2: desde /backend ejecutar `npm run db:init` (usa las variables del .env)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS crud_productos;
USE crud_productos;

CREATE TABLE IF NOT EXISTS productos (
  id           BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120)  NOT NULL,
  descripcion  TEXT          NULL,
  precio       DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock        INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos de ejemplo (solo se insertan si la tabla está vacía)
INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT * FROM (
  SELECT 'Teclado mecánico' AS nombre, 'Switches rojos, retroiluminado' AS descripcion, 59.90 AS precio, 15 AS stock
  UNION ALL SELECT 'Mouse inalámbrico', 'Sensor óptico 16000 DPI', 29.50, 40
  UNION ALL SELECT 'Monitor 27"', 'IPS 1440p 144Hz', 289.00, 7
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM productos);
