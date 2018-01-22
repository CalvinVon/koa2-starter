// xml Conversion
const xml2js = require('xml2js');

exports.xmlToJson = (str) => {
  return new Promise((resolve, reject) => {
    const parseString = xml2js.parseString;
    parseString(str, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

exports.jsonToXml = (messageObj) => {
  const {
    ToUserName,
    FromUserName,
    MsgType = 'text',
    Content
  } = messageObj;
  const CreateTime = new Date().getTime();
  const header = `<xml>
                  <ToUserName><![CDATA[${ToUserName}]]></ToUserName>
                  <FromUserName><![CDATA[${FromUserName}]]></FromUserName>
                  <CreateTime>${CreateTime}</CreateTime>
                  <MsgType><![CDATA[${MsgType}]]></MsgType>`;
  let content = '';
  switch (MsgType) {
    case 'text':
      content = `<Content><![CDATA[${Content}]]></Content>
                   </xml>`;
      break;
      // case 'image':
      //   let {
      //     MediaId
      //   } = messageObj;
      //   content = `<Image>
      //                    <MediaId><![CDATA[${MediaId}]]></MediaId>
      //                  </Image>
      //                </xml>`;
      //   break;
      // case 'voice':
      //   let {
      //     MediaId
      //   } = messageObj;
      //   content = `<Voice>
      //                    <MediaId><![CDATA[${MediaId}]]></MediaId>
      //                  </Voice>
      //                </xml>`;
      //   break;
      // case 'video':
      //   let {
      //     MediaId,
      //     Title,
      //     Description
      //   } = messageObj;
      //   content = `<Video>
      //                    <MediaId><![CDATA[${MediaId}]]></MediaId>
      //                    <Title><![CDATA[${Title}]]></Title>
      //                    <Description><![CDATA[${Description}]]></Description>
      //                  </Video> 
      //                </xml>`;
      //   break;
      // case 'music':
      //   let {
      //     Title,
      //     Description,
      //     MusicUrl,
      //     HQMusicUrl,
      //     ThumbMediaId
      //   } = messageObj;
      //   content = `<Music>
      //                    <Title><![CDATA[${Title}]]></Title>
      //                    <Description><![CDATA[${Description}]]></Description>
      //                    <MusicUrl><![CDATA[${MusicUrl}]]></MusicUrl>
      //                    <HQMusicUrl><![CDATA[${HQMusicUrl}]]></HQMusicUrl>
      //                    <ThumbMediaId><![CDATA[${ThumbMediaId}]]></ThumbMediaId>
      //                  </Music>
      //                </xml>`;
      //   break;
      // case 'news':
      //   let {
      //     Articles
      //   } = messageObj;
      //   let ArticleCount = Articles.length;
      //   content = `<ArticleCount>${ArticleCount}</ArticleCount><Articles>`;
      //   for (let i = 0; i < ArticleCount; i++) {
      //     content += `<item>
      //                           <Title><![CDATA[${Articles[i].Title}]]></Title>
      //                           <Description><![CDATA[${Articles[i].Description}]]></Description>
      //                           <PicUrl><![CDATA[${Articles[i].PicUrl}]]></PicUrl>
      //                           <Url><![CDATA[${Articles[i].Url}]]></Url>
      //                         </item>`;
      //   }
      //   content += '</Articles></xml>';
      //   break;
    default:
      content = `<Content><![CDATA[Error]]></Content>
                   </xml>`;
  }

  const xml = header + content;
  return xml;
};

exports.wxpayReturn = (returnCode = 'SUCCESS', returnMsg = 'OK') => {
  return `<xml>
    <return_code><![CDATA[${returnCode}]]></return_code>
    <return_msg><![CDATA[${returnMsg}]]></return_msg>
  </xml>`;
};