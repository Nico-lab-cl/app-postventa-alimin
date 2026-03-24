# Stage 1: Build
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npx expo export --platform web
# Build the server (compiling TS to JS)
RUN npx tsc -p tsconfig.server.json

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist-server/server/index.js"]
