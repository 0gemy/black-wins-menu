const $=s=>document.querySelector(s);
const fmt=n=>n.toLocaleString('en')+' ج';
const cart={}; // key -> {n,l,p,q}
const store=JSON.parse(localStorage.getItem('bw')||'{}');

/* theme */
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem('bw-theme',t)}
setTheme(localStorage.getItem('bw-theme')||document.documentElement.dataset.theme||'dark');
$('#themeBtn').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

/* render menu */
const menuEl=$('#menu'),catsEl=$('#cats');
const PH={pizza:"photo-1622880833523-7cf1c0bd4296",fatayer:"photo-1650142700227-ebd74e00d84e","fatir-sand":"photo-1665579479833-51cf6e4c6f23",sweet:"photo-1650330144213-e16d339a88f0","crepe-chicken":"photo-1535381987-2075e3077deb","crepe-meat":"photo-1535381987-2075e3077deb",mix:"photo-1535381987-2075e3077deb",shawarma:"photo-1665579479833-51cf6e4c6f23",arabic:"photo-1696950170773-db0bf33ca0ca",kilo:"photo-1767354063817-ad6d91d39478",fatta:"photo-1643995531740-01c3267fe2d9",syrian:"photo-1756137951022-93f3e83282e1",starters:"photo-1690965044177-f4870bdb22d9",sauces:"photo-1564115895589-c8c6bd1076f8","grill-chicken":"photo-1757961047502-0c0351ae7a48","grill-kofta":"photo-1764032754057-8a5fbfa8ea96","grill-meals":"photo-1767354063817-ad6d91d39478",offers:"photo-1677048547513-7701d262113e",rizo:"photo-1643995531740-01c3267fe2d9",tasweyat:"photo-1609722719705-11f7c7472b5c",extras:"photo-1690965044177-f4870bdb22d9"};
const phUrl=id=>PH[id]?`https://images.unsplash.com/${PH[id]}?auto=format&fit=crop&w=900&h=360&q=70`:'';
MENU.forEach(sec=>{
  const a=document.createElement('a');a.href='#'+sec.id;a.textContent=sec.title;a.dataset.id=sec.id;catsEl.appendChild(a);
  const s=document.createElement('section');s.className='sec';s.id=sec.id;
  s.innerHTML=`${phUrl(sec.id)?`<div class="banner" style="background-image:url(${phUrl(sec.id)})"><h2>${sec.title}</h2></div>`:`<h2>${sec.title}</h2>`}${sec.note?`<div class="note">${sec.note}</div>`:''}<div class="grid"></div>`;
  const g=s.querySelector('.grid');
  sec.items.forEach(it=>{
    const c=document.createElement('div');c.className='card '+(it.v.length===1&&!it.v[0].l?'single':'multi');
    c.innerHTML=`<div class="hd"><h3>${it.n}</h3>${it.d?`<div class="d">${it.d}</div>`:''}</div><div class="vars"></div>`;
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
  ctl.innerHTML=q?`<div class="step"><button data-a="+" aria-label="زيادة">+</button><b>${q}</b><button data-a="-" aria-label="نقصان">−</button></div>`:`<button class="add" data-a="+" aria-label="إضافة"><span>+</span><i>إضافة</i></button>`;
}
function refresh(){document.querySelectorAll('.var').forEach(drawCtl);renderCart();try{localStorage.setItem('bw-cart',JSON.stringify(cart))}catch(e){}}
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
const sv=()=>localStorage.setItem('bw',JSON.stringify(store));
document.querySelectorAll('input[name=method]').forEach(r=>r.onchange=()=>{store.method=r.value;sv();syncMethod()});
document.querySelectorAll('input[name=branch]').forEach(r=>r.onchange=()=>{store.branch=r.value;sv()});
(document.querySelector('input[name=method][value='+(store.method==='pickup'?'pickup':'delivery')+']')).checked=true;syncMethod();
if(store.branch&&BRANCHES[store.branch]){const bo=document.querySelector('input[name=branch][value='+store.branch+']');if(bo)bo.checked=true}
['fName','fPhone','fAddr','fNotes'].forEach(id=>{const el=$('#'+id);el.value=store[id]||'';el.addEventListener('input',()=>{store[id]=el.value;localStorage.setItem('bw',JSON.stringify(store))})});
$('#sendBtn').onclick=()=>{
  const err=(m,el)=>{const e=$('#err');e.textContent=m;e.hidden=!m;if(m){toast(m);document.querySelectorAll('.bad').forEach(x=>x.classList.remove('bad'));if(el){el.classList.add('bad');el.scrollIntoView({behavior:'smooth',block:'center'});if(el.focus&&el.tagName!=='DIV')setTimeout(()=>el.focus({preventScroll:true}),350)}else e.scrollIntoView({behavior:'smooth',block:'center'})}return !m};
  const br=val('branch'),me=val('method'),name=$('#fName').value.trim(),ph=$('#fPhone').value.trim(),ad=$('#fAddr').value.trim(),nt=$('#fNotes').value.trim();
  if(!Object.keys(cart).length)return err('السلة فاضية'),void 0;
  if(!br)return err('اختار الفرع',$('#branchSeg')),void 0;
  if(!me)return err('اختار توصيل أو استلام'),void 0;
  if(!name)return err('اكتب الاسم',$('#fName')),void 0;
  if(me==='delivery'){
    if(!ad)return err('اكتب العنوان',$('#fAddr')),void 0;
    if(!/^(\+?20|0)?1[0125]\d{8}$/.test(ph.replace(/[\s-]/g,'')))return err('اكتب رقم موبايل صحيح',$('#fPhone')),void 0;
  }
  document.querySelectorAll('.bad').forEach(x=>x.classList.remove('bad'));
  err('');
  const B=BRANCHES[br];
  const lines=Object.values(cart).map(i=>`• ${i.q}× ${i.n}${i.l?` (${i.l})`:''} = ${i.q*i.p} ج`);
  const msg=['طلب جديد من موقع Black Wins','',`الفرع: ${B.name}`,`الطريقة: ${me==='delivery'?'توصيل':'استلام من الفرع'}`,`الاسم: ${name}`,...(me==='delivery'?[`الموبايل: ${ph}`,`العنوان: ${ad}`]:[]),'','الطلب:',...lines,'',`الإجمالي: ${total()} ج`,...(nt?['',`ملاحظات: ${nt}`]:[])].join('\n');
  location.href=`https://wa.me/${B.wa}?text=${encodeURIComponent(msg)}`;
};

/* toast */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1600)}

/* scroll: reveal + active category */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -40px'});
document.querySelectorAll('.card').forEach(c=>io.observe(c));
const secs=[...document.querySelectorAll('.sec')];
function spy(){
  let cur=secs[0];secs.forEach(s=>{if(!s.hidden&&s.getBoundingClientRect().top<160)cur=s});
  catsEl.querySelectorAll('a').forEach(a=>{const on=a.dataset.id===cur.id;if(on&&!a.classList.contains('on')){const r=a.getBoundingClientRect(),p=catsEl.getBoundingClientRect();catsEl.scrollTo({left:catsEl.scrollLeft+(r.left-p.left)-p.width/2+r.width/2,behavior:'smooth'})}a.classList.toggle('on',on)});
}
addEventListener('scroll',spy,{passive:true});spy();

/* preloader */
const hide=()=>setTimeout(()=>$('#preloader').classList.add('done'),900);
document.readyState==='complete'?hide():addEventListener('load',hide);
setTimeout(()=>$('#preloader').classList.add('done'),3500);
/* restore saved cart, validated against the current menu */
(function(){try{const saved=JSON.parse(localStorage.getItem('bw-cart')||'{}'),ok={};
MENU.forEach(sec=>sec.items.forEach(it=>it.v.forEach(v=>{ok[it.n+'|'+v.l]={n:it.n,l:v.l,p:v.p}})));
Object.keys(saved).forEach(k=>{const m=ok[k],q=parseInt(saved[k]&&saved[k].q,10);if(m&&q>0)cart[k]={...m,q:Math.min(q,99)}})}catch(e){}})();
refresh();

/* search */
const AR=t=>(t||'').toString().toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/(.)\1+/g,'$1');
function lev(a,b){if(Math.abs(a.length-b.length)>1)return 9;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i]}for(let j=0;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
const cards=[...document.querySelectorAll('.card')];
cards.forEach(c=>{const sec=c.closest('.sec');const t=c.querySelector('h3').textContent+' '+(c.querySelector('.d')?c.querySelector('.d').textContent:'')+' '+sec.querySelector('h2').textContent;c._h=AR(t);c._hn=c._h.replace(/\s/g,'');c._w=c._h.split(/\s+/)});
function matches(c,q){const qn=AR(q).trim();if(!qn)return true;if(qn.length<2&&q.trim().length>=3)return false;
  if(qn.includes(' ')&&c._hn.includes(qn.replace(/\s/g,'')))return true;
  return qn.split(/\s+/).every(tk=>c._w.some(w=>w.startsWith(tk))||(tk.length>=4&&(c._hn.includes(tk)||c._w.some(w=>lev(tk,w)<=1||lev(tk,w.slice(0,tk.length))<=1))))}
const qEl=$('#q'),emptyEl=$('#noRes');
function runSearch(){const q=qEl.value;let any=false;
  document.querySelectorAll('.sec').forEach(sec=>{let n=0;sec.querySelectorAll('.card').forEach(c=>{const m=matches(c,q);c.hidden=!m;if(m){n++;c.classList.add('in')}});sec.hidden=n===0;if(n)any=true});
  emptyEl.hidden=any||!q.trim();$('#qClear').hidden=!q;
  document.body.classList.toggle('searching',!!q.trim());
  if(q.trim()){const sb=document.querySelector('.searchbar');const y=sb.getBoundingClientRect().top+scrollY-130;if(Math.abs(scrollY-y)>2&&scrollY>y)window.scrollTo({top:y,behavior:'instant'})}}
qEl.addEventListener('input',runSearch);
$('#qClear').onclick=()=>{qEl.value='';runSearch();qEl.focus()};
