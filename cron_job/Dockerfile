FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copia el resto del código (TS, configs, etc.)
COPY tsconfig.json ./
COPY src ./src

# Compila a /app/dist
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Pino: pretty solo si quieres ver legible en local (desactívalo en prod)
ENV NODE_ENV=production PINO_PRETTY=false 

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/dist ./dist

USER node

CMD ["node", "dist/cronJob.js"]
