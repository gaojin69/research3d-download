(function(root){'use strict';
 const COMMON=['dan','kill','sum','span','size','parity'],KEYS=ResearchConditions.CATALOG.map(c=>c[0]);
 function createEditor(options){const doc=options.container.ownerDocument||document,nav=doc.getElementById('condition-category-nav'),toolbar=doc.getElementById('condition-panel-actions');let mode='common',opened=new Set(['dan','kill']),cards=new Map(),base=null;
  try{const saved=options.readView&&options.readView();if(saved){if(!saved||Object.keys(saved).sort().join(',')!=='mode,open'||!['common','all'].includes(saved.mode)||!Array.isArray(saved.open)||saved.open.length>20||new Set(saved.open).size!==saved.open.length||saved.open.some(k=>!KEYS.includes(k)))throw Error('条件显示设置无效');mode=saved.mode;opened=new Set(saved.open);}}catch(e){options.notify('条件显示设置未恢复，选号条件仍保留');}
  function remember(){for(const [key,card] of cards)card.open?opened.add(key):opened.delete(key);}
  function save(){if(!options.writeView)return;try{options.writeView({mode,open:[...opened].filter(k=>KEYS.includes(k))});}catch(e){options.notify('显示设置未保存：'+e.message);}}
  function apply(){if(nav)nav.classList.add('hidden');if(toolbar)toolbar.classList.remove('hidden');const enabled=new Set((options.getConditions().rules||[]).map(r=>ResearchConditions.categoryFor(r)?.[0]));for(const [key,card] of cards){card.classList.toggle('hidden',mode==='common'&&!COMMON.includes(key)&&!enabled.has(key)&&!opened.has(key));card.open=opened.has(key);}for(const key of ['common','all']){const button=doc.getElementById('condition-mode-'+key);if(button){button.classList.toggle('active',mode===key);button.setAttribute('aria-pressed',String(mode===key));}}const summary=doc.getElementById('filter-selected-count');if(summary)summary.closest('details').open=true;const help=doc.getElementById('condition-instructions');if(help)help.textContent='直接展开多个条件、勾选取值，最后统一计算。所有已选条件同时生效。';}
  function selectCategory(key){if(!KEYS.includes(key))throw Error('条件类别无效');remember();opened.add(key);base.selectCategory(key);apply();save();}
  function restoreCategory(key){if(!KEYS.includes(key))throw Error('条件类别无效');remember();base.selectCategory(key);apply();}
  function toggle(key,event){if(event)event.preventDefault();remember();const was=opened.has(key);was?opened.delete(key):opened.add(key);base.selectCategory(key);apply();save();}
  base=ResearchConditionUI.createEditor({...options,changed:()=>{remember();options.changed();apply();save();}});
  function sync(){remember();base.sync();cards=new Map([...options.container.children].map((card,i)=>[KEYS[i],card]));for(const [key,card] of cards){card.querySelector('summary').onclick=e=>toggle(key,e);}for(const key of ['common','all']){const button=doc.getElementById('condition-mode-'+key);if(button)button.onclick=()=>{remember();mode=key;apply();save();};}apply();}
  return {sync,selectCategory,restoreCategory,getActive:()=>base.getActive()};
 }
 root.ResearchConditionPanels={createEditor};
})(typeof globalThis==='object'?globalThis:this);
