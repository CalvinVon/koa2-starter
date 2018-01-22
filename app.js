/* eslint no-console:0 */
const Koa = require('koa');
const convert = require('koa-convert');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser');
const logger = require('./middlewares/logger');
const _ = require("lodash");
const router = require('koa-router')();
const http = require("http");
const serve = require("koa-static");
const path = require("path");
const cors = require('koa2-cors');

const env = process.env.NODE_ENV || 'development';

const app = new Koa();


// middlewaress
app.use(serve(path.join(__dirname, "/static/")));
app.use(convert(bodyparser({ multipart: true })));
app.use(convert(json()));
app.use(cors({
  origin(ctx) {
    return ctx.header.origin;
  },
  maxAge: 7200,
  credentials: true,
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// logger and error handler
app.use(async (ctx, next) => {
  const start = new Date();
  try {
    await next();
  } catch (error) {
    logger.error('server error', error);
    ctx.status = error.status || 500;
    if (env === 'development') {
      ctx.body = error;
    }
  }
  const responseTime = new Date() - start;
  const logObj = { responseTime };
  ["method", "url", "res.statusCode", "response.body"].forEach(n => (logObj[n] = _.get(ctx, n)));
  logger.info(logObj);
});

// routes
const wechat = require('./routes/wx/wechat');
const userRouter = require('./routes/api/user');
const devRouter = require('./routes/api/_development');

router.redirect('/', '/wx/login');
router.use('/wx', wechat.routes(), wechat.allowedMethods());
router.use('/api/dev', devRouter.routes(), devRouter.allowedMethods());
router.use('/api/user', userRouter.routes(), userRouter.allowedMethods());

app.use(router.routes(), router.allowedMethods());

const server = http.createServer(app.callback());
if (!module.parent) {
  server.listen(process.env.PORT || 3500);
  server.on('listening', () => {
    logger.info('Server listening on http://localhost:%d', server.address().port);
  });
}

process.on('uncaughtException', (err) => {
  const errObj = _.isString(err) ? new Error(err) : err;
  logger.error(errObj.stack);
  try {
    const killTimer = setTimeout(() => {
      process.exit(1);
    }, 30000);
    killTimer.unref();
    server.close();
  } catch (e) {
    logger.error('error when exit', e.stack);
  }
});

module.exports = server;
