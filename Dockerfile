FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
    && pnpm install --frozen-lockfile --prod

COPY adapters/openai/chatgpt-plugin/package.json ./adapters/openai/chatgpt-plugin/package.json
RUN npm install --omit=dev --prefix adapters/openai/chatgpt-plugin

COPY --chown=node:node . .

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

USER node

CMD ["node", "adapters/openai/chatgpt-plugin/server.mjs"]
