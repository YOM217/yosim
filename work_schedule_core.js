'use strict';
const STORE='astWorkSchedulePro140';
const HEB_DAY_SHORT=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const HEB_DAY_LONG=['יום א׳','יום ב׳','יום ג׳','יום ד׳','יום ה׳','יום ו׳','שבת'];
const $=id=>document.getElementById(id);
let S={rangeStart:'',rangeEnd:'',selected:'',workers:[],dayNotes:{},hiddenDates:{}};
let editingWorkerId=null;
function uid(){return 'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function parseDate(v){return new Date(v+'T12:00:00')}
function addDays(v,n){const d=parseDate(v);d.setDate(d.getDate()+n);return iso(d)}
function diffDays(a,b){return Math.round((parseDate(b)-parseDate(a))/86400000)}
function heDate(v,year){return parseDate(v).toLocaleDateString('he-IL',year?{day:'2-digit',month:'2-digit',year:'numeric'}:{day:'2-digit',month:'2-digit'})}
function shortLabel(v){const d=parseDate(v);return HEB_DAY_SHORT[d.getDay()]}
function longLabel(v){const d=parseDate(v);return HEB_DAY_LONG[d.getDay()]}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtRange(from,to){return '\u200E'+String(from||'')+'–'+String(to||'')+'\u200E'}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}}
function migrate(){
  const keys=['fastScheduleV5','fastScheduleV4'];
  for(const key of keys){
    try{
      const old=JSON.parse(localStorage.getItem(key)||'null');
      if(old&&Array.isArray(old.workers)){
        if(old.start){S.rangeStart=old.start;S.rangeEnd=addDays(old.start,5);S.selected=old.selected||old.start;}
        S.dayNotes=old.dayNotes||{};
        S.hiddenDates=old.hiddenDates||{};
        S.workers=old.workers.map(w=>({id:w.id||uid(),name:w.name||'',from:w.from||'16:30',to:w.to||'22:00',days:w.days||{}}));
        persist();return true;
      }
    }catch(e){}
  }
  return false;
}
function getAllDates(){
  const out=[]; let cur=S.rangeStart; const guard=400;
  if(!S.rangeStart||!S.rangeEnd) return out;
  let i=0;
  while(i<guard && parseDate(cur) <= parseDate(S.rangeEnd)){ out.push(cur); cur=addDays(cur,1); i++; }
  return out;
}
function getVisibleDates(){return getAllDates().filter(d=>!S.hiddenDates[d])}
function ensureState(){
  const today=iso(new Date());
  if(!S.rangeStart) S.rangeStart=today;
  if(!S.rangeEnd) S.rangeEnd=addDays(S.rangeStart,5);
  if(parseDate(S.rangeEnd) < parseDate(S.rangeStart)) S.rangeEnd=S.rangeStart;
  if(!migrateLoaded){ /* noop */ }
  const all=getAllDates();
  if(all.length && all.every(d=>S.hiddenDates[d])) S.hiddenDates={};
  const vis=getVisibleDates();
  if(!vis.length){S.hiddenDates={};}
  const finalVis=getVisibleDates();
  if(!finalVis.includes(S.selected)) S.selected=finalVis[0]||S.rangeStart;
}
let migrateLoaded=false;
function load(){
  let ok=false;
  try{const raw=JSON.parse(localStorage.getItem(STORE)||'null');if(raw&&Array.isArray(raw.workers)){S=Object.assign(S,raw);ok=true}}catch(e){}
  if(!ok) migrateLoaded=migrate();
  ensureState();
  render();
}
function assigned(w,date){return !!(w.days&&w.days[date])}
function info(w,date){const d=w.days&&w.days[date];return d?{from:d.from||w.from||'16:30',to:d.to||w.to||'22:00',note:d.note||''}:{from:w.from||'16:30',to:w.to||'22:00',note:''}}
function countDay(date){return S.workers.filter(w=>assigned(w,date)).length}
function totalAssignments(){return getVisibleDates().reduce((sum,d)=>sum+countDay(d),0)}
function rangeText(){return heDate(S.rangeStart,true)+' - '+heDate(S.rangeEnd,true)}
function rangeDaysCount(){return diffDays(S.rangeStart,S.rangeEnd)+1}
function renderRangeMeta(){
  const vis=getVisibleDates();
  $('rangeMeta').innerHTML=''
    +'<span class="pill">'+rangeText()+'</span>'
    +'<span class="pill soft">ימי עבודה מוצגים: '+vis.length+'</span>'
    +'<span class="pill soft">שיבוצים: '+totalAssignments()+'</span>';
  $('toggleHideDayBtn').textContent = S.hiddenDates[S.selected] ? 'הצג יום נבחר' : 'הסתר יום נבחר';
}
function renderDays(){
  const vis=getVisibleDates();
  if(!vis.length){$('days').innerHTML='<div class="empty">אין ימי עבודה מוצגים. לחץ "הצג את כל הימים".</div>';return;}
  $('days').innerHTML=vis.map(d=>'<button type="button" class="day '+(S.selected===d?'active ':'')+(countDay(d)?'has':'')+'" data-day="'+d+'"><strong>'+shortLabel(d)+'</strong><small>'+heDate(d,false)+'</small><div class="count">'+countDay(d)+' משובצים</div></button>').join('');
  document.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{S.selected=b.dataset.day;render()}));
}
function renderLive(){
  const vis=getVisibleDates(); const box=$('liveGrid');
  if(!vis.length){box.innerHTML='<div class="empty">אין ימי עבודה להצגה.</div>';return;}
  box.innerHTML=vis.map(d=>{
    const arr=S.workers.filter(w=>assigned(w,d));
    const rows=arr.slice(0,4).map(w=>{const x=info(w,d);return '<div class="liveWorker"><strong>'+esc(w.name)+'</strong><em>'+fmtRange(x.from,x.to)+'</em></div>'}).join('');
    return '<button type="button" class="liveDay '+(S.selected===d?'active':'')+'" data-live-day="'+d+'"><div class="liveHead"><b>'+longLabel(d)+'</b><span>'+heDate(d,false)+' · '+arr.length+'</span></div><div class="liveWorkers">'+(rows||'<div class="liveEmpty">אין שיבוץ</div>')+(arr.length>4?'<div class="liveMore">+'+(arr.length-4)+' נוספים</div>':'')+'</div></button>';
  }).join('');
  box.querySelectorAll('[data-live-day]').forEach(b=>b.addEventListener('click',()=>{S.selected=b.dataset.liveDay;render()}));
}
function renderPeople(){
  const label=longLabel(S.selected);
  $('assignTitle').textContent='שיבוץ עובדים · '+label;
  $('assignCount').textContent=countDay(S.selected)+' משובצים';
  if(!S.workers.length){$('people').innerHTML='<div class="empty">אין עובדים. הוסף דרך ניהול עובדים.</div>';return;}
  $('people').innerHTML=S.workers.map(w=>{
    const on=assigned(w,S.selected),x=info(w,S.selected);
    return '<button type="button" class="person '+(on?'on':'')+'" data-person="'+w.id+'"><span class="edit" data-edit="'+w.id+'">⚙︎</span><span class="name">'+esc(w.name)+'</span><span class="time">'+fmtRange(x.from,x.to)+'</span>'+(x.note?'<span class="noteDot"></span>':'')+'</button>';
  }).join('');
  document.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',e=>{if(e.target.closest('[data-edit]'))return;toggleWorker(b.dataset.person)}));
  document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openWorker(b.dataset.edit)}));
}
function renderManage(){
  const box=$('manageList'); if(!box) return;
  if(!S.workers.length){box.innerHTML='<div class="empty">עדיין אין עובדים.</div>';return;}
  box.innerHTML=S.workers.map(w=>'<div class="manageRow"><div><div class="mname">'+esc(w.name)+'</div><div class="mtime">'+fmtRange(w.from,w.to)+'</div></div><button type="button" data-del="'+w.id+'">מחק</button></div>').join('');
  box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>deleteWorker(b.dataset.del)));
}
function render(){
  ensureState();
  $('rangeStart').value=S.rangeStart; $('rangeEnd').value=S.rangeEnd; $('rangeText').textContent=rangeText();
  renderRangeMeta(); renderDays(); renderLive(); renderPeople(); renderManage();
  $('dayNoteTitle').textContent='הערה ל'+longLabel(S.selected); $('dayNoteInput').value=S.dayNotes[S.selected]||'';
  drawReport(); persist();
}
function toggleWorker(id){
  const w=S.workers.find(x=>x.id===id); if(!w) return; if(!w.days) w.days={};
  if(w.days[S.selected]){ if(!confirm('להוריד את '+w.name+' מ'+longLabel(S.selected)+'?')) return; delete w.days[S.selected]; }
  else { w.days[S.selected]={from:w.from||'16:30',to:w.to||'22:00',note:''}; }
  render();
}
function openWorker(id){
  const w=S.workers.find(x=>x.id===id); if(!w) return; editingWorkerId=id; const x=info(w,S.selected);
  $('workerSheetTitle').textContent=w.name+' · '+longLabel(S.selected); $('workerFrom').value=x.from; $('workerTo').value=x.to; $('workerNote').value=x.note; $('workerSheet').classList.add('open');
}
function closeWorker(){$('workerSheet').classList.remove('open'); editingWorkerId=null}
function saveWorker(){const w=S.workers.find(x=>x.id===editingWorkerId); if(!w) return; if(!w.days)w.days={}; w.days[S.selected]={from:$('workerFrom').value||w.from||'16:30',to:$('workerTo').value||w.to||'22:00',note:$('workerNote').value.trim()}; closeWorker(); render()}
function markAll(){S.workers.forEach(w=>{if(!w.days)w.days={}; if(!w.days[S.selected])w.days[S.selected]={from:w.from||'16:30',to:w.to||'22:00',note:''};}); render()}
function clearDay(){if(!confirm('לנקות את כל השיבוץ של '+longLabel(S.selected)+'?')) return; S.workers.forEach(w=>{if(w.days) delete w.days[S.selected];}); render()}
function shiftRange(n){S.rangeStart=addDays(S.rangeStart,n); S.rangeEnd=addDays(S.rangeEnd,n); render()}
function updateRange(){const a=$('rangeStart').value,b=$('rangeEnd').value; if(!a||!b) return; S.rangeStart=a; S.rangeEnd=b; if(parseDate(S.rangeEnd)<parseDate(S.rangeStart)) S.rangeEnd=S.rangeStart; render()}
function toggleHideSelected(){
  const all=getAllDates();
  if(S.hiddenDates[S.selected]){ delete S.hiddenDates[S.selected]; render(); return; }
  const vis=getVisibleDates();
  if(vis.length<=1){ alert('חייב להישאר לפחות יום עבודה אחד.'); return; }
  if(confirm('להסתיר את '+longLabel(S.selected)+' מהדשבורד ומהדוח?')){ S.hiddenDates[S.selected]=1; render(); }
}
function resetHidden(){ S.hiddenDates={}; render() }
function openManage(){ renderManage(); $('manageSheet').classList.add('open') }
function closeManage(){$('manageSheet').classList.remove('open'); render()}
function addWorker(){ const name=$('newName').value.trim(); if(!name){$('newName').focus(); return} if(S.workers.some(w=>w.name.toLowerCase()===name.toLowerCase())){alert('העובד כבר קיים'); return} S.workers.push({id:uid(),name,from:$('newFrom').value||'16:30',to:$('newTo').value||'22:00',days:{}}); $('newName').value=''; renderManage(); persist(); $('newName').focus() }
function deleteWorker(id){ const w=S.workers.find(x=>x.id===id); if(!w) return; if(!confirm('למחוק את העובד '+w.name+'?')) return; S.workers=S.workers.filter(x=>x.id!==id); renderManage(); persist(); render() }
function resetData(){ if(!confirm('לאפס את כל העובדים והשיבוצים?')) return; const today=iso(new Date()); S={rangeStart:today,rangeEnd:addDays(today,5),selected:today,workers:[],dayNotes:{},hiddenDates:{}}; persist(); $('manageSheet').classList.remove('open'); render() }
function openCopy(){
  const vis=getVisibleDates().filter(d=>d!==S.selected);
  if(!vis.length){ alert('אין ימים נוספים בטווח להעתקה.'); return; }
  $('copyDays').innerHTML=vis.map(d=>'<button type="button" class="day" data-copy="'+d+'"><strong>'+shortLabel(d)+'</strong><small>'+heDate(d,false)+'</small><div class="count">'+longLabel(d)+'</div></button>').join('');
  $('copyDays').querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>copyTo(b.dataset.copy)));
  $('copySheet').classList.add('open');
}
function copyTo(target){
  S.workers.forEach(w=>{ if(!w.days)w.days={}; if(w.days[S.selected]) w.days[target]=JSON.parse(JSON.stringify(w.days[S.selected])); else delete w.days[target]; });
  S.dayNotes[target]=S.dayNotes[S.selected]||''; $('copySheet').classList.remove('open'); S.selected=target; render();
}
function rr(ctx,x,y,w,h,r){const q=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath()}
function fit(ctx,text,max,start,min){let s=start;ctx.font='900 '+s+'px Arial';while(s>min&&ctx.measureText(text).width>max){s--;ctx.font='900 '+s+'px Arial'}return s}
function wrap(ctx,text,max){const words=String(text||'').split(/\s+/),lines=[];let line='';for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>max&&line){lines.push(line);line=w}else line=t}if(line)lines.push(line);return lines}
