const $=s=>document.querySelector(s);
const fmt=n=>n.toLocaleString('en')+' ج';
const cart={}; // key -> {n,l,p,q}
const store=JSON.parse(localStorage.getItem('bw')||'{}');

/* theme */
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem('bw-theme',t)}
setTheme(localStorage.getItem('bw-theme')||'dark');
$('#themeBtn').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

/* render menu */
const menuEl=$('#menu'),catsEl=$('#cats');
MENU.forEach(sec=>{
  const a=document.createElement('a');a.href='#'+sec.id;a.textContent=sec.title;a.dataset.id=sec.id;catsEl.appendChild(a);
  const s=document.createElement('section');s.className='sec';s.id=sec.id;
  s.innerHTML=`<h2>${sec.title}</h2>${sec.note?`<div class="note">${sec.note}</div>`:''}<div class="grid"></div>`;
  const g=s.querySelector('.grid');
  sec.items.forEach(it=>{
    const c=document.createElement('div');c.className='card';
    c.innerHTML=`<h3>${it.n}</h3>${it.d?`<div class="d">${it.d}</div>`:''}<div class="vars"></div>`;
    const vs=c.querySelector('.vars');
    it.v.forEach(v=>{
      const key=it.n+'|'+v.l;
      const row=document.createElement('div');row.className='var';
      row.innerHTML=`${v.l?`<span class="lbl">${v.l}</span>`:''}<span class="pr">${v.p} <small>ج</small></span><span class="ctl"></span>`;
      row._key=key;row._it={n:it.n,l:v.l,p:v.p};vs.appendChild(row);
    });
    g.appendChild(c);
  });
  menuEl.appendChild(s);
});
function drawCtl(row){
  const k=row._key,q=cart[k]?cart[k].q:0,ctl=row.querySelector('.ctl');
  ctl.innerHTML=q?`<div class="step"><button data-a="+" aria-label="زيادة">+</button><b>${q}</b><button data-a="-" aria-label="نقصان">−</button></div>`:`<button class="add" data-a="+">إضافة</button>`;
}
function refresh(){document.querySelectorAll('.var').forEach(drawCtl);renderCart()}
menuEl.addEventListener('click',e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;
  const row=b.closest('.var');change(row._key,b.dataset.a==='+'?1:-1,row._it);
});
function change(key,d,it){
  const first=Object.keys(cart).length===0;
  if(!cart[key]){if(d<0)return;cart[key]={...it,q:0}}
  cart[key].q+=d;if(cart[key].q<=0)delete cart[key];
  if(d>0&&first)toast('تمت الإضافة للسلة');
  refresh();
  if(d>0){const f=$('#fab');f.classList.remove('bump');void f.offsetWidth;f.classList.add('bump')}
}

/* cart */
const count=()=>Object.values(cart).reduce((a,i)=>a+i.q,0);
const total=()=>Object.values(cart).reduce((a,i)=>a+i.q*i.p,0);
function renderCart(){
  const c=count(),t=total();
  $('#fab').hidden=c===0||$('#drawer').classList.contains('open');
  $('#fabCount').textContent=c;$('#fabTotal').textContent=fmt(t);
  const b=$('#cartBadge');b.hidden=c===0;b.textContent=c;
  $('#cartEmpty').hidden=c>0;$('#checkout').hidden=c===0;
  $('#total').textContent=fmt(t);$('#sendBtn').disabled=c===0;
  const ul=$('#cartList');ul.innerHTML='';
  Object.entries(cart).forEach(([k,i])=>{
    const li=document.createElement('li');
    li.innerHTML=`<div class="nm">${i.n}${i.l?`<small>${i.l}</small>`:''}</div><div class="step"><button data-a="+">+</button><b>${i.q}</b><button data-a="-">−</button></div><div class="lp">${fmt(i.q*i.p)}</div>`;
    li.querySelectorAll('button').forEach(bt=>bt.onclick=()=>change(k,bt.dataset.a==='+'?1:-1,i));
    ul.appendChild(li);
  });
}
function openDrawer(){$('#drawer').classList.add('open');$('#overlay').hidden=false;document.body.classList.add('lock');$('#drawer').setAttribute('aria-hidden','false');renderCart()}
function closeDrawer(){$('#drawer').classList.remove('open');$('#overlay').hidden=true;document.body.classList.remove('lock');$('#drawer').setAttribute('aria-hidden','true');renderCart()}
$('#fab').onclick=$('#cartBtn').onclick=openDrawer;
$('#closeDrawer').onclick=$('#overlay').onclick=closeDrawer;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});

