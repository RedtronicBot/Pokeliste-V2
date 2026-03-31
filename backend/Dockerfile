# --- STAGE BUILD ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
COPY . .
RUN npx prisma generate
RUN npm run build

# --- STAGE RUN ---
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/src/main"]