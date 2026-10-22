(function(root){'use strict';
 function enhancePolarity(select,doc){
  const group=doc.createElement('span');group.className='polarity-buttons';group.setAttribute('role','group');group.setAttribute('aria-label',select.getAttribute('aria-label')||'处理方式');
  const buttons=[];
  for(const [value,text]of [['keep','保留'],['exclude','排除']]){
   const b=doc.createElement('button');b.type='button';b.textContent=text;b.dataset.polarity=value;
   b.onclick=e=>{e.preventDefault();if(select.disabled)return;select.value=value;select.dispatchEvent(new root.Event('change',{bubbles:true}));sync();};group.append(b);buttons.push(b);
  }
  select.insertAdjacentElement('afterend',group);select.classList.add('polarity-enhanced');
  function sync(){group.hidden=select.hidden;for(const b of buttons){const selected=b.dataset.polarity===select.value;b.setAttribute('aria-pressed',String(selected));b.classList.toggle('selected',selected);b.disabled=select.disabled;}}
  select.addEventListener('change',sync);sync();return {select,group,sync};
 }
 function boot(){const doc=root.document,host=doc.getElementById('filter');if(!host||typeof root.MutationObserver!=='function')return;
  const controls=new Map();let pending=false;
  function refresh(){pending=false;for(const [select,control]of controls){if(!host.contains(select)){controls.delete(select);continue;}control.sync();}for(const select of host.querySelectorAll('select.condition-polarity'))if(!controls.has(select))controls.set(select,enhancePolarity(select,doc));}
  function schedule(){if(!pending){pending=true;root.requestAnimationFrame(refresh);}}
  new root.MutationObserver(schedule).observe(host,{subtree:true,childList:true,characterData:true});host.addEventListener('change',schedule);host.addEventListener('input',schedule);refresh();
 }
 const api={enhancePolarity};if(typeof module==='object')module.exports=api;root.ResearchUsabilityUI=api;
 if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot);else boot();}
})(typeof globalThis==='object'?globalThis:this);
