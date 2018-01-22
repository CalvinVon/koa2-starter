const qs = require('querystring');
const Promise = require('bluebird');
const encode = require('./encode');
const config = require('../config');
const httpsGet = require('./https').requestGet;
const httpsPost = require('./https').requestPost;
// const accessTokenJson = require('../accessToken.json');
// const jsapiTicketJson = require('../jsapiTicket.json');

const UserAccessToken = require('../models/userAccessToken').UserAccessToken;
const User = require('../models/user').User;

const fs = Promise.promisifyAll(require('fs'));

class WeChat {
  constructor() {
    this.token = config.wx.token;
    this.appID = config.wx.appID;
    this.appsecret = config.wx.appsecret;
    this.host = config.host;

    this.accessTokenJson = JSON.parse(fs.readFileSync('accessToken.json'));
    this.jsapiTicketJson = JSON.parse(fs.readFileSync('jsapiTicket.json'));

    if (!this.accessTokenJson.access_token || this.accessTokenJson.access_token === "" || this.accessTokenJson.expires_time < Date.now()) {
      this._requestForAccessToken();
    }
  }

  /**
   * 验证是否是微信服务器发送的消息
   * @param {Object} ctx
   * @return {String} echostr
   */
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

  _requestForAccessToken() {
    return new Promise(async(resolve, reject) => {
      try {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appID}&secret=${this.appsecret}`;
        const data = await httpsGet(url);
        const resObj = JSON.parse(data);
        if (data.indexOf('errcode') !== -1) throw new Error(resObj.errmsg);

        this.accessTokenJson.access_token = resObj.access_token;
        this.accessTokenJson.expires_time = new Date().getTime() + ((parseInt(resObj.expires_in) - 10) * 1000);

        fs.writeFileSync('accessToken.json', JSON.stringify(this.accessTokenJson));
        this.accessTokenJson = JSON.parse(fs.readFileSync('accessToken.json'));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取基础 access_token（非用户）
   * @return {Promise}
   */
  getBaseAccessToken() {
    return new Promise(async(resolve, reject) => {
      const currentTime = Date.now();
      try {
        if (!this.accessTokenJson.access_token || this.accessTokenJson.access_token === "" || this.accessTokenJson.expires_time < currentTime) {
          await this._requestForAccessToken();
          resolve(this.accessTokenJson.access_token);
        } else {
          resolve(this.accessTokenJson.access_token);
        }
      } catch (error) {
        reject(error);
      }
    });
  }


  /**
   * 获取jsapi_ticket
   */
  getJsapiTicket() {
    return new Promise(async(resolve, reject) => {
      // 获取当前时间
      const currentTime = Date.now();
      try {
        if (!this.jsapiTicketJson.ticket || this.jsapiTicketJson.ticket === "" || this.jsapiTicketJson.expires_time < currentTime) {
          const accessToken = await this.getBaseAccessToken();
          const requestUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
          const resObj = JSON.parse(await httpsGet(requestUrl));
          // if (resObj.errMsg.indexOf('not latest') !== -1) {
          //   await this._requestForAccessToken();
          // }
          if (resObj.errcode !== 0) {
            await this._requestForAccessToken();
            throw new Error(resObj.errmsg);
          }
          this.jsapiTicketJson.expires_time = new Date().getTime() + ((parseInt(resObj.expires_in) - 10) * 1000);
          this.jsapiTicketJson.ticket = resObj.ticket;
          fs.writeFileSync('jsapiTicket.json', JSON.stringify(this.jsapiTicketJson));
          this.jsapiTicketJson = JSON.parse(fs.readFileSync('jsapiTicket.json'));
          resolve(this.jsapiTicketJson.ticket);
        } else {
          resolve(this.jsapiTicketJson.ticket);
        }
      } catch (error) {
        reject(error);
      }
    });
  }


  /**
   * 生成JS SDK签名参数
   * @param {String} url  调用JS SDK接口的网址
   */
  async generateSDKsignature(url = this.host) {
    try {
      const noncestr = Math.random().toString(16).substr(2);
      const timestamp = parseInt(Date.now() / 1000);
      const jsapi_ticket = await this.getJsapiTicket();
      console.log(jsapi_ticket);

      const signature = {
        noncestr,
        timestamp,
        jsapi_ticket,
        url
      };
      let string1 = [];
      Object.keys(signature).sort().forEach(key => {
        string1.push(`${key}=${signature[key]}`);
      });

      string1 = string1.join('&');

      const result = encode.sha1(string1);
      return {
        noncestr,
        timestamp,
        signature: result
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户 access_token（单次使用） 之后用 getUserAccessToken 方法
   * @param {string}  code  用户同意授权后返回的code，用来获取 用户access_token
   *  code说明 ： code作为换取access_token的票据，每次用户授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期。
   * @return {Promise} { accessToken, openId }
   */
  getUserAccessTokenOnce(code) {
    return new Promise((resolve, reject) => {
      const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appID}&secret=${this.appsecret}&code=${code}&grant_type=authorization_code`;

      httpsGet(url).then(res => {
        const userAccessTokenObj = JSON.parse(res);
        if (res.indexOf("errcode") < 0) {
          const openid = userAccessTokenObj.openid;
          UserAccessToken.findOneAndUpdate({
            openid
          }, {
            $set: {
              openid: userAccessTokenObj.openid,
              access_token: userAccessTokenObj.access_token,
              refresh_token: userAccessTokenObj.refresh_token,
              expires_in: userAccessTokenObj.expires_in,
              expires_time: new Date().getTime() + (parseInt(userAccessTokenObj.expires_in) - 200) * 1000,
              scope: userAccessTokenObj.scope
            }
          }, {
            upsert: true
          }, (err) => {
            if (err) return reject(err);
            resolve({
              accessToken: userAccessTokenObj.access_token,
              openId: userAccessTokenObj.openid
            });
          });
        } else reject(userAccessTokenObj);
      }).catch(err => reject(err));
    });
  }

