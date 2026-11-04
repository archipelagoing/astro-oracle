/* Deterministic helpers shared by browser and Node verification. */
(function (root) {
  const bodies = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const aspects = [[0,'conjunction'],[60,'sextile'],[90,'square'],[120,'trine'],[180,'opposition']];
  const norm = x => ((x % 360) + 360) % 360;
  const signed = x => norm(x + 180) - 180;
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
  root.OracleCore={bodies,aspects,norm,signed,validBirth,parseICS,exportICS};
  if(typeof module!=='undefined') module.exports=root.OracleCore;
})(globalThis);
