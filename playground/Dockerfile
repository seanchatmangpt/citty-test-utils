# Production Dockerfile for citty-test-utils playground
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package.json
COPY src/ src/

# Install production dependencies
RUN npm install --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S playground -u 1001

# Change ownership of the app directory
RUN chown -R playground:nodejs /app
USER playground

# Expose port (if needed for future web interface)
EXPOSE 3000

# Default command
CMD ["node", "src/cli.mjs", "--show-help"]
