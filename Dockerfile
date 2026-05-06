# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar archivos de configuración necesarios para el build
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copiar código fuente
COPY src ./src

# Construir la aplicación
RUN npm run build

# Verificar que dist existe
RUN ls -la dist/

# Etapa de producción
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar la aplicación construida desde la etapa de builder
COPY --from=builder /app/dist ./dist

# Verificar archivos copiados
RUN ls -la dist/

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"]