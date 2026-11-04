/* Deterministic helpers shared by browser and Node verification. */
(function (root) {
  const bodies = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const aspects = [[0,'conjunction'],[60,'sextile'],[90,'square'],[120,'trine'],[180,'opposition']];
  const norm = x => ((x % 360) + 360) % 360;
  const signed = x => norm(x + 180) - 180;
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  function validBirth(value) {
    const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
    if(!match)return false;
    const [,y,m,d,h,min,sec,,oh,om]=match;
    const days=new Date(Date.UTC(+y,+m,0)).getUTCDate();
    return +y>=1900&&+y<=2100&&+m>=1&&+m<=12&&+d>=1&&+d<=days&&+h<24&&+min<60&&+sec<60&&(!oh||(+oh<=14&&+om<60&&(+oh<14||+om===0)))&&Number.isFinite(Date.parse(value));
  }
  function parseICS(text) {
    if (!text.includes('BEGIN:VCALENDAR') || !text.includes('END:VCALENDAR')) throw Error('This file is not a complete ICS calendar.');
    const lines = text.replace(/\r?\n[ \t]/g,'').split(/\r?\n/);
    const events=[]; let event=null;
    const unescape = s => s.replace(/\\([nN,;\\])/g,(_,c)=> /[nN]/.test(c)?'\n':c);
    for (const line of lines) {
      if (line==='BEGIN:VEVENT') { event={}; continue; }
      if (line==='END:VEVENT') { if(event) events.push(event); event=null; continue; }
      if (!event) continue;
      const colon=line.indexOf(':'); if(colon<0) continue;
      const key=line.slice(0,colon).split(';')[0].toUpperCase();
      if(['SUMMARY','DESCRIPTION','DTSTART','UID'].includes(key)) event[key]=unescape(line.slice(colon+1));
    }
    return events;
  }
  function parseAstroSeek(text) {
    const events=parseICS(text),transits=[],issues=[],groups=new Map();
    const targets=new Set([...bodies,'Ascendant','DSC','MC','IC']);
    const supported=new Set(aspects.map(a=>a[1]));
    for(const [index,event] of events.entries()){
      const uid=event.UID;
      if(!uid){issues.push({event:index+1,code:'missing_uid'});continue;}
      if(!groups.has(uid))groups.set(uid,[]);
      groups.get(uid).push({event,index});
    }
    for(const [uid,records] of groups){
      if(new Set(records.map(r=>JSON.stringify(r.event))).size>1){issues.push({uid,code:'conflicting_uid'});continue;}
      if(records.length>1)issues.push({uid,code:'duplicate_collapsed',count:records.length});
      const {event,index}=records[0];
      const reject=code=>issues.push({uid,event:index+1,code});
      const title=/^Tr\. (\w+) (conjunction|sextile|square|trine|opposition) (\w+)$/.exec(event.SUMMARY||'');
      if(!title||!bodies.includes(title[1])||!supported.has(title[2])||!targets.has(title[3])){reject('unsupported_transit');continue;}
      const detail=/^Transit (\w+) \(([A-Za-z]+) (\d{1,2})°(\d{2})[’′']\) - (\w+) - Natal (\w+)(?=\s|$)/.exec(event.DESCRIPTION||'');
      if(!detail){reject('missing_or_unrecognized_position');continue;}
      const [,moving,sign,degrees,minutes,aspect,target]=detail;
      if(moving!==title[1]||aspect!==title[2]||target!==title[3]){reject('summary_description_conflict');continue;}
      if(!signs.includes(sign)||+degrees>=30||+minutes>=60){reject('invalid_position');continue;}
      const timestamp=/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(event.DTSTART||'');
      if(!timestamp){reject('requires_exact_utc_timestamp');continue;}
      const [,y,m,d,h,min,sec]=timestamp;
      const iso=`${y}-${m}-${d}T${h}:${min}:${sec}Z`,ms=Date.parse(iso);
      if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,19)+'Z'!==iso){reject('invalid_timestamp');continue;}
      const houseMatch=/Transit (\w+) in Natal (\d{1,2})(?:st|nd|rd|th) house:/.exec(event.DESCRIPTION);
      let movingHouse=null;
      if(houseMatch){
        if(houseMatch[1]!==moving||+houseMatch[2]<1||+houseMatch[2]>12){reject('invalid_house');continue;}
        movingHouse=+houseMatch[2];
      }
      const missingFacts=['natal_longitude','natal_house','independent_aspect_verification'];
      if(movingHouse===null)missingFacts.push('transiting_house');
      transits.push({id:uid,sourceUid:uid,exactAt:iso,movingBody:moving,targetBody:target,
        aspect,movingSign:sign,movingDegree:+degrees+(+minutes/60),
        movingLongitude:signs.indexOf(sign)*30+(+degrees)+(+minutes/60),
        movingHouse,natalLongitude:null,natalHouse:null,missingFacts,
        verification:'parsed_source_only',source:{...event}});
    }
    return {sourceEventCount:events.length,transits,issues};
  }
  const escapeICS = s => String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function fold(line) {
    // RFC 5545 physical lines are limited by UTF-8 octets, not JS character count.
    let out='',part='',bytes=0;
    for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>75){out+=part+'\r\n';part=' ';bytes=1;}part+=c;bytes+=n;}
    return out+part;
  }
  function exportICS(events, stamp=new Date()) {
    const compact = d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Astro Oracle//Transit Calculator v1//EN','CALSCALE:GREGORIAN'];
    for(const e of events){lines.push('BEGIN:VEVENT','UID:'+e.id+'@astro-oracle','DTSTAMP:'+compact(stamp),'DTSTART:'+compact(e.at),'SUMMARY:'+escapeICS(e.title),'DESCRIPTION:'+escapeICS(e.description),'TRANSP:TRANSPARENT','END:VEVENT');}
    lines.push('END:VCALENDAR'); return lines.map(fold).join('\r\n')+'\r\n';
  }
  root.OracleCore={bodies,aspects,norm,signed,validBirth,parseICS,parseAstroSeek,exportICS};
  if(typeof module!=='undefined') module.exports=root.OracleCore;
})(globalThis);
