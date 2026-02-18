FROM node:20-alpine
WORKDIR /app

# Install OpenSSL — required by Prisma for database connections
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Build-time dummy so prisma generate succeeds during npm install.
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001

# At runtime, Render injects the real DATABASE_URL as a container env var.
# We don't set ENV DATABASE_URL here so Render's value takes precedence.
CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npx prisma migrate deploy && npx prisma db seed; else echo 'WARNING: DATABASE_URL not set, skipping migrations'; fi && node server/index.js"]
