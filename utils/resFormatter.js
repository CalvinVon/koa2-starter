/**
 * 统一返回数据工具
 * @param {*} data 
 * @param {Number} code 返回的状态码
 * @param {String} msg 返回的错误信息
 */
exports.resFormat = (data = [], code = 0, msg = '') => {
  return { code, data, msg };
};