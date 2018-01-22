const resFormat = require('../utils/resFormatter').resFormat;
const util = require('../utils/util');
const Promise = require('bluebird');
const moment = require('moment');

// models
const User = require('../models/user').User;

// services
const ChargeOrderService = require('../services/chargeOrderService');

exports.getUserBalance = async ctx => {
  const uid = ctx.userid;

  ctx.body = resFormat(await User.getBalance(uid));
};