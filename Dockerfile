# Aiven Runtime : build Vite puis serveur Node qui sert dist/ et lit PORT.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY src/app/serveur.mjs ./src/app/serveur.mjs
COPY package.json ./
EXPOSE 8080
USER node
CMD ["node", "src/app/serveur.mjs"]
