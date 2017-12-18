const https = require('https');

exports.requestGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
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