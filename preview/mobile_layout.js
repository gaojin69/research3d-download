(function(root){'use strict';
 function mount(doc){
  if(root.ResearchDesktopBridge||doc.getElementById('mobile-filter-panels'))return false;
  const by=id=>doc.getElementById(id),filter=by('filter'),cards=by('quick-cards'),categories=by('condition-categories'),S=root.ResearchSelectionUI;
  if(!S||!cards||cards.children.length!==6||!categories||categories.children.length!==20)return false;
  const el=(tag,id)=>{const n=doc.createElement(tag);if(id)n.id=id;return n;},panels=el('div','mobile-filter-panels'),base=el('div','mobile-filter-base'),conditions=el('div','mobile-filter-conditions'),results=el('div','mobile-filter-results');
  const positions=by('positions').closest('details'),ranges=by('ranges').closest('details'),snapshot=by('snapshot').closest('.card');
  base.append(by('workbench-base'));conditions.append(by('quick-condition-menu'),by('condition-panel-actions'),by('condition-category-nav'),categories,by('workbench-rules'),positions,ranges,snapshot);results.append(by('number-panel'),by('filter-explanation'));panels.append(base,conditions,results);filter.append(panels,by('run-filter').parentElement);
  doc.body.classList.add('mobile-direct-selection');const flow=by('quick-flow'),buttons=[...flow.querySelectorAll('button')].slice(0,3),views={base,conditions,results};let active='conditions',browser=null;
  const heading=el('div','mobile-filter-heading');heading.append(filter.querySelector('h1'),by('clear-filter'));filter.prepend(heading);
  function show(key){active=key;for(const [name,panel]of Object.entries(views))panel.classList.toggle('hidden',name!==key);buttons.forEach((b,i)=>{const selected=['base','conditions','results'][i]===key;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});if(key==='results')by('number-panel').open=true;if(browser)browser.refresh();}
  buttons.forEach((button,i)=>{const key=['base','conditions','results'][i];button.textContent=['大底','条件','结果'][i];button.onclick=()=>{show(key);flow.scrollIntoView({block:'start'});};});
  flow.setAttribute('aria-label','选号步骤');by('clear-filter').textContent='重置选号';
  const picker=el('select','mobile-condition-picker'),placeholder=el('option');placeholder.value='';placeholder.textContent='选择缩水条件（28类）';picker.append(placeholder);picker.setAttribute('aria-label','定位到缩水条件');const targets=new Map();
  function option(key,label,target){const n=el('option');n.value=key;n.textContent=label;picker.append(n);targets.set(key,target);}
  root.ResearchConditions.CATALOG.forEach((c,i)=>option(c[0],c[1],()=>categories.children[i]));for(const [key,label]of Object.entries(root.ResearchWorkbench.RULES))option(key,label,()=>by('quick-card-'+key));option('positions','百十个位定位',()=>positions);option('ranges','组选间距与数值范围',()=>ranges);conditions.prepend(picker);
  function navigate(key){const target=targets.get(key);if(!target)return;show('conditions');by('condition-mode-all').click();const card=target(),summary=card.querySelector('summary');if(summary&&!card.open)summary.click();}
  targets.set('snapshot',()=>snapshot);browser=root.ResearchMobileConditions.create({doc,conditions,categories,cards,targets,navigate,show});
  picker.onchange=()=>{browser.open(picker.value);picker.value='';};by('condition-mode-all').click();
  function readyForAction(){const recovery=by('quick-recovery');if(recovery&&!recovery.classList.contains('hidden')){show('conditions');browser.close();recovery.scrollIntoView({block:'center'});return;}if([...conditions.querySelectorAll('.condition-status')].some(n=>/待补全|未填完整/.test(n.textContent))){show('conditions');browser.focusProblem();}}
  for(const id of ['run-filter','quick-copy-numbers','save-filter','wb-base-transfer'])by(id).addEventListener('click',readyForAction,true);
  by('run-filter').addEventListener('click',()=>setTimeout(()=>{if(/^(保留\s+\d|大底\s+\d+\s*注)/.test(by('remaining').textContent))show('results');},0));
  by('quick-condition-menu').addEventListener('click',()=>show('conditions'),true);
  results.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&/修改/.test(button.textContent)){const row=button.closest('.filter-selected-row');show(row&&row.textContent.startsWith('当前大底')?'base':'conditions');if(row&&browser.editRow(row)){event.preventDefault();event.stopPropagation();}}},true);
  cards.addEventListener('input',S.directConditionSelection);cards.addEventListener('change',S.directConditionSelection);
  function decorate(){S.directSelectionHints(cards,doc);for(const group of [...categories.querySelectorAll('.condition-options'),...cards.querySelectorAll('.quick-digits')]){const inputs=[...group.querySelectorAll('input')],values=inputs.map(n=>n.value);group.classList.toggle('mobile-digit-grid',inputs.length===10&&values.every(v=>/^\d$/.test(v)));group.classList.toggle('mobile-value-grid',inputs.length>10&&values.every(v=>/^\d{1,2}$/.test(v)));for(const input of inputs){const label=input.closest('label');if(label)label.classList.toggle('mobile-selected',input.checked);}}}
  filter.addEventListener('change',decorate);filter.addEventListener('input',decorate);
  if(typeof root.MutationObserver==='function'){const observer=new root.MutationObserver(decorate);observer.observe(cards,{subtree:true,childList:true,characterData:true});observer.observe(categories,{subtree:true,childList:true,characterData:true});}
  decorate();show(active);return true;
 }
 root.ResearchMobileLayout={mount};if(typeof module==='object')module.exports={mount};
 if(typeof document==='undefined')return;
 document.addEventListener('DOMContentLoaded',()=>{if(root.ResearchDesktopBridge)return;if(mount(document))return;const host=document.getElementById('filter');if(!host||typeof root.MutationObserver!=='function')return;const observer=new root.MutationObserver(()=>{if(mount(document))observer.disconnect();});observer.observe(host,{childList:true,subtree:true});});
})(typeof globalThis==='object'?globalThis:this);
