/* The BRIK Hub, hosted edition: sign in, agent invites and the admin publishing cards.
   Loaded after the main script, so these functions replace the claude.ai sign in. */
const HX=window.HUB;
const J={logo:"",logoW:0,logoH:0,name:"",company:"",email:"",phone:"",role:"Agent"};
const hxWa=(num,text)=>"https://wa.me/"+String(num||"").replace(/\D/g,"").replace(/^0/,"44")+"?text="+encodeURIComponent(text);
const hxDate=t=>{try{return new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}catch(e){return ""}};

/* ---------- sign in: by invitation, plus the admin login ---------- */
function vSignin(){
  if(HX.join&&HX.join.valid)return vJoin();
  const last=HX.lastInvite(),c=S.contact;
  const ask=hxWa(c.whatsapp,`Hi ${firstName(c.name)}, could I have access to the BRIK Hub?`);
  const msg=HX.join?"This invite link is no longer active. Ask BRIK for a new one.":HX.notice;
  return `<section class="signin"><div class="grid">
  <div class="form">
    <div class="top">${logo("cream","170px")}</div>
    <div><div class="eyebrow" style="color:rgba(255,255,255,.6)">Partner portal</div><h1 style="margin-top:14px">The BRIK Hub</h1>
      <p class="lede">The schemes, documents and tools for selling BRIK homes. Access is by invitation.</p></div>
    ${msg?`<p class="hx-msg">${esc(msg)}</p>`:""}
    ${last&&!HX.join?`<div class="hx-back"><div><span>Welcome back</span><b>${esc(last.name)}</b>${last.company?`<small>${esc(last.company)}</small>`:""}</div><button class="link light strong" type="button" id="hxResume">Enter the hub →</button></div>`
      :`<div class="hx-back"><div><span>New here?</span><b>Ask for your invite link</b><small>BRIK sends every partner their own link to set up a profile.</small></div><a class="wa light" href="${esc(ask)}" target="_blank" rel="noopener">${ICON_CHAT}<span>WhatsApp ${esc(firstName(c.name))}</span></a></div>`}
    <details class="hx-admin" ${HX.notice&&/Sign in again/.test(HX.notice)?"open":""}><summary>BRIK admin sign in</summary>
      <form id="hxAdmin" novalidate class="hx-af">
        <div class="row2"><div class="fld"><label for="hx-u">Username</label><input id="hx-u" autocomplete="username" value="admin"></div>
          <div class="fld"><label for="hx-p">Password</label><input id="hx-p" type="password" autocomplete="current-password"></div></div>
        <div class="err" id="hx-aerr" role="alert"></div>
        <button class="link light strong" type="submit" style="align-self:flex-start">Sign in →</button>
      </form></details>
  </div>
  <div class="wall hx-film" aria-hidden="true"><video src="film/brik-loop.mp4" poster="img2/brik-loop-poster.jpg" autoplay muted loop playsinline preload="auto"></video></div>
  </div></section>`}

/* ---------- first visit from an invite: set up the profile, then in ---------- */
function joinPreview(){const who=[J.name,J.company].filter(Boolean).join(", ");
  return `<div class="pcover"><img src="img2/ph-front.jpg" alt=""><div class="plogo">${J.logo?`<img src="${J.logo}" alt="">`:`<span>${esc(J.company||"Your logo")}</span>`}</div>
   <div class="pc"><small>An investment proposal</small><b>The Print House</b><i>${esc(who?"Prepared by "+who:"Prepared by you")}</i></div></div>
   <p class="pvcap" style="color:rgba(255,255,255,.6)">Your branding on a proposal cover</p>`}
