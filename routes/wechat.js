const router = require('koa-router')();
const wechatController = require('../controllers/wechat');

// middlewares
const wechatAuth = require('../middlewares/wechatAuth');
const xmlParser = require('../middlewares/xmlParse');

router
  .get('/', wechatAuth(), wechatController.getHandler)
  .post('/', wechatAuth(), xmlParser(), wechatController.postHandler);

module.exports = router;