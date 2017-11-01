FROM node:alpine

RUN npm install --global yarn

ADD dist/ /app/dist
ADD public/ /app/public
ADD package.json yarn.lock /app/
WORKDIR /app/
RUN yarn install --production

EXPOSE 8080
ENTRYPOINT [ "npm", "run", "start" ]
