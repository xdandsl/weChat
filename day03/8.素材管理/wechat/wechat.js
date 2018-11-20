/**
 * 获取access_token
 */
/*
 获取access_token。
 1. 是什么？
 微信公众号的全局唯一接口调用凭据

 接口/api  application interface:
 1. url地址： 全称包含：请求方式、请求地址、请求参数、响应内容等
 2. 公共函数/方法
 2. 作用：
 使用access_token才能成功调用微信的各个接口
 3. 特点：
 1. access_token的存储至少要保留512个字符空间
 2. 有效期目前为2个小时，提前5分钟刷新
 3. 重复获取将导致上次获取的access_token失效，注意不要用别人的appid appseceret
 4. access_token接口调用时有限的，大概为2000次
 4. 请求地址
 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
 5. 请求方式：
 GET
 6. 请求成功的响应结果：
 JSON： {"access_token":"ACCESS_TOKEN","expires_in":7200}
 7. 发送请求：
 npm install --save request request-promise-native
 8. 设计：
 - 第一次发送请求，获取access_token，保存下来
 - 第二次读取之前保存的access_token，判断是否过期
 - 过期了, 重新发送请求，获取access_token，保存下来（覆盖之前的）
 - 没有过期, 直接使用
 整理：
 读取本地保存access_token（readAccessToken）
 -
 - 判断是否过期（isValidAccessToken）
 - 过期了, 重新发送请求，获取access_token（getAccessToken），保存下来（覆盖之前的）(saveAccessToken)
 - 没有过期, 直接使用
 - 没有
 - 发送请求，获取access_token，保存下来
 */

const rp = require('request-promise-native');
const {writeFile,readFile,createReadStream} = require('fs');//writeFile 和readFile均为fs上面异步的方法。
const {appID,appsecret} = require('../config');
const api = require('../api');

//异步的方法通常包含一个promise对象。根据promise对象的状态决定下一步执行的操作(.then()或者.catch())//或者配合async函数使用
//如何判断是否是异步的方法:有一个回调函数
//

//第一步,定义class类（构造函数，可以new一个实例对象accessToken，拥有类上的所有方法），保存方法
class Wechat {
  //1，获取access_token（getAccessToken）
  async getAccessToken() {
    const url = `${api.accessToken}grant_type=client_credential&appid=${appID}&secret=${appsecret}`;
    const result = await rp({method: 'GET', url, json: true});
    //请求的json数据   JSON： {"access_token":"ACCESS_TOKEN","expires_in":7200}
    //获取时设置access_token的过期时间。  当前获取时间+有效时间-提前刷新的5分钟时间    注意看单位为ms
    result.expires_in = Date.now() + 7200000 - 300000;
    return result;
  }

  //2，保存access_token（saveAccessToken）  传参：保存的文件路径，以及保存的内容
  saveAccessToken(filepath, accessToken) {
    //异步的方法，等保存成功才执行下面的代码。。异步方法通常包一个promise对象。。
    //js对象转成json字符串，再保存
    return new Promise((resolve, reject) => {
      writeFile(filepath, JSON.stringify(accessToken), err => {
        if (!err) {
          resolve();
        } else {
          reject('saveAccessToken方法出现了问题：' + err);
        }
      })
    })
  }

  //3，读取本地保存的access_token（readAccessToken）  传参：读取的文件路径
  readAccessToken(filepath) {
    return new Promise((resolve, reject) => {
      readFile(filepath, (err, data) => {
        if (!err) {
          //读取到的数据data为buffer类型数据，然后需要data.tostring(),然后再转成js对象

          resolve(JSON.parse(data.toString()));
        } else {
          reject('readAccessToken方法出了问题:' + err);
        }
      })
    })
  }

  //4，判断access_token是否过期（isValidAccessToken）
  isValidAccessToken({expires_in}) {
    //这里的{expires_in}== 传入的accessToken对象，相当于解构赋值
    //思路：当前时间与过期时间对比
    return expires_in > Date.now();
  }

