# Stage 1:# Build stage
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npx expo export --platform web
# Build the server (compiling TS to JS)
RUN npx tsc -p tsconfig.server.json

# Production stage
FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist-server/server/index.js"]
