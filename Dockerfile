# P.Y.T. — despliegue en Google Cloud Run (un solo contenedor: API + frontend + SQLite)
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
# Cloud Run inyecta PORT (8080); server/index.js lo lee de process.env.PORT
EXPOSE 8080
CMD ["node", "server/index.js", "--prod"]
