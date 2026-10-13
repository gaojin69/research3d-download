'use strict';
function verifiedRelease(value){
 return Boolean(value&&value.status==='available'&&typeof value.version==='string'&&/^\d+\.\d+\.\d+$/.test(value.version)
   &&typeof value.apk_url==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.apk$/.test(value.apk_url)
   &&typeof value.sha256==='string'&&/^[a-f0-9]{64}$/.test(value.sha256)
   &&Number.isSafeInteger(value.bytes)&&value.bytes>=1000&&value.bytes<=25*1048576
   &&typeof value.minimum_android==='string'&&value.minimum_android.length>0
   &&Array.isArray(value.notes)&&value.notes.length<=12&&value.notes.every(note=>typeof note==='string'&&note.length<=300));
}
function createDownloadController(doc,request){
 const button=doc.querySelector('#download'),status=doc.querySelector('#release-status');let serial=0,lastVerified=null;
 const set=(id,value)=>{doc.querySelector(id).textContent=value;};
 function disable(message){button.disabled=true;button.onclick=null;button.textContent='安卓版准备中';status.textContent=message;
  set('#version','暂无');set('#size','尚未生成');set('#requirement','构建后确认');doc.querySelector('#checksum-wrap').hidden=true;doc.querySelector('#release-notes').hidden=true;}
 async function refresh(){
  const current=++serial;
  try{
   const response=await request('android-release.json',{cache:'no-store'});if(!response.ok)throw new Error('版本状态暂时不可读取');
   const value=await response.json();if(current!==serial)return;
   if(!verifiedRelease(value)){lastVerified=null;disable('尚未生成APK · 暂未开放下载');return;}
   const identity=value.apk_url+':'+value.sha256+':'+value.bytes;
   if(lastVerified!==identity){
    button.disabled=true;button.onclick=null;
    const head=await request(value.apk_url,{method:'HEAD',cache:'no-store'});if(current!==serial)return;
    if(!head.ok||Number(head.headers.get('content-length'))!==value.bytes)throw new Error('安装包暂时不可下载');lastVerified=identity;
   }
   set('#version',value.version);set('#size',(value.bytes/1048576).toFixed(1)+' MB');set('#requirement',value.minimum_android);
   set('#checksum',value.sha256);doc.querySelector('#checksum-wrap').hidden=false;button.textContent='下载安卓版APK';button.disabled=false;
   set('#release-notes',value.notes.join('\n'));doc.querySelector('#release-notes').hidden=!value.notes.length;
   button.onclick=()=>{const link=doc.createElement('a');link.href=value.apk_url;link.download=value.apk_url;link.click();};
   status.textContent='版本与下载入口已同步 · 页面可见时约每30秒检查';
  }catch(error){if(current===serial){lastVerified=null;disable('版本检查暂不可用，请稍后重试。');}}
 }
 return {refresh};
}
if(typeof document!=='undefined'){
 const timedFetch=async(url,options)=>{const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);
  try{return await fetch(url,{...options,signal:abort.signal});}finally{clearTimeout(timer);}};
 const controller=createDownloadController(document,timedFetch);controller.refresh();
 setInterval(()=>{if(document.visibilityState==='visible')controller.refresh();},30000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')controller.refresh();});
}
if(typeof module!=='undefined')module.exports={verifiedRelease,createDownloadController};
