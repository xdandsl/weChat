/**
 * 接口管理模块（把所有的url接口单独放到一个模块中，防止后期接口发生变动，便于后期的维护）
 */

const profix = `https://api.weixin.qq.com/`;
//原则：把所有接口中，不变的量实时获取，变得量放在此模块中。。。
module.exports = {
  accessToken:`${profix}cgi-bin/token?`,
  menu:{
    createMenu:`${profix}cgi-bin/menu/create?`,
    deleteMenu:`${profix}cgi-bin/menu/delete?`
  },
  tag:{
    createTag:`${profix}cgi-bin/tags/create?`,
    deleteTag:`${profix}cgi-bin/tags/delete?`,
    getTag:`${profix}/cgi-bin/user/tag/get?`,
    batch:`${profix}/cgi-bin/tags/members/batchtagging?`
  }
};

