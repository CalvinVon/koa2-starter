const env = process.env.NODE_ENV || 'development'; // development production test_ci ..
const _ = require("lodash");

const _config = {
  // 基本配置
  base: {
    log: {
      console: true
    }
  },
  // 开发环境配置
  development: {
    mongos: {   // Mongodb数据库连接配置
      calvin: {
        hosts: [
          'xxx.xxx.x.xx'
        ],
        database: 'xxxxxxx',
        options: {
          user: 'xxxx',
          pass: 'xxxx'
        }
      }
    },
    wx: {   // 微信公众号接口配置
      token: 'xxxxxxxxxxxxxxxxxxxxx',
      appID: 'xxxxxxxxxxxxxxxxx',
      appsecret: 'xxxxxxxxxxxxxxxxxxx',
    }
  },
  // 本地环境配置
  local: {
    mongos: {
      calvin: {
        hosts: [
          '127.0.0.1:27017'
        ],
        database: 'xxxxxxxxxx'
      }
    },
    wx: {   // 微信公众号接口配置
      token: 'xxxxxxxxxxxxxxxxxxxxx',
      appID: 'xxxxxxxxxxxxxxxxx',
      appsecret: 'xxxxxxxxxxxxxxxxxxx',
    }
  }
};
console.log("Server is running in [" + env + "] mode.");
const config = _.defaultsDeep(_config[env], _config.base);
module.exports = config;
