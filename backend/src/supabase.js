import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_KEY. ' +
      'Revisa el archivo .env (local) o la configuración del servicio en Cloud Run.'
  );
  process.exit(1);
}

// Cliente de servidor: usa la clave secreta (service_role / sb_secret_...).
// ¡Nunca expongas esta clave en el frontend!
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
