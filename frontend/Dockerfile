FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

EXPOSE 5173

# Use preview mode for production or dev mode for development
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
