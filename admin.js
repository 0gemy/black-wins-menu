(function(){
'use strict';
const U=BW.U,KEY=BW.KEY,K='bw_adm';
const $=s=>document.querySelector(s);
const E=v=>String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const N=v=>(+v||0).toLocaleString('en');
let G=null;try{G=JSON.parse(localStorage.getItem(K)||'null')}catch(e){}
const setG=v=>{G=v;try{v?localStorage.setItem(K,JSON.stringify(v)):localStorage.removeItem(K)}catch(e){}};
const hd=t=>({apikey:KEY,Authorization:'Bearer '+(t||KEY),'Content-Type':'application/json'});
let ME='',ROLE='',SEC=[],ITEMS=[],VIEW='items',Q='';

function toast(m,bad){const t=$('#toast');t.textContent=m;t.className='show'+(bad?' bad':'');clearTimeout(toast._t);toast._t=setTimeout(()=>{t.className=''},2600)}

async function fresh(){
  if(!G)return null;
  if(G.exp-Date.now()>60000)return G.at;
  try{
    const r=await fetch(U+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:hd(),body:JSON.stringify({refresh_token:G.rt})});
    const j=await r.json();
    if(j.access_token){setG(Object.assign({},G,{at:j.access_token,rt:j.refresh_token||G.rt,exp:Date.now()+(j.expires_in||3600)*1000}));return G.at}
    if(r.status===400||r.status===401)setG(null);
  }catch(e){}
  return null;
}
async function api(path,opt){
  const t=await fresh();if(!t)throw new Error('انتهت الجلسة، سجّل دخول تاني');
  const o=Object.assign({},opt||{});
  o.headers=Object.assign(hd(t),o.body?{'Content-Type':'application/json'}:{},o.headers||{});
  const r=await fetch(U+path,o);
  const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null}catch(e){}
  if(!r.ok){const e=new Error((j&&(j.message||j.error_description||j.hint))||('HTTP '+r.status));e.status=r.status;throw e}
  return j;
}

/* auth */
function login(){location.href=U+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(location.origin+location.pathname)}
async function finishRedirect(){
  const h=location.hash;if(h.indexOf('access_token=')<0)return;
  const p=new URLSearchParams(h.slice(1));history.replaceState(null,'',location.pathname+location.search);
  const at=p.get('access_token');if(!at)return;
  try{
    const r=await fetch(U+'/auth/v1/user',{headers:hd(at)});const u=await r.json();
    if(!u.id)return;
    setG({id:u.id,email:u.email,at,rt:p.get('refresh_token'),exp:Date.now()+(+p.get('expires_in')||3600)*1000});
  }catch(e){}
}
function gate(html){
  $('#app').hidden=true;const g=$('#gate');g.hidden=false;
  g.innerHTML='<div class="box"><img src="icon.png" alt="" style="width:64px;height:64px;border-radius:50%;border:1px solid var(--line)"><h1>لوحة منيو Black Wins</h1>'+
   (html||'<p>ادخل بحساب Google المصرّح له، وتقدر تضيف أصناف وصور وتشيل أي حاجة من المنيو.</p>')+
   '<div style="margin-top:14px"><button class="gbtn" id="gGo"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.1 7-10.2 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg><span>الدخول بحساب Google</span></button></div>'+
   '<p style="margin-top:14px;font-size:12px"><a href="/" style="color:var(--mut)">رجوع للمنيو</a></p></div>';
  $('#gGo').onclick=login;
}

/* data */
async function loadAll(){
  const [s,i]=await Promise.all([
    api('/rest/v1/bw_sections?select=id,title,note,banner,sort&order=sort.asc,title.asc'),
    api('/rest/v1/bw_items?select=id,section_id,name,descr,img,variants,sort&order=sort.asc,created_at.asc')
  ]);
  SEC=s||[];ITEMS=i||[];
}
const itemsOf=id=>ITEMS.filter(x=>x.section_id===id);
const priceTxt=v=>(v||[]).map(x=>(x.l?x.l+' ':'')+N(x.p)+' ج').join(' · ')||'—';

