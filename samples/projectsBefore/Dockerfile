FROM node:lts-alpine

WORKDIR project

COPY ["package.json", "./"]

RUN npm i --production

COPY . .

CMD ["node", "."]