/* checkout form */
const val=n=>document.querySelector(`input[name=${n}]:checked`)?.value;
function syncMethod(){const d=val('method')==='delivery';$('#fAddrWrap').hidden=!d;$('#fPhoneWrap').hidden=!d}
document.querySelectorAll('input[name=method]').forEach(r=>r.onchange=syncMethod);
document.querySelector('input[name=method][value=delivery]').checked=true;syncMethod();
['fName','fPhone','fAddr','fNotes'].forEach(id=>{const el=$('#'+id);el.value=store[id]||'';el.addEventListener('input',()=>{store[id]=el.value;localStorage.setItem('bw',JSON.stringify(store))})});
$('#sendBtn').onclick=()=>{
  const err=m=>{const e=$('#err');e.textContent=m;e.hidden=!m;return !m};
  const br=val('branch'),me=val('method'),name=$('#fName').value.trim(),ph=$('#fPhone').value.trim(),ad=$('#fAddr').value.trim(),nt=$('#fNotes').value.trim();
  if(!br)return err('اختار الفرع'),void 0;
  if(!me)return err('اختار توصيل أو استلام'),void 0;
  if(!name)return err('اكتب الاسم'),void 0;
  if(me==='delivery'){
    if(!ad)return err('اكتب العنوان'),void 0;
    if(!/^(\+?20|0)?1[0125]\d{8}$/.test(ph.replace(/[\s-]/g,'')))return err('اكتب رقم موبايل صحيح'),void 0;
  }
  err('');
  const B=BRANCHES[br];
  const lines=Object.values(cart).map(i=>`• ${i.q}× ${i.n}${i.l?` (${i.l})`:''} = ${i.q*i.p} ج`);
  const msg=['طلب جديد من موقع Black Wins','',`الفرع: ${B.name}`,`الطريقة: ${me==='delivery'?'توصيل':'استلام من الفرع'}`,`الاسم: ${name}`,...(me==='delivery'?[`الموبايل: ${ph}`,`العنوان: ${ad}`]:[]),'','الطلب:',...lines,'',`الإجمالي: ${total()} ج`,...(nt?['',`ملاحظات: ${nt}`]:[])].join('\n');
  window.open(`https://wa.me/${B.wa}?text=${encodeURIComponent(msg)}`,'_blank');
};

/* toast */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1600)}

/* scroll: reveal + active category */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -40px'});
document.querySelectorAll('.card').forEach(c=>io.observe(c));
const secs=[...document.querySelectorAll('.sec')];
function spy(){
  let cur=secs[0];secs.forEach(s=>{if(s.getBoundingClientRect().top<160)cur=s});
  catsEl.querySelectorAll('a').forEach(a=>{const on=a.dataset.id===cur.id;if(on&&!a.classList.contains('on')){const r=a.getBoundingClientRect(),p=catsEl.getBoundingClientRect();catsEl.scrollTo({left:catsEl.scrollLeft+(r.left-p.left)-p.width/2+r.width/2,behavior:'smooth'})}a.classList.toggle('on',on)});
}
addEventListener('scroll',spy,{passive:true});spy();

/* preloader */
const hide=()=>setTimeout(()=>$('#preloader').classList.add('done'),900);
document.readyState==='complete'?hide():addEventListener('load',hide);
setTimeout(()=>$('#preloader').classList.add('done'),3500);
refresh();
