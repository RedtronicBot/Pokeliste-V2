FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# --- SECTION DIAGNOSTIC ---
# On affiche le contenu de /app, /app/dist et le dossier de Prisma
RUN echo "--- CONTENU DE /APP ---" && ls -la
RUN echo "--- CONTENU DE /APP/DIST ---" && ls -la dist
RUN echo "--- CONTENU DE /APP/DIST/SRC ---" && ls -la dist/src
# Ajuste le nom du dossier prisma-client ci-dessous selon ton schema.prisma
RUN echo "--- CONTENU DU DOSSIER PRISMA GENERATED ---" && ls -la prisma/generated/prisma || echo "Dossier non trouvé"

EXPOSE 3000
CMD ["node", "dist/src/main"]