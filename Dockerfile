FROM node:20-alpine
WORKDIR /app

# Install OpenSSL — required by Prisma for database connections
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Provide a dummy DATABASE_URL so prisma generate (postinstall) can validate the schema.
# The real DATABASE_URL is supplied at runtime via environment variables.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node server/index.js"]
