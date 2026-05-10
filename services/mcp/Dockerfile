FROM node:22-alpine

WORKDIR /app

COPY services/mcp/package*.json ./
RUN npm install

COPY services/mcp/tsconfig.json ./
COPY services/mcp/src ./src

RUN npm run build

ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
