const fs = require('fs');
const encode = require('./encode');
const config = require('../config');
const httpsGet = require('./https').requestGet;
const accessTokenJson = require('../accessToken.json');
const xml = require('./xml');


class WeChat {
  constructor() {
    this.token = config.wx.token;
    this.appID = config.wx.appID;
    this.appsecret = config.wx.appsecret;
  }

  auth(ctx) {
    const signature = ctx.query.signature;
    const timestamp = ctx.query.timestamp;
    const echostr = ctx.query.echostr;
    const nonce = ctx.query.nonce;

    // 字典排序
    const arr = [this.token, timestamp, nonce].sort();
    const result = encode.sha1(arr.join(''));

    if (result === signature) {
      return echostr;
    } else {
      return '';
    }
  }

  getAccessToken() {
    return new Promise((resolve, reject) => {
      // 获取当前时间
      const currentTime = Date.now();
      // 格式化请求地址
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appID}&secret=${this.appsecret}`;
      // 判断 本地存储的 access_token 是否有效
      if (accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime) {
        httpsGet(url).then(data => {
          const result = JSON.parse(data);
          if (data.indexOf("errcode") < 0) {
            accessTokenJson.access_token = result.access_token;
            accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
            // 更新本地存储的

            fs.writeFile('accessToken.json', JSON.stringify(accessTokenJson));
            // 将获取后的 access_token 返回
            resolve(accessTokenJson.access_token);
          } else {
            // 将错误返回
            resolve(result);
          }
        })
          .catch(err => reject(err));


      } else {
        // 将本地存储的 access_token 返回
        resolve(accessTokenJson.access_token);
      }
    });
  }

}

// 暴露可供外部访问的接口
module.exports = WeChat;