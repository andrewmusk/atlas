FROM node:20-alpine
WORKDIR /app

# Install OpenSSL — required by Prisma for database connections
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Dummy DATABASE_URL for prisma generate at build time only.
# ARG does not persist into the running container — the real DATABASE_URL
# is injected by Render at runtime.
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node server/index.js"]
