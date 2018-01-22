const WXPay = require('wechat-pay').Payment;
const WXPayMiddleware = require('wechat-pay').middleware;
const config = require('../config');
const fs = require('fs');
const encode = require('./encode');

const initConfig = {
  appId: config.wx.appID,
  mchId: config.wx.mchId,
  partnerKey: config.wx.partnerKey,
  pfx: fs.readFileSync('apiclient_cert.p12'), // 微信商户平台证书
};

const wxpay = new WXPay(initConfig);
const middleware = WXPayMiddleware(initConfig);
const validation = (toValidateBody) => {
  let string = [];
  Object.keys(toValidateBody).sort().forEach(key => {
    string.push(`${key}=${toValidateBody[key]}`);
  });
  string.push(`key=${config.wx.partnerKey}`);
  string = string.join('&');
  const result = encode.md5(string);
  return result.toUpperCase();
};

module.exports = { wxpay, middleware, validation };