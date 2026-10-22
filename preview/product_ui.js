(function(root){'use strict';
 function boot(){
  const doc=root.document,open=doc.getElementById('open-usage');if(!open)return;
  const overlay=doc.createElement('div');overlay.id='usage-overlay';overlay.className='usage-overlay hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','usage-dialog-title');
  const panel=doc.createElement('div');panel.className='usage-dialog';const heading=doc.createElement('div');heading.className='usage-dialog-heading';const title=doc.createElement('h2');title.id='usage-dialog-title';title.textContent='使用说明';const close=doc.createElement('button');close.type='button';close.textContent='关闭';heading.append(title,close);
  const content=doc.createElement('div');content.className='usage-dialog-content';content.setAttribute('tabindex','0');content.setAttribute('aria-label','使用说明正文');panel.append(heading,content);overlay.append(panel);doc.body.append(overlay);
  let lastFocus=null,loaded=false,loading=null;
  function hide(){overlay.classList.add('hidden');doc.body.classList.remove('usage-open');if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});}
  function load(){if(loaded)return Promise.resolve();if(loading)return loading;content.textContent='正在读取使用说明…';loading=root.fetch('usage_guide.html').then(r=>{if(!r.ok)throw Error('读取失败');return r.text();}).then(text=>{
   const source=new root.DOMParser().parseFromString(text,'text/html').getElementById('usage-content');if(!source)throw Error('内容缺失');
   // Import only the packaged static guide, never execute scripts or external media.
   for(const n of source.querySelectorAll('script,style,iframe,object,embed,form,img,link,meta,base'))n.remove();
   for(const n of [source,...source.querySelectorAll('*')])for(const a of [...n.attributes])if(a.name.startsWith('on')||['src','srcdoc','style'].includes(a.name)||a.name==='href'&&!a.value.startsWith('#'))n.removeAttribute(a.name);
   content.replaceChildren(doc.importNode(source,true));loaded=true;
  }).catch(()=>{content.replaceChildren();const message=doc.createElement('p');message.textContent='使用说明暂时未能读取，请重试。';const retry=doc.createElement('button');retry.type='button';retry.textContent='重新读取';retry.onclick=()=>load();content.append(message,retry);}).finally(()=>{loading=null;});return loading;}
  function show(){lastFocus=doc.activeElement;overlay.classList.remove('hidden');doc.body.classList.add('usage-open');close.focus({preventScroll:true});load();}
  open.onclick=show;close.onclick=hide;
  const previousBack=root.phoneBack;root.phoneBack=()=>{if(!overlay.classList.contains('hidden')){hide();return;}if(typeof previousBack==='function')previousBack();};
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();return;}if(e.key!=='Tab')return;const nodes=[...overlay.querySelectorAll('button,a[href],[tabindex="0"],summary')].filter(n=>n.getClientRects().length&&!n.disabled),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}});
  content.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();const target=content.querySelector(a.getAttribute('href'));if(target)target.scrollIntoView({block:'start',behavior:'auto'});});
  function contextHelp(){const h=doc.getElementById('mobile-editor-heading');if(!h)return false;if(h.querySelector('.condition-help'))return true;const b=doc.createElement('button');b.type='button';b.className='condition-help';b.textContent='说明';b.setAttribute('aria-label','查看条件使用说明');b.onclick=show;h.insertBefore(b,h.lastElementChild);return true;}
  if(!contextHelp()&&!root.ResearchDesktopBridge){const observer=new root.MutationObserver(()=>{if(contextHelp())observer.disconnect();});observer.observe(doc.getElementById('filter'),{childList:true,subtree:true});}
 }
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof globalThis==='object'?globalThis:this);
