const router = require('koa-router')();
const wechatController = require('../../controllers/wechat');

// middlewares
const wechatAuth = require('../../middlewares/wechatAuth');
const auth = require('../../middlewares/auth');
const xmlParser = require('../../middlewares/xmlParse');
const joi = require("joi");
const validation = require("../../middlewares/validation");

// all under /wx
router.get('/', wechatController.getHandler);

// 支持微信公众号自动回复文字
router.post('/', wechatAuth(), xmlParser(), wechatController.postHandler);

// 用户第一次登录，将openid保存到cookie返回
router.get('/getWechatAuth', wechatController.getWechatAuth);

// cookie有openid，登录
router.get('/login', validation({
  query: {
    redirect: joi.string().allow(['station', 'port']),
    sid: joi.string().length(24),
    pid: joi.string().length(24)
  }
}), auth(), wechatController.login);

// 重新授权
router.get('/regetWechatAuth', wechatController.regetWechatAuth);

// 自定义菜单
router.get('/customWechatMenu', wechatController.customWechatMenu);

// 获取jsapi_ticket
router.get('/getJsapiTicket', wechatController.getJsapiTicket);

module.exports = router;