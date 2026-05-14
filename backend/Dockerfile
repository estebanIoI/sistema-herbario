FROM node:20-alpine

# Aplicar parches de seguridad disponibles en Alpine
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

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

# Generar Prisma client si es necesario
# RUN npx prisma generate

# Cambiar a usuario no-root
USER nodejs

EXPOSE 5001

CMD ["node", "server.js"]
