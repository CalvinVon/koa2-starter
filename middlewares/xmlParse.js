const xml = require('../utils/xml');

const formatMessage = result => {
  const message = {};
  if (typeof result === 'object') {
    const keys = Object.keys(result);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const item = result[key];
      if (!(item instanceof Array) || item.length === 0) continue;
      if (item.length === 1) {
        const val = item[0];
        if (typeof val === 'object') message[key] = formatMessage(val);
        else message[key] = (val || '').trim();
      }
      else {
        message[key] = [];
        for (let j = 0, k = item.length; j < k; j++) message[key].push(formatMessage(item[j]));
      }
    }
  }
  return message;
};

module.exports = () => {
  return async (ctx, next) => {
    if (ctx.method === 'POST' && ctx.is('text/xml')) {
      const promise = new Promise((resolve, reject) => {
        let buf = '';
        ctx.req.setEncoding('utf8');
        ctx.req.on('data', (chunk) => {
          buf += chunk;
        });
        ctx.req.on('end', () => {
          console.log(buf);
          xml.xmlToJson(buf)
            .then(resolve)
            .catch(reject);
        });
      });

      await promise.then((result) => {
        const received = result.xml;
        ctx.request.body = formatMessage(received);
      })
        .catch((e) => {
          e.status = 400;
        });

      return await next();
    } else {
      return await next();
    }
  };
};