function vJoin(){
  return `<section class="signin hx-join"><div class="grid">
  <form class="form" id="hxJoin" novalidate>
    <div class="top">${logo("cream","170px")}</div>
    <div><div class="eyebrow" style="color:rgba(255,255,255,.6)">You are invited</div><h1 style="margin-top:14px">Welcome to The BRIK Hub</h1>
      <p class="lede">Set up your profile first. Your logo and details go on every proposal, form, calculation and mail shot you send from the hub.</p></div>
    <div class="hx-step"><i>01</i><b>Your logo</b></div>
    <div class="logozone hx-lz">
      <div class="logoprev" id="hxLogoPrev">${J.logo?`<img src="${J.logo}" alt="Your logo">`:`<span>Your logo</span>`}</div>
      <div class="logoacts"><label class="link light" for="hx-logo" style="cursor:pointer">${J.logo?"Replace logo":"Upload your logo"}</label><input id="hx-logo" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="vh">
        <span class="small" style="color:rgba(255,255,255,.6)">PNG or SVG with a clear background works best.</span></div>
    </div>
    <div class="hx-step"><i>02</i><b>Your details</b></div>
    <div class="row2"><div class="fld"><label for="hj-name">Your name</label><input id="hj-name" data-j="name" autocomplete="name" value="${esc(J.name)}"></div>
      <div class="fld"><label for="hj-co">Company</label><input id="hj-co" data-j="company" autocomplete="organization" value="${esc(J.company)}"></div></div>
    <div class="row2"><div class="fld"><label for="hj-email">Email</label><input id="hj-email" data-j="email" type="email" autocomplete="email" value="${esc(J.email)}"></div>
      <div class="fld"><label for="hj-phone">Mobile</label><input id="hj-phone" data-j="phone" inputmode="tel" autocomplete="tel" value="${esc(J.phone)}"></div></div>
    <div class="fld"><span class="lb">I work as</span><div class="roles" role="radiogroup" aria-label="Role">${ROLES.filter(r=>r!=="BRIK Admin").map(r=>`<label><input type="radio" name="hj-role" value="${r}" ${J.role===r?"checked":""}><span>${r}</span></label>`).join("")}</div></div>
    <div class="err" id="hj-err" role="alert"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
      <button class="link light strong" type="submit">Enter the hub →</button>
      <span class="small" style="color:rgba(255,255,255,.6)">Saved on this device. Change it any time under Profile.</span></div>
  </form>
  <div class="wall hx-pv"><div class="hx-pvin" id="hxPv">${joinPreview()}</div></div>
  </div></section>`}

document.addEventListener("input",e=>{const k=e.target&&e.target.dataset&&e.target.dataset.j;if(!k)return;J[k]=e.target.value;const p=$("#hxPv");if(p)p.innerHTML=joinPreview()});
document.addEventListener("change",async e=>{const t=e.target;
  if(t.name==="hj-role")J.role=t.value;
  if(t.id==="hx-logo"&&t.files&&t.files[0]){try{Object.assign(J,await readLogo(t.files[0]));render()}catch(err){toast("That file could not be read as an image")}}
  if(t.id==="hx-docfile"&&t.files&&t.files[0])hxUpload(t.files[0])});
document.addEventListener("submit",async e=>{const f=e.target;
  if(f.id==="hxAdmin"){e.preventDefault();const err=$("#hx-aerr");const u=$("#hx-u").value,p=$("#hx-p").value;
    if(!p){err.textContent="Enter the password.";return}err.textContent="";const done=busy("Opening the admin hub");
    try{await HX.adminLogin(u,p);location.hash="admin";location.reload()}catch(x){done();err.textContent=x&&x.message==="user"?"The username is admin.":"That password is not right."}}
  if(f.id==="hxJoin"){e.preventDefault();const err=$("#hj-err");
    if(!J.logo){err.textContent="Add your logo first. It goes on everything you send.";return}
    if(!J.name.trim()||!J.company.trim()){err.textContent="Add your name and company.";return}
    if(!/^\S+@\S+\.\S+$/.test(J.email.trim())){err.textContent="Add an email address so clients can reply to you.";return}
    if(J.phone.replace(/\D/g,"").length<10){err.textContent="Add a mobile number for your documents.";return}
    const done=busy("Setting up your hub");
    try{await HX.joinFinish({...J,name:J.name.trim(),company:J.company.trim(),email:J.email.trim(),phone:J.phone.trim()});location.hash="portfolio";location.reload()}
    catch(x){done();err.textContent="This invite could not be opened. Ask BRIK for a new link."}}
  if(f.id==="hxInvite"){e.preventDefault();const g=id=>$("#"+id).value.trim();const p={name:g("hi-name"),company:g("hi-co"),phone:g("hi-phone"),email:g("hi-email")};
    if(!p.name){$("#hi-err").textContent="Add the agent's name.";return}
    const iv=HX.addInvite(p);S.hxNew=iv.code;f.reset();render();toast(HX.admin.token?"Invite created. It works once published, in a minute or two.":"Invite created. Connect GitHub to make it live.")}
  if(f.id==="hxToken"){e.preventDefault();const t=$("#hx-token").value.trim();if(!/^(github_pat_|ghp_)/.test(t)){$("#hx-terr").textContent="That does not look like a GitHub key. It starts with github_pat_";return}
    S.hxTokOpen=false;render();await HX.setToken(t);render();toast(HX.status==="done"?"GitHub connected. Changes now go live.":HX.statusText())}
});
document.addEventListener("click",async e=>{const t=e.target.closest("[data-hx],#hxResume");if(!t)return;
  if(t.id==="hxResume"){if(await HX.resume()){location.hash="portfolio";location.reload()}else{toast("That invite is no longer active");render()}return}
  const a=t.dataset.hx,code=t.dataset.code,iv=(HX.admin&&HX.admin.invites||[]).find(x=>x.code===code);
  if(a==="copy"&&iv)copyText(HX.inviteLink(code),"Invite link copied");
  else if(a==="revokeask"){S.hxRevoke=code;render()}
  else if(a==="keep"){S.hxRevoke=null;render()}
  else if(a==="revoke"){S.hxRevoke=null;HX.revokeInvite(code);render();toast("Invite revoked. That link stops working once published.")}
  else if(a==="restore"){HX.restoreInvite(code);render()}
  else if(a==="tok"){S.hxTokOpen=!S.hxTokOpen;render()}
  else if(a==="publish"){await HX.publish();render()}
});

