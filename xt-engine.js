(() => {
'use strict';
const K={pool:'op_pool_v5',fav:'op_fav_v5',del:'op_del_v5',seen:'op_seen_v5',hist:'op_hist_v5',feedVersion:'op_feed_version_v5'};
const $=id=>document.getElementById(id);
const load=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const idFor=s=>'l-'+hash(norm(s));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

let pool=load(K.pool),fav=load(K.fav),del=load(K.del),seen=load(K.seen),hist=load(K.hist);
let current=null,index=0,tab='history',freshIds=new Set(),feedMeta={source:'local',generatedAt:null,version:0};

const seed=[
['קליל','מה הדבר הקטן שהכי שיפר לך את השבוע?'],['מסקרן','איזו דעה שלך בדרך כלל מפתיעה אנשים?'],['עמוק','מה הופך מבחינתך שיחה רגילה לשיחה שבאמת זוכרים?'],['קליל','אם היום היה מקבל כותרת, מה היא הייתה?'],['מסקרן','מה הדבר האחרון שלמדת רק כי הסתקרנת?'],['קליל','מה תמיד מצליח להרים לך את מצב הרוח?'],['עמוק','איזה הרגל קטן עשה אצלך שינוי גדול?'],['מסקרן','איזה נושא יכול לגרום לך לשכוח מהשעה?'],['מצחיק','איזה כישרון לא שימושי שלך דווקא די מרשים?']
];
const starts=['שאלה בלי הכנה מוקדמת:','במקום עוד היי רגיל:','נלך ישר למעניין:','מסקרן אותי לדעת:','שאלה קצת אחרת:','בלי תשובה נכונה או לא נכונה:','שאלה אקראית אבל טובה:','יש לי אחת מסקרנת:','בוא נתחיל ממשהו פחות צפוי:','שאלה של שתי שניות:'];
const cores=['מה הדבר שהכי קל לגרום לך לחייך ממנו?','איזה מקום תמיד עושה לך טוב?','מה היית רוצה לדעת לעשות ממש טוב?','איזו החלטה ספונטנית יצאה לך הכי מוצלחת?','מה הדבר האחרון שלמדת רק מתוך סקרנות?','מה מבחינתך הופך שיחה לטובה באמת?','אם היום היה מקבל כותרת — מה היא הייתה?','מה משהו שאנשים בדרך כלל מניחים עליך ולא תמיד קולעים?','איזה דבר קטן יכול לשנות לך מצב רוח?','על איזה נושא אף פעם לא נמאס לך לדבר?','מה הדבר הראשון שהיית עושה ביום פנוי לגמרי?','איזה הרגל קטן עושה לך סדר בראש?','מה לדעתך אנשים מעריכים פחות ממה שמגיע לו?','איזה נושא יכול לגרום לך לשכוח מהשעה?','מה הדבר המעניין האחרון שראית או שמעת?','אם אפשר היה ללמוד משהו חדש בשנייה — מה היית בוחר?','מה יותר חשוב לך ביום טוב: שקט, צחוק או עניין?','איזה מקום תמיד שווה מבחינתך ביקור נוסף?','מה הופך יום רגיל ליום מוצלח?','איזה דבר חדש היית מוכן לנסות רק בשביל החוויה?','מה היה הפלייליסט המושלם ליום הזה?','איזו אפליקציה היית מוחק מהעולם ליום אחד?','איזה מאכל תמיד מנצח אצלך כשאין כוח להחליט?','מה הדבר הכי מפתיע שגילית לאחרונה?'];
const tails=['',' תשובה ראשונה שעולה לך.',' בלי לחשוב יותר מדי.',' אפשר גם תשובה מפתיעה.',' מסקרן אותי דווקא למה.',' ואם צריך לבחור רק אחד?'];

function addItem(item,fresh=false){
 const text=String(item?.text||'').replace(/\s+/g,' ').trim(); if(text.length<8)return false;
 const n=norm(text); if(pool.some(x=>norm(x.text)===n))return false;
 const obj={id:item.id||idFor(text),category:item.category||'מסקרן',text,createdAt:item.createdAt||new Date().toISOString(),source:item.source||'local'};
 pool.unshift(obj); if(fresh)freshIds.add(obj.id); return true;
}
function bootstrap(){ if(!pool.length)seed.forEach(([category,text])=>addItem({category,text,source:'seed'})); }
function generateLocal(count=24){
 let added=0,tries=0; while(added<count&&tries<count*20){tries++; const text=`${pick(starts)} ${pick(cores)}${pick(tails)}`; const categories=['קליל','מסקרן','עמוק','מצחיק']; if(addItem({category:pick(categories),text,source:'local'},true))added++;}
 const h=new Date().getHours(); const moment=h<11?'מה הדבר שיכול להפוך את הבוקר הזה לטוב?':h<17?'אם הייתה לך עכשיו שעה פנויה לגמרי, מה היית עושה?':'מה היה החלק הכי טוב ביום שלך עד עכשיו?';
 addItem({category:'רגעי',text:`שאלה לפי הרגע: ${moment}`,source:'context'},true);
 pool=pool.slice(0,2000); save(K.pool,pool); return added;
}
async function syncFeed(){
 try{
  const res=await fetch(`openers-feed.json?v=${Date.now()}`,{cache:'no-store'}); if(!res.ok)throw new Error('feed');
  const feed=await res.json(); feedMeta={source:feed.source||'feed',generatedAt:feed.generatedAt||null,version:feed.version||0};
  let added=0; for(const x of (feed.items||[])){if(addItem({...x,source:x.source||'ai'},true))added++;}
  pool=pool.slice(0,3000); save(K.pool,pool); save(K.feedVersion,feedMeta.version); $('syncState').textContent=`מאגר מרכזי v${feedMeta.version} · ${added} חדשים`;
 }catch{ $('syncState').textContent='מצב מקומי · הסנכרון יחזור אוטומטית'; }
 render();
}
function filtered(){const q=norm($('search').value),c=$('category').value;return pool.filter(x=>!del.includes(x.id)&&(c==='all'||x.category===c)&&(!q||norm(x.text).includes(q)));}
function setCurrent(x,list){current=x;if(!x){$('opener').textContent='אין תוצאות';$('position').textContent='0 מתוך 0';return;} index=Math.max(0,list.findIndex(i=>i.id===x.id)); $('opener').textContent=x.text;$('catLabel').textContent=x.category;$('position').textContent=`${index+1} מתוך ${list.length}`;$('source').textContent=x.source==='ai'?'נוצר במנוע AI':x.source==='seed'?'מאגר בסיס':x.source==='context'?'לפי הרגע':'נוצר במנוע המקומי';$('freshBadge').style.display=freshIds.has(x.id)?'inline-block':'none';$('favBtn').classList.toggle('active',fav.includes(x.id)); if(!seen.includes(x.id)){seen.unshift(x.id);seen=seen.slice(0,3000);save(K.seen,seen)} hist=hist.filter(id=>id!==x.id);hist.unshift(x.id);hist=hist.slice(0,80);save(K.hist,hist);stats();}
function render(){const list=filtered(); if(current&&list.some(x=>x.id===current.id))setCurrent(current,list); else setCurrent(list[0]||null,list); $('freshCount').textContent=`${freshIds.size} חדשים`;stats();renderPanel();}
function move(step){const list=filtered();if(!list.length)return;let i=current?list.findIndex(x=>x.id===current.id):-1;i=(i+step+list.length)%list.length;setCurrent(list[i],list);}
function stats(){$('totalStat').textContent=filtered().length;$('favStat').textContent=fav.length;$('deletedStat').textContent=del.length;$('seenStat').textContent=seen.length;}
function byId(id){return pool.find(x=>x.id===id)}
function renderPanel(){let ids=tab==='favorites'?fav:tab==='deleted'?del:hist;const rows=ids.map(byId).filter(Boolean).slice(0,40);$('panel').innerHTML=rows.length?rows.map(x=>`<div class="row"><div class="rowtext">${escapeHtml(x.text)}</div><button class="mini" data-open="${x.id}">פתח</button>${tab==='deleted'?`<button class="mini" data-restore="${x.id}">שחזר</button>`:''}</div>`).join(''):'<div class="empty">אין כאן פריטים עדיין</div>';}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function favToggle(){if(!current)return;fav=fav.includes(current.id)?fav.filter(x=>x!==current.id):[current.id,...fav];save(K.fav,fav);render();}
function removeCurrent(){if(!current)return;del=[current.id,...del.filter(x=>x!==current.id)];save(K.del,del);current=null;render();}
function restore(id){del=del.filter(x=>x!==id);save(K.del,del);render();}
async function copyCurrent(){if(!current)return;try{await navigator.clipboard.writeText(current.text);$('copyBtn').textContent='הועתק';setTimeout(()=>$('copyBtn').textContent='העתק',900)}catch{}}
function context(){const d=new Date(),h=d.getHours();$('contextLine').textContent=`${h<11?'בוקר':h<17?'צהריים':'ערב'} · מנוע היברידי AI + מקומי`;}

$('nextBtn').onclick=()=>move(1);$('prevBtn').onclick=()=>move(-1);$('copyBtn').onclick=copyCurrent;$('favBtn').onclick=favToggle;$('deleteBtn').onclick=removeCurrent;
$('moreBtn').onclick=()=>{const n=generateLocal(24);$('syncState').textContent=`נוצרו עכשיו ${n} מקומיים חדשים`;render();};
$('category').onchange=()=>{current=null;render()};$('search').oninput=()=>{current=null;render()};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');tab=b.dataset.tab;renderPanel();});
$('panel').onclick=e=>{const o=e.target.dataset.open,r=e.target.dataset.restore;if(r)return restore(r);if(o){const x=byId(o);if(x){current=x;render();window.scrollTo({top:0,behavior:'smooth'})}}};

bootstrap();context();generateLocal(24);shuffle(pool);save(K.pool,pool);render();syncFeed();
})();
