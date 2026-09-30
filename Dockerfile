FROM node
WORKDIR /app
COPY package.json /app
RUN npm install
COPY --chmod=0644 init.sql /docker-entrypoint-initdb.d/01-init.sql