  /**
   * 获取用户 access_token（后续使用）
   * @param {string}  openid  用户同意授权后返回的code，用来获取 用户access_token
   *  code说明 ： code作为换取access_token的票据，每次用户授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期。
   * @return {Promise} { accessToken, openId }
   */
  getUserAccessToken(openid) {
    return new Promise(async(resolve, reject) => {
      // UserAccessToken.findByOpenId(openid).then((err, userAccessTokenObj) => {
      //   if (err) return reject(err);

      // if (userAccessTokenObj.expires_time < new Date().getTime()) {
      //   // 此token还未过期，不需要重新获取
      //   resolve({
      //     accessToken: userAccessTokenObj.access_token,
      //     openId: userAccessTokenObj.openid
      //   });
      // }
      // else {
      //   this.refreshUserToken(userAccessTokenObj.refresh_token).then(token => {
      //     resolve(token);
      //   }).catch(e => reject(e));
      // }
      // });

      const userAccessTokenObj = await UserAccessToken.findByOpenId(openid);
      if (userAccessTokenObj.expires_time < new Date().getTime()) {
        // 此token还未过期，不需要重新获取
        resolve({
          accessToken: userAccessTokenObj.access_token,
          openId: userAccessTokenObj.openid
        });
      } else {
        this.refreshUserToken(userAccessTokenObj.refresh_token).then(token => {
          resolve(token);
        }).catch(e => reject(e));
      }
    });
  }


