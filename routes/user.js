const router = require('koa-router')();
const userController = require('../controllers/user');

router
  .get('/', userController.findUser)
  .get('/getme', userController.getMe);


module.exports = router;