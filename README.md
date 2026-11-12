# 📦 CRUD de Productos

Una app CRUD de ejemplo con tres piezas desplegadas por separado:

| Capa       | Tecnología                        | Despliegue                 |
|------------|-----------------------------------|----------------------------|
| Frontend   | React 19 + Vite + CSS             | **Netlify**                |
| Backend    | Node.js + Express 5 (JavaScript)  | **Google Cloud Run (GCP)** |
| Base datos | TiDB (compatible con MySQL)       | **TiDB Cloud**             |

```
Navegador ──► Netlify (React) ──fetch──► Cloud Run (Express API) ──TLS──► TiDB Cloud
```

El frontend **nunca** habla con la base de datos directamente: todo pasa por la API, que guarda las credenciales.

## Estructura

```
crud-productos/
├── database/schema.sql          # Base de datos + tabla + datos de ejemplo
├── backend/                     # API REST (Cloud Run)
│   ├── src/index.js
│   ├── src/db.js                # Pool de conexiones mysql2 (TLS)
│   ├── src/routes/productos.js
│   ├── src/scripts/init-db.js   # npm run db:init
│   ├── Dockerfile
│   └── .env.example
├── frontend/                    # React (Netlify)
│   ├── src/App.jsx
│   ├── src/api.js
│   ├── src/components/
│   └── .env.example
└── netlify.toml
```

## Endpoints de la API

| Método | Ruta                 | Descripción                         |
|--------|----------------------|-------------------------------------|
| GET    | `/health`            | Healthcheck de la API               |
| GET    | `/health/db`         | Comprueba la conexión con TiDB      |
| GET    | `/api/productos?q=`  | Listar (búsqueda opcional)          |
| GET    | `/api/productos/:id` | Obtener uno                         |
| POST   | `/api/productos`     | Crear                               |
| PUT    | `/api/productos/:id` | Actualizar                          |
| DELETE | `/api/productos/:id` | Eliminar                            |

Body JSON: `{ "nombre": "...", "descripcion": "...", "precio": 10.5, "stock": 3 }`

---

## 1️⃣ TiDB Cloud (base de datos)

1. En <https://tidbcloud.com> → **Create Resource** → elige **TiDB Cloud Starter** (gratis).
   Región sugerida: una de AWS en EE. UU. (p. ej. `us-east-1`), cerca de Cloud Run `us-central1`.
2. Cuando el cluster esté *Available*, pulsa **Connect**:
   - *Connect With*: **General**
   - Pulsa **Generate Password** y guárdala (solo se muestra una vez).
   - Anota **HOST**, **PORT** (4000) y **USERNAME** (tiene un prefijo, p. ej. `2abcXYZ.root`).
3. Crea la tabla con **una** de estas opciones:
   - **SQL Editor** de la consola de TiDB: pega [`database/schema.sql`](database/schema.sql) y ejecuta.
   - **Terminal**: completa `backend/.env` (ver paso 2) y corre `npm run db:init`.

> ℹ️ Cloud Run no tiene IP fija. Si configuras reglas de firewall / IP Access List en TiDB, permite `0.0.0.0/0`
> (la conexión sigue protegida por TLS + usuario/contraseña).

## 2️⃣ Probar en local

```powershell
# Backend
cd backend
copy .env.example .env      # completa DB_HOST, DB_USER, DB_PASSWORD
npm install
npm run db:init             # crea la base, la tabla y datos de ejemplo
npm run dev                 # http://localhost:8080  →  /health/db

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
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
   ```
2. Guarda la contraseña de TiDB en **Secret Manager**:
   ```powershell
   Set-Content pass.txt "TU_PASSWORD" -NoNewline
   gcloud secrets create tidb-password --data-file=pass.txt
   Remove-Item pass.txt

   # Permite a Cloud Run leer el secreto (cuenta de servicio por defecto de Compute)
   $PROJECT_NUMBER = gcloud projects describe (gcloud config get-value project) --format="value(projectNumber)"
   gcloud secrets add-iam-policy-binding tidb-password `
     --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
     --role="roles/secretmanager.secretAccessor"
   ```
3. Despliega desde la carpeta `backend` (Cloud Build usa el `Dockerfile`):
   ```powershell
   cd backend
   gcloud run deploy crud-productos-api `
     --source . `
     --region us-central1 `
     --allow-unauthenticated `
     --set-env-vars "DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com,DB_PORT=4000,DB_USER=xxxxxxxx.root,DB_NAME=crud_productos" `
     --set-secrets "DB_PASSWORD=tidb-password:latest"
   ```
4. Al terminar verás la URL del servicio, p. ej. `https://crud-productos-api-xxxxx-uc.a.run.app`.
   Pruébala: `https://.../health/db` → `{"status":"ok","db":"8.0.11-TiDB-..."}`.

## 4️⃣ Frontend en Netlify

**Opción A — desde GitHub (recomendada):**
1. En Netlify: **Add new site → Import an existing project** → elige el repo.
   El archivo [`netlify.toml`](netlify.toml) ya define `base = frontend`, el comando de build y la carpeta `dist`.
2. En **Site configuration → Environment variables** añade:
   `VITE_API_URL = https://crud-productos-api-xxxxx-uc.a.run.app`
3. **Deploy**. (Si cambias la variable después, vuelve a desplegar: Vite la incrusta en tiempo de build.)

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
