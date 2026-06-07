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
FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install opencv-python-headless numpy

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

COPY python ./python

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]