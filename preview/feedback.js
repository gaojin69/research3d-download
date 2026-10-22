(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ResearchFeedback=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';const contact='RURU250203',types=['使用问题','功能建议','开奖数据','其他反馈'];
 function text({type,message,version,lottery,cutoff}){if(!types.includes(type)||typeof message!=='string'||!message.trim()||message.length>1000)throw Error('请填写1～1000字的反馈内容');if(!/^\d+\.\d+\.\d+$/.test(version)||!['FC3D','PL3'].includes(lottery)||typeof cutoff!=='string'||cutoff.length>50)throw Error('反馈信息无效');return '3D数据研究工具 · 体验反馈\n类型：'+type+'\n版本：'+version+'\n彩种：'+(lottery==='FC3D'?'福彩3D':'排列3')+'\n开奖数据截止：'+cutoff+'\n\n'+message.trim();}
 return {contact,types,text};
});
