# sprinklers3

## How to run

### Docker

```shell

# for production build (http://localhost:8080)
docker-compose up

# for development with hot-reload (http://localhost:8081)
docker-compose -f docker-compose.dev.yml up

```
### Not docker

```shell

yarn install

# for production build (http://localhost:8080)
yarn build
yarn start:pretty

# for development build (http://localhost:8081)
yarn start:dev


```