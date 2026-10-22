(function(root){'use strict';
 function directConditionSelection(event){
  const target=event.target;if(!target||!target.closest||String(target.id||'').startsWith('quick-enable-'))return false;
  if(event.type==='input'&&target.type==='checkbox')return false;
  const row=target.closest('.quick-editor-row');if(!row)return false;
  const toggle=row.querySelector('input[id^="quick-enable-"]');if(!toggle||!toggle.checked)return false;
  const digits=[...row.querySelectorAll('.quick-digits input')],texts=[...row.querySelectorAll('input[type="text"],textarea')];
  if(digits.some(n=>n.checked)||texts.some(n=>n.value.trim()))return false;
  // Only the user's explicit clearing action disables an empty clause; loading never does.
  toggle.click();return true;
 }
 function enhanceSavedBase(row,use,record,current){
  if(row.querySelector('.desktop-base-choice'))return;
  const doc=row.ownerDocument||document,label=doc.createElement('label'),choice=doc.createElement('input'),caption=doc.createElement('span');
  label.className='desktop-base-choice';choice.type='radio';choice.name='desktop-base-'+record.lottery;choice.setAttribute('aria-label','选用大底 '+record.name);caption.textContent='选用';
  choice.checked=Boolean(current&&current.name===record.name&&current.numbers.length===record.numbers.length&&current.numbers.every((n,i)=>n===record.numbers[i]));
  choice.onchange=()=>{if(choice.checked)use.click();};label.append(choice,caption);row.append(label);use.classList.add('desktop-hidden-base-use');
 }
 function directSelectionHints(container,doc){
  let pausedCount=0;for(const row of container.querySelectorAll('.quick-editor-row')){
   const toggle=[...row.querySelectorAll('input')].find(n=>String(n.id).startsWith('quick-enable-'));
   const filled=[...row.querySelectorAll('.quick-digits input')].some(n=>n.checked)||[...row.querySelectorAll('input[type="text"],textarea')].some(n=>n.value.trim());
   const paused=Boolean(toggle&&!toggle.checked&&filled);let note=row.querySelector('.desktop-paused-note');
   if(paused&&!note){note=doc.createElement('p');note.className='desktop-paused-note';note.textContent='这条条件尚未启用，重新勾选或修改取值后使用。';row.append(note);}
   if(note)note.hidden=!paused;row.classList.toggle('desktop-paused-rule',paused);if(paused)pausedCount++;
  }return pausedCount;
 }
 const api={directConditionSelection,enhanceSavedBase,directSelectionHints};root.ResearchSelectionUI=api;if(typeof module==='object')module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
