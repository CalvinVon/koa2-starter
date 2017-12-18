const WeChat = require('../utils/WeChat');

module.exports = () => {
  const weChat = new WeChat();
  return async (ctx, next) => {
    if (weChat.auth(ctx) !== '') {
      // 确认是微信服务器
      ctx.state.accessToken = await weChat.getAccessToken();
      await next();
    }
    else {
      ctx.status = 400;
      ctx.body = 'ERR: not from wechat server';
    }
  };
};