FROM node:18-alpine
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# copy source
COPY . .

# If you use TypeScript, add build step:
# RUN npm run build
# CMD ["node", "dist/index.js"]

EXPOSE 5000
# ensure your start script uses a port from process.env.PORT
CMD ["node", "index.js"]