/* ---------- admin cards ---------- */
function inviteText(iv){return `Hi ${firstName(iv.name)}, here is your own link to The BRIK Hub, our partner portal. Open it to set up your profile and add your logo, then you will have every scheme, document and tool in one place.\n\n${HX.inviteLink(iv.code)}\n\n${S.contact.name}, BRIK Studios`}
function hxStatusBar(){return `<div class="hx-status" data-hubstatus data-state="${esc(HX.status)}">${esc(HX.statusText())}</div>`}
function hxAgents(){const list=(HX.admin&&HX.admin.invites||[]).slice().reverse();
  const row=iv=>{const subj="Your link to The BRIK Hub";const body=inviteText(iv);const isNew=S.hxNew===iv.code;
    return `<div class="hx-row ${iv.revoked?"off":""} ${isNew?"new":""}">
      <div class="hx-who"><b>${esc(iv.name)}</b><span>${esc([iv.company,iv.phone,iv.email].filter(Boolean).join(" · "))}</span><small>${iv.revoked?"Revoked "+hxDate(iv.revoked):"Invited "+hxDate(iv.created)}</small></div>
      ${isNew&&!iv.revoked?`<div class="lnk hx-lnk"><input readonly value="${esc(HX.inviteLink(iv.code))}" aria-label="Invite link"><button type="button" data-hx="copy" data-code="${iv.code}">Copy</button></div>`:""}
      <div class="hx-acts">${iv.revoked?`<button class="link" type="button" data-hx="restore" data-code="${iv.code}">Restore access</button>`:`
        <button class="wa" type="button" data-hx="copy" data-code="${iv.code}">Copy link</button>
        ${iv.phone?`<a class="wa" href="${esc(hxWa(iv.phone,body))}" target="_blank" rel="noopener">${ICON_CHAT}<span>WhatsApp</span></a>`:""}
        <a class="wa" href="${esc("https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(iv.email||"")+"&su="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body))}" target="_blank" rel="noopener">Gmail</a>
        <a class="wa" href="${esc("https://outlook.office.com/mail/deeplink/compose?to="+encodeURIComponent(iv.email||"")+"&subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body))}" target="_blank" rel="noopener">Outlook</a>
        ${S.hxRevoke===iv.code?`<span class="confirm"><span>Revoke access?</span><button class="link strong" type="button" data-hx="revoke" data-code="${iv.code}">Revoke</button><button class="link" type="button" data-hx="keep">Keep</button></span>`:`<button class="link" type="button" data-hx="revokeask" data-code="${iv.code}">Revoke</button>`}`}</div></div>`};
  return `<div class="secthead"><div><div class="eyebrow">BRIK Admin</div><h2>Agents</h2></div><span class="small muted">Every agent gets their own link. They set up their profile and logo before they get in.</span></div>
  <div class="hx-agents">
    <form class="hcard" id="hxInvite" novalidate>
      <div class="hch"><h3>Invite an agent</h3></div>
      <div class="row2"><div class="fld"><label for="hi-name">Name</label><input id="hi-name" autocomplete="off"></div><div class="fld"><label for="hi-co">Company</label><input id="hi-co" autocomplete="off"></div></div>
      <div class="row2"><div class="fld"><label for="hi-phone">Mobile</label><input id="hi-phone" inputmode="tel" autocomplete="off" placeholder="07700 900000"></div><div class="fld"><label for="hi-email">Email</label><input id="hi-email" type="email" autocomplete="off"></div></div>
      <div class="err" id="hi-err" style="color:var(--charcoal-dark)"></div>
      <button class="link strong" type="submit" style="align-self:flex-start">Create invite link →</button>
      <p class="small muted" style="margin:0">You then send it by WhatsApp or email from the list. Revoke a link and it stops working.</p>
    </form>
    <div class="hx-list">${list.length?list.map(row).join(""):`<div class="empty" style="border:0"><b>No agents invited yet</b><span class="muted">Create the first invite link on the left.</span></div>`}</div>
  </div>`}
