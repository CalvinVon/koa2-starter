const crypto = require('crypto');

// sha1 encode
exports.sha1 = (str) => {
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('hex');
};

// md5 encode
exports.md5 = (str) => {
  const md5 = crypto.createHash('md5');
  md5.update(str);
  return md5.digest('hex');
};