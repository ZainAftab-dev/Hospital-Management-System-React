# ============================================================
#  HMS Web (Next.js 15 / React 19)  — production image
# ============================================================
FROM node:20-bookworm-slim

WORKDIR /app

# The browser calls the API directly, so this URL must be reachable
# from the CLIENT's machine. For a single-machine handoff that is the
# published API port on localhost. Override at build time if deploying.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Install dependencies (cached unless package.json changes)
#    NODE_ENV is left unset here so devDependencies (TypeScript, Tailwind,
#    PostCSS) are installed — they are required to build. `next start`
#    runs in production mode automatically.
COPY package.json ./
RUN npm install

# 2. Copy source and build the production bundle
COPY . .
RUN npm run build

EXPOSE 3000

# next start binds to 0.0.0.0:3000 by default
CMD ["npm", "run", "start"]
