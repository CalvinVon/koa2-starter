/**
 * @desc 发送模板消息服务
 */

const WeChat = require('../utils/WeChat').WeChat;
const WeChatInstance = require('../utils/WeChat').WeChatInstance;

/**
 * 发送充电结束 模板消息
 * @param {String} targetOpenid 目标用户
 * @param {Array} textArray 参数列表
 */
exports.sendChargeEndMsg = (targetOpenid, textArray) => {
  return WeChatInstance.sendTemplateMessage(targetOpenid, WeChat.TPL_TYPE.CHARGE_END, textArray);
};

/**
 * 发送余额不足 模板消息
 * @param {String} targetOpenid 目标用户
 * @param {Array} textArray 参数列表
 */
exports.sendBalanceLackMsg = (targetOpenid, textArray) => {
  return WeChatInstance.sendTemplateMessage(targetOpenid, WeChat.TPL_TYPE.BALANCE_LACK, textArray);
};

/**
 * 发送充电中止，插头脱落 模板消息
 * @param {String} targetOpenid 目标用户
 * @param {Array} textArray 参数列表
 */
exports.sendChargeInterruptedMsg = (targetOpenid, textArray) => {
  return WeChatInstance.sendTemplateMessage(targetOpenid, WeChat.TPL_TYPE.CHARGE_INTERRUPTED, textArray);
};

/**
 * 发送充值完成 模板消息
 * @param {String} targetOpenid 目标用户
 * @param {Array} textArray 参数列表
 */
exports.sendRechargeOKMsg = (targetOpenid, textArray) => {
  return WeChatInstance.sendTemplateMessage(targetOpenid, WeChat.TPL_TYPE.RECHARGE_OK, textArray);
};

/**
 * 发送退款完成 模板消息
 * @param {String} targetOpenid 目标用户
 * @param {Array} textArray 参数列表
 */
exports.sendRefundOKMsg = (targetOpenid, textArray) => {
  return WeChatInstance.sendTemplateMessage(targetOpenid, WeChat.TPL_TYPE.REFUND, textArray);
};