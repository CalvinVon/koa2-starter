const User = require('../models/user').User;
const resFormat = require('../utils/resFormatter').resFormat;
const WeChat = require('../utils/WeChat').WeChatInstance;

const qs = require('querystring');

/**
 * 判断是否登录中间件
 * @param opt.redirect {Boolean} 没有登录默认重定向去授权登录
 * @param opt.identity {Boolean} ctx.user 赋值当前用户 默认true
 */
module.exports = (opt = {}) => async (ctx, next) => {
  const openid = ctx.cookies.get("openid");
  const userid = ctx.cookies.get("userid");
  const { redirect = true, identity = true } = opt;

  const query = ctx.query;

  if (!openid) {
    if (redirect) {
      const url = WeChat.getWebGrantedUrl(qs.stringify(query));
      console.log(url);
      ctx.redirect(url);
      return false;
    }
    else {
      resFormat({}, 1, '没有登录，请重新登录');
      return false;
    }
  }
  ctx.openid = openid;
  ctx.userid = userid;
  if (identity && !userid) {
    const user = await User.findByUserName(openid);
    ctx.userid = user && user._id || '';
    ctx.cookies.set('userid', ctx.userid);
    // 这里有篡改cookie的可能
  }
  return await next();
};