function hxGithub(){const has=!!(HX.admin&&HX.admin.token);
  return `<div class="secthead" style="margin-top:72px"><div><div class="eyebrow">Publishing</div><h2>GitHub</h2></div>${hxStatusBar()}</div>
  <div class="hcard setform">
    ${has&&!S.hxTokOpen?`<div class="hx-ok"><b>Connected</b><span>Every change you make on this page is published to the live hub automatically. Charlie only needs the admin password.</span></div>
      <div style="display:flex;gap:22px;flex-wrap:wrap">${HX.pending.length?`<button class="link strong" type="button" data-hx="publish">Publish now →</button>`:""}<button class="link" type="button" data-hx="tok">Replace the key</button></div>`
    :`<p style="margin:0">Connect once and the admin page can publish to the live hub. The key is stored encrypted inside the hub with the admin password, so nobody pastes it again.</p>
      <ol class="hx-steps">
        <li>Signed in as Brikstudios3, open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a></li>
        <li>Name it BRIK Hub admin and set the expiry to a year</li>
        <li>Repository access: Only select repositories, then brikhub</li>
        <li>Permissions: Contents, Read and write</li>
        <li>Generate the key, copy it and paste it here</li></ol>
      <form id="hxToken" novalidate style="display:flex;flex-direction:column;gap:12px"><div class="fld"><label for="hx-token">GitHub key</label><input id="hx-token" type="password" autocomplete="off" placeholder="github_pat_"></div>
        <div class="err" id="hx-terr" style="color:var(--charcoal-dark)"></div><button class="link strong" type="submit" style="align-self:flex-start">Connect →</button></form>`}
  </div>`}
function hxDocsUpload(){return `<div class="hcard setform" style="margin-top:20px"><div class="hch"><h3>Upload a document</h3><span class="small muted">PDF up to 40MB. It is linked on the scheme's Assets tab for every partner.</span></div>
  <div class="row2"><div class="fld"><label for="hx-docsc">Scheme</label><select id="hx-docsc">${SCHEMES.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div>
    <div class="fld"><label for="hx-dockind">Document</label><select id="hx-dockind"><option value="contract">Draft contract pack</option><option value="title">Report on title</option></select></div></div>
  <label class="link strong" for="hx-docfile" style="align-self:flex-start;cursor:pointer">Choose the file and upload →</label><input id="hx-docfile" type="file" accept="application/pdf,.pdf,.zip" class="vh">
  <p class="small muted" style="margin:0">${HX.admin&&HX.admin.token?"Uploads are published straight away.":"Connect GitHub below to upload."}</p></div>`}
async function hxUpload(file){const sid=$("#hx-docsc").value,kind=$("#hx-dockind").value;if(!HX.admin.token){toast("Connect GitHub first");return}
  const done=busy("Uploading "+file.name);
  try{const path=await HX.uploadDoc(file,sid,kind);done();const v=JSON.parse(JSON.stringify(S.docs||{}));v[sid]=v[sid]||{};v[sid][kind]=path;S.docs=v;
    await db.doc("settings/docs").set({...v,updatedAt:new Date().toISOString()});render();toast("Uploaded. It shows on the Assets tab once published.")}
  catch(e){done();toast(e&&e.code==="too_big"?"That file is over 40MB. Use a Drive link instead.":"The upload did not go through. Try again.")}}

/* ---------- no brick wall: loaders are a quiet line, the sign in plays a BRIK film ---------- */
function mountBricks(root=document){root.querySelectorAll("[data-bricks]").forEach(el=>{el.dataset.bm="1"})
  root.querySelectorAll(".hx-film video,video.hfilm").forEach(v=>{v.muted=true;const p=v.play&&v.play();if(p&&p.catch)p.catch(()=>{})})}
