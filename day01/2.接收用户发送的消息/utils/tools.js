/**
 * 封装的一些工具函数
 */

//引入xml2js模块
const {parseString} = require('xml2js');

module.exports = {
  //1,获取用户数据的参数的函数
  getUserDataAsync(req){
    return new Promise(resolve => {
      //接收数据 ,以及判断数据何时接收成功
      let result = '';
      req
        .on('data',data => {
          console.log(data.toString());//data为buffer数据，即为二进制的数据
          result += data.toString();//需要转成字符串数据
        })
        .on('end',() => {
          console.log('数据接收完毕');
          //记得把拼接完成的最后的数据写上
          resolve(result);
        })
    });
  },
  //2,将xml数据转成js对象
  parseXMLDataAsync(xmlData){
    return new Promise((resolve,reject) => {
      //{trim: true} 去除空格操作
      parseString(xmlData,{trim: true},function (err, data) {
        if(!err){
          resolve(data);//data即为转化后的js对象
        }else{
          reject('parseXMLDataAsync方法出了问题：' + err);
        }
      })
    })
  },

  //3，得到想要的值,即格式化数据
  //得到的data数据。为对象类型。。。想要数组里面字符串的值
  // { xml:
  // { ToUserName: [ 'gh_672b38f31741' ],
  //   FromUserName: [ 'oRh2R50_DfCRGbPsYrqHzsjTb5tw' ],
  //   CreateTime: [ '1542371513' ],
  //   MsgType: [ 'text' ],
  //   Content: [ '33' ],
  //   MsgId: [ '6624435207034478039' ] } }
  formatMessage({xml}){
    //{xml}解构赋值，{xml} = data  xml即为对应的对象值
    //枚举对象上的属性
    let obj = {};//定义空对象存放遍历的属性值
    for (let key in xml) {
       obj[key] = xml[key][0];
    }
    return obj;
  }

};
