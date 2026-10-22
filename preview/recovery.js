(function(root,factory){const api=factory(typeof module==='object'?require('./core.js'):ResearchCore,typeof module==='object'?require('./conditions.js'):ResearchConditions);if(typeof module==='object')module.exports=api;else root.ResearchRecovery=api;})(typeof globalThis==='object'?globalThis:this,function(C,A){
 'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v)),ensure=(v,m)=>{if(!v)throw Error(m);};
 function mergeCached(seed,saved,lottery,today){
  const width=lottery==='FC3D'?7:lottery==='PL3'?5:0;ensure(width,'缓存彩种无效');
  for(const rows of [seed,saved]){C.validateHistory(rows);ensure(rows.length>=503&&rows[0][0].length===width&&rows.every(r=>r[1]<=today),'历史缓存范围无效');}
  const originals=new Map(seed.map(r=>[r[0],r]));let overlap=0;
  for(const r of saved){const prior=originals.get(r[0]);if(prior){overlap++;if(prior[1]!==r[1]||prior[2]!==r[2])throw Object.assign(Error('历史缓存与内置同期开奖冲突'),{historyConflict:true});}}
  ensure(overlap,'缓存与内置历史没有共同期号');
  const last=seed.at(-1),newer=saved.filter(r=>r[1]>last[1]);
  const combined=C.mergeHistory(seed,[last,...newer],today),map=new Map(combined.map(r=>[r[0],r]));
  const statusRank={pending:0,verified:1,manual_verified:2,conflict:3};
  for(const r of saved){if(map.has(r[0])){const prior=map.get(r[0]);map.set(r[0],[...prior.slice(0,3),statusRank[r[3]]>=statusRank[prior[3]]?r[3]:prior[3]]);}else{ensure(r[1]<seed[0][1],'缓存有无法合并的历史缺口');map.set(r[0],r);}}
  const result=[...map.values()].sort((a,b)=>(a[1]+a[0]).localeCompare(b[1]+b[0]));C.validateHistory(result);return result;
 }
 // Incomplete drafts are restored as drafts, never accepted as executable rules.
 function draftConditions(value,lottery){
  ensure(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>['positions','pattern','ranges','snapshot','rules','lottery','positionExcludes','patternExclude'].includes(k)),'草稿条件无效');const c=clone(value);
  ensure(c.lottery===undefined||c.lottery===lottery,'草稿条件彩种不一致');c.lottery=lottery;
  ensure(Array.isArray(c.positions)&&c.positions.every(a=>Array.isArray(a)&&a.length<=10&&new Set(a).size===a.length),'草稿定位无效');
  if(c.snapshot)ensure(Object.keys(c.snapshot).filter(k=>k!=='exclude').sort().join(',')==='cutoff,key,values,version'&&typeof c.snapshot.cutoff==='string'&&new RegExp('^[0-9]{'+(lottery==='FC3D'?7:5)+'}$').test(c.snapshot.cutoff)&&[C.VERSION,C.LEGACY_VERSION].filter(Boolean).includes(c.snapshot.version),'草稿预测快照元数据无效');
  const rules=c.rules===undefined?[]:c.rules;ensure(Array.isArray(rules),'草稿分类条件无效');const completed=clone(rules);
  for(const r of completed){const category=A.categoryFor(r);ensure(category,'草稿分类无法恢复');const p=r.params;
   const fillers={digits:[0],counts:[1],values:[0],patterns:['SSS'],pairs:['00']};
   if(r.type==='partition')fillers.patterns=[A.patterns(p.scheme)[0]];
   if(r.type==='pattern')fillers.values=['group6'];if(r.type==='cyclic')fillers.values=[0];if(r.type==='shape')fillers.values=['parallel'];
   if(r.type==='direction'){ensure(typeof p.reference==='string'&&/^[0-9]{0,3}$/.test(p.reference),'草稿参考号码无效');p.reference=p.reference.padStart(3,'0');fillers.patterns=['PPP'];}
   for(const [key,fill] of Object.entries(fillers))if(Array.isArray(p[key])&&p[key].length===0)p[key]=fill;
  }
  C.checkConditions({...c,rules:completed});A.checked(completed,lottery);return c;
 }
 function readDraft(v){
  ensure(v&&v.schema==='android_draft_v1'&&['FC3D','PL3'].includes(v.lottery)&&['prediction','filter','plans','checks','draws'].includes(v.page),'选号草稿格式无效');
  ensure([10,20,50,100].includes(v.count)&&[30,50,100,300].includes(v.window)&&typeof v.calculated==='boolean'&&typeof v.hadPrediction==='boolean'&&typeof v.checking==='boolean'&&typeof v.numberOpen==='boolean'&&A.CATALOG.some(c=>c[0]===v.category),'选号草稿设置无效');
  const c=draftConditions(v.conditions,v.lottery);if(v.calculated)C.filter(c);
  return {...clone(v),conditions:c};
 }
 function releaseRelation(r,installed,code){
  ensure(r&&r.status==='available'&&/^\d+\.\d+\.\d+$/.test(r.version)&&r.apk_url==='research3d-'+r.version+'.apk'&&/^[a-f0-9]{64}$/.test(r.sha256)&&Number.isSafeInteger(r.bytes)&&r.bytes>=1000&&r.bytes<=25*1048576&&Number.isSafeInteger(r.version_code)&&r.version_code>0,'发布信息尚未就绪，请打开下载页查看');
  ensure(/^\d+\.\d+\.\d+$/.test(installed),'已安装版本无效');const a=r.version.split('.').map(Number),b=installed.split('.').map(Number);let order=0;
  for(let i=0;i<3;i++){ensure(Number.isSafeInteger(a[i])&&Number.isSafeInteger(b[i]),'版本数字无效');if(!order&&a[i]!==b[i])order=a[i]>b[i]?1:-1;}
  if(code!==undefined){ensure(Number.isSafeInteger(code)&&code>0,'已安装版本序号无效');const numbered=Math.sign(r.version_code-code);ensure(numbered===order,'发布版本与版本序号不一致');}
  return order>0?'newer':order<0?'older':'current';
 }
 function releaseSummary(response,installed,code){
  const stable=response.release,relation=releaseRelation(stable,installed,code);
  let text='已安装 '+installed+'；正式通道 '+stable.version+(relation==='newer'?' 可更新。':relation==='older'?' 较旧，无需降级。':'，已是该通道当前版本。');
  if(response.candidateUnavailable)return text+' 候选通道暂未读取成功，请打开下载页查看。';
  const c=response.candidate;
  if(!c||c.schema!=='android_candidate_v1'||c.status!=='candidate'||c.formal_acceptance!=='PENDING_REAL_DEVICE')return text+' 候选版信息未就绪，请打开下载页查看。';
  const next=releaseRelation({...c,status:'available'},installed,code);
  return text+' 候选通道 '+c.version+(next==='newer'?' 可试用更新':next==='older'?' 较旧，无需降级':' 与已安装版本相同')+'（尚待实机验收）。';
 }
 return {mergeCached,draftConditions,readDraft,releaseRelation,releaseSummary};
});
