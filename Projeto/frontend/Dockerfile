FROM node:18-alpine

WORKDIR /usr/src/app/frontend

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 17000

ENV PORT=17000

ENV BACKEND_API_URL="http://data:16000"

CMD [ "npm", "start" ]