function drawReport(){
  const dates=getVisibleDates();
  const c=$('reportCanvas'),ctx=c.getContext('2d');
  const cols=2, gapX=20, gapY=18, margin=60, headerH=188, footerH=42;
  const cardW=(1080-margin*2-gapX)/2;
  const rows=Math.max(1,Math.ceil(Math.max(dates.length,1)/cols));
  const cardH=dates.length>6?390:dates.length>4?410:440;
  c.width=1080; c.height=headerH + rows*(cardH+gapY) + footerH;
  const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);ctx.direction='rtl';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f8fbff');bg.addColorStop(1,'#ecf3fb');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const top=ctx.createLinearGradient(0,0,W,0);top.addColorStop(0,'#21c7f0');top.addColorStop(1,'#3b82f6');ctx.fillStyle=top;ctx.fillRect(0,0,W,18);
  ctx.fillStyle='#dff0ff';ctx.fillRect(0,18,W,6);

  ctx.textAlign='right';ctx.fillStyle='#102b4e';ctx.font='900 68px Arial';ctx.fillText('WORK SCHEDULE',1008,90);
  ctx.fillStyle='#557595';ctx.font='800 28px Arial';ctx.fillText(rangeText(),1008,132);
  ctx.textAlign='left';ctx.fillStyle='#5d7f9f';ctx.font='900 24px Arial';ctx.fillText('AST DEPARTMENT',66,90);

  function pill(x,y,w,h,text,fill,textColor){ ctx.fillStyle=fill;ctx.strokeStyle='rgba(0,0,0,.03)';ctx.lineWidth=1;rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.fillStyle=textColor;ctx.font='900 20px Arial';ctx.fillText(text,x+w/2,y+24); }
  pill(58,108,118,36,'AST','#e7f7ff','#1e6588');
  pill(186,108,132,36,'SHIFT B','#e9f0ff','#355ea8');
  pill(328,108,120,36,'PRO v1.4','#eef3f8','#5e748d');
  pill(458,108,112,36,'ימים: '+dates.length,'#f1f8f2','#267150');
  pill(580,108,132,36,'שיבוצים: '+totalAssignments(),'#fff4e7','#a26214');

  ctx.strokeStyle='#d5e6f5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(60,166);ctx.lineTo(1020,166);ctx.stroke();
  if(!dates.length){ ctx.textAlign='center'; ctx.fillStyle='#7d93aa'; ctx.font='900 40px Arial'; ctx.fillText('אין ימי עבודה להצגה',540,320); return; }

  dates.forEach((date,i)=>{
    const col=i%2,row=Math.floor(i/2),x=margin+col*(cardW+gapX),y=headerH+row*(cardH+gapY);
    ctx.save(); ctx.shadowColor='rgba(16,43,78,0.09)'; ctx.shadowBlur=22; ctx.shadowOffsetY=7; ctx.fillStyle='#fff'; rr(ctx,x,y,cardW,cardH,24); ctx.fill(); ctx.restore();
    ctx.strokeStyle='#d0e1f0'; ctx.lineWidth=2; rr(ctx,x,y,cardW,cardH,24); ctx.stroke();

    const hg=ctx.createLinearGradient(x,y,x+cardW,y); hg.addColorStop(0,'#e8f6ff'); hg.addColorStop(1,'#d8efff'); ctx.fillStyle=hg; rr(ctx,x,y,cardW,72,24); ctx.fill(); ctx.fillRect(x,y+36,cardW,36);
    ctx.textAlign='right'; ctx.fillStyle='#14375c'; ctx.font='900 40px Arial'; ctx.fillText(longLabel(date),x+cardW-18,y+48);
    ctx.textAlign='left'; ctx.fillStyle='#5f7c99'; ctx.font='900 28px Arial'; ctx.fillText(heDate(date,false),x+18,y+48);
    pill(x+16,y+80,90,28,countDay(date)+' עובדים','#f4f9ff','#5a7b99');

    let cy=y+116; const dn=S.dayNotes[date]||'';
    if(dn){
      ctx.fillStyle='#f2f8fe'; ctx.strokeStyle='#dfeaf5'; ctx.lineWidth=1.5; rr(ctx,x+16,cy-6,cardW-32,72,14); ctx.fill(); ctx.stroke();
      ctx.textAlign='right'; ctx.fillStyle='#5a738b'; ctx.font='900 23px Arial'; const lines=wrap(ctx,'הערה: '+dn,cardW-60).slice(0,2); lines.forEach((ln,j)=>ctx.fillText(ln,x+cardW-28,cy+22+j*22)); cy+=80;
    }

    const arr=S.workers.filter(w=>assigned(w,date));
    if(!arr.length){ ctx.textAlign='center'; ctx.fillStyle='#a0b4c7'; ctx.font='800 42px Arial'; ctx.fillText('אין שיבוץ',x+cardW/2,y+cardH/2+12); return; }

    const available=Math.max(96,y+cardH-20-cy);
    const minRowH=40;
    let maxFit=Math.max(1,Math.floor(available/minRowH));
    let overflow=arr.length>maxFit;
    const overflowSpace=overflow?30:0;
    if(overflow){maxFit=Math.max(1,Math.floor((available-overflowSpace)/minRowH)); overflow=arr.length>maxFit;}
    const show=arr.slice(0,maxFit);
    const usable=available-(overflow?overflowSpace:0);
    const rowH=usable/show.length;
    const nameBase=clamp(rowH*0.60,24,50), timeSize=clamp(rowH*0.40,20,34), noteSize=clamp(rowH*0.27,14,22), nameY=clamp(rowH*0.35,16,30), noteY=clamp(rowH*0.74,30,62), dividerOffset=clamp(rowH*0.18,8,16);

    show.forEach((w,j)=>{
      const v=info(w,date),yy=cy+j*rowH;
      if(j){ctx.strokeStyle='#edf3f9'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+18,yy-dividerOffset); ctx.lineTo(x+cardW-18,yy-dividerOffset); ctx.stroke();}
      ctx.textAlign='right'; ctx.fillStyle='#102b4e'; const fs=fit(ctx,w.name,cardW-190,Math.round(nameBase),22); ctx.font='900 '+fs+'px Arial'; ctx.fillText(w.name,x+cardW-18,yy+nameY);
      ctx.save(); ctx.direction='ltr'; ctx.textAlign='left'; ctx.fillStyle='#2f628f'; ctx.font='900 '+Math.round(timeSize)+'px Arial'; ctx.fillText(fmtRange(v.from,v.to),x+18,yy+nameY); ctx.restore(); ctx.direction='rtl';
      if(v.note && rowH>=46){ ctx.textAlign='right'; ctx.fillStyle='#7a8ea3'; ctx.font='800 '+Math.round(noteSize)+'px Arial'; const limit=rowH<58?22:34; ctx.fillText(v.note.length>limit?v.note.slice(0,limit-1)+'…':v.note,x+cardW-18,yy+noteY); }
    });
    if(overflow){ ctx.textAlign='center'; ctx.fillStyle='#6f89a4'; ctx.font='800 22px Arial'; ctx.fillText('+'+(arr.length-show.length)+' עובדים נוספים',x+cardW/2,y+cardH-12); }
  });
  ctx.textAlign='center'; ctx.fillStyle='#89a0b8'; ctx.font='800 20px Arial'; ctx.fillText('WORK SCHEDULE · AST DEPARTMENT · SHIFT B · PRO v1.4.0',540,H-16);
}
function canvasBlob(){return new Promise((res,rej)=>$('reportCanvas').toBlob(b=>b?res(b):rej(new Error('blob')),'image/png',1))}
async function savePng(){try{const b=await canvasBlob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='WORK-SCHEDULE-AST-'+S.rangeStart+'_TO_'+S.rangeEnd+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}catch(e){alert('לא ניתן לשמור תמונה במכשיר הזה')}}
async function sharePng(){try{const b=await canvasBlob(),f=new File([b],'WORK-SCHEDULE-AST-'+S.rangeStart+'_TO_'+S.rangeEnd+'.png',{type:'image/png'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[f]}))){await navigator.share({files:[f],title:'WORK SCHEDULE · AST'})}else await savePng()}catch(e){if(e&&e.name!=='AbortError')alert('השיתוף לא נתמך. השתמש בשמור PNG.')}}
$('prevRange').addEventListener('click',()=>shiftRange(-rangeDaysCount()));
$('nextRange').addEventListener('click',()=>shiftRange(rangeDaysCount()));
$('rangeStart').addEventListener('change',updateRange); $('rangeEnd').addEventListener('change',updateRange);
$('resetHiddenBtn').addEventListener('click',resetHidden); $('resetHiddenBtnBottom').addEventListener('click',resetHidden); $('toggleHideDayBtn').addEventListener('click',toggleHideSelected);
$('allDayBtn').addEventListener('click',markAll); $('clearDayBtn').addEventListener('click',clearDay); $('copyDayBtn').addEventListener('click',openCopy); $('dayNoteInput').addEventListener('input',()=>{S.dayNotes[S.selected]=$('dayNoteInput').value.trim();persist();drawReport()});
$('manageBtn').addEventListener('click',openManage); $('closeManage').addEventListener('click',closeManage); $('addWorkerBtn').addEventListener('click',addWorker); $('newName').addEventListener('keydown',e=>{if(e.key==='Enter')addWorker()}); $('resetData').addEventListener('click',resetData);
$('saveWorkerDay').addEventListener('click',saveWorker); $('cancelWorkerDay').addEventListener('click',closeWorker); $('workerSheet').addEventListener('click',e=>{if(e.target===$('workerSheet'))closeWorker()});
$('closeCopy').addEventListener('click',()=>$('copySheet').classList.remove('open')); $('copySheet').addEventListener('click',e=>{if(e.target===$('copySheet'))$('copySheet').classList.remove('open')});
$('manageSheet').addEventListener('click',e=>{if(e.target===$('manageSheet'))closeManage()}); $('shareBtn').addEventListener('click',sharePng); $('saveBtn').addEventListener('click',savePng);
load();