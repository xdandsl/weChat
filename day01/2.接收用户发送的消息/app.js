
const express = require('express');

//引入自定义工具模块
const{getUserDataAsync,parseXMLDataAsync,formatMessage}= require('./utils/tools');

const app = express();
const sha1 = require('sha1');
/*
 1. 搭建开发者服务器, 使用中间件接受请求
 2. 默认localhost:3000访问本地服务器， 需要一个互联网能够访问的域名地址
 借助ngrok工具，能将本地地址映射为互联网能访问的域名地址
 3. 测试号管理页面填写服务器配置：
 url：通过ngrok映射的地址   http://3389687c.ngrok.io
 token：参与微信签名加密的参数， 自己定义，尽量复杂
 4. 验证微信服务器有效性
 目的：验证消息来自于微信服务器， 同时返回一个特定参数给微信服务器（告诉微信服务器我这里准备ok）

 - 将参数签名加密的三个参数（timestamp、nonce、token）组合在一起，按照字典序排序
 - 将排序后的参数拼接在一起，进行sha1加密
 - 加密后的到的就是微信签名，将其与微信发送过来的微信签名对比，
 - 如果一样，说明消息来自于微信服务器，返回echostr给微信服务器
 - 如果不一样，说明消息不是微信服务器发送过来的，返回error

 */

const shenlan = {
  appID: 'wxf8c3d0c0f188cdbe',//在测试号管理界面，每个开发者固定的
  appsecret: '4c3a6a297e973168a7d9b7d03178c88c',//在测试号管理界面，每个开发者固定的
  token: 'SHENLAN130682'//自己定义。在测试号管理界面
}

//使用中间件接收请求（因为不清楚是什么请求）
app.use(async (req,res,next) =>{
  console.log(req.query);
  /*
   { signature: 'ff299dfb0059ee0359f0851e30d9ae8ee439790a',  微信签名
   echostr: '3330701733801130972',  微信后台生成随机字符串
   timestamp: '1542349780',   时间戳
   nonce: '1704777037' }      微信后台生成随机数字
   */
  //获取请求参数
  const {signature, echostr, timestamp, nonce} = req.query;
  const {token} = shenlan;
  const str = sha1([timestamp, nonce, token].sort().join(''));

  //第一，判断是否是get请求或者post请求  通过req.method
  if(req.method === 'GET'){
    //get请求总思路：直接验证服务器的有效性
    // - 加密后的到的就是微信签名，将其与微信发送过来的微信签名对比，
    if (signature === str) {
      //说明消息来自于微信服务器
      res.end(echostr);
    } else {
      //说明消息不来自于微信服务器
      res.end('error');
    }
  }else if(req.method === 'POST'){
    //post请求的思路：第一，如果消息不是来自微信服务器，直接返回
    if(signature !== str){
      res.end('error');
      return;
    }
    //第二，接收微信服务器转发的用户的消息（都在req中）
    //1,读取转发的用户的消息（xml数据）
    const xmlData = await getUserDataAsync(req);
    // console.log(xmlData);
    // <xml>  这个xml数据即为得到的xml数据
      // <ToUserName><![CDATA[gh_672b38f31741]]></ToUserName>  //开发者的微信号（再测试页面有显示）
    //   <FromUserName><![CDATA[oRh2R50_DfCRGbPsYrqHzsjTb5tw]]></FromUserName> //用户的微信号
    //   <CreateTime>1542369310</CreateTime>  //时间戳  秒为单位
    //   <MsgType><![CDATA[text]]></MsgType> //消息类型
    //   <Content><![CDATA[22]]></Content>   //消息的具体内容
    //   <MsgId>6624425745221524948</MsgId>  //消息id，微信服务器默认保存3天的消息，在此期间通过这个id就能找到这个
  //   </xml>

    //3，将得到的xml数据转成js对象。。。（对数据进行操作）
    //思路：封装函数。从npm库中寻找方法  通过模块xml2js来完成
     const data = await parseXMLDataAsync(xmlData);
     // console.log(data);
     //得到的data数据。为对象类型。。。想要数组里面字符串的值
    // { xml:
    // { ToUserName: [ 'gh_672b38f31741' ],
    //   FromUserName: [ 'oRh2R50_DfCRGbPsYrqHzsjTb5tw' ],
    //   CreateTime: [ '1542371513' ],
    //   MsgType: [ 'text' ],
    //   Content: [ '33' ],
    //   MsgId: [ '6624435207034478039' ] } }

    //4，转化得到的js对象（包含请求的数据）
    const message =  formatMessage(data);
    // console.log(message);
    //得到的message对象
    // { ToUserName: 'gh_672b38f31741',
    //   FromUserName: 'oRh2R50_DfCRGbPsYrqHzsjTb5tw',
    //   CreateTime: '1542372539',
    //   MsgType: 'text',
    //   Content: '55',
    //   MsgId: '6624439613670923737' }

    //5,初始化一个回复消息文本
    let content = '你在说什么，我听不懂~';

    //判断用户发送消息的内容，根据内容返回特定的响应
    if (message.Content === '小') {  //全匹配
      content = '大东哥';
    } else if (message.Content === '猪') {
      content = '小猪婆';
    } else if (message.Content.includes('爱')) {  //半匹配
      content = '哈哈哈哈哈，我也爱你';
    }

    //6，返回xml微信消息给微信服务器（设置回复消息根据请求的数据）
    //微信官网提供的xml数据有问题，有多余的空格，要手动去除，不去除会报错
    let replyMessage = `<xml>
      <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName> 
      <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
      </xml>`;


    //2，当服务器没有返回响应给微信服务器时，微信服务器默认会请求三次，所以可以先设置一个 res.end('');
    // res.end('');
    res.send(replyMessage);
  }else{
    res.end('error');
  }
});


app.listen(3000,err => {
  if(!err) console.log('服务器连接成功');
  else console.log(err);
});
