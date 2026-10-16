"use strict";
function basicRelease(v,url,max){return Boolean(v&&typeof v.version==='string'&&/^\d+\.\d+\.\d+$/.test(v.version)&&typeof v[url]==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(v[url])&&typeof v.sha256==='string'&&/^[a-f0-9]{64}$/.test(v.sha256)&&Number.isSafeInteger(v.bytes)&&v.bytes>=1000&&v.bytes<=max);}
function verifiedRelease(v){return Boolean(basicRelease(v,'apk_url',25*1048576)&&v.status==='available'&&v.apk_url==='research3d-'+v.version+'.apk'&&Number.isSafeInteger(v.version_code)&&v.version_code>0&&v.version.split('.').every(n=>Number.isSafeInteger(Number(n)))&&typeof v.minimum_android==='string'&&v.minimum_android.length>0);}
function verifiedCandidate(v){return Boolean(basicRelease(v,'apk_url',25*1048576)&&v.schema==='android_candidate_v1'&&v.status==='candidate'&&v.formal_acceptance==='PENDING_REAL_DEVICE'&&v.apk_url==='research3d-'+v.version+'.apk'&&Number.isSafeInteger(v.version_code)&&v.version_code>0);}
function verifiedWindows(v){return Boolean(basicRelease(v,'archive_url',100*1048576)&&v.status==='available'&&v.platform==='windows'&&/^research3d-windows-[a-zA-Z0-9._-]+\.zip$/.test(v.archive_url)&&Number.isSafeInteger(v.version_code)&&v.version_code>0&&typeof v.minimum_windows==='string'&&v.minimum_windows.length>0);}
function createController(doc,request,o){
 const button=doc.querySelector(o.button),status=doc.querySelector(o.status);let serial=0,lastVerified=null;
 const set=(id,text)=>{const n=doc.querySelector(id);if(n)n.textContent=text;};
 function fallback(message){lastVerified=null;if(button.tagName==='A'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(apk|zip)$/.test(button.getAttribute('href')||'')){status.textContent=message+' 可继续下载本页列出的版本。';return;}button.disabled=true;button.onclick=null;button.textContent='下载暂不可用';status.textContent=message;set(o.version,'暂未读取');set(o.size,'暂未读取');}
 async function refresh(){const current=++serial;try{
  const res=await request(o.endpoint,{cache:'no-store'});if(!res.ok)throw Error('版本信息暂不可用');const value=await res.json();if(current!==serial)return;
  if(!o.verify(value)){fallback('更新信息未通过检查。');return;}
  const filename=value[o.file],identity=filename+':'+value.sha256+':'+value.bytes;
  if(lastVerified!==identity){const h=await request(filename,{method:'HEAD',cache:'no-store'});if(current!==serial)return;if(!h.ok||Number(h.headers.get('content-length'))!==value.bytes)throw Error('暂时无法核对安装包');lastVerified=identity;}
  set(o.version,value.version+(value.status==='candidate'||value.release_stage==='candidate'?' 候选版':''));set(o.size,(value.bytes/1048576).toFixed(1)+' MB');set(o.requirement,value[o.requirementField]||o.defaultRequirement||'');
  if(o.date)set(o.date,value.updated||'');set(o.checksum,value.sha256);const checksum=doc.querySelector(o.checksumWrap);if(checksum)checksum.hidden=false;
  const notes=Array.isArray(value.notes)?value.notes.filter(n=>typeof n==='string').slice(0,50).map(n=>n.slice(0,300)):[];set(o.notes,notes.join('\n'));const noteEl=doc.querySelector(o.notes);if(noteEl)noteEl.hidden=!notes.length;
  button.disabled=false;button.textContent=o.label(value);if(button.tagName==='A'){button.href=filename;button.download=filename;button.onclick=null;}else button.onclick=()=>{const a=doc.createElement('a');a.href=filename;a.download=filename;a.click();};
  status.textContent=o.success;
 }catch(e){if(current===serial)fallback('本次版本检查未完成。');}}
 return {refresh};
}
function createDownloadController(doc,request,candidate=false){return createController(doc,request,{button:'#download',status:'#release-status',endpoint:candidate?'android-candidate.json':'android-release.json',verify:candidate?verifiedCandidate:verifiedRelease,file:'apk_url',version:'#version',size:'#size',requirement:'#requirement',requirementField:'minimum_android',defaultRequirement:'Android 8.0及以上；需更新Android System WebView',checksum:'#checksum',checksumWrap:'#checksum-wrap',notes:'#release-notes',label:v=>'下载安卓版 '+v.version+(candidate?' 候选版':''),success:candidate?'安卓候选包可下载 · 真机验收尚未完成':'安卓版版本与下载入口已同步'});}
function createWindowsController(doc,request){return createController(doc,request,{button:'#windows-download',status:'#windows-status',endpoint:'windows-release.json',verify:verifiedWindows,file:'archive_url',version:'#windows-version',size:'#windows-size',requirement:'#windows-requirement',requirementField:'minimum_windows',date:'#windows-date',checksum:'#windows-checksum',checksumWrap:'#windows-checksum-wrap',notes:'#windows-notes',label:v=>'下载电脑版 ZIP '+v.version,success:'电脑版下载信息已同步 · 解压整个文件夹后运行'});}
if(typeof document!=='undefined'){
 const request=async(url,options)=>{const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);try{return await fetch(url,{...options,signal:abort.signal});}finally{clearTimeout(timer);}};
 const controllers=[createDownloadController(document,request,document.querySelector('#download').getAttribute('data-channel')==='candidate')];if(document.querySelector('#windows-download'))controllers.push(createWindowsController(document,request));
 const refresh=()=>controllers.forEach(c=>c.refresh());refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh();},30000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
}
if(typeof module!=='undefined')module.exports={verifiedRelease,verifiedCandidate,verifiedWindows,createDownloadController,createWindowsController};
