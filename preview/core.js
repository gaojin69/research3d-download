(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ResearchCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';const Conditions=typeof module==='object'?require('./conditions.js'):ResearchConditions;
 const VERSION='CNB_V1:n500:l3:a1',KEYS=['dan','pairs','selected','four','five','six','direct','group3'],LABELS=['独胆','双码','精选','四码','五码','六码','直选','组三'];
 const RULES=['两个备选数字出现任意一个，不限位置。','任意一组双码的两个不同数字都出现，不限位置。','四注精选中任一注逐位相同。','三位全部在四码池，可重号。','三位全部在五码池，可重号。','三位全部在六码池，可重号。','百、十、个位逐位一致。','恰有两个相同数字，不定位，排除豹子。'];
 const all=Array.from({length:1000},(_,i)=>String(i).padStart(3,'0'));
 function ensure(value,message){if(!value)throw Error(message);}
 function validateHistory(rows){ensure(Array.isArray(rows)&&rows.length<=20000,'开奖数据格式无效');const seen=new Set();let last='';
  for(const r of rows){ensure(Array.isArray(r)&&r.length===4&&r.every(v=>typeof v==='string')&&r[0].length===(rows[0]&&rows[0][0].length)&&/^(?:\d{5}|\d{7})$/.test(r[0])&&/^\d{4}-\d{2}-\d{2}$/.test(r[1])&&Number.isFinite(Date.parse(r[1]))&&new Date(r[1]).toISOString().slice(0,10)===r[1]&&/^\d{3}$/.test(r[2])&&['pending','verified','manual_verified','conflict'].includes(r[3]),'开奖记录无效');
   const key=r[1]+':'+r[0];ensure(key>last&&!seen.has(r[0]),'开奖记录乱序或重复');last=key;seen.add(r[0]);}return rows;}
 const gcd=(a,b)=>{while(b){const t=a%b;a=b;b=t;}return a;};
 function weights(numbers){ensure(numbers.length===503&&numbers.every(n=>/^\d{3}$/.test(n)),'需要完整503期历史训练500组样本');
  const counts=Array.from({length:3},()=>Array(10).fill(0)),features=Array.from({length:3},()=>Array.from({length:10},()=>Array.from({length:9},()=>Array(10).fill(0))));
  const input=at=>[...numbers.slice(at-3,at).reverse().join('')].map(Number);
  for(let t=3;t<503;t++){const x=input(t);for(let p=0;p<3;p++){const y=Number(numbers[t][p]);counts[p][y]++;x.forEach((v,j)=>features[p][y][j][v]++);}}
  const x=input(503);return counts.map((row,p)=>{const denominator=row.map(n=>BigInt(n+10)**9n),common=denominator.reduce((a,b)=>a/gcd(a,b)*b,1n);
   return row.map((n,y)=>BigInt(n+1)*x.reduce((a,v,j)=>a*BigInt(features[p][y][j][v]+1),1n)*(common/denominator[y]));});}
 function decimal(n,d){const base=1000000000000n,q=n*base/d,remainder=n*base%d;const rounded=q+(remainder*2n>d||remainder*2n===d&&q%2n===1n?1n:0n);return String(rounded/base)+'.'+String(rounded%base).padStart(12,'0');}
 function predict(history,count=20){validateHistory(history);ensure([10,20,50,100].includes(count),'直选数量仅支持10/20/50/100');ensure(history.length>=503,'历史不足503期，不能生成AI预测');
  const window=history.slice(-503),w=weights(window.map(r=>r[2])),total=w.map(a=>a.reduce((s,n)=>s+n,0n)).reduce((a,b)=>a*b,1n);
  const ranked=all.map(n=>({number:n,weight:w[0][Number(n[0])]*w[1][Number(n[1])]*w[2][Number(n[2])]}));
  const digits=Array(10).fill(0n),pairs={},groups={};
  for(const r of ranked){const seen=[...new Set(r.number)].sort();for(const d of seen)digits[Number(d)]+=r.weight;
   for(let i=0;i<seen.length;i++)for(let j=i+1;j<seen.length;j++){const pair=seen[i]+seen[j];pairs[pair]=(pairs[pair]||0n)+r.weight;}
   if(seen.length===2){const group=[...r.number].sort().join('');groups[group]=(groups[group]||0n)+r.weight;}}
  const compare=(a,b)=>a.weight>b.weight?-1:a.weight<b.weight?1:a.number.localeCompare(b.number);ranked.sort(compare);
  const ds=digits.map((weight,n)=>({number:String(n),weight})).sort(compare),ps=Object.entries(pairs).map(([number,weight])=>({number,weight})).sort(compare),gs=Object.entries(groups).map(([number,weight])=>({number,weight})).sort(compare);
  const item=r=>({number:r.number,score:decimal(r.weight,total)}),values=[ds.slice(0,2).map(item),ps.slice(0,3).map(item),ranked.slice(0,4).map(item)];
  for(const size of [4,5,6]){const pool=ds.slice(0,size).map(r=>r.number).sort().join('');const allowed=new Set(pool);const score=ranked.filter(r=>[...r.number].every(d=>allowed.has(d))).reduce((s,r)=>s+r.weight,0n);values.push([{number:pool,score:decimal(score,total)}]);}
  values.push(ranked.slice(0,count).map(item),gs.slice(0,12).map(item));
  return {version:VERSION,count,cutoff:window.at(-1),training_start:window[3][0],context:window.slice(-3),sections:KEYS.map((key,i)=>({key,label:LABELS[i],items:values[i],rule:RULES[i]}))};}
 function covers(key,values,n){ensure(KEYS.includes(key)&&/^\d{3}$/.test(n),'预测栏或号码无效');if(key==='dan')return values.some(d=>n.includes(d));if(key==='pairs')return values.some(pair=>[...pair].every(d=>n.includes(d)));
  if(['four','five','six'].includes(key))return [...n].every(d=>values[0].includes(d));if(key==='group3')return new Set(n).size===2&&values.includes([...n].sort().join(''));return values.includes(n);}
 function feature(n){const d=[...n].map(Number),s=[...d].sort((a,b)=>a-b),pairs=[d[0]+d[1],d[0]+d[2],d[1]+d[2]].sort((a,b)=>a-b),diff=[Math.abs(d[0]-d[1]),Math.abs(d[0]-d[2]),Math.abs(d[1]-d[2])].sort((a,b)=>a-b);
  return {sum:d.reduce((a,b)=>a+b,0),tail:d.reduce((a,b)=>a+b,0)%10,span:s[2]-s[0],odd_count:d.filter(v=>v%2).length,big_count:d.filter(v=>v>=5).length,mod0_count:d.filter(v=>v%3===0).length,mod1_count:d.filter(v=>v%3===1).length,mod2_count:d.filter(v=>v%3===2).length,
   repeat_count:3-new Set(d).size,min:s[0],median:s[1],max:s[2],big_sum:d.filter(v=>v>=5).reduce((a,b)=>a+b,0),small_sum:d.filter(v=>v<5).reduce((a,b)=>a+b,0),odd_sum:d.filter(v=>v%2).reduce((a,b)=>a+b,0),even_sum:d.filter(v=>v%2===0).reduce((a,b)=>a+b,0),
   site_prime_sum:d.filter(v=>[1,2,3,5,7].includes(v)).reduce((a,b)=>a+b,0),site_composite_sum:d.filter(v=>[0,4,6,8,9].includes(v)).reduce((a,b)=>a+b,0),pair_sum_min:pairs[0],pair_sum_median:pairs[1],pair_sum_max:pairs[2],pair_diff_min:diff[0],pair_diff_median:diff[1],pair_diff_max:diff[2],weighted_sum:d[0]+2*d[1]+3*d[2],weighted_tail:(d[0]+2*d[1]+3*d[2])%10};}
 const LIMITS={sum:27,tail:9,span:9,odd_count:3,big_count:3,mod0_count:3,mod1_count:3,mod2_count:3,repeat_count:2,min:9,median:9,max:9,big_sum:27,small_sum:12,odd_sum:27,even_sum:24,site_prime_sum:21,site_composite_sum:27,pair_sum_min:18,pair_sum_median:18,pair_sum_max:18,pair_diff_min:9,pair_diff_median:9,pair_diff_max:9,weighted_sum:54,weighted_tail:9};
 function hasExclusions(c){return Boolean(c&&(c.positionExcludes?.some(Boolean)||c.patternExclude||c.snapshot?.exclude||(c.ranges||[]).some(r=>r.exclude)||(c.rules||[]).some(r=>r.exclude)||(c.workbench?.rules||[]).some(r=>r.exclude)||(c.extended?.gaps||[]).some(r=>r.exclude)));}
 function checkConditions(c){ensure(c&&Array.isArray(c.positions)&&c.positions.length===3&&c.positions.every(a=>Array.isArray(a)&&a.every(v=>Number.isInteger(v)&&v>=0&&v<=9)),'定位条件无效');ensure(['all','group6','group3','triple'].includes(c.pattern),'形态条件无效');ensure(c.positionExcludes===undefined||Array.isArray(c.positionExcludes)&&c.positionExcludes.length===3&&c.positionExcludes.every(v=>typeof v==='boolean'),'定位处理方式无效');ensure(c.patternExclude===undefined||typeof c.patternExclude==='boolean','形态处理方式无效');
  ensure(Array.isArray(c.ranges)&&c.ranges.length<=32,'最多32项条件');for(const r of c.ranges)ensure((r.exclude===undefined||typeof r.exclude==='boolean')&&Object.hasOwn(LIMITS,r.field)&&Number.isInteger(r.min)&&Number.isInteger(r.max)&&r.min>=0&&r.max<=LIMITS[r.field]&&r.min<=r.max,'数值条件范围无效');
  Conditions.checked(c.rules===undefined?[]:c.rules,c.lottery);if(c.snapshot){ensure(c.snapshot.exclude===undefined||typeof c.snapshot.exclude==='boolean','快照处理方式无效');const {key,values}=c.snapshot;ensure(KEYS.includes(key)&&Array.isArray(values)&&values.length>0&&new Set(values).size===values.length,'预测快照条件无效');
   const size={dan:1,pairs:2,selected:3,four:4,five:5,six:6,direct:3,group3:3}[key];ensure(values.every(v=>typeof v==='string'&&new RegExp('^[0-9]{'+size+'}$').test(v)),'快照号码位数无效');
   if(['four','five','six'].includes(key))ensure(values.length===1&&new Set(values[0]).size===size&&[...values[0]].sort().join('')===values[0],'数字池无效');
   if(key==='dan')ensure(values.length===2,'独胆必须为两个备选数字');if(key==='pairs')ensure(values.length===3&&values.every(v=>v[0]<v[1]),'双码必须为三组不同数字');
   if(key==='selected')ensure(values.length===4,'精选必须为四注');if(key==='direct')ensure([10,20,50,100].includes(values.length),'直选数量无效');
   if(key==='group3')ensure(values.length===12&&values.every(v=>new Set(v).size===2&&[...v].sort().join('')===v),'组三组合无效');}return c;}
 function filter(c){checkConditions(c);return all.filter(n=>{if(!c.positions.every((a,i)=>!a.length||(c.positionExcludes?.[i]?!a.includes(Number(n[i])):a.includes(Number(n[i])))))return false;
  const distinct=new Set(n).size;if(c.pattern!=='all'){const same=distinct===({group6:3,group3:2,triple:1}[c.pattern]);if(c.patternExclude?same:!same)return false;}
  const f=feature(n);return c.ranges.every(r=>r.exclude?!(f[r.field]>=r.min&&f[r.field]<=r.max):f[r.field]>=r.min&&f[r.field]<=r.max)&&(c.rules||[]).every(r=>Conditions.matches(r,n))&&(!c.snapshot||(c.snapshot.exclude?!covers(c.snapshot.key,c.snapshot.values,n):covers(c.snapshot.key,c.snapshot.values,n)));});}
 function empty(){return {positions:[[],[],[]],pattern:'all',ranges:[],snapshot:null};}
 async function replay(history,window,count,onProgress,cancel){validateHistory(history);ensure([30,50,100,300].includes(window),'历史窗口仅支持30/50/100/300');const start=Math.max(0,history.length-window),rows=[];
  for(let at=start;at<history.length;at++){if(cancel&&cancel())throw Error('检验已取消');const target=history[at];if(at<503)rows.push({target,hit:null,reason:'开奖前历史不足503期'});
   else{const p=predict(history.slice(Math.max(0,at-503),at),count);rows.push({target,cutoff:p.cutoff[0],values:p.sections.map(r=>r.items.map(i=>i.number)),hit:p.sections.map(r=>covers(r.key,r.items.map(i=>i.number),target[2])),population:p.sections.map(r=>all.filter(n=>covers(r.key,r.items.map(i=>i.number),n)).length)});}
   if(onProgress)onProgress(at-start+1,history.length-start);await new Promise(resolve=>setTimeout(resolve,0));}
  const usable=rows.filter(r=>r.hit),stats=KEYS.map((key,i)=>({key,label:LABELS[i],hits:usable.filter(r=>r.hit[i]).length,evaluable:usable.length,skipped:rows.length-usable.length,baseline:usable.length?usable.reduce((s,r)=>s+r.population[i],0)/(1000*usable.length):null}));return {rows,stats,notice:'逐期开奖前重建，不是当时已发布预测。历史命中率不代表未来中奖概率。'};}
 function mergeHistory(oldRows,newRows,today){validateHistory(oldRows);validateHistory(newRows);ensure(oldRows.length,'本机历史为空');const map=new Map(oldRows.map(r=>[r[0],r]));
  ensure(newRows.some(r=>r[0]===oldRows.at(-1)[0]),'官方窗口未包含本机最新一期，请稍后重试或更新程序');
  for(const row of newRows){ensure(row[1]<=today,'官方记录包含未来日期');const prior=map.get(row[0]);if(prior)ensure(prior[1]===row[1]&&prior[2]===row[2],'同期开奖数据冲突，旧数据保留');else if(row[1]>oldRows.at(-1)[1])map.set(row[0],row);}
  const result=[...map.values()].sort((a,b)=>(a[1]+a[0]).localeCompare(b[1]+b[0]));validateHistory(result);
  let prior=oldRows.at(-1);for(const row of result.slice(oldRows.length)){const previousYear=prior[0].slice(0,-3),year=row[0].slice(0,-3);ensure(row[0].length===prior[0].length&&(year===previousYear?Number(row[0].slice(-3))===Number(prior[0].slice(-3))+1:Number(year)===Number(previousYear)+1&&row[0].endsWith('001')),'新开奖期号不连续，旧数据保留');prior=row;}return result;}
 function text(p,lottery){return [`${lottery==='FC3D'?'福彩3D':'排列3'} · 安卓AI研究预测`,`数据截止：${p.cutoff[0]} / ${p.cutoff[1]}`,...p.sections.map(s=>s.label+'：'+s.items.map(i=>i.number).join(' ')+'\n依据：'+s.rule),`模型：${VERSION} · 500组训练样本 · 前3期9个定位数字\n训练范围：${p.training_start}–${p.cutoff[0]}\n输入：${p.context.map(r=>r[0]+'期 '+r[2]).join('、')}`,'评分未作概率校准，不保证中奖。TXT不能替代完整方案或首次预测留档。'].join('\n\n');}
 return {hasExclusions,VERSION,KEYS,LABELS,LIMITS,all,validateHistory,predict,covers,feature,checkConditions,filter,empty,replay,mergeHistory,text};
});
