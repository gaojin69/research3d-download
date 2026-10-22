(function(root,factory){const api=factory(typeof module==='object'?require('./core.js'):ResearchCore,typeof module==='object'?require('./conditions.js'):ResearchConditions);if(typeof module==='object')module.exports=api;else root.ResearchFilterFlow=api;})(typeof globalThis==='object'?globalThis:this,function(C,A){
 'use strict';
 const fields={sum:'和值',tail:'和尾',span:'跨度',odd_count:'奇数个数',big_count:'大数个数',mod0_count:'0路个数',mod1_count:'1路个数',mod2_count:'2路个数',repeat_count:'重复数字数',min:'最小数',median:'中间数',max:'最大数',big_sum:'大数和',small_sum:'小数和',odd_sum:'奇数和',even_sum:'偶数和',site_prime_sum:'质数和（含1）',site_composite_sum:'合数和（含0）',pair_sum_min:'最小两码和',pair_sum_median:'中间两码和',pair_sum_max:'最大两码和',pair_diff_min:'最小两码差',pair_diff_median:'中间两码差',pair_diff_max:'最大两码差',weighted_sum:'加权和值1:2:3',weighted_tail:'加权和尾'};
 const pattern={all:'全部',group6:'组六',group3:'组三',triple:'豹子'},join=a=>a.join('、');
 function ruleText(r){return (r.exclude?'排除所选；':'')+includedText(r);}
 function includedText(r){const p=r.params;
  if(r.type==='dan')return '数字 '+join(p.digits)+'；恰好 '+join(p.counts)+' 个（'+(p.count_mode==='distinct'?'不同数字':'出现次数')+'）';
  if(r.type==='kill')return '排除 '+join(p.digits);
  if(r.type==='partition'){const names={size:{S:'小',B:'大'},parity:{E:'双',O:'单'},site_prime:{P:'质',C:'合'},threeway:{S:'小',M:'中',B:'大'}}[p.scheme];return p.patterns.map(v=>names?[...v].map(x=>names[x]).join(''):v).join('、');}
  if(r.type==='unordered')return join(p.pairs)+'（'+(p.mode==='all'?'各组都出现':'任一组出现')+'）';
  if(r.type==='direction')return '参考 '+p.reference+'；'+p.patterns.map(v=>[...v].map(x=>({U:'升',D:'降',P:'平'})[x]).join('')).join('、');
  if(r.type==='pattern')return p.values.map(v=>pattern[v]).join('、');
  if(r.type==='sorted')return ({min:'最小数',median:'中间数',max:'最大数'})[p.rank]+' '+join(p.values);
  if(r.type.startsWith('pair_'))return ({ht:'百十',hu:'百个',tu:'十个',any:'任一组'})[p.pair]+' '+join(p.values);
  if(r.type==='cyclic')return p.values.map(v=>({0:'无连号',2:'二连号',3:'三连号'})[v]).join('、');
  if(r.type==='shape')return p.values.map(v=>({concave:'凹',convex:'凸',ascending:'升',descending:'降',parallel:'平行',boundary:'边界'})[v]).join('、');
  return join(p.values||[]);
 }
 function entries(c){const list=[];
  c.positions.forEach((a,i)=>{if(a.length)list.push({id:'position-'+i,label:['百位','十位','个位'][i],text:(c.positionExcludes?.[i]?'排除所选；':'')+join(a),position:i});});
  if(c.pattern!=='all')list.push({id:'pattern',label:'号码形态',text:(c.patternExclude?'排除所选；':'')+pattern[c.pattern],pattern:c.pattern});
  c.ranges.forEach((r,i)=>list.push({id:'range-'+i,label:(fields[r.field]||r.field)+'范围 '+(i+1),text:(r.exclude?'排除所选；':'')+r.min+'～'+r.max,range:r}));
  const counts=new Map();(c.rules||[]).forEach((r,i)=>{const category=A.categoryFor(r),key=category&&category[0],number=(counts.get(key)||0)+1;counts.set(key,number);list.push({id:'rule-'+i,label:(category?category[1]:'分类条件')+' · 第'+number+'条',text:ruleText(r),category:key,rule:r});});
  if(c.snapshot)list.push({id:'snapshot',label:C.LABELS[C.KEYS.indexOf(c.snapshot.key)]+'固定号码',text:(c.snapshot.exclude?'排除所选；':'')+c.snapshot.values.join(' ')+'；截止 '+c.snapshot.cutoff,snapshot:c.snapshot});
  return list;
 }
 // All masks come from the existing filter; explanations never change its rules.
 function explain(c){C.checkConditions(c);const selected=entries(c),steps=[];
  const masks=selected.map(e=>{const one=C.empty();one.lottery=c.lottery;if(e.position!==undefined){one.positions[e.position]=c.positions[e.position];if(c.positionExcludes)one.positionExcludes=c.positionExcludes;}if(e.pattern){one.pattern=e.pattern;if(c.patternExclude)one.patternExclude=true;}if(e.range)one.ranges=[e.range];if(e.rule)one.rules=[e.rule];if(e.snapshot)one.snapshot=e.snapshot;return new Set(C.filter(one));});
  let numbers=C.all.slice();masks.forEach((mask,i)=>{const before=numbers.length;numbers=numbers.filter(n=>mask.has(n));steps.push({...selected[i],before,removed:before-numbers.length,after:numbers.length});});
  const intersect=indices=>C.all.filter(n=>indices.every(i=>masks[i].has(n)));
  let conflict=[],repairs=[];
  if(!numbers.length){let group=selected.map((_,i)=>i);for(let i=group.length-1;i>=0;i--){const trial=group.filter(n=>n!==i);if(!intersect(trial).length)group=trial;}conflict=group.map(i=>selected[i]);
   repairs=selected.map((e,i)=>({...e,remaining:intersect(selected.map((_,j)=>j).filter(j=>j!==i)).length})).filter(e=>e.remaining>0);
  }
  return {selected,steps,numbers,conflict,repairs};
 }
 return {entries,explain};
});
