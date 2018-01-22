/**
 * @desc ChargeRecord - 充电订单记录 路由相关
 */
const router = require('koa-router')();

// middlewares
const auth = require('../../middlewares/auth');
const joi = require("joi");
const validation = require("../../middlewares/validation");
const extJoi = require("../../middlewares/joi_ext");

// controllers
const chargeOrderController = require('../../controllers/chargeOrder');

const DEFAULT_LIMIT = 10;

/**
 * @api {post} /api/chargeorder/addbybalance  充电订单记录 - 使用余额支付
 * @apiGroup ChargeOrder
 * @apiName  addChargeOrderByBalance
 * @apiDescription  使用余额支付发起充电订单
 * 
 * @apiParam {String} sid 充电站id
 * @apiParam {String} pid 充电口id
 * @apiParam {Number} consume 消费数值（单位为分）
 * @apiParam {Number} planDuration 购买的总时间（单位为秒）
 * @apiParam  {String} createTime
 *
 * @apiParamExample {json} 接口返回值
{
    "code": 0,
    "data": {
        "newChargeOrder": {
            "__v": 0,
            "uid": "5a3b5a3ae0ce4273a631633d",
            "portRecordId": "5a4395bca7052d40ac9f908a",
            "consume": 100,
            "planDuration": 10800,
            "balance": 4640,
            "_id": "5a4395bca7052d40ac9f908b",
            "refund": false,
            "createTime": "2017-12-27T12:43:50.461Z"
        }
    },
    "msg": ""
}
 *
 */
router.post('/addbybalance', auth(), validation({
  body: {
    sid: joi.string().length(24).required(),
    pid: joi.string().length(24).required(),
    consume: joi.number().required(),
    planDuration: joi.number().required(),
    createTime: joi.string().required()
  }
}), chargeOrderController.addByBalance);


/**
 * @api {post} /api/chargeorder/getcurrentcharge  充电订单记录 - 查询当前充电状态
 * @apiGroup ChargeOrder
 * @apiName  getCurrentCharge
 * @apiDescription  查询当前充电状态
 * 
 * @apiSuccess  (chargeOrder) {Number}  planDuration  购买的充电时长
 * @apiSuccess  (chargeOrder) {Number}  consume  购买的金额
 * 
 * @apiParamExample {json} 接口返回值
{
    "code": 0,
    "data": {
        "state": "charging",
        "station": {
            "_id": "5a3c5f0e7664c060c08328f7",
            "__v": 0,
            "address": "2",
            "name": "新城金郡2号楼",
            "createTime": "2017-12-22T01:25:24.879Z"
        },
        "port": {
            "_id": "5a3c5f0e7664c060c0832900",
            "__v": 0,
            "index": 2,
            "group": 3,
            "status": 1,
            "createTime": "2017-12-22T01:25:24.911Z"
        },
        "chargeOrder": {
            "_id": "5a4395bca7052d40ac9f908b",
            "consume": 100,
            "planDuration": 10800,
            "createTime": "2017-12-27T12:43:50.461Z"
        }
    },
    "msg": ""
}
 *
 */
router.get('/getcurrentcharge', auth(), chargeOrderController.getCurrentCharge);

/**
 * @api {post} /api/chargeorder/stop  充电订单记录 - 停止当前充电
 * @apiGroup ChargeOrder
 * @apiName  stopCurrentCharge
 * @apiDescription  停止当前充电
 * 
 * @apiParam    {String} chargeOrderId 当前订单id
 * 
 * @apiSuccess  (chargeOrder) {String}  chargeOrderId  充电订单id
 * @apiSuccess  (chargeOrder) {String}  portId  充电口id
 * 
 * @apiParamExample {json} 接口返回值
 {
    "code": 0,
    "data": {
        "_id": "5a4395bca7052d40ac9f908b",
        "uid": "5a3b5a3ae0ce4273a631633d",
        "portRecordId": "5a4395bca7052d40ac9f908a",
        "consume": 100,
        "planDuration": 10800,
        "balance": 4640,
        "__v": 0,
        "remark": "用户手动停止充电",
        "endTime": "2017-12-27T13:22:02.557Z",
        "refund": false,
        "createTime": "2017-12-27T12:43:50.461Z"
    },
    "msg": ""
}
 *
 */
router.post('/stop', auth(), validation({
  body: {
    chargeOrderId: joi.string().length(24).required(),
  }
}), chargeOrderController.stopCurrentCharge);


