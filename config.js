const env = process.env.NODE_ENV || 'development'; // development production test_ci ..
const _ = require("lodash");

const _config = {
  // 基本配置
  base: {
    log: {
      console: true
    },
    // wx: {   // 微信公众号接口配置
      // token: 'thisisaverylongtokenbycalvin'
    // }
  },
  // 开发环境配置
  development: {
    host: 'http://xxxxxxxxxxx',
    mongos: {   // Mongodb数据库连接配置
      calvin: {
        hosts: [
          'xxxx.xx.xx.xxx:27017'
        ],
        database: 'database',
        options: {
          user: 'work',
          pass: 'xxxxx'
        }
      }
    },
    wx: {   // 微信公众号接口配置
      token: 'thisisaverylongtokenbycalvin',
      appID: 'xxxxxxxxxxx',
      appsecret: 'xxxxxxxx',
      mchId: 'xxxxxx',                            // 微信商户号
      partnerKey: 'xxxxxx',                       // 微信商户平台API密钥
    }
  },
  // 测试环境配置
  test: {
    host: 'http://cloudcharge-dev.qingzhoudata.com',
    mongos: {   // Mongodb数据库连接配置
      calvin: {
        hosts: [
          '121.199.53.9:27017'
        ],
        database: 'database_test',
        options: {
          user: 'work',
          pass: 'xxxxx'
        }
      }
    },
    wx: {   // 微信公众号接口配置
      token: 'thisisaverylongtokenbycalvin',
      appID: 'xxxxxxxxxxx',
      appsecret: 'xxxxxxxx',
      mchId: 'xxxxxx',                            // 微信商户号
      partnerKey: 'xxxxxx',                       // 微信商户平台API密钥
    }
  },
  // 本地环境配置
  local: {
    host: 'http://localhost:3500',
    mongos: {
      calvin: {
        hosts: [
          '127.0.0.1:27017'
        ],
        database: 'database_local'
      }
    },
    wx: {   // 微信公众号接口配置
      token: 'thisisaverylongtokenbycalvin',
      appID: 'xxxxxxxxxxx',
      appsecret: 'xxxxxxxx',
      mchId: 'xxxxxx',                            // 微信商户号
      partnerKey: 'xxxxxx',                       // 微信商户平台API密钥
    }
  }
};
console.log("Server is running in [" + env + "] mode.");
const config = _.defaultsDeep(_config[env], _config.base);
module.exports = config;
