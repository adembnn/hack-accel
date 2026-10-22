# Aiven Runtime : une seule image sert l'interface (dist/) ET l'API de données (src/server/).
# DATABASE_URL est injectée par Aiven (jamais écrite ici) ; WRITE_TOKEN se saisit en secret dans la Console.
FROM node:22-alpine AS build
# Test local seulement, derrière un proxy qui intercepte TLS : --build-arg NPM_STRICT_SSL=false. Jamais sur Aiven.
ARG NPM_STRICT_SSL=true
ENV npm_config_strict_ssl=$NPM_STRICT_SSL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ARG NPM_STRICT_SSL=true
ENV npm_config_strict_ssl=$NPM_STRICT_SSL
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY infra ./infra
COPY src/server ./src/server
EXPOSE 8080
USER node
# Le serveur applique le schéma (idempotent) au démarrage, puis écoute PORT.
CMD ["node", "src/server/serveur.mjs"]
