FROM node:7.6
# author
MAINTAINER fengjiahui <fengjiahui@zhehekeji.com>

COPY ./package.json /tmp/package.json
RUN  npm i --production -verbose

COPY ./ /backend-wechat
WORKDIR /backend-wechat
RUN mv /tmp/node_modules /backend-wechat

CMD node  app.js