  //5，获取最终有效的的accessToken(fetchAccessToken 方法)
  fetchAccessToken() {
    if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
      console.log('进来了~');
      //说明access_token是有效的
      return Promise.resolve({access_token: this.access_token, expires_in: this.expires_in});
    }
    return this.readAccessToken('./accessToken.txt')
      .then(async res => {
        //本地有access_token
        //判断是否过期
        if (this.isValidAccessToken(res)) {
          //没过期
          return res;
        } else {
          //过期
          const accessToken = await this.getAccessToken();
          await this.saveAccessToken('./accessToken.txt', result);
          return accessToken;
        }
      })
      .catch(async err => {
        const accessToken = await this.getAccessToken();
        await this.saveAccessToken('./accessToken.txt', accessToken);
        return accessToken;
      })
      .then(res => {
        //不管上面成功或者失败都会来到这
        this.access_token = res.access_token;
        this.expires_in = res.expires_in;

        return Promise.resolve(res);
      })


  }

  //自定义菜单
  //6，创建菜单
  async createMenu(menu) {
    try {
      //获取access_token。。获取了这个才能调用接口
      const {access_token} = await this.fetchAccessToken();
      //定义url地址
      const url = `${api.menu.createMenu}access_token=${access_token}`;
      //发送请求,请求接口调用
      const result = await rp({method: 'POST', url, json: true, body: menu});
      return result;
    } catch (e) {
      return 'createMenu方法出现了问题' + e;
    }
  }

  //7，删除菜单
  async deleteMenu() {
    try {
      //获取access_token。。获取了这个才能调用接口
      const {access_token} = await this.fetchAccessToken();
      //定义url地址
      const url = `${api.menu.deleteMenu}access_token=${access_token}`;
      //发送请求
      const result = await rp({method: 'POST', url, json: true});
      return result;
    } catch (e) {
      return 'deleteMenu方法出现了问题' + e;
    }
  }

  //8，创建用户标签
  async createTag(name) {
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.createTag}access_token=${access_token}`;
      return await rp({method: 'POST', url, json: true, body: {"tag": {name}}});
    }catch(e){
      return 'createTag方法出了问题'+e;
    }
  }

  //9,删除用户标签
  async deleteTag(id){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.deleteTag}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{"tag":{id}}});
    }catch(e){
      return 'deleteTag方法出了问题'+e;
    }

  }

  //10,获取标签下用户列表
  async getTagUsers(tagid,next_openid=""){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.getTag}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{tagid,next_openid}});
    }catch(e){
      return 'getTagUsers方法出了问题'+e;
    }
  }

  //11,批量为用户打标签
  async batchUsersTag(openid_list,tagid){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.batch}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{openid_list,tagid}});
    }catch(e){
      return 'batchUsersTag方法出了问题'+e;
    }
  }

  //12,群发消息
  async sendAllByTag(options){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.message.sendAll}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:options});
    }catch(e){
      return 'sendAllByTag方法出了问题'+e;
    }
  }

  //13,素材管理方法
  async uploadMaterial(type,material,body){
    try{
      const {access_token} = await this.fetchAccessToken();
      let options = {method:'POST',json:true};
      let url = '';
      if(type = 'news'){
       url = `${api.upload.uploadnews}access_token=${access_token}`;
       options.body = material;
      }else if(type === 'pic'){
        url = `${api.upload.uploadimg}access_token=${access_token}`;
        //以form表单上传
        options.formData = {
          media: createReadStream(material)
        }
      }else {
        url = `${api.upload.uploadOthers}access_token=${access_token}&type=${type}`;
        //以form表单上传
        options.formData = {
          media: createReadStream(material)
        };
        if (type === 'video') {
          options.body = body;
        }
      }
      options.url = url;
      return await rp(options);

      }catch(e){
      return 'uploadMaterial方法出了问题'+e;
    }
  };

}


(async () => {
 //  读取本地保存access_token（readAccessToken）
 // -
 //   - 判断是否过期（isValidAccessToken）
 // - 过期了, 重新发送请求，获取access_token（getAccessToken），保存下来（覆盖之前的）(saveAccessToken)
 //  - 没有过期, 直接使用
 //  - 没有
 //  - 发送请求，获取access_token，保存下来
  //1,创建实例对象
  const w = new Wechat();
  // let result = await w.fetchAccessToken();
  //测试素材管理
  

})();




