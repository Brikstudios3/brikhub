/* The BRIK Hub, hosted edition.
   Stands in for the claude.ai runtime: data comes from files in the GitHub repository,
   admin saves are committed back to it, and agents get in through invite links.
   Public files: data/hub.json (settings, partners, invite keys). Encrypted files:
   data/private.enc (listed units and bank details, opened with an agent's invite)
   and data/admin.enc (everything, opened with the admin password). */
(function(){
"use strict";
const REPO={owner:"Brikstudios3",repo:"brikhub",branch:"main"};
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=u8=>{let s="";const a=new Uint8Array(u8);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
const ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const SS={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del(k){try{sessionStorage.removeItem(k)}catch(e){}}};
async function sha(s){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function kdf(pass,salt,iter){const base=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
const rawKey=raw=>crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt","decrypt"]);
async function seal(key,bytes){const i=rnd(12);return {i:b64(i),c:b64(await crypto.subtle.encrypt({name:"AES-GCM",iv:i},key,bytes))}}
async function open(key,blob){return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:ub64(blob.i)},key,ub64(blob.c)))}
const PW_ITER=310000,INV_ITER=60000;
async function sealPw(pw,obj){const s=rnd(16);const k=await kdf(pw,s,PW_ITER);return {v:1,s:b64(s),n:PW_ITER,...await seal(k,enc.encode(JSON.stringify(obj)))}}
async function openPw(pw,blob){const k=await kdf(pw,ub64(blob.s),blob.n||PW_ITER);return JSON.parse(dec.decode(await open(k,blob)))}
async function wrapK(code,K){const s=rnd(16);const k=await kdf(code,s,INV_ITER);return {s:b64(s),...await seal(k,K)}}
async function unwrapK(code,w){const k=await kdf(code,ub64(w.s),INV_ITER);return open(k,w)}
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
function deepMerge(a,b){if(!b||typeof b!=="object"||Array.isArray(b))return clone(b);const out={...(a&&typeof a==="object"&&!Array.isArray(a)?a:{})};for(const k of Object.keys(b))out[k]=(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))?deepMerge(out[k],b[k]):clone(b[k]);return out}
async function getJSON(p){const r=await fetch(p+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error(p+" "+r.status);return r.json()}
function inviteCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const r=rnd(16);let s="";for(const x of r)s+=a[x%32];return s}

/* ---------- state ---------- */
const H=window.HUB={isAdmin:false,admin:null,hub:null,units:{},listing:{},settings:{},bank:null,K:null,
  join:null,notice:"",status:"",pending:[],pw:null,repo:REPO,
  esc:s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))};
const SESSION_KEY="brikpp.session",INVITE_KEY="brikhub.invite",PW_KEY="brikhub.pw";
function applyPriv(p){H.units=Object.fromEntries((p.units||[]).map(u=>[u.id,u]));H.listing=p.listing||{};H.bank=p.bank||null}
async function loadAgent(code){const w=(H.hub.invites||{})[await sha(code)];if(!w)return false;
  H.K=await unwrapK(code,w);const p=JSON.parse(dec.decode(await open(await rawKey(H.K),await getJSON("data/private.enc"))));applyPriv(p);return true}
async function loadAdmin(pw){const a=await openPw(pw,await getJSON("data/admin.enc"));H.admin=a;H.isAdmin=true;H.pw=pw;H.K=ub64(a.K);
  H.units=Object.fromEntries((a.units||[]).map(u=>[u.id,u]));H.listing=a.listing||{};H.bank=a.bank||null;
  H.settings={...H.settings,...(a.settings||{})};return a}
