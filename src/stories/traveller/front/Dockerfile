FROM node:21.6.1 as build

ARG BUILD_ENV=prod

WORKDIR /iam

COPY ./package.json ./package.json

RUN npm cache clean --force
RUN npm i --force

COPY . .

# VOLUME [ "/app/node_modules" ]

# CMD ["npm", "run", "dev"]

# for production
RUN npm run build
CMD ["npm", "run", "start"]