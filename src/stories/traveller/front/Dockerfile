FROM node:21.6.1 as build

ARG BUILD_ENV=prod

WORKDIR /front-traveller

COPY ./package.json ./package.json

RUN npm cache clean --force
RUN npm i --force

COPY . .

# For production
RUN npm run build
CMD ["npm", "run", "start"]