/* render */
function render(){
  $('#tabItems').classList.toggle('on',VIEW==='items');
  $('#tabUsers').classList.toggle('on',VIEW==='users');
  if(VIEW==='users')return renderUsers();
  const q=Q.trim();
  let html='';
  if(!SEC.length){
    html+='<div class="sec"><div class="sechd"><div><b>قاعدة البيانات فاضية</b> <small>استورد المنيو الحالي بضغطة واحدة</small></div><button class="btn primary" id="imp">استيراد المنيو الحالي</button></div><div class="empty">ده بيملا كل الأقسام والأصناف الحالية على الداتابيز، وبعد كده تعدل براحتك.</div></div>';
  }
  html+='<div class="bar"><input id="q" class="grow" placeholder="دوّر على صنف…" value="'+E(Q)+'"><button class="btn primary" id="addSec">+ قسم جديد</button></div>';
  let shown=0;
  SEC.forEach(sec=>{
    let its=itemsOf(sec.id);
    if(q)its=its.filter(it=>(it.name+' '+(it.descr||'')).includes(q));
    if(q&&!its.length)return;
    shown+=its.length;
    html+='<div class="sec"><div class="sechd"><div><b>'+E(sec.title)+'</b> <small>('+its.length+' صنف)</small></div>'+
      '<div class="acts"><button class="btn sm" data-add="'+E(sec.id)+'">+ صنف</button>'+
      '<button class="btn sm ghost" data-esec="'+E(sec.id)+'">تعديل القسم</button></div></div>';
    if(!its.length)html+='<div class="empty">مفيش أصناف في القسم ده لسه</div>';
    its.forEach(it=>{
      html+='<div class="item"><div class="th">'+(it.img?'<img src="'+E(it.img)+'" alt="" loading="lazy">':'صورة')+'</div>'+
        '<div class="nm"><b>'+E(it.name)+'</b>'+(it.descr?'<small>'+E(it.descr)+'</small>':'')+'<span class="pr">'+E(priceTxt(it.variants))+'</span></div>'+
        '<div class="rowacts"><button class="btn sm" data-img="'+E(it.id)+'">'+(it.img?'تغيير الصورة':'إضافة صورة')+'</button>'+
        '<button class="btn sm ghost" data-eitem="'+E(it.id)+'">تعديل</button>'+
        '<button class="btn sm danger" data-del="'+E(it.id)+'">حذف</button></div></div>';
    });
    html+='</div>';
  });
  if(q&&!shown)html+='<div class="empty">مفيش نتايج للبحث ده</div>';
  $('#view').innerHTML=html;
  $('#q').oninput=e=>{Q=e.target.value;const pos=e.target.selectionStart;render();const el=$('#q');el.focus();try{el.setSelectionRange(pos,pos)}catch(x){}};
  $('#addSec').onclick=()=>secEditor(null);
  if($('#imp'))$('#imp').onclick=importMenu;
  $('#view').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>itemEditor(null,b.dataset.add));
  $('#view').querySelectorAll('[data-eitem]').forEach(b=>b.onclick=()=>itemEditor(ITEMS.find(x=>x.id===b.dataset.eitem),null));
  $('#view').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>delItem(b.dataset.del));
  $('#view').querySelectorAll('[data-img]').forEach(b=>b.onclick=()=>quickImage(ITEMS.find(x=>x.id===b.dataset.img)));
  $('#view').querySelectorAll('[data-esec]').forEach(b=>b.onclick=()=>secEditor(SEC.find(x=>x.id===b.dataset.esec)));
}

function renderUsers(){
  $('#view').innerHTML='<div class="bar"><button class="btn primary" id="addUser">+ إضافة مستخدم</button></div>'+
   '<div class="sec"><div class="sechd"><div><b>المستخدمون</b> <small>اللي يقدروا يفتحوا اللوحة</small></div></div><div id="ulist"><div class="empty">جاري التحميل…</div></div></div>';
  $('#addUser').onclick=userEditor;
  api('/rest/v1/bw_admins?select=email,role,created_at&order=created_at.asc').then(rows=>{
    const list=$('#ulist');if(!list)return;
    if(!rows||!rows.length){list.innerHTML='<div class="empty">مفيش مستخدمين</div>';return}
    list.innerHTML=rows.map(r=>'<div class="urow"><div><span class="em">'+E(r.email)+'</span><span class="tag'+(r.role==='owner'?' owner':'')+'">'+(r.role==='owner'?'مالك':'محرر')+'</span></div>'+
      (r.email!==ME?'<button class="btn sm danger" data-udel="'+E(r.email)+'">إزالة</button>':'<small style="color:var(--mut)">إنت</small>')+'</div>').join('');
    list.querySelectorAll('[data-udel]').forEach(b=>b.onclick=async()=>{
      if(!confirm('تشيل '+b.dataset.udel+' من اللوحة؟'))return;
      try{await api('/rest/v1/bw_admins?email=eq.'+encodeURIComponent(b.dataset.udel),{method:'DELETE'});toast('اتشال');renderUsers()}catch(e){toast(e.message,1)}
    });
  }).catch(e=>{const list=$('#ulist');if(list)list.innerHTML='<div class="empty">'+E(e.message)+'</div>'});
}

