FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src

ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "src/index.mjs"]
