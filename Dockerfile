FROM node:alpine as builder

RUN apk add yarn \
    python \
    make \
    g++

WORKDIR /app/

COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile

COPY tslint.json /app
COPY app/ /app/app
COPY common/ /app/common
COPY server/ /app/server

RUN yarn build

RUN yarn install --frozen-lockfile --production

FROM node:alpine

WORKDIR /app/

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 8080
EXPOSE 8081
ENTRYPOINT [ "node", "." ]
