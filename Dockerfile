FROM node:15

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

ENTRYPOINT ["./entrypoint.sh"]

CMD ["yarn", "watch", "|", "yarn", "run", "bunyan", "-o", "simple"]
