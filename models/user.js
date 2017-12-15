/**
 * 用户表 - user
 * @author Calvin
 * @version 1.0.0
 * 
 * ----------------------------------------------
 *  字段名       类型          释义          取值
 *  username    String        用户名        微信access_token
 *  password    String        密码
 *  balance     String        密码
 *  name        String        姓名
 *  sex         String        性别          "男", "女"
 *  level       Number        用户分组      0: 用户，1: 代理商，2: 管理员
 *  disable     Boolean       是否禁用      默认 false
 *  createTime  Date          创建时间
 */

const mongoose = require('mongoose');
const db = require("../mongo").calvin;
const hash = require('password-hash');
const uuidV4 = require('uuid/v4');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  balance: {
    type: Number,
    required: true
  },
  name: String,
  sex: String,
  level: {
    type: Number,
    default: 0
  },
  createTime: {
    type: Date,
    default: Date.now()
  },
  disable: {
    type: Boolean,
    default: false
  }
})

// 保存之间的md5加密
UserSchema.pre('save', function (next) {
  const self = this;
  self.password = hash.generate(self.password);
  // self.accessToken || (self.accessToken = uuidV4());
  next();
});

// 更新密码之后的加密
UserSchema.pre('update', function () {
  const self = this;
  const update = self.getUpdate();
  self.update({}, {
    $set: {
      password: hash.generate(update.$set.password)
    }
  });
});


// 实体的实例方法
UserSchema.statics.findByUserName = function(username, callback) {
  return this.findOne({ username }).exec().then(callback);
}

exports.User = db.model('user', UserSchema, 'user');
