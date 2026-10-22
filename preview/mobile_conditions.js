(function(root){'use strict';
 function create({doc,conditions,categories,cards,targets,navigate,show}){
  const by=id=>doc.getElementById(id),make=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const entries=[['dan','胆码'],['kill','杀码'],['sum','和值'],['span','跨度'],['tail','和尾'],['mean','均值'],['positions','定位选号'],['pattern','组选形态'],['size','大小形态'],['parity','单双形态'],['prime','质合形态'],['mod','012路'],['bigmiddle','大中小'],['cyclic','环形连号'],['shape','凹凸形态'],['direction','升降平'],['sorted','最小中大数'],['unordered','不定位两码'],['groupPairs','组选两码'],['pairSum','两码和'],['pairTail','两码和尾'],['pairDiff','两码差'],['pairCombined','两码合差'],['decompose','分解'],['break','断组'],['killDirect','杀直选复式'],['intersection','交集'],['ranges','间距/范围']];
  const overview=make('div',undefined,'mobile-condition-overview');overview.id='mobile-condition-overview';
  const title=make('div',undefined,'mobile-overview-title'),hint=make('span','28类 · 点开设置');title.append(make('strong','全部缩水条件'),hint);overview.append(title);const toggle=make('button','展开全部条件');toggle.type='button';toggle.id='mobile-catalog-toggle';title.append(toggle);
  const grid=make('div',undefined,'mobile-condition-grid');grid.id='mobile-condition-grid';grid.setAttribute('aria-label','全部28类缩水条件');overview.append(grid);
  const selected=make('details',undefined,'mobile-selected-overview'),selectedTitle=make('summary','已选0项条件'),selectedList=make('div');selected.id='mobile-selected-overview';selected.append(selectedTitle,selectedList);
  const reference=make('button','预测参考号码','mobile-reference-link');reference.type='button';reference.onclick=()=>open('snapshot');overview.append(reference);
  const heading=make('div',undefined,'mobile-editor-heading'),back=make('button','收起设置'),name=make('strong'),run=make('button','缩水');heading.id='mobile-editor-heading';back.type=run.type='button';back.onclick=()=>close();run.onclick=()=>by('run-filter').click();heading.append(back,name,run);conditions.prepend(overview,selected,heading);
  doc.body.classList.add('mobile-condition-overview-on');let active=null,selectionSignature='',catalogOpen=false;toggle.onclick=()=>{catalogOpen=!catalogOpen;refresh();};const buttons=new Map();
  function open(key){if(!targets.has(key))return;active=key;catalogOpen=false;selected.open=false;show('conditions');refresh();navigate(key);refresh();buttons.get(key)?.button.scrollIntoView({block:'nearest'});}
  function close(){const focused=doc.activeElement;if(focused&&conditions.contains(focused))focused.blur();active=null;refresh();root.requestAnimationFrame(fitOverview);}
  for(const [key,label]of entries){const button=make('button',undefined,'mobile-condition-tile'),caption=make('span',label),badge=make('small');button.type='button';button.dataset.condition=key;button.setAttribute('aria-label',label);button.setAttribute('aria-expanded','false');button.append(caption,badge);button.onclick=()=>open(key);grid.append(button);buttons.set(key,{button,badge});}
  function keyFor(row){const text=row.querySelector('span')?.textContent||row.textContent;
   if(/^当前大底/.test(text))return 'base';
   for(const [key,label]of root.ResearchConditions.CATALOG.map(c=>[c[0],c[1]]).concat(Object.entries(root.ResearchWorkbench.RULES)))if(text.startsWith(label+'：')||text.startsWith(label+' ·'))return key;
   return /范围|间距/.test(text)?'ranges':/固定号码/.test(text)?'snapshot':/^(百位|十位|个位|号码形态)：/.test(text)?'positions':null;
  }
  function refresh(){
   hint.textContent=active?'随时切换':'28类 · 点开设置';toggle.hidden=!active;toggle.textContent=catalogOpen?'收起条件目录':'展开全部条件';toggle.setAttribute('aria-expanded',String(catalogOpen));doc.body.classList.toggle('mobile-catalog-expanded',Boolean(active&&catalogOpen));
   doc.body.classList.toggle('mobile-editor-open',Boolean(active&&!conditions.classList.contains('hidden')&&!by('filter').classList.contains('hidden')));
   conditions.dataset.editorKind=root.ResearchConditions.CATALOG.some(c=>c[0]===active)?'category':Object.keys(root.ResearchWorkbench.RULES).includes(active)?'quick':'other';
   by('condition-instructions').textContent='点条件设置取值，可多选，最后统一缩水。';
   for(const [key,target]of targets){const node=target();node.classList.toggle('mobile-editing',key===active);if(key===active&&node.tagName==='DETAILS'&&!node.open)node.open=true;}
   heading.classList.toggle('hidden',!active);name.textContent=active==='snapshot'?'预测参考号码':(entries.find(e=>e[0]===active)||[])[1]||'';
   const recovery=by('quick-recovery');by('workbench-rules').classList.toggle('mobile-tools-empty',!Object.keys(root.ResearchWorkbench.RULES).includes(active)&&recovery.classList.contains('hidden'));
   const rows=[...by('filter-selected').querySelectorAll('.filter-selected-row')],counts=new Map();for(const row of rows){const key=keyFor(row);if(key)counts.set(key,(counts.get(key)||0)+1);}
   for(const [key,{button,badge}]of buttons){const status=targets.get(key)().querySelector('.condition-status')?.textContent||'',invalid=/待补全|未填完整/.test(status),count=counts.get(key)||0,marked=count>0||invalid;button.classList.toggle('is-selected',marked);button.classList.toggle('is-incomplete',invalid);button.classList.toggle('is-editing',active===key);button.setAttribute('aria-expanded',String(active===key));const text=invalid?'待补全':count?'✓ '+count:'';if(badge.textContent!==text)badge.textContent=text;button.setAttribute('aria-label',(entries.find(e=>e[0]===key)[1])+(invalid?'，待补全':count?'，已选'+count+'条':''));}
   const visibleRows=rows.filter(row=>keyFor(row)!=='base'),signature=visibleRows.map(row=>row.textContent).join('\n');
   if(signature!==selectionSignature){selectionSignature=signature;selectedTitle.textContent='已选'+visibleRows.length+'项 · '+(visibleRows[0]?.querySelector('span').textContent||'点此修改');selectedList.replaceChildren();for(const [i,row]of visibleRows.entries()){const current=()=>[...by('filter-selected').querySelectorAll('.filter-selected-row')].filter(r=>keyFor(r)!=='base')[i];const line=make('div'),button=make('button',row.querySelector('span').textContent);button.type='button';button.onclick=()=>{const live=current();if(!live)return;const key=keyFor(live);if(key)open(key);else live.querySelector('button')?.click();};line.append(button);const remove=[...row.querySelectorAll('button')].find(b=>b.textContent==='移除');if(remove){const cancel=make('button','移除');cancel.type='button';cancel.onclick=()=>[...(current()?.querySelectorAll('button')||[])].find(b=>b.textContent==='移除')?.click();line.append(cancel);}selectedList.append(line);}}
   if(!visibleRows.length){selectedTitle.textContent='已选0项条件 · 可同时选择多项';}
  }
  function focusProblem(){const card=[...categories.children,...cards.children].find(n=>/待补全|未填完整/.test(n.querySelector('.condition-status')?.textContent||''));if(card){const entry=[...targets].find(([,target])=>target()===card);if(entry)open(entry[0]);}}
  function fitOverview(){if(active||by('filter').classList.contains('hidden'))return;if(grid.getBoundingClientRect().bottom>by('run-filter').parentElement.getBoundingClientRect().top)overview.scrollIntoView({block:'start'});}
  const pageObserver=new root.MutationObserver(()=>{refresh();root.requestAnimationFrame(fitOverview);});pageObserver.observe(by('filter'),{attributes:true,attributeFilter:['class']});root.addEventListener('resize',()=>root.requestAnimationFrame(fitOverview));
  doc.querySelector('body>nav [data-page="filter"]').addEventListener('click',()=>root.requestAnimationFrame(fitOverview));
  const observer=new root.MutationObserver(refresh);for(const node of [categories,cards,by('filter-selected')])observer.observe(node,{subtree:true,childList:true,characterData:true});
  refresh();root.requestAnimationFrame(fitOverview);return {open,close,refresh,focusProblem,editRow:row=>{const key=keyFor(row);if(key&&key!=='base'){open(key);return true;}return false;}};
 }
 root.ResearchMobileConditions={create};
})(typeof globalThis==='object'?globalThis:this);
