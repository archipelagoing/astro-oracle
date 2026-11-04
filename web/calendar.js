(function(root){
  const glyphs={Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇',conjunction:'☌',sextile:'⚹',square:'□',trine:'△',opposition:'☍'};
  function validDay(key){const ms=Date.parse(key+'T12:00:00Z');return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===key;}
  function dayKey(item,timezone){
    if(item.date)return /^\d{4}-\d{2}-\d{2}$/.test(item.date)&&validDay(item.date)?item.date:null;
    const raw=item.start||'';
    if(/^\d{8}$/.test(raw)){const key=`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;return validDay(key)?key:null;}
    const compact=/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(raw);
    const iso=compact?`${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}Z`:raw;
    const at=item.at??(iso.endsWith('Z')||/[+-]\d{2}:\d{2}$/.test(iso)?Date.parse(iso):NaN);
    if(!Number.isFinite(at))return null;
    if(compact&&new Date(at).toISOString().slice(0,19)+'Z'!==iso)return null;
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at)).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function content(item){
    const text=item.description||'',title=item.title||'Untitled transit';
    const fortune=/A\. FORTUNE\s*\n([\s\S]*?)(?=\n\s*B\. MEANING)/.exec(text)?.[1].trim()||'';
    const meaning=/B\. MEANING\s*\n([\s\S]*?)(?=\n\s*C\. HOUSES ACTIVATED)/.exec(text)?.[1].trim()||'';
    const details=fortune&&meaning?text.slice(text.indexOf('C. HOUSES ACTIVATED')):text;
    const rank=/\((\d+)\)/.exec(title)?.[1]||null;
    const glyph=(title.match(/[☉☽☿♀♂♃♄♅♆♇△□☍☌⚹]/gu)||[]).join(' ')||title.split(/\s+/).filter(w=>glyphs[w]).map(w=>glyphs[w]).join(' ')||'✧';
    return {...item,title,fortune,meaning,details,rank,glyph};
  }
  function addDays(key,n){const date=new Date(key+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10);}
  function monday(key){const weekday=new Date(key+'T12:00:00Z').getUTCDay();return addDays(key,-((weekday+6)%7));}
  function group(items,timezone){
    const days=new Map(),undated=[];
    for(const item of items){const entry=content(item),key=dayKey(item,timezone);if(!key){undated.push(entry);continue;}if(!days.has(key))days.set(key,[]);days.get(key).push(entry);}
    const keys=[...days.keys()].sort();return {days,undated,first:keys.length?monday(keys[0]):null,last:keys.length?monday(keys.at(-1)):null};
  }
  function mount(container,items,timezone){
    container.replaceChildren();const calendar=group(items,timezone);
    const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)OracleSymbols.write(e,text);if(className)e.className=className;return e;};
    if(calendar.first){
      const current=monday(dayKey({at:Date.now()},timezone));
      let week=current>=calendar.first&&current<=calendar.last?current:calendar.first;
      const toolbar=el('div',undefined,'week-toolbar'),previous=el('button','← Previous','secondary'),next=el('button','Next →','secondary'),label=el('h3');
      previous.type=next.type='button';previous.setAttribute('aria-label','Previous week');next.setAttribute('aria-label','Next week');label.setAttribute('aria-live','polite');
      const grid=el('div',undefined,'week-grid');grid.setAttribute('aria-label','Weekly oracle cards');
      toolbar.append(previous,label,next);container.append(toolbar,grid);
      const dateLabel=(key,options)=>new Intl.DateTimeFormat(undefined,{...options,timeZone:'UTC'}).format(new Date(key+'T12:00:00Z'));
      function draw(){
        label.textContent=`${dateLabel(week,{month:'short',day:'numeric'})} – ${dateLabel(addDays(week,6),{month:'short',day:'numeric',year:'numeric'})}`;
        previous.disabled=week<=calendar.first;next.disabled=week>=calendar.last;grid.replaceChildren();
        for(let i=0;i<7;i++){
          const day=addDays(week,i),entries=calendar.days.get(day)||[],column=el('section',undefined,'calendar-day');
          column.append(el('h4',dateLabel(day,{weekday:'short'}),'day-name'),el('p',dateLabel(day,{day:'numeric',month:'short'}),'day-date'));
          if(!entries.length){column.append(el('div','No entries for this day','empty-day'));grid.append(column);continue;}
          const primary=entries[0],card=el('article',undefined,'oracle-card'),front=el('button',undefined,'card-front'),back=el('div',undefined,'card-back');
          front.type='button';front.setAttribute('aria-label',`Reveal ${dateLabel(day,{month:'long',day:'numeric'})}: ${primary.title}`);front.setAttribute('aria-expanded','false');
          front.append(el('span',primary.rank?`NO. ${primary.rank}`:'UNRANKED','card-rank'),el('span',primary.glyph,'card-glyph'),el('span',entries.length>1?`${entries.length} transits`:primary.title,'card-title'),el('span','✧ Flip to reveal','card-hint'));
          back.hidden=true;
          if(primary.fortune){back.append(el('p','YOUR FORTUNE','eyebrow'),el('p',primary.fortune,'card-fortune'));if(primary.meaning)back.append(el('p','MEANING','eyebrow'),el('p',primary.meaning,'card-meaning'));}
          else{back.append(el('p','YOUR TRANSITS','eyebrow'),el('h5',primary.title),el('p','A personalized fortune has not been generated for these transit candidates.','card-meaning'));}
          for(const entry of entries){const details=el('details');details.append(el('summary',entries.length>1?entry.title:'Astrological details'),el('p',entry.when||'','event-time'),el('p',entry.details,'card-details'));back.append(details);}
          const close=el('button','↶ Turn card back','card-close');close.type='button';back.append(close);
          const flip=open=>{front.hidden=open;back.hidden=!open;front.setAttribute('aria-expanded',String(open));card.classList.remove('card-reveal');void card.offsetWidth;card.classList.add('card-reveal');(open?close:front).focus();};
          front.addEventListener('click',()=>flip(true));close.addEventListener('click',()=>flip(false));back.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();flip(false);}});
          card.append(front,back);column.append(card);grid.append(column);
        }
      }
      previous.addEventListener('click',()=>{week=addDays(week,-7);draw();});next.addEventListener('click',()=>{week=addDays(week,7);draw();});draw();
    }else container.append(el('p','No dated entries to display.'));
    if(calendar.undated.length){const details=el('details');details.append(el('summary',`${calendar.undated.length} entries with unsupported or missing dates`));for(const item of calendar.undated)details.append(el('h4',item.title),el('p',item.description,'card-details'));container.append(details);}
  }
  root.OracleCalendar={dayKey,content,group,monday,addDays,mount};
  if(typeof module!=='undefined')module.exports=root.OracleCalendar;
})(globalThis);
