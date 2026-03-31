# --- STAGE BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
RUN npm run build
COPY --from=build /app/prisma/generated ./dist/prisma/generated
# --- STAGE RUN ---
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main"]