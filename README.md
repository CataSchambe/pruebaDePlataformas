# 📦 CRUD de Productos

Una app CRUD de ejemplo con tres piezas desplegadas por separado:

| Capa      | Tecnología                          | Despliegue                  |
|-----------|-------------------------------------|-----------------------------|
| Frontend  | React 19 + Vite + CSS               | **Netlify**                 |
| Backend   | Node.js + Express 5 (JavaScript)    | **Google Cloud Run (GCP)**  |
| Base datos| PostgreSQL                          | **Supabase**                |

```
Navegador ──► Netlify (React) ──fetch──► Cloud Run (Express API) ──► Supabase (Postgres)
```

El frontend **nunca** habla con Supabase directamente: todo pasa por la API, que guarda la clave secreta.

## Estructura

```
crud-productos/
├── database/schema.sql      # Tabla + trigger + RLS + datos de ejemplo
├── backend/                 # API REST (Cloud Run)
│   ├── src/index.js
│   ├── src/supabase.js
│   ├── src/routes/productos.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # React (Netlify)
│   ├── src/App.jsx
│   ├── src/api.js
│   ├── src/components/
│   └── .env.example
└── netlify.toml
```

## Endpoints de la API

| Método | Ruta                   | Descripción                      |
|--------|------------------------|----------------------------------|
| GET    | `/health`              | Healthcheck                      |
| GET    | `/api/productos?q=`    | Listar (búsqueda opcional)       |
| GET    | `/api/productos/:id`   | Obtener uno                      |
| POST   | `/api/productos`       | Crear                            |
| PUT    | `/api/productos/:id`   | Actualizar                       |
| DELETE | `/api/productos/:id`   | Eliminar                         |

Body JSON: `{ "nombre": "...", "descripcion": "...", "precio": 10.5, "stock": 3 }`

---

## 1️⃣ Supabase (base de datos)

1. Crea un proyecto en <https://supabase.com/dashboard>.
2. Ve a **SQL Editor → New query**, pega el contenido de [`database/schema.sql`](database/schema.sql) y pulsa **Run**.
3. En **Project Settings → API Keys** copia:
   - **Project URL** → `SUPABASE_URL`
   - **Secret key** (`sb_secret_...`) o la legacy **service_role** → `SUPABASE_SERVICE_KEY`

> ⚠️ La clave secreta salta RLS. Solo debe vivir en el backend, nunca en el frontend ni en Git.

## 2️⃣ Probar en local

```powershell
# Backend
cd backend
copy .env.example .env      # y completa los valores de Supabase
npm install
npm run dev                 # http://localhost:8080

# Frontend (otra terminal)
cd frontend
copy .env.example .env      # VITE_API_URL=http://localhost:8080
npm install
npm run dev                 # http://localhost:5173
```

## 3️⃣ Backend en Google Cloud Run

1. Instala el [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) y autentícate:
   ```powershell
   gcloud auth login
   gcloud config set project TU_PROJECT_ID
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
   ```
2. Despliega desde la carpeta `backend` (Cloud Build usa el `Dockerfile`):
   ```powershell
   cd backend
   gcloud run deploy crud-productos-api `
     --source . `
     --region us-central1 `
     --allow-unauthenticated `
     --set-env-vars "SUPABASE_URL=https://TU-PROYECTO.supabase.co,SUPABASE_SERVICE_KEY=TU_CLAVE,ALLOWED_ORIGINS=http://localhost:5173"
   ```
3. Al terminar verás la URL del servicio, p. ej. `https://crud-productos-api-xxxxx-uc.a.run.app`.
   Pruébala: `https://.../health` → `{"status":"ok"}`.

> 💡 **Recomendado para producción:** guarda la clave en **Secret Manager** en vez de en una variable plana:
> ```powershell
> Set-Content key.txt "TU_CLAVE" -NoNewline
> gcloud secrets create supabase-service-key --data-file=key.txt
> Remove-Item key.txt
> gcloud run services update crud-productos-api --region us-central1 `
>   --set-secrets "SUPABASE_SERVICE_KEY=supabase-service-key:latest"
> ```
> (La cuenta de servicio de Cloud Run necesita el rol *Secret Manager Secret Accessor*.)

## 4️⃣ Frontend en Netlify

**Opción A — desde GitHub (recomendada):**
1. Sube este repositorio a GitHub.
2. En Netlify: **Add new site → Import an existing project** → elige el repo.
   El archivo [`netlify.toml`](netlify.toml) ya define `base = frontend`, el comando de build y la carpeta `dist`.
3. En **Site configuration → Environment variables** añade:
   `VITE_API_URL = https://crud-productos-api-xxxxx-uc.a.run.app`
4. **Deploy**. (Si cambias la variable después, vuelve a desplegar: Vite la incrusta en tiempo de build.)

**Opción B — con la CLI:**
```powershell
npm install -g netlify-cli
netlify login
cd frontend
$env:VITE_API_URL="https://crud-productos-api-xxxxx-uc.a.run.app"; npm run build
netlify deploy --prod --dir dist
```

## 5️⃣ Cerrar el círculo: CORS

Con la URL final de Netlify (p. ej. `https://mi-crud.netlify.app`), actualiza el backend:

```powershell
gcloud run services update crud-productos-api --region us-central1 `
  --update-env-vars "^@^ALLOWED_ORIGINS=https://mi-crud.netlify.app,http://localhost:5173"
```

> El prefijo `^@^` cambia el separador de gcloud para que la coma forme parte del valor.

¡Listo! 🎉 Abre la URL de Netlify y prueba crear, editar, buscar y eliminar productos.
