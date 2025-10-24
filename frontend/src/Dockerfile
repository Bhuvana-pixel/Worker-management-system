# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app

# copy package.json first (caching)
COPY package*.json ./
RUN npm ci --silent

COPY . .
# build production assets (adjust if using yarn or vite)
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
# remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# copy a minimal nginx conf if you want single page app support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
