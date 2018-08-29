FROM node:10 as builder

WORKDIR /app/

COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile

COPY tslint.json /app
COPY client/ /app/client
COPY common/ /app/common
COPY server/ /app/server

RUN yarn build

RUN yarn install --frozen-lockfile --production

FROM node:10

WORKDIR /app/

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 8080
ENTRYPOINT [ "node", "." ]
