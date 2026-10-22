(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ResearchReleaseChecks=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function conditions(c,lottery,version){
  if(!c||typeof c!=='object'||Array.isArray(c)||!['FC3D','PL3'].includes(lottery)||c.lottery!==undefined&&c.lottery!==lottery)throw Error('保存条件彩种或结构无效');
  if(!Array.isArray(c.ranges)||c.ranges.some(r=>!r||typeof r.field!=='string'))throw Error('范围条件字段必须是名称文字');
  if(c.snapshot){const s=c.snapshot;if(typeof s!=='object'||Array.isArray(s)||Object.keys(s).filter(k=>k!=='exclude').sort().join(',')!=='cutoff,key,values,version'||s.exclude!==undefined&&typeof s.exclude!=='boolean'||typeof s.cutoff!=='string'||!new RegExp('^[0-9]{'+(lottery==='FC3D'?7:5)+'}$').test(s.cutoff)||!(s.version===version||version==='CB_NO_GAP_TEN_V1_20261022'&&s.version==='CNB_V1:n500:l3:a1'))throw Error('预测快照截止期或模型版本无效');}
  return c;
 }
 return {conditions};
});
