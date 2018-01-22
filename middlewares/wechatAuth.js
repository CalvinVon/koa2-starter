/**
 * @desc 该中间件验证消息是否来自微信服务器并获取正确的access_token存入ctx.state.accessToken中
 */

const WeChat = require('../utils/WeChat');

module.exports = () => {
  const weChat = WeChat.WeChatInstance;
  return async (ctx, next) => {
    if (weChat.auth(ctx) !== '') {
      // 确认是微信服务器
      ctx.state.accessToken = await weChat.getBaseAccessToken();
      await next();
    }
    else {
      ctx.status = 400;
      ctx.body = 'ERR: not from wechat server';
    }
  };
};