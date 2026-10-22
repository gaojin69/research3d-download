(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ResearchConditions=api;})(typeof globalThis==='object'?globalThis:this,function(){'use strict';
 const PARTITIONS={size:'SSSSSBBBBB',parity:'EOEOEOEOEO',site_prime:'CPPPCPCPCC',threeway:'SSSMMMMBBB',mod:'0120120120'},SHAPES=['concave','convex','ascending','descending','parallel','boundary'];
 const CATALOG=[['dan','胆码','dan'],['kill','杀码','kill'],['size','大小形态','partition','size'],['parity','单双形态','partition','parity'],['prime','质合形态','partition','site_prime'],['sorted','最小 / 中间 / 最大数','sorted'],['sum','和值多选','values','sum'],['tail','和尾多选','values','tail'],['span','跨度多选','values','span'],['cyclic','环形连号','cyclic'],['pattern','组六 / 组三 / 豹子','pattern'],['bigmiddle','大中小形态','partition','threeway'],['mod','012路形态','partition','mod'],['pairSum','两码和','pair_sum'],['pairTail','两码和尾','pair_tail'],['pairDiff','两码差','pair_diff'],['pairCombined','两码合差','pair_combined'],['unordered','不定位两码','unordered'],['direction','升降平走势','direction'],['shape','凹凸形态','shape']];
 const range=n=>Array.from({length:n+1},(_,i)=>i),ensure=(v,m)=>{if(!v)throw Error(m);},own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const choices=(v,allowed)=>ensure(Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(x=>allowed.includes(x)),'条件取值为空、重复或超出范围');
 function patterns(s){const letters=[...new Set(PARTITIONS[s])];return letters.flatMap(a=>letters.flatMap(b=>letters.map(c=>a+b+c)));}
 function checked(rules,lottery){ensure(Array.isArray(rules)&&rules.length<=32,'分类条件最多32条');ensure(lottery===undefined||['FC3D','PL3'].includes(lottery),'条件彩种无效');
  for(const r of rules){ensure(r&&typeof r==='object'&&Object.keys(r).filter(k=>k!=='exclude').sort().join(',')==='params,type'&&(r.exclude===undefined||typeof r.exclude==='boolean')&&!(r.type==='kill'&&r.exclude)&&typeof r.type==='string'&&r.params&&typeof r.params==='object'&&!Array.isArray(r.params),'分类条件结构无效');const p=r.params,keys={dan:['digits','counts','count_mode'],kill:['digits'],partition:['scheme','patterns'],sorted:['rank','values'],values:['field','values'],cyclic:['values'],pattern:['values'],unordered:['pairs','mode'],direction:['reference','lottery_type','patterns'],shape:['values'],pair_sum:['pair','values'],pair_tail:['pair','values'],pair_diff:['pair','values'],pair_combined:['pair','values']}[r.type];
   ensure(keys&&Object.keys(p).sort().join(',')===keys.slice().sort().join(','),'不支持或不完整的分类条件');
   if(r.type==='dan'){choices(p.digits,range(9));choices(p.counts,range(3));ensure(['distinct','occurrences'].includes(p.count_mode),'胆码计数方式无效');}
   else if(r.type==='kill')choices(p.digits,range(9));
   else if(r.type==='partition'){ensure(typeof p.scheme==='string'&&own(PARTITIONS,p.scheme),'分类形态无效');choices(p.patterns,patterns(p.scheme));}
   else if(r.type==='sorted'){ensure(['min','median','max'].includes(p.rank),'最数类型无效');choices(p.values,range(9));}
   else if(r.type==='values'){ensure(typeof p.field==='string'&&['sum','tail','span'].includes(p.field),'多选数值类型无效');choices(p.values,range({sum:27,tail:9,span:9}[p.field]));}
   else if(r.type==='cyclic')choices(p.values,[0,2,3]);
   else if(r.type==='pattern')choices(p.values,['group6','group3','triple']);
   else if(r.type.startsWith('pair_')){ensure(['ht','hu','tu','any'].includes(p.pair),'两码位置无效');choices(p.values,range(r.type==='pair_sum'?18:9));}
   else if(r.type==='unordered'){ensure(['any','all'].includes(p.mode),'两码匹配方式无效');choices(p.pairs,range(9).flatMap(a=>range(9).filter(b=>b>=a).map(b=>String(a)+b)));}
   else if(r.type==='direction'){ensure(typeof p.reference==='string'&&/^[0-9]{3}$/.test(p.reference),'走势须填写三位手动参考号码，例如007');ensure(['FC3D','PL3'].includes(p.lottery_type)&&(!lottery||p.lottery_type===lottery),'走势参考彩种不一致');choices(p.patterns,['U','D','P'].flatMap(a=>['U','D','P'].flatMap(b=>['U','D','P'].map(c=>a+b+c))));}
   else choices(p.values,SHAPES);
  }ensure(rules.filter(r=>r.type==='dan').length<=12,'胆码最多12组');return rules;
 }
 function matches(r,n){const yes=included(r,n);return r.exclude?!yes:yes;}
 function included(r,n){const p=r.params,d=[...n].map(Number),sorted=d.slice().sort((a,b)=>a-b);switch(r.type){
  case 'dan':return p.counts.includes(p.count_mode==='distinct'?[...new Set(d)].filter(v=>p.digits.includes(v)).length:d.filter(v=>p.digits.includes(v)).length);
  case 'kill':return d.every(v=>!p.digits.includes(v));
  case 'partition':return p.patterns.includes(d.map(v=>PARTITIONS[p.scheme][v]).join(''));
  case 'sorted':return p.values.includes(sorted[['min','median','max'].indexOf(p.rank)]);
  case 'values':{const sum=d.reduce((a,b)=>a+b,0);return p.values.includes(p.field==='sum'?sum:p.field==='tail'?sum%10:sorted[2]-sorted[0]);}
  case 'cyclic':{const s=new Set(d),three=s.size===3&&range(9).some(v=>s.has(v)&&s.has((v+1)%10)&&s.has((v+2)%10)),two=[...s].some(v=>s.has((v+1)%10));return p.values.includes(three?3:two?2:0);}
  case 'pattern':return p.values.includes(({1:'triple',2:'group3',3:'group6'})[new Set(d).size]);
  case 'unordered':{const available=[[0,1],[0,2],[1,2]].map(([a,b])=>[n[a],n[b]].sort().join(''));return p.mode==='any'?p.pairs.some(v=>available.includes(v)):p.pairs.every(v=>available.includes(v));}
  case 'direction':return p.patterns.includes(d.map((v,i)=>v>Number(p.reference[i])?'U':v<Number(p.reference[i])?'D':'P').join(''));
  case 'shape':{const [h,t,u]=d;return p.values.includes(t<Math.min(h,u)?'concave':t>Math.max(h,u)?'convex':h<t&&t<u?'ascending':h>t&&t>u?'descending':h===t&&t===u?'parallel':'boundary');}
  default:{const pairs=p.pair==='any'?[[0,1],[0,2],[1,2]]:[{ht:[0,1],hu:[0,2],tu:[1,2]}[p.pair]];return pairs.some(([a,b])=>{const sum=d[a]+d[b],diff=Math.abs(d[a]-d[b]);return p.values.includes(r.type==='pair_sum'?sum:r.type==='pair_tail'?sum%10:r.type==='pair_diff'?diff:sum%10)||r.type==='pair_combined'&&p.values.includes(diff);});}
 }}
 function defaults(category,lottery){const [key,label,type,field]=category;switch(type){case 'dan':return {digits:[],counts:[],count_mode:'distinct'};case 'kill':return {digits:[]};case 'partition':return {scheme:field,patterns:[]};case 'sorted':return {rank:'min',values:[]};case 'values':return {field,values:[]};case 'unordered':return {pairs:[],mode:'any'};case 'direction':return {reference:'',lottery_type:lottery,patterns:[]};default:return type.startsWith('pair_')?{pair:'ht',values:[]}:{values:[]};}}
 function categoryFor(rule){return CATALOG.find(c=>c[2]===rule.type&&(rule.type!=='partition'||c[3]===rule.params.scheme)&&(rule.type!=='values'||c[3]===rule.params.field));}
 return {CATALOG,PARTITIONS,SHAPES,range,patterns,checked,matches,defaults,categoryFor};
});
