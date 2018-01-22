/**
 * @desc ChargeRecord - 用户记录 路由相关
 */
const router = require('koa-router')();

// middlewares
const auth = require('../../middlewares/auth');
const joi = require("joi");
const validation = require("../../middlewares/validation");
const extJoi = require("../../middlewares/joi_ext");

// controllers
const userController = require('../../controllers/user');

const DEFAULT_LIMIT = 10;

/**
 * @api {post} /api/user/balance  用户接口 - 查看余额
 * @apiGroup User
 * @apiName  userBalance
 * @apiDescription  查看余额
 * 
 * @apiParamExample {json} 接口返回值
{
    "code": 0,
    "data": 4240,
    "msg": ""
}
 *
 */
router.get('/balance', auth(), userController.getUserBalance);

module.exports = router;