  /**
   * 刷新用户 access_token（后续使用）
   * @param {string}  refreshToken
   * @return {Promise} { accessToken, openId }
   */
  refreshUserToken(refreshToken) {
    const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${this.appID}&grant_type=refresh_token&refresh_token=${refreshToken}`;
    return new Promise((resolve, reject) => {
      httpsGet(url).then(res => {
        const userAccessTokenObj = JSON.parse(res);
        if (res.indexOf("errcode") < 0) {
          const openid = userAccessTokenObj.openid;
          UserAccessToken.findOneAndUpdate({
            openid
          }, {
            $set: {
              access_token: userAccessTokenObj.access_token,
              refresh_token: userAccessTokenObj.refresh_token,
              expires_in: userAccessTokenObj.expires_in,
              expires_time: new Date().getTime() + (parseInt(userAccessTokenObj.expires_in) - 200) * 1000,
            }
          }, (err) => err && reject(err));

          resolve({
            accessToken: userAccessTokenObj.access_token,
            openId: userAccessTokenObj.openid
          });
        } else reject(userAccessTokenObj);
      }).catch(err => reject(err));
    });
  }

  /**
   * 获取网页授权的url
   * @param {String} params 重定向需要携带的参数
   * @param {String} redirectUri 重定向地址
   * @param {*} scope 作用域
   */
  getWebGrantedUrl(params = '', redirectUri = config.host, scope = 'snsapi_userinfo') {
    const getOpenIdUrl = `/wx/getWechatAuth?${params}`;
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appID}&redirect_uri=${encodeURIComponent(redirectUri + getOpenIdUrl)}&response_type=code&scope=${scope}&state=STATE#wechat_redirect`;
  }


  /**
   * 拉取用户信息，并保存至数据库
   * @param {String} accessToken
   * @param {String} openId
   * @returns {Promise} Object:{
   *    "openid":" OPENID",
        "nickname": NICKNAME,
        "sex":"1",
        "province":"PROVINCE"
        "city":"CITY",
        "country":"COUNTRY",
        "headimgurl":    "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
        "privilege":[ "PRIVILEGE1" "PRIVILEGE2"     ],
        "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
      }
   */
  pullUserInfo(accessToken, openId) {
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
    return new Promise((resolve, reject) => {
      httpsGet(url).then(res => {
        const userInfo = JSON.parse(res);
        if (res.indexOf("errcode") < 0) {
          resolve(userInfo);
          const userInstance = new User({
            username: userInfo.openid,
            name: userInfo.nickname,
            sex: userInfo.sex === 1 ? '男' : '女',
            balance: [{
              balance: 0,
              balanceOrigin: 0,
              giftOrigin: 0,
              rate: 0
            }]
          });

          userInstance.save(err => err && reject(err));
        } else reject(userInfo);
      }).catch(err => reject(err));
    });
  }


  /**
   * 创建自定义菜单
   * @param {*} accessToken 
   * @param {*} menuBody 自定义菜单体
   */
  createMenu(accessToken, menuBody = {}) {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;

    return new Promise(async(resolve, reject) => {
      try {
        const res = await httpsPost(url, menuBody);
        if (res.errcode !== 0) return reject(res);
        resolve(res);
      } catch (error) {
        reject(error);
      }
    });
  }


