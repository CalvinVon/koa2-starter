const env = process.env.NODE_ENV || 'development'; // development production test_ci ..
const _ = require("lodash");

const settings = {
  base: {
    log: {
      console: true
    }
  },
  development: {
    mongos: {
      calvin: {
        hosts: [
          '121.199.53.9:27017'
        ],
        database: 'cloudcharge',
        options: {
          user: 'work',
          pass: 'work'
        }
      }
    }
  },
  local: {
    mongos: {
      calvin: {
        hosts: [
          '127.0.0.1:27017'
        ],
        database: 'cloudcharge'
      }
    }
  }
};
console.log("Server is running in [" + env + "] mode.");
module.exports = _.defaultsDeep(settings[env], settings.base);
