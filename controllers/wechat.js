const xml = require('../utils/xml');
const WeChat = require('../utils/WeChat');
const resFormat = require('../utils/resFormatter').resFormat;
// models
const User = require('../models/user').User;

const wechat = WeChat.WeChatInstance;

exports.getHandler = async ctx => {
  ctx.body = await wechat.auth(ctx);
};

exports.postHandler = async ctx => {
  const message = ctx.request.body;
  let reply = '';

  if (message.MsgType === 'event') {
    if (message.Event === 'subscribe') {
      ctx.status = 200;
      ctx.type = 'application/xml';
      reply = '终于等待你，还好我没走...';
    }
    else if (message.Event === 'unsubscribe') {
      console.log(message.FromUserName + ' 悄悄地走了...');
      reply = '';
    }
  }

  else if (message.MsgType === 'text') {
    const content = message.Content;
    reply = '你说的话：“' + content + '”，我听不懂呀，但是我知道有个小链接嘿嘿' + wechat.getWebGrantedUrl();
  }
  ctx.body = xml.jsonToXml({
    Content: reply,
    ToUserName: message.FromUserName,
    FromUserName: message.ToUserName
  });
};

// 获取微信授权
exports.getWechatAuth = async ctx => {
  const code = ctx.query.code;
  const redirectType = ctx.query.redirect;
  const redirectSid = ctx.query.sid;
  const redirectPid = ctx.query.pid;

  try {
    const { accessToken, openId } = await wechat.getUserAccessTokenOnce(code);
    const userInfo = await wechat.pullUserInfo(accessToken, openId);
    ctx.cookies.set('openid', openId);
    ctx.body = userInfo;
    // 后续应该重定向
    if (redirectType === 'station' && redirectSid) {
      ctx.redirect(`/#/stationDetail/${redirectSid}`);
    }
    else if (redirectType === 'port' && redirectPid) {
      ctx.redirect(`/#/payMent?pid=${redirectPid}`);
    }
    else {
      ctx.redirect('/');
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
};

// 正常登录
exports.login = async ctx => {
  const redirectType = ctx.query.redirect;
  const redirectSid = ctx.query.sid;
  const redirectPid = ctx.query.pid;

  // 后续应该重定向
  if (redirectType === 'station' && redirectSid) {
    ctx.redirect(`/#/stationDetail/${redirectSid}`);
  }
  else if (redirectType === 'port' && redirectPid) {
    ctx.redirect(`/#/payMent?pid=${redirectPid}`);
  }
  else {
    ctx.redirect('/');
  }
};


exports.regetWechatAuth = async ctx => {
  ctx.body = 'regetWechatAuth';
};


// 自定义微信菜单
exports.customWechatMenu = async ctx => {
  const menuBody = {
    button: [
      {
        type: "view",
        name: "云充小站",
        url: 'http://cloudcharge-dev.qingzhoudata.com/wx/login'
      }
    ]
  };
  try {
    const accessToken = await wechat.getBaseAccessToken();
    const res = await wechat.createMenu(accessToken, menuBody);
    ctx.body = resFormat(res);
  } catch (error) {
    ctx.body = resFormat({}, 1, error);
  }
};


// 获取jsapi_ticket
exports.getJsapiTicket = async ctx => {
  const url = ctx.query.url;
  try {
    const signature = await wechat.generateSDKsignature(url);
    ctx.body = resFormat(signature);
  } catch (error) {
    ctx.body = resFormat({}, 1, error.message);
  }
};