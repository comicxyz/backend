FROM node:16.19.0-alpine as builder
WORKDIR /server
COPY ./package.json yarn.lock tsconfig.json* ./
RUN yarn install --production=false
COPY . .
RUN yarn run compile

FROM node:16.19.0-alpine
RUN yarn global add pm2
WORKDIR /server
COPY package.json yarn.lock ./
RUN yarn install --production=true --ignore-engines
COPY --from=builder /server ./
COPY ecosystem.config.cjs ./
CMD [ "pm2-runtime", "ecosystem.config.cjs"]