FROM node:alpine

RUN npm install --global yarn

ADD package.json yarn.lock /app/
WORKDIR /app/
RUN yarn install --production

ADD dist/ /app/dist
ADD public/ /app/public

EXPOSE 8080
ENTRYPOINT [ "npm", "run", "start" ]
