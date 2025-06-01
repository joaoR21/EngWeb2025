FROM node:18-alpine

WORKDIR /usr/src/app/data

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 16000

ENV PORT=16000

ENV MONGO_URI="mongodb://mongo:27017/TP-EW2025"

CMD [ "npm", "start" ]