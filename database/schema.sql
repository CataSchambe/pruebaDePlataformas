-- =====================================================================
-- Esquema de la base de datos (Supabase / PostgreSQL)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

create table if not exists public.productos (
  id           bigint generated always as identity primary key,
  nombre       text        not null check (char_length(nombre) between 1 and 120),
  descripcion  text        default '',
  precio       numeric(12, 2) not null default 0 check (precio >= 0),
  stock        integer     not null default 0 check (stock >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Mantener updated_at actualizado automáticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_productos_updated_at on public.productos;
create trigger trg_productos_updated_at
before update on public.productos
for each row execute function public.set_updated_at();

-- Seguridad: activamos RLS SIN políticas públicas.
-- Así la tabla NO es accesible con la clave pública (anon/publishable);
-- solo el backend (con la clave secreta / service_role) puede leer y escribir.
alter table public.productos enable row level security;

-- Datos de ejemplo (opcional)
insert into public.productos (nombre, descripcion, precio, stock) values
  ('Teclado mecánico', 'Switches rojos, retroiluminado', 59.90, 15),
  ('Mouse inalámbrico', 'Sensor óptico 16000 DPI', 29.50, 40),
  ('Monitor 27"', 'IPS 1440p 144Hz', 289.00, 7);
