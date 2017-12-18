const xml = require('../utils/xml');

exports.getHandler = async ctx => {
  ctx.body = ctx.state;
};

exports.postHandler = async ctx => {
  const message = ctx.request.body;
  let reply = '';

  if (message.MsgType === 'event') {
    if (message.Event === 'subscribe') {
      ctx.status = 200;
      ctx.type = 'application/xml';
      reply = '终于等待你，还好我没走...';
    }
    else if (message.Event === 'unsubscribe') {
      console.log(message.FromUserName + ' 悄悄地走了...');
      reply = '';
    }
  }

  else if (message.MsgType === 'text') {
    const content = message.Content;
    reply = '你说的话：“' + content + '”，我听不懂呀';
  }
  ctx.body = xml.jsonToXml({
    Content: reply,
    ToUserName: message.FromUserName,
    FromUserName: message.ToUserName
  });
};
