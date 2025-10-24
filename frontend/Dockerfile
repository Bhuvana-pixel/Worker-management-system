# Stage 1 - Build the Vite React app
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . .

# Build production version
RUN npm run build

# Stage 2 - Serve with Nginx
FROM nginx:alpine

# Copy build output from previous stage to Nginx folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
