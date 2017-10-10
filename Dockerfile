FROM node:alpine

ADD dist/ /app/dist
ADD public/ /app/public
ADD package.json /app/
WORKDIR /app/
RUN npm install --production

EXPOSE 8080
ENTRYPOINT [ "npm", "run", "start" ]