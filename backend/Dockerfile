FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

# Étape CRUCIALE : On prépare l'environnement Prisma
COPY prisma ./prisma/

# On force la génération. 
# Si ton environnement Docker est bien en 'production', 
# Prisma devrait générer du JS.
RUN npx prisma generate

COPY . .
RUN npm run build

# --- DIAGNOSTIC FINAL (Le juge de paix) ---
# On vérifie si NestJS a bien généré du JS pour Prisma dans DIST
RUN echo "--- VERIFICATION JS DANS DIST/PRISMA ---" && \
    ls -la dist/prisma/generated/prisma || echo "Pas de JS ici"

EXPOSE 3000
CMD ["node", "dist/src/main"]