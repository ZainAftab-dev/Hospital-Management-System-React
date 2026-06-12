# ============================================================
#  HMS API (NestJS + Prisma + SQL Server)  — production image
# ============================================================
FROM node:20-bookworm-slim

# Prisma needs openssl + ca-certificates on Debian
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install dependencies (cached unless package.json changes)
COPY package.json ./
RUN npm install

# 2. Copy source and build
COPY . .
RUN npx prisma generate \
 && npm run build

# 3. Normalise line endings + make the entrypoint executable
#    (the file may carry Windows CRLF endings from the host)
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 4000

# bash runs the orchestration script (wait for DB -> migrate -> seed -> start)
CMD ["bash", "docker-entrypoint.sh"]
