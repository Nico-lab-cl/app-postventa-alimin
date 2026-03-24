# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Install expo-cli and build web
RUN npx expo export:web

# Stage 2: Serve
FROM nginx:alpine

# Copy static files to nginx
COPY --from=build /app/web-build /usr/share/nginx/html

# Copy custom nginx config if needed or use default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