H.ready=(async()=>{
  try{H.hub=await getJSON("data/hub.json")}catch(e){H.hub={invites:{}};H.notice="The hub could not load its settings. Refresh in a moment."}
  H.settings={contact:H.hub.contact,partners:H.hub.partners,docs:H.hub.docs};
  const m=(location.hash||"").match(/^#join-([A-Z0-9]{8,32})$/i);
  if(m){const code=m[1].toUpperCase();H.join={code,valid:!!(H.hub.invites||{})[await sha(code)]};LS.del(SESSION_KEY);SS.del(PW_KEY)}
  const s=LS.get(SESSION_KEY,null);
  try{
    if(s&&s.role==="BRIK Admin"){const pw=SS.get(PW_KEY);if(pw)await loadAdmin(pw);else{LS.del(SESSION_KEY);H.notice="Signed out. Sign in again to manage the hub."}}
    else if(s&&s.invite){if(!await loadAgent(s.invite)){LS.del(SESSION_KEY);LS.del(INVITE_KEY);H.notice="This invite is no longer active. Ask BRIK for a new link."}}
    else if(s){LS.del(SESSION_KEY)}
  }catch(e){LS.del(SESSION_KEY);if(s&&s.role==="BRIK Admin")SS.del(PW_KEY);H.notice="Your session has ended. Sign in again."}
  if(H.bank&&typeof RESV_FORM!=="undefined")Object.values(RESV_FORM).forEach(f=>{if(f.bank)f.bank=H.bank});
})();

/* ---------- sign in actions ---------- */
H.adminLogin=async(user,pw)=>{if(String(user).trim().toLowerCase()!=="admin")throw new Error("user");
  await loadAdmin(pw);SS.set(PW_KEY,pw);LS.set(SESSION_KEY,{name:"BRIK Studios",company:"",email:"",role:"BRIK Admin",at:Date.now()})};
H.joinFinish=async(p)=>{const code=H.join.code;if(!await loadAgent(code))throw new Error("invite");
  LS.set(SESSION_KEY,{name:p.name,company:p.company,email:p.email,phone:p.phone,role:p.role||"Agent",invite:code,at:Date.now()});
  LS.set(INVITE_KEY,{code,name:p.name,company:p.company});
  LS.set("brikpp.brand",{company:p.company,consultant:p.name,phone:p.phone,email:p.email,showBrik:false});
  if(p.logo)LS.set("brikpp.brandlogo",{logo:p.logo,w:p.logoW,h:p.logoH})};
H.resume=async()=>{const iv=LS.get(INVITE_KEY,null);if(!iv)return false;const s=LS.get("brikhub.lastagent",null);
  if(!(H.hub.invites||{})[await sha(iv.code)]){LS.del(INVITE_KEY);return false}
  LS.set(SESSION_KEY,{...(s||{}),name:iv.name,company:iv.company,role:(s&&s.role)||"Agent",invite:iv.code,at:Date.now()});return true};
H.lastInvite=()=>LS.get(INVITE_KEY,null);
H.signOut=()=>{const s=LS.get(SESSION_KEY,null);if(s&&s.invite)LS.set("brikhub.lastagent",s);SS.del(PW_KEY)};

/* ---------- GitHub publishing (admin) ---------- */
/* agents only see the floors in their allocation */
const AGENT_FLOORS={"print-house":["Ground","4th"]};
function floorOk(u){const f=AGENT_FLOORS[u.scheme];return !f||f.includes(u.floor)}
function listedFor(u,L){const x=(L[u.scheme]||{}).units;if(x&&Object.prototype.hasOwnProperty.call(x,u.id))return !!x[u.id];return /^available$/i.test(String(u.status||"").trim())}
async function gh(method,path,body){const t=H.admin&&H.admin.token;if(!t)throw Object.assign(new Error("no token"),{code:"no_token"});
  const r=await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}${path}`,{method,headers:{Authorization:"Bearer "+t,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},body:body?JSON.stringify(body):undefined});
  if(!r.ok){const e=new Error("GitHub "+r.status);e.code=r.status===401||r.status===403?"bad_token":"github";throw e}return r.status===204?null:r.json()}
async function commit(files,message){
  const ref=await gh("GET",`/git/ref/heads/${REPO.branch}`);const base=await gh("GET",`/git/commits/${ref.object.sha}`);
  const tree=[];for(const f of files){const b=await gh("POST","/git/blobs",f.b64?{content:f.b64,encoding:"base64"}:{content:f.text,encoding:"utf-8"});tree.push({path:f.path,mode:"100644",type:"blob",sha:b.sha})}
  const t=await gh("POST","/git/trees",{base_tree:base.tree.sha,tree});const c=await gh("POST","/git/commits",{message,tree:t.sha,parents:[ref.object.sha]});
  await gh("PATCH",`/git/refs/heads/${REPO.branch}`,{sha:c.sha})}
async function latestAdmin(){const r=await gh("GET",`/contents/data/admin.enc?ref=${REPO.branch}`);return openPw(H.pw,JSON.parse(dec.decode(ub64(r.content.replace(/\n/g,"")))))}
function applyOp(a,op){const [kind,id]=op.path.split("/");
  if(kind==="settings"){a.settings=a.settings||{};a.settings[id]=op.merge?deepMerge(a.settings[id],op.data):clone(op.data)}
  else if(kind==="listing"){a.listing=a.listing||{};a.listing[id]=op.merge?deepMerge(a.listing[id],op.data):clone(op.data)}
  else if(kind==="units"){a.units=(a.units||[]).map(u=>u.id===id?(op.merge?deepMerge(u,op.data):{id,...clone(op.data)}):u)}
  else if(kind==="invites"){a.invites=op.data}
  else if(kind==="token"){a.token=op.data}
  else if(kind==="rotate"){a.K=H.admin.K}}
let pubTimer=null,publishing=false;
function setStatus(s){H.status=s;document.querySelectorAll("[data-hubstatus]").forEach(el=>{el.textContent=statusText();el.dataset.state=s})}
function statusText(){return {"":"All changes are live.",waiting:"Saving shortly…",publishing:"Publishing to the live hub…",done:"Published. Partners see it within a minute or two.",needs_token:"Not live yet: connect GitHub below to publish changes.",bad_token:"GitHub refused the key. Paste a new one below.",error:"Publishing failed. Check your connection and save again."}[H.status]||""}
H.statusText=statusText;
H.queue=op=>{H.pending.push(op);applyOp(H.admin,op);clearTimeout(pubTimer);
  if(!H.admin.token){setStatus("needs_token");return}setStatus("waiting");pubTimer=setTimeout(H.publish,1800)};
H.publish=async(extraFiles=[],msg)=>{if(publishing){clearTimeout(pubTimer);pubTimer=setTimeout(H.publish,1500);return}
  if(!H.admin.token){setStatus("needs_token");return}
  publishing=true;setStatus("publishing");const ops=H.pending.splice(0);
  try{let a;try{a=await latestAdmin();a.token=a.token||H.admin.token}catch(e){if(e.code==="bad_token")throw e;a=clone(H.admin)}
    ops.forEach(op=>applyOp(a,op));
    const L=a.listing||{};const K=ub64(a.K);const key=await rawKey(K);
    const hide=typeof HIDDEN_SCHEMES!=="undefined"?HIDDEN_SCHEMES:[];const listed=(a.units||[]).filter(u=>!hide.includes(u.scheme)&&floorOk(u)&&listedFor(u,L));
    const pubListing={};listed.forEach(u=>{(pubListing[u.scheme]=pubListing[u.scheme]||{units:{}}).units[u.id]=true});
    const priv=await seal(key,enc.encode(JSON.stringify({units:listed,listing:pubListing,bank:a.bank||null,at:new Date().toISOString()})));
    const invites={};for(const iv of (a.invites||[]).filter(x=>!x.revoked))invites[await sha(iv.code)]=await wrapK(iv.code,K);
    const st=a.settings||{};
    const hub={v:1,contact:st.contact||null,partners:st.partners||null,docs:st.docs||null,invites,updatedAt:new Date().toISOString()};
    a.rev=(a.rev||0)+1;
    await commit([{path:"data/hub.json",text:JSON.stringify(hub)},{path:"data/private.enc",text:JSON.stringify(priv)},{path:"data/admin.enc",text:JSON.stringify(await sealPw(H.pw,a))},...extraFiles],msg||"Update hub from the admin page");
    H.admin=a;H.hub=hub;setStatus("done");
  }catch(e){H.pending.unshift(...ops);setStatus(e.code==="bad_token"?"bad_token":e.code==="no_token"?"needs_token":"error")}
  finally{publishing=false;if(typeof render==="function")render()}};

/* rotating the unit key when an invite is revoked, so an old link cannot open new data */
H.rotateKey=()=>{H.admin.K=b64(rnd(32));H.pending.push({path:"rotate",data:null})};

/* ---------- invites (admin) ---------- */
H.siteUrl=()=>location.origin+location.pathname;
H.inviteLink=code=>H.siteUrl()+"#join-"+code;
H.addInvite=p=>{const iv={code:inviteCode(),name:p.name,company:p.company,email:p.email,phone:p.phone,created:new Date().toISOString()};
  const list=[...(H.admin.invites||[]),iv];H.queue({path:"invites",data:list});return iv};
H.revokeInvite=code=>{const list=(H.admin.invites||[]).map(x=>x.code===code?{...x,revoked:new Date().toISOString()}:x);H.rotateKey();H.queue({path:"invites",data:list})};
H.restoreInvite=code=>{const list=(H.admin.invites||[]).map(x=>x.code===code?{...x,revoked:null}:x);H.queue({path:"invites",data:list})};
H.setToken=t=>{H.admin.token=t;H.pending.push({path:"token",data:t});clearTimeout(pubTimer);return H.publish([],"Connect the admin page to GitHub")};
H.uploadDoc=async(file,sid,kind)=>{const ext=(file.name.match(/\.[a-z0-9]{2,5}$/i)||[".pdf"])[0].toLowerCase();
  const path=`files/${sid}-${kind}-${Date.now().toString(36)}${ext}`;const buf=new Uint8Array(await file.arrayBuffer());
  if(buf.length>40*1024*1024)throw Object.assign(new Error("big"),{code:"too_big"});
  await commit([{path,b64:b64(buf)}],`Upload ${kind} for ${sid}`);return path};

/* ---------- the claude.use stand in ---------- */
const subs=new Map();
function emit(path){const [col]=path.split("/");[path,"col:"+col].forEach(k=>(subs.get(k)||[]).forEach(f=>{try{f()}catch(e){}}))}
function on(k,f){if(!subs.has(k))subs.set(k,[]);subs.get(k).push(f);return()=>{const a=subs.get(k);const i=a.indexOf(f);if(i>=0)a.splice(i,1)}}
function read(path){const [col,id]=path.split("/");
  if(col==="settings")return H.settings[id]||null;if(col==="listing")return H.listing[id]||null;if(col==="units")return H.units[id]||null;
  return LS.get("brikhub.db."+path,null)}
function ids(col){if(col==="settings")return Object.keys(H.settings).filter(k=>H.settings[k]);if(col==="listing")return Object.keys(H.listing);if(col==="units")return Object.keys(H.units);
  const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith("brikhub.db."+col+"/"))out.push(k.slice(("brikhub.db."+col+"/").length))}}catch(e){}return out}
const dsnap=(path,id)=>{const v=read(path);return {id,exists:v!=null,data:()=>clone(v)}};
async function write(path,data,merge){const [col,id]=path.split("/");const shared=col==="settings"||col==="listing";
  if(shared&&!H.isAdmin)throw Object.assign(new Error("not allowed"),{code:"not_granted"});
  const cur=read(path);const val=merge?deepMerge(cur,data):clone(data);
  if(col==="settings")H.settings[id]=val;else if(col==="listing")H.listing[id]=val;else if(col==="units")H.units[id]={id,...val};else LS.set("brikhub.db."+path,val);
  if(H.isAdmin&&(shared||col==="units"))H.queue({path,data:clone(data),merge});
  emit(path)}
const db={doc(path){const id=path.split("/").pop();return {
    get:async()=>dsnap(path,id),set:d=>write(path,d,false),update:d=>write(path,d,true),delete:async()=>{LS.del("brikhub.db."+path);emit(path)},
    onSnapshot(fn){const run=()=>fn(dsnap(path,id));setTimeout(run,0);return on(path,run)}}},
  collection(col){return {onSnapshot(fn){const run=()=>{const docs=ids(col).map(id=>dsnap(col+"/"+id,id));fn({empty:!docs.length,docs,size:docs.length})};setTimeout(run,0);return on("col:"+col,run)},
    doc(id){return db.doc(col+"/"+id)}}}};
const downloads={async save({filename,data}){const url=URL.createObjectURL(data instanceof Blob?data:new Blob([data]));const a=document.createElement("a");a.href=url;a.download=filename||"download";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}};
function dictation(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;let rec=null,cb={p:[],f:[],s:[]};
  const st=(state,reason)=>cb.s.forEach(f=>f({state,reason}));
  return {onPartial:f=>cb.p.push(f),onFinal:f=>cb.f.push(f),onState:f=>cb.s.push(f),
    start(){return new Promise((res,rej)=>{try{rec=new SR();rec.lang="en-GB";rec.interimResults=true;rec.continuous=true;
      rec.onstart=()=>{st("listening");res()};
      rec.onresult=e=>{let part="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)cb.f.forEach(f=>f({text:r[0].transcript}));else part+=r[0].transcript}cb.p.forEach(f=>f({text:part}))};
      rec.onerror=e=>{const reason=e.error==="not-allowed"?"not_granted":e.error==="audio-capture"?"unavailable":"stopped";st("idle",reason);if(reason==="not_granted")rej({code:"not_granted"})};
      rec.onend=()=>st("idle","stopped");st("starting");rec.start()}catch(e){rej({code:"unavailable"})}})},
    async stop(){if(rec){st("finishing");rec.stop()}}}}
function user(){const s=LS.get(SESSION_KEY,null)||{};const id=H.isAdmin?"admin":s.invite?"inv_"+s.invite.slice(0,6):"guest";
  return {me:async()=>({id,name:s.name||"",email:s.email||"",avatarUrl:""}),id:async()=>id,canEdit:async()=>H.isAdmin,isOwner:()=>H.isAdmin,can:()=>H.isAdmin,profiles:async()=>({})}}
window.claude={use:async name=>{await H.ready;
  if(name==="db")return db;if(name==="downloads")return downloads;if(name==="dictation")return dictation();if(name==="user")return user();return null}};
document.documentElement.classList.add("hosted","nosample");
})();
