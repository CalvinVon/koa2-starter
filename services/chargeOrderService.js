/**
 * @desc 充电订单的业务层
 */

const Promise = require('bluebird');
const moment = require('moment');

// models
const ChargeOrder = require('../models/chargeOrder').ChargeOrder;
const Port = require('../models/port').Port;
const User = require('../models/user').User;

// services
const ChargeRecordService = require('../services/chargeRecordService');
const TemplateMessageService = require('../services/templateMessageService');


/**
 * 添加微信支付直接充电订单
 * @param {String} uid 
 * @param {String} sid 站点id
 * @param {String} pid 充电口id
 * @param {Number} consume 充值金额
 * @param {Number} planDuration 购买时长
 */
exports.addChargeOrderByWxpay = (uid, sid, pid, consume, planDuration, rechargeOrderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const curState = await this.getCurrentChargeState(uid);
      if (curState.state !== 'not charging') throw new Error('当前已有正在充电的订单');

      const newPortRecord = await ChargeRecordService.addChargeRecord(uid, sid, pid, consume, planDuration);
      const newChargeOrder = new ChargeOrder({
        uid,
        portRecordId: newPortRecord._id,
        consume,
        planDuration,
        balance: await User.getBalance(uid),
        rechargeOrderId
      });
      await newChargeOrder.save();
      resolve(newChargeOrder);
    } catch (error) {
      reject(error);
    }
  });
};


/**
 * 获取当前的充电状态
 * @param {String} uid 用户id
 */