  sendTemplateMessage(targetOpenid, tplType = WeChat.TPL_TYPE.CHARGE_END, textArray = []) {
    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${this.accessTokenJson.access_token}`;
    const messageBody = {
      touser: targetOpenid,
      template_id: tplType,
      // url: '',
      data: null,
      // color: ''
    };

    switch (tplType) {
      case WeChat.TPL_TYPE.CHARGE_END:    // 充电结束
        Object.assign(messageBody, {
          data: {
            first: {
              value: textArray[0],
              color: "#173177"
            },
            keyword1: {
              value: textArray[1],
              color: "#173177"
            },
            keyword2: {
              value: textArray[2],
              color: "#173177"
            },
            keyword3: {
              value: textArray[3],
              color: "#173177"
            },
            keyword4: {
              value: textArray[4],
              color: "#173177"
            },
            keyword5: {
              value: textArray[5],
              color: "#173177"
            },
            remark: {
              value: textArray[6],
              color: "#173177"
            }
          }
        });
        break;

      case WeChat.TPL_TYPE.BALANCE_LACK:  // 余额不足
        Object.assign(messageBody, {
          data: {
            first: {
              value: textArray[0],
              color: "#173177"
            },
            keyword1: {
              value: textArray[1],
              color: "#173177"
            },
            keyword2: {
              value: textArray[2],
              color: "#173177"
            },
            remark: {
              value: textArray[3],
              color: "#173177"
            }
          }
        });
        break;
      
      case WeChat.TPL_TYPE.CHARGE_INTERRUPTED:    // 充电中止，插头脱落
        Object.assign(messageBody, {
          data: {
            first: {
              value: textArray[0],
              color: "#173177"
            },
            keyword1: {
              value: textArray[1],
              color: "#173177"
            },
            keyword2: {
              value: textArray[2],
              color: "#173177"
            },
            remark: {
              value: textArray[3],
              color: "#173177"
            }
          }
        });
        break;

      case WeChat.TPL_TYPE.RECHARGE_OK:    // 充电完成
        Object.assign(messageBody, {
          data: {
            first: {
              value: textArray[0],
              color: "#173177"
            },
            keyword1: {
              value: textArray[1],
              color: "#173177"
            },
            keyword2: {
              value: textArray[2],
              color: "#173177"
            },
            keyword3: {
              value: textArray[3],
              color: "#173177"
            },
            remark: {
              value: textArray[4],
              color: "#173177"
            }
          }
        });
        break;

      case WeChat.TPL_TYPE.REFUND:    // 退款
        Object.assign(messageBody, {
          data: {
            first: {
              value: textArray[0],
              color: "#173177"
            },
            keyword1: {
              value: textArray[1],
              color: "#173177"
            },
            keyword2: {
              value: textArray[2],
              color: "#173177"
            },
            keyword3: {
              value: textArray[3],
              color: "#173177"
            },
            remark: {
              value: textArray[4],
              color: "#173177"
            }
          }
        });
        break;

      default: break;
    }
    return new Promise(async(resolve, reject) => {
      try {
        const result = await httpsPost(sendUrl, messageBody);
        if (result.errcode === 0) resolve();
        else reject(new Error(result.errmsg));
      } catch (error) {
        reject(error);
      }
    });
  }

}

// 部署类的静态属性
WeChat.TPL_TYPE = {
  // 充电完成
  // {{first.DATA}}
  // 插座编号：{{keyword1.DATA}}
  // 充电地址：{{keyword2.DATA}}
  // 充电时间：{{keyword3.DATA}}
  // 充电耗时：{{keyword4.DATA}}
  // 消费金额：{{keyword5.DATA}}
  // {{remark.DATA}}
  CHARGE_END: 'OzYE27RwOWuFogcIEXtLLQSg41b452fCd86SFryUYPo',

  // 充电中止，插头脱落
  // {{first.DATA}}
  // 充电端口：{{keyword1.DATA}}
  // 充电地址：{{keyword2.DATA}}
  // 时间：{{keyword3.DATA}}
  // {{remark.DATA}}
  CHARGE_INTERRUPTED: 'rIGTPmIMz2pH9kb3d2pu0-YFhzwaoPC5HbRNwf2WEHM',

  // 充值成功
  // {{first.DATA}}
  // 充值金额：{{keyword1.DATA}}
  // 充值日期：{{keyword2.DATA}}
  // 账户余额：{{keyword3.DATA}}
  // {{remark.DATA}}
  RECHARGE_OK: 'jzE85_VRlk3uhU2AbijcFomJJlq9OZP8hVTOohbut7o',

  // 退款提醒
  // {{first.DATA}}
  // 温馨提示：{{keyword1.DATA}}
  // 退款金额：{{keyword2.DATA}}
  // 退款时间：{{keyword3.DATA}}
  // {{remark.DATA}}
  REFUND: 'cWxb-rsOTOzxwFZisTsn3I5AAaEi1bBPiRga2vLxGUQ',

  // 余额不足
  // {{first.DATA}}
  // 账号：{{keyword1.DATA}}
  // 当前余额：{{keyword2.DATA}}
  // {{remark.DATA}}
  BALANCE_LACK: 'EsngmxKb5kCtdXR2EnnnJF6WB7Px_X1umtZcfElr3a4'


};

const WeChatInstance = new WeChat();

// 暴露可供外部访问的接口
exports.WeChat = WeChat;
exports.WeChatInstance = WeChatInstance;