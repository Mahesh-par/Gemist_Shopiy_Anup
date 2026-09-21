FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy all source files
COPY . .

# Generate Prisma client for PostgreSQL and build the app
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
# Prefer compose env_file; do not bake secrets into the image
ENV PORT=3000

# Run database migrations, then start the production server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
