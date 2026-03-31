# --- STAGE BUILD ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
# Génère le client Prisma DANS le dossier par défaut (prisma/generated)
RUN npx prisma generate
COPY . .
RUN npm run build

# --- STAGE RUN ---
FROM node:20-alpine
WORKDIR /app
# 1. Copie des dépendances
COPY --from=build /app/node_modules ./node_modules
# 2. Copie du code compilé
COPY --from=build /app/dist ./dist
# 3. Copie du dossier prisma ET du dossier generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated
EXPOSE 3000
CMD ["node", "dist/src/main"]