exports.getCurrentChargeState = (uid) => {
  return new Promise(async(resolve, reject) => {
    try {
      const chargeOrder = await ChargeOrder
        .findOne({
          uid,
          cid: null,
          refund: false,
          endTime: null
        })
        .sort({
          createTime: -1
        })
        .select('_id consume planDuration createTime startTime')
        .populate({
          path: 'portRecordId',
          select: 'pid',
          populate: {
            path: 'pid',
            populate: {
              path: 'sid'
            }
          }
        })
        .lean()
        .exec();

      if (!chargeOrder) {
        return resolve({
          state: 'not charging'
        });
      }

      if (moment(chargeOrder.createTime * 1000).add(chargeOrder.planDuration, 's').isAfter(moment())) {
        const station = chargeOrder.portRecordId.pid.sid;
        const port = chargeOrder.portRecordId.pid;
        delete port.sid;
        delete chargeOrder.portRecordId;

        resolve({
          state: chargeOrder.startTime ? 'charging' : 'waiting charge',
          station,
          port,
          chargeOrder
        });
      } else {
        resolve({
          state: 'not charging'
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};


/**
 * 获取用户的充电订单记录
 * @param {*} uid
 * @param {*} page
 * @param {*} limit
 * @param {*} cid 为'ALL'时，查询所有的card
 */
exports.getUserChargeOrderHistory = (uid, page, limit, cid) => {
  return new Promise(async(resolve, reject) => {
    const query = {
      uid
    };
    if (!cid) query.cid = null;
    else if (cid === 'ALL') {
      query.cid = {
        $ne: null
      };
    } else query.cid = cid;

    try {
      const chargeOrderHistory = [];
      const chargeOrders = await ChargeOrder
        .find(query, {
          uid: false,
          __v: false
        })
        .populate({
          path: 'portRecordId',
          select: 'pid',
          populate: {
            path: 'pid',
            select: 'index group status',
            populate: {
              path: 'sid',
              select: 'name address'
            }
          }
        })
        .populate('cid', 'name _id uid')
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({
          createTime: -1
        })
        .lean()
        .exec();

      let chargeCycles = 0;
      let payAmount = 0;
      let chargeTime = 0;
      let refundCycles = 0;
      // chargeOrders.forEach(order => {
      for (let i = 0; i < chargeOrders.length; i++) {
        const order = chargeOrders[i];
        if (cid && (!order.cid.uid || order.cid.uid.toString() !== uid.toString())) {   // 当cid存在时，即当查询卡的充电记录时，只查当前被绑定的
          continue;
        }
        const port = order.portRecordId.pid;
        const station = port.sid;

        delete port.sid;
        delete order.portRecordId;

        const orderHistory = {
          port,
          station
        };
        // 判断订单状态
        if (order.refund) order.status = '已退款';
        else if (order.endTime) order.status = '已完成';
        else if (order.startTime) {
          if (moment(order.createTime * 1000).add(order.planDuration, 's').isBefore(moment())) order.status = '已完成';
          else order.status = '正在充电';
        }
        else order.status = '等待充电';

        orderHistory.chargeOrder = order;
        chargeOrderHistory.push(orderHistory);
      }

      const docs = await ChargeOrder.find(query).populate('cid', 'name _id uid').exec();
      let total = 0;
      for (let i = 0; i < docs.length; i++) {
        const order = docs[i];
        if (cid && (!order.cid.uid || order.cid.uid.toString() !== uid.toString())) continue;
        total++;
        if (order.refund) {
          refundCycles++;
        } else {
          chargeCycles++;
          payAmount += order.consume;
          chargeTime += order.planDuration;
        }
      }

      resolve(await Promise.props({
        chargeOrderHistory,
        statistic: {
          chargeCycles,
          payAmount,
          chargeTime,
          refundCycles
        },
        page,
        limit,
        total
      }));
    } catch (error) {
      reject(error);
    }
  });
};


const singleRefund = (orderId) => {
  return new Promise(async(resolve, reject) => {
    const query = {
      _id: orderId,
      refund: false
    };
    try {
      const formerOrder = await ChargeOrder
        .findOne(query, {
          __v: false
        })
        .populate({
          path: 'portRecordId',
          select: 'pid',
          populate: {
            path: 'pid',
            select: 'index group status'
          }
        })
        .populate('cid', 'name _id')
        .populate('uid', 'username')
        .lean()
        .exec();

      if (!formerOrder) throw new Error('没有找到正在进行的订单');
      if (formerOrder.startTime) throw new Error('该订单正在进行，无法退款取消');
      if (formerOrder.endTime) throw new Error('该订单已完成，无法退款取消');

      // if (uid !== formerOrder.uid.toString()) throw new Error('该订单不是您创建的订单，无法退款');
      if (!formerOrder.portRecordId) throw new Error('找不到原订单的充电记录');
      const pid = formerOrder.portRecordId.pid._id;
      // 将原订单对应的port状态改成空闲
      const foundPort = await Port.findOneAndUpdate({
        _id: pid
      }, {
        $set: {
          status: 0
        }
      }, {
        new: true
      });

      if (!foundPort) throw new Error('没有找到订单对应的充电口');
      const consume = formerOrder.consume;
      const balance = await User.refundBalance(formerOrder.uid, consume);
      const order = await ChargeOrder.findOneAndUpdate({
        _id: formerOrder._id
      }, {
        $set: {
          refund: true,
          refundRemark: '等待充电十分钟未处理 退款'
        }
      }, {
        new: true
      });

      // 推送退款完成消息
      await TemplateMessageService.sendRefundOKMsg(
        formerOrder.uid.username,
        [
          '订单退款提醒',
          '超时未插入插头，已取消订单，退款稍后送达，请注意查收',
          `￥${(formerOrder.consume / 100).toFixed(2)}元`,
          moment().format('YYYY-MM-DD HH:mm:ss'),
          `当前账户余额为￥${((formerOrder.balance + formerOrder.consume) / 100).toFixed(2)}元。感谢您的使用，祝您生活愉快！`
        ]
      );

      resolve({
        order,
        balance
      });
    } catch (error) {
      reject(error);
    }
  });
};

// 订单退款
exports.refundOrder = (uid, orderId) => {
  return new Promise(async(resolve, reject) => {
    try {
      resolve(await singleRefund(orderId));
    } catch (error) {
      reject(error);
    }
  });
};


// 统一检查
exports.startCheckAllOrderShouldRefund = () => {
  const intervalTime = 1000 * 60 * 3; // 三分钟检查一次
  const checkCycle = 1000 * 60 * 15; // 十五分钟之前的
  const fnn = async() => {
    const query = {
      startTime: null,
      endTime: null,
      refund: false,
      createTime: {
        $gte: Math.floor((Date.now() - checkCycle) / 1000)
      }
    };

    const allWaitingOrders = await ChargeOrder.find(query).exec();

    const toRefundOrders = allWaitingOrders.filter(item => {
      if (item.createTime + 60 * 10 < Math.floor(Date.now() / 1000)) {
        // 如果订单已超时十分钟
        return true;
      }
      return false;
    });
    // console.log({
    //   allWaitingOrders,
    //   toRefundOrders
    // });
    await Promise.map(toRefundOrders, order => {
      singleRefund(order._id);
    });
  };

  fnn();
  setInterval(fnn, intervalTime);
};