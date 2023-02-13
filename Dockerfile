FROM node:16.16.0-alpine AS BUILDER

ENV NODE_ENV production
ARG NPM_TOKEN

WORKDIR /
RUN mkdir app

WORKDIR /app
COPY .npmrc .npmrc
COPY package.json /app

RUN npm install
RUN rm -f .npmrc

WORKDIR /app
RUN mkdir logs

FROM node:16.16.0-alpine AS TESTER
ARG NPM_TOKEN
COPY --from=BUILDER /app /app
WORKDIR /app

COPY .npmrc .npmrc
RUN npm install
RUN rm -f .npmrc

COPY . /app

USER node
WORKDIR /app
CMD ["npm", "test"]

FROM node:16.16.0-alpine AS RUNNER
ENV NODE_ENV production

COPY --from=BUILDER /app /app

COPY . /app

WORKDIR /app

EXPOSE 32000
EXPOSE 32001

USER node
WORKDIR /app
CMD ["node", "index.js"]
