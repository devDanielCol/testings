FROM node:lts-alpine3.22

WORKDIR /web

COPY . .

RUN cat package.json

RUN npm install

RUN npm run build --port 8080

ENV PORT=8080

VOLUME ["/logs"]

EXPOSE 8080

CMD ["node", "./dist/server/entry.mjs"]