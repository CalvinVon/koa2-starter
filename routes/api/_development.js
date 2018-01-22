/**
 * @desc 供开发使用的 路由相关
 */
const router = require('koa-router')();

// utils
const resFormat = require('../../utils/resFormatter').resFormat;

const WeChat = require('../../utils/WeChat');

const auth = require('../../middlewares/auth');

/**
 * @api {get} /api/dev/getCookie 调试 - 设置cookie
 * @apiGroup Cookie
 * @apiName  setCookie
 * @apiDescription  设置Cookie的openid
 * 
 * @apiParam  {String}  openid
 */
router.get('/getCookie', async ctx => {
  const openid = ctx.query.openid || 'oXV1dw5FdHC3u6C742edQs7taS6g';
  await ctx.cookies.set('openid', openid);
  ctx.body = resFormat('success set cookie of openid: ' + openid);
});

router.get('/testTpl', auth(), async ctx => {
  const openid = ctx.openid;
  const wechat = WeChat.WeChatInstance;
  try {
    ctx.body = resFormat(await wechat.sendTemplateMessage(
      openid,
      WeChat.TPL_TYPE.CHARGE_END,
      ['测试模板', 'DZ00001-1', '杨浦区长阳谷', '11-24 14:58~11-24 14:58', '180分钟', '1元', '感谢您的使用！']
    ));
  } catch (error) {
    ctx.body = resFormat({}, 1, error.message);
  }
});

module.exports = router;
