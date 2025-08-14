# Stage 1

FROM node:22 as builder

WORKDIR /build

COPY package*.json .
RUN npm ci

COPY . .

RUN npm run build



# Stage 2

FROM node:22 as runner

WORKDIR /app

COPY --from=builder build/package*.json .
COPY --from=builder build/node_modules node_modules/
COPY --from=builder build/dist dist/

CMD [ "npm", "start" ]