/* modal */
function openSheet(html){const m=$('#modal');$('#sheet').innerHTML=html;m.hidden=false;document.body.style.overflow='hidden';
  $('#sheet').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeSheet);
  m.onclick=e=>{if(e.target===m)closeSheet()};
}
function closeSheet(){$('#modal').hidden=true;document.body.style.overflow='';$('#sheet').innerHTML=''}

/* image */
async function shrink(file){
  const bmp=await createImageBitmap(file);
  const max=900;let w=bmp.width,h=bmp.height;
  if(Math.max(w,h)>max){const k=max/Math.max(w,h);w=Math.round(w*k);h=Math.round(h*k)}
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bmp,0,0,w,h);
  return await new Promise(r=>cv.toBlob(r,'image/jpeg',0.86));
}
async function upload(file){
  const blob=await shrink(file);
  const path='items/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.jpg';
  const t=await fresh();if(!t)throw new Error('انتهت الجلسة');
  const r=await fetch(U+'/storage/v1/object/bw-menu/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+t,'Content-Type':'image/jpeg','x-upsert':'true'},body:blob});
  if(!r.ok)throw new Error('فشل رفع الصورة');
  return U+'/storage/v1/object/public/bw-menu/'+path;
}
function quickImage(it){
  if(!it)return;
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=async()=>{
    const f=inp.files&&inp.files[0];if(!f)return;
    toast('بنرفع الصورة…');
    try{const url=await upload(f);await api('/rest/v1/bw_items?id=eq.'+it.id,{method:'PATCH',body:JSON.stringify({img:url})});
      it.img=url;toast('الصورة اتضافت ✓');render();}
    catch(e){toast(e.message,1)}
  };
  inp.click();
}

/* item editor */
function vrow(l,p){return '<div class="vrow"><input class="vl" placeholder="الحجم (عادي / كونو)" value="'+E(l||'')+'"><input class="vp" type="number" inputmode="numeric" placeholder="السعر" value="'+((p||p===0)?p:'')+'"><button type="button" class="del">✕</button></div>'}
function bindV(){$('#vars').querySelectorAll('.del').forEach(b=>b.onclick=()=>{if($('#vars').children.length>1)b.closest('.vrow').remove()})}

function itemEditor(it,sectionId){
  const isNew=!it;
  const v=(it&&it.variants&&it.variants.length)?it.variants:[{l:'',p:''}];
  openSheet('<h2>'+(isNew?'صنف جديد':'تعديل الصنف')+'</h2>'+
   '<div class="fld"><label>اسم الصنف</label><input id="iName" value="'+E(it?it.name:'')+'" placeholder="مثال: بيتزا مارجريتا"></div>'+
   '<div class="fld"><label>الوصف (اختياري)</label><input id="iDesc" value="'+E(it?it.descr||'':'')+'" placeholder="المكونات…"></div>'+
   '<div class="fld"><label>الأسعار (سيب الحجم فاضي لو سعر واحد)</label><div id="vars">'+
     v.map(x=>vrow(x.l,x.p)).join('')+
   '</div><button type="button" class="btn sm ghost" id="addV">+ حجم/سعر تاني</button></div>'+
   '<div class="fld"><label>الصورة (اختياري)</label><div class="imgbox">'+
     '<img class="prev" id="prev" src="'+E(it&&it.img?it.img:'')+'" alt="" '+(it&&it.img?'':'hidden')+'>'+
     '<div class="pick"><input type="file" id="file" accept="image/*"><small style="color:var(--mut);font-size:11px">هتتصغّر تلقائي وتظهر جنب الصنف</small></div>'+
   '</div><button type="button" class="btn sm danger" id="rmImg" '+(it&&it.img?'':'hidden')+'>شيل الصورة</button></div>'+
   '<div class="mact"><button class="btn primary" id="save">حفظ</button><button class="btn ghost" data-close>إلغاء</button></div>');
  let imgUrl=it&&it.img?it.img:'';
  const fileEl=$('#file'),prev=$('#prev');
  fileEl.onchange=()=>{const f=fileEl.files&&fileEl.files[0];if(f){prev.src=URL.createObjectURL(f);prev.hidden=false;$('#rmImg').hidden=false}};
  $('#rmImg').onclick=()=>{imgUrl='';prev.hidden=true;fileEl.value='';$('#rmImg').hidden=true};
  $('#addV').onclick=()=>{const d=document.createElement('div');d.innerHTML=vrow('','');$('#vars').appendChild(d.firstChild);bindV()};
  bindV();
  $('#save').onclick=async()=>{
    const name=$('#iName').value.trim(),descr=$('#iDesc').value.trim();
    if(!name)return toast('اكتب اسم الصنف',1);
    const variants=[];
    $('#vars').querySelectorAll('.vrow').forEach(r=>{
      const l=r.querySelector('.vl').value.trim(),p=parseFloat(r.querySelector('.vp').value);
      if(p>0)variants.push({l,p});
    });
    if(!variants.length)return toast('اكتب سعر واحد على الأقل',1);
    const btn=$('#save');btn.disabled=true;btn.innerHTML='<span class="spin"></span> بنحفظ';
    try{
      const f=fileEl.files&&fileEl.files[0];
      if(f)imgUrl=await upload(f);
      const body={name,descr:descr||null,variants,img:imgUrl||null};
      if(isNew){
        const sort=(itemsOf(sectionId).length+1)*10;
        await api('/rest/v1/bw_items',{method:'POST',body:JSON.stringify(Object.assign({section_id:sectionId,sort},body))});
      }else{
        await api('/rest/v1/bw_items?id=eq.'+it.id,{method:'PATCH',body:JSON.stringify(body)});
      }
      await loadAll();closeSheet();render();toast(isNew?'الصنف اتضاف ✓':'التعديل اتحفظ ✓');
    }catch(e){toast(e.message,1);btn.disabled=false;btn.textContent='حفظ'}
  };
}

async function delItem(id){
  const it=ITEMS.find(x=>x.id===id);if(!it)return;
  if(!confirm('تحذف "'+it.name+'" من المنيو؟'))return;
  try{await api('/rest/v1/bw_items?id=eq.'+id,{method:'DELETE'});ITEMS=ITEMS.filter(x=>x.id!==id);render();toast('اتحذف')}
  catch(e){toast(e.message,1)}
}

/* one-time import of the static menu */
async function importMenu(){
  if(!confirm('نستورد المنيو الحالي على قاعدة البيانات؟'))return;
  toast('بنستورد…');
  try{
    const secs=MENU.map((s,i)=>({id:s.id,title:s.title,note:s.note||null,sort:(i+1)*10}));
    await api('/rest/v1/bw_sections',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify(secs)});
    const items=[];
    MENU.forEach(s=>s.items.forEach((it,ii)=>items.push({section_id:s.id,name:it.n,descr:it.d||null,variants:it.v.map(v=>({l:v.l||'',p:v.p})),sort:(ii+1)*10})));
    for(let i=0;i<items.length;i+=40){
      await api('/rest/v1/bw_items',{method:'POST',body:JSON.stringify(items.slice(i,i+40))});
    }
    await loadAll();render();toast('تم استيراد '+items.length+' صنف ✓');
  }catch(e){toast(e.message,1)}
}

/* section editor */
function secEditor(sec){
  const isNew=!sec;
  openSheet('<h2>'+(isNew?'قسم جديد':'تعديل القسم')+'</h2>'+
   '<div class="fld"><label>اسم القسم</label><input id="sTitle" value="'+E(sec?sec.title:'')+'" placeholder="مثال: ركن البيتزا"></div>'+
   '<div class="fld"><label>ملاحظة تحت العنوان (اختياري)</label><input id="sNote" value="'+E(sec?sec.note||'':'')+'" placeholder="مثال: الأسعار: عادي / كونو / كومبو"></div>'+
   '<div class="fld"><label>الترتيب (رقم أصغر = يظهر الأول)</label><input id="sSort" type="number" value="'+(sec?sec.sort:(SEC.length+1)*10)+'"></div>'+
   '<div class="mact"><button class="btn primary" id="save">حفظ</button>'+(isNew?'':'<button class="btn danger" id="delSec">حذف القسم</button>')+'<button class="btn ghost" data-close>إلغاء</button></div>');
  $('#save').onclick=async()=>{
    const title=$('#sTitle').value.trim();if(!title)return toast('اكتب اسم القسم',1);
    const note=$('#sNote').value.trim(),sort=parseInt($('#sSort').value||'100',10);
    try{
      if(isNew){
        const id='sec-'+Date.now().toString(36);
        await api('/rest/v1/bw_sections',{method:'POST',body:JSON.stringify({id,title,note:note||null,sort})});
      }else{
        await api('/rest/v1/bw_sections?id=eq.'+sec.id,{method:'PATCH',body:JSON.stringify({title,note:note||null,sort})});
      }
      await loadAll();closeSheet();render();toast(isNew?'القسم اتضاف ✓':'اتحفظ ✓');
    }catch(e){toast(e.message,1)}
  };
  if(!isNew)$('#delSec').onclick=async()=>{
    if(!confirm('تحذف القسم "'+sec.title+'" وكل أصنافه؟'))return;
    try{await api('/rest/v1/bw_sections?id=eq.'+sec.id,{method:'DELETE'});await loadAll();closeSheet();render();toast('القسم اتحذف')}
    catch(e){toast(e.message,1)}
  };
}

/* users */
function userEditor(){
  openSheet('<h2>إضافة مستخدم</h2>'+
   '<div class="fld"><label>إيميل جوجل</label><input id="uEmail" type="email" placeholder="name@gmail.com" dir="ltr"></div>'+
   '<div class="fld"><label>الصلاحية</label><select id="uRole"><option value="editor">محرر (يعدل المنيو بس)</option><option value="owner">مالك (يضيف ويشيل مستخدمين)</option></select></div>'+
   '<div class="mact"><button class="btn primary" id="save">إضافة</button><button class="btn ghost" data-close>إلغاء</button></div>');
  $('#save').onclick=async()=>{
    const email=$('#uEmail').value.trim().toLowerCase(),role=$('#uRole').value;
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return toast('اكتب إيميل صح',1);
    try{await api('/rest/v1/bw_admins',{method:'POST',body:JSON.stringify({email,role,added_by:ME})});closeSheet();renderUsers();toast('اتضاف ✓')}
    catch(e){toast(e.message,1)}
  };
}

/* boot */
$('#out').onclick=()=>{setG(null);location.reload()};
$('#tabItems').onclick=()=>{VIEW='items';render()};
$('#tabUsers').onclick=()=>{VIEW='users';render()};

(async function boot(){
  await finishRedirect();
  if(!G)return gate('');
  try{
    const t=await fresh();if(!t)return gate('انتهت الجلسة، سجّل دخول تاني.');
    const u=await (await fetch(U+'/auth/v1/user',{headers:hd(t)})).json();
    if(!u.email)return gate('مش عارفين نقرأ حسابك، جرّب تاني.');
    ME=u.email.toLowerCase();
    const rows=await api('/rest/v1/bw_admins?select=email,role&email=eq.'+encodeURIComponent(ME));
    if(!rows||!rows.length)return gate('<p><b style="direction:ltr;display:inline-block">'+E(ME)+'</b><br>الإيميل ده مش مصرّح له يفتح اللوحة.<br>اطلب من صاحب المطعم يضيفه من شاشة المستخدمين.</p>');
    ROLE=rows[0].role;
    $('#gate').hidden=true;$('#app').hidden=false;$('#em').textContent=ME;
    if(ROLE!=='owner')$('#tabUsers').hidden=true;
    await loadAll();render();
  }catch(e){gate('<p>حصلت مشكلة: '+E(e.message)+'</p><button class="btn primary" onclick="location.reload()">إعادة المحاولة</button>')}
})();
})();
