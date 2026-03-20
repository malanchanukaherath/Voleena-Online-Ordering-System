# server/Dockerfile
# Use Node.js LTS
FROM node:20-alpine  

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the server code
COPY . .

ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Run the app
CMD ["node", "index.js"]