FROM node:20-alpine

# Aplicar parches de seguridad y herramientas necesarias
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache su-exec && \
    rm -rf /var/cache/apk/*

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Crear directorio de uploads con permisos correctos
RUN mkdir -p /app/uploads/plants && chown -R nodejs:nodejs /app/uploads

# Entrypoint que garantiza permisos del volumen montado en runtime
# sed convierte CRLF → LF por si el archivo fue editado en Windows
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["/docker-entrypoint.sh"]
