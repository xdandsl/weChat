/**
 * 把处理响应的中间件，拿出来单独维护
 */

//错误1，记得把所有需要的模块都重新引入过来。然后记得改路径
const sha1 = require('sha1');

const {getUserDataAsync, parseXMLDataAsync, formatMessage} = require('../utils/tools');
const reply = require('./reply');
const template = require('./template');
const config = require('../config');


module.exports = ()=>{
  //错误2：记得return 这个async函数，
   return async (req, res, next) => {
    console.log(req.query);
    //获取请求参数
    const {signature, echostr, timestamp, nonce} = req.query;
    const {token} = config;
    const str = sha1([timestamp, nonce, token].sort().join(''));
    /*
     微信服务器会发送两种类型的消息给开发者
     1. GET 验证服务器有效性逻辑
     2. POST 转发用户消息
     */
    if (req.method === 'GET') {
      // 验证服务器有效性逻辑
      if (signature === str) {
        //说明消息来自于微信服务器
        res.end(echostr);
      } else {
        //说明消息不来自于微信服务器
        res.end('error');
      }
    } else if (req.method === 'POST') {
      // 转发用户消息
      //接受微信服务器转发用户消息
      //验证消息来自于微信服务器
      if (signature !== str) {
        res.end('error');
        return;
      }
      //用户发送的消息在请求体
      const xmlData = await getUserDataAsync(req);
      console.log(xmlData);
      //将用户发送过来的xml数据解析为js对象
      const jsData = await parseXMLDataAsync(xmlData);
      console.log(jsData);
      /*
       {
       xml:
       { ToUserName: [ 'gh_4fe7faab4d6c' ],
       FromUserName: [ 'oAsoR1iP-_D3LZIwNCnK8BFotmJc' ],
       CreateTime: [ '1542355988' ],
       MsgType: [ 'text' ],
       Content: [ '222' ],
       MsgId: [ '6624368527677682013' ]
       }
       }
       */
      //格式化数据
      const message = formatMessage(jsData);
      console.log(message);
      /*
       { ToUserName: 'gh_4fe7faab4d6c',
       FromUserName: 'oAsoR1iP-_D3LZIwNCnK8BFotmJc',
       CreateTime: '1542356422',
       MsgType: 'text',
       Content: '333',
       MsgId: '6624370391693488478' }
       */
      const options = reply(message);

      const replyMessage = template(options);
      console.log(replyMessage);

      res.send(replyMessage);

    } else {
      res.end('error');
    }
  }
}