/**
 * @api {post} /api/chargeorder/changeport  充电订单记录 - 切换充电口
 * @apiGroup ChargeOrder
 * @apiName  changeport
 * @apiDescription  切换充电口
 * 
 * @apiParam  {String} chargeOrderId 原充电订单id
 * @apiParam  {String} newStationId 新充电站id
 * @apiParam  {String} newPortId 新充电口id
 * @apiParam  {String} createTime
 * 
 * @apiParamExample {json} 接口返回值
 {
    "code": 0,
    "data": {
        "state": "charging",
        "station": {
            "_id": "5a3c5f0e7664c060c08328f7",
            "__v": 0,
            "address": "2",
            "name": "新城金郡2号楼",
            "createTime": "2017-12-22T01:25:24.879Z"
        },
        "port": {
            "_id": "5a3c5f0e7664c060c08328ff",
            "__v": 0,
            "index": 1,
            "group": 3,
            "status": 1,
            "createTime": "2017-12-22T01:25:24.911Z"
        },
        "chargeOrder": {
            "_id": "5a43c6c115c4b414ead9edc7",
            "consume": 200,
            "planDuration": 10800,
            "createTime": "2017-12-27T16:15:26.960Z"
        }
    },
    "msg": ""
}
 *
 */
router.post('/changeport', auth(), validation({
  body: {
    chargeOrderId: joi.string().length(24).required(),
    newStationId: joi.string().length(24).required(),
    newPortId: joi.string().length(24).required(),
    createTime: joi.string().required()
  }
}), chargeOrderController.changePort);


/**
 * @api {post} /api/chargeorder/history  充电订单记录 - 充电订单历史记录
 * @apiGroup ChargeOrder
 * @apiName  history
 * @apiDescription  充电订单历史记录
 * 
 * @apiParam  {Numebr} [page] 页数
 * @apiParam  {Numebr} [limit]
 * 
 * @apiSuccess  (chargeOrderHistory)  {json} port  充电口信息
 * @apiSuccess  (chargeOrderHistory)  {json} station  充电站信息
 * @apiSuccess  (chargeOrderHistory)  {json} chargeOrder  充电订单
 * @apiSuccess  (chargeOrder)  {String} _id  充电订单id
 * @apiSuccess  (chargeOrder)  {Number} consume  消费数值（单位为分）
 * @apiSuccess  (chargeOrder)  {Number} planDuration  购买的总时间（单位为秒）
 * @apiSuccess  (chargeOrder)  {Number} duration  实际消费时间（单位为秒）
 * @apiSuccess  (chargeOrder)  {Number} balance  消费后余额（单位为分）
 * @apiSuccess  (chargeOrder)  {String} startTime  实际消费开始时间
 * @apiSuccess  (chargeOrder)  {String} endTime  实际消费结束时间
 * @apiSuccess  (chargeOrder)  {Number} power  实际消费电量
 * @apiSuccess  (chargeOrder)  {Number} power  实际消费电量
 * @apiSuccess  (chargeOrder)  {Number} refund  为true代表已退款
 * @apiSuccess  (chargeOrder)  {Number} refundRemark  退款原因
 * @apiSuccess  (chargeOrder)  {String} status  充电订单状态
 * 
 * @apiSuccess  (statistic)  {Number} chargeCycles  充电次数
 * @apiSuccess  (statistic)  {Number} payAmount  支付金额
 * @apiSuccess  (statistic)  {Number} chargeTime  充电时长
 * @apiSuccess  (statistic)  {Number} refundCycles  退款次数
 * 
 * @apiParamExample {json} 接口返回值
{
    "code": 0,
    "data": {
        "chargeOrderHistory": [
            {
                "port": {
                    "_id": "5a3bc70d71f0dc0614512315",
                    "index": 1,
                    "group": 2,
                    "status": 1
                },
                "station": {
                    "_id": "5a3bc70d71f0dc0614512312",
                    "address": "1",
                    "name": "新城金郡1号楼"
                },
                "chargeOrder": {
                    "_id": "5a449d8ce02993174cc3f413",
                    "consume": 100,
                    "planDuration": 10800,
                    "balance": 3940,
                    "refund": false,
                    "createTime": "2017-12-28T07:31:11.693Z",
                    "status": "等待充电"
                }
            }
        ],
        "statistic": { 
            "chargeCycles": 1,
            "payAmount": 100,
            "chargeTime": 10800,
            "refundCycles": 0
        },
        "page": 1,
        "limit": 10,
        "total": 1
    },
    "msg": ""
}
 *
 */
router.get('/history', auth(), validation({
  query: {
    limit: joi.number().default(DEFAULT_LIMIT),
    page: joi.number().default(1)
  }
}), chargeOrderController.getHistory);


/**
 * @api {post} /api/chargeorder/history  充电订单记录 - 充电订单退款
 * @apiGroup ChargeOrder
 * @apiName  refundOrder
 * @apiDescription  充电订单退款
 * 
 * @apiParam  {String} orderId  原订单id
 * 
 * 
 * @apiParamExample {json} 接口返回值
{
    "code": 0,
    "data": "success",
    "msg": ""
}
 *
 */
router.post('/refund', auth(), validation({
  body: {
    orderId: joi.string().length(24).required()
  }
}), chargeOrderController.refundOrder);


// mock 添加卡充电记录
router.post('/mockCardChargeRecord', auth(), chargeOrderController.mockCardChargeRecord);

module.exports = router;