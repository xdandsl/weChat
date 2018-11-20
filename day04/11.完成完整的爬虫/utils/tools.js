/*
  工具方法
 */
const {parseString} = require('xml2js');
const {writeFile,readFile} = require('fs');

module.exports = {
  getUserDataAsync (req) {
    return new Promise(resolve => {
      //接受数据
      let result = '';
      req
        .on('data', data => {
          console.log(data.toString()); //buffer
          result += data.toString();
        })
        .on('end', () => {
          console.log('用户数据接受完毕');
          resolve(result);
        })
    })
    
  },
  parseXMLDataAsync (xmlData) {
    return new Promise((resolve, reject) => {
      parseString(xmlData, {trim: true}, (err, data) => {
        if (!err) {
          resolve(data);
        } else {
          reject('parseXMLDataAsync方法出了问题：' + err);
        }
      })
    })
  },
  formatMessage ({xml}) {
    // const {xml} = jsData
    //去掉xml
    //去掉[]
    let result = {};
    //遍历对象
    for (let key in xml) {
      //获取属性值
      let value = xml[key];
      //去掉[]
      result[key] = value[0];
    }
    
    return result;
  },

  //把保存ticket的writefile方法进行封装
  writeFileAsync(filepath,data){
    return new Promise((resolve, reject) => {
      writeFile(filepath, JSON.stringify(data), err => {
        if (!err) {
          resolve();
        } else {
          reject('writeFileAsync方法出现了问题：' + err);
        }
      })
    })
  },

  //把保存ticket的readfile方法进行封装
  readFileAsync(filepath){
    return new Promise((resolve, reject) => {
      readFile(filepath, (err, data) => {
        if (!err) {
          //读取到的数据data为buffer类型数据，然后需要data.tostring(),然后再转成js对象
          resolve(JSON.parse(data.toString()));
        } else {
          reject('readFileAsync方法出了问题:' + err);
        }
      })
    })
  }


};