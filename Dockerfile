FROM node:10

WORKDIR /usr/src/app

COPY wait.sh /wait.sh
RUN chmod +x /wait.sh

COPY package*.json ./

RUN npm install -g

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
