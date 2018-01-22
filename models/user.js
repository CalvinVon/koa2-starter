/**
 * 用户表 - user
 * @author Calvin
 * @version 1.0.0
 * 
 * ----------------------------------------------
 *  字段名       类型          释义          取值
 *  username    String        用户名        微信openid
 *  balance     Array         余额（单位都是分）
 *  name        String        姓名
 *  sex         String        性别          "男", "女"
 *  level       Number        用户分组      0: 用户，1: 代理商，2: 管理员
 *  disable     Boolean       是否禁用      默认 false
 *  status      Number        道童加的      默认 10007
 *  createTime  Date          创建时间
 */

const mongoose = require('mongoose');
const db = require("../mongo").calvin;
// const hash = require('password-hash');
// const uuidV4 = require('uuid/v4');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    index: true
  },
  // password: String,
  balance: [{
    balance: {      // 实际余额
      type: Number,
      default: 0
    },
    balanceOrigin: {  // 原始充值金额（套餐）
      type: Number,
      default: 0
    },
    giftOrigin: {     // 原始赠送金额（套餐）
      type: Number,
      default: 0
    },
    rate: {           // giftOrigin / balanceOrigin
      type: Number,
      default: 0
    }
  }],
  name: String,
  sex: String,
  level: {
    type: Number,
    default: 0
  },
  createTime: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  disable: {
    type: Boolean,
    default: false
  },
  status: {
    type: Number,
    default: 10007
  }
});

// // 保存之间的md5加密
// UserSchema.pre('save', function (next) {
//   const self = this;
//   self.password = hash.generate(self.password);
//   // self.accessToken || (self.accessToken = uuidV4());
//   next();
// });

// // 更新密码之后的加密
// UserSchema.pre('update', function () {
//   const self = this;
//   const update = self.getUpdate();
//   self.update({}, {
//     $set: {
//       password: hash.generate(update.$set.password)
//     }
//   });
// });


// 实体的静态方法
UserSchema.statics.findByUserName = async function (username) {
  return await this.findOne({ username }).exec();
};

// 充值方法
UserSchema.statics.pushBalance = async function (uid, newBalance) {
  const user = await this.findOne({ _id: uid }).exec();
  if (user.balance.length === 1) {    // 余额只有一条记录
    const balance = user.balance[0];
    if (balance.balance === 0 && balance.balanceOrigin === 0 && balance.giftOrigin === 0) {
      // 没有任何充值记录
      user.balance = [];
    }
    user.balance.push(newBalance);
  }
  else {      // 多条记录，找到相似的项添加
    let found = false;
    for (let i = 0; i < user.balance.length; i++) {
      const balance = user.balance[i];
      if (
        balance.balanceOrigin === newBalance.balanceOrigin ||
        balance.giftOrigin === newBalance.giftOrigin ||
        balance.rate === newBalance.rate
      ) {
        balance.balance += newBalance.balance;
        found = true;
        break;
      }
    }
    if (!found) {
      user.balance.push(newBalance);
    }
  }
  return await user.save();
};

// 获取余额方法
UserSchema.statics.getBalance = async function (uid) {
  const user = await this.findOne({ _id: uid }).exec();
  return user.balance.reduce((pre, cur) => pre + cur.balance, 0);
};

// 消费余额方法，返回当前余额
UserSchema.statics.spendBalance = async function (uid, _consume) {
  let consume = _consume;
  const user = await this.findOne({ _id: uid }).exec();
  const balances = user.balance;
  if (balances.reduce((pre, cur) => pre + cur.balance, 0) < consume) {
    throw new Error('余额不足');
  }
  // 接下来肯定是能支付的起的
  for (let i = 0; i < balances.length; i++) {
    if (consume === 0) break;   // 已扣完
    // const balance = balances[i];
    if (balances[i].balance >= consume) {      // 这项能支付得起
      balances[i].balance -= consume;
      break;
    }
    else {
      consume -= balances[i].balance;
      balances[i].balance = 0;
      if (i === balances.length - 1 && consume > 0) {
        throw new Error('金额扣取失败');    // 理论上不可能存在
      }
      continue;
    }
  }

  // 将空的数组项删除
  const _balance = user.balance;
  user.balance = _balance.filter(item => !(item.balance === 0 && item.giftOrigin === 0 && item.balanceOrigin === 0));
  if (user.balance.length === 0) {
    user.balance.push({
      balance: 0,
      balanceOrigin: 0,
      giftOrigin: 0,
      rate: 0
    });
  }
  await user.save();
  return balances.reduce((pre, cur) => pre + cur.balance, 0);
};

// 退还资金，返回当前余额
// 退还时，新建一条balance数组
UserSchema.statics.refundBalance = async function (uid, _consume) {
  const consume = _consume;
  const user = await this.findOne({ _id: uid }).exec();
  user.balance.unshift({
    balance: consume,
    balanceOrigin: 0,
    giftOrigin: 0,
    rate: 0
  });

  await user.save();
  return user.balance.reduce((pre, cur) => pre + cur.balance, 0);
};
exports.User = db.model('user', UserSchema, 'user');
