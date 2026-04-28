FROM node:18-alpine

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

EXPOSE 3001

# Usar comando más robusto
CMD ["node", "server.js"]
