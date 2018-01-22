const https = require('https');
const url = require('url');

exports.requestGet = (getUrl) => {
  return new Promise((resolve, reject) => {
    https.get(getUrl, res => {
      const buffers = [];
      let result = "";
      let size = 0;
      // 监听 data 事件
      res.on('data', data => {
        buffers.push(data);
        size += data.length;
      });

      // 监听 数据传输完成事件
      res.on('end', () => {
        result = Buffer.concat(buffers, size).toString('utf-8');
        console.log(result);
        // 将最后结果返回
        resolve(result);
      });
    }).on('error', err => {
      reject(err);
    });
  });
};

exports.requestPost = (postUrl, body) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(postUrl);
    const postData = JSON.stringify(body);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let result = "";

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        result += chunk;
      });
      res.on('end', () => {
        console.log(result);
        // 将最后结果返回
        resolve(JSON.parse(result));
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    // write data to request body
    req.write(postData);
    req.end();
  });
};