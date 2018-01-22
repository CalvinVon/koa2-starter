/**
 * @desc 该中间件验证消息是否来自微信服务器判断签名
 */
const config = require('../config');
const wxpayReturn = require('../utils/xml').wxpayReturn;
const validation = require('../utils/WXpay').validation;
// services
const rechargeOrderService = require('../services/rechargeOrderService');

module.exports = () => {
  return async (ctx, next) => {
    const wxbody = ctx.request.body;
    ctx.set('Content-Type', 'text/xml');
    ctx.status = 200;
    try {
      if (wxbody.return_code === 'SUCCESS') {
        // 先验证签名
        const sign = wxbody.sign;
        delete wxbody.sign;
        if (validation(wxbody) !== sign) throw new Error('签名不正确');
        // 判断原订单
        
        const formerOrder = await rechargeOrderService.queryRechargeOrder(wxbody.out_trade_no);
        if (typeof formerOrder.success !== 'undefined') {
          ctx.body = wxpayReturn();
          return false;
        }
        if (formerOrder.success) {
          ctx.body = wxpayReturn();
          return false;
        }
        if (
          wxbody.appid !== config.wx.appID ||
          wxbody.mch_id !== config.wx.mchId
        ) throw new Error('验证失败');
        if (
          wxbody.out_trade_no !== formerOrder.out_trade_no ||
          wxbody.openid !== formerOrder.openid ||
          parseInt(wxbody.total_fee) !== parseInt(formerOrder.amount)
        ) throw new Error('与原账单不符');
        
        return await next();
      }
      else {
        ctx.body = wxpayReturn('FAIL');
        return false;
      }
    }
    catch (error) {
      ctx.body = wxpayReturn('FAIL');
      return false;
    }
  };
};