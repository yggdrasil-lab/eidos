FROM node:22-alpine

WORKDIR /app

COPY services/graphql/package*.json ./
RUN npm install

COPY services/graphql/tsconfig.json ./
COPY services/graphql/src ./src

RUN npm run build

ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]
