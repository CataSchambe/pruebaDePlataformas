# Imagen para Google Cloud Run
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el código fuente
COPY src ./src

# Ejecutar como usuario no-root
USER node

# Cloud Run define PORT (8080 por defecto)
EXPOSE 8080
CMD ["node", "src/index.js"]
