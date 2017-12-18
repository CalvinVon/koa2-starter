/**
 * 站点表 - station
 * @author Calvin
 * @version 1.0.0
 *
 * ------------------------------------------------
 *  字段名       类型          释义          取值
 *  name        String        站点名称
 *  address     String        站点地点
 *  uid         ObjectId      用户_id       ref: 'user' 
 *  createTime  Date          创建时间
 */

const mongoose = require('mongoose');
const db = require("../mongo").calvin;

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const StationSchema = new Schema({
  name: String,
  address: String,
  uid: {
    type: ObjectId,
    ref: 'user',
    required: true
  },
  createTime: {
    type: Date,
    default: Date.now()
  }
});


exports.Station = db.model('station', StationSchema, 'station');
