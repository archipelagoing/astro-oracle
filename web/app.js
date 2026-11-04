const $=id=>document.getElementById(id);
let exportEvents=[],worker;
$('month').value=new Date().toISOString().slice(0,7);
$('timezone').value=Intl.DateTimeFormat().resolvedOptions().timeZone;
function status(message){$('status').textContent=message;}
function render(items,note){
  $('entries').replaceChildren();$('result-note').textContent=note;$('results').hidden=false;
  for(const item of items){const article=document.createElement('article');article.className='entry';
    const title=document.createElement('h3');title.textContent=item.title;
    const time=document.createElement('time');time.textContent=item.when;
    const desc=document.createElement('p');desc.textContent=item.description;
    article.append(title,time,desc);$('entries').append(article);}
}
function reset(){if(worker){worker.terminate();worker=null;}$('calculate').disabled=false;exportEvents=[];$('download').hidden=true;$('results').hidden=true;}
$('calculate-form').addEventListener('submit',event=>{
  event.preventDefault();reset();
  const birth=$('birth').value.trim(),month=$('month').value,timezone=$('timezone').value.trim();
  if(!OracleCore.validBirth(birth)){status('Enter a valid birth timestamp between 1900 and 2100, with seconds and an explicit UTC offset.');return;}
  const birthYear=Number(birth.slice(0,4));
  if(birthYear<1900||birthYear>2100||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<'1900-01'||month>'2100-12'){status('Choose birth and transit dates between 1900 and 2100.');return;}
  let format;try{format=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'long',timeZone:timezone});}catch{status('Enter a valid timezone, such as America/New_York.');return;}
  $('calculate').disabled=true;status('Calculating natal placements and scanning your month…');
  worker=new Worker('transits-worker.js');
  worker.onerror=()=>{reset();status('The calculation engine could not load. Check the site files and try again.');};
  worker.onmessage=({data})=>{
    if(data.error){reset();status('Calculation failed: '+data.error);return;}
    if(data.progress!==undefined){status('Scanning planetary transits… '+data.progress+'%');return;}
    const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const position=n=>`${(n%30).toFixed(4)}° ${signs[Math.floor(n/30)]}`;
    exportEvents=data.hits.map(h=>({id:`calc-v1-${birth.replace(/[^0-9A-Za-z]/g,'')}-${h.moving}-${h.target}-${h.aspect}-${Math.round(h.at/1000)}`,at:h.at,title:`${h.moving} ${h.aspect} natal ${h.target}`,description:`Transiting ${h.moving}: ${position(h.longitude)}. Natal ${h.target}: ${position(h.natalLongitude)}.\nCalculated tropical geocentric aspect; numerical crossing estimate, not an AI fortune. Exact instant (UTC): ${new Date(h.at).toISOString()}.`}));
    render(exportEvents.map(e=>({...e,when:format.format(new Date(e.at))})),`${exportEvents.length} calculated crossings in ${month} (UTC boundaries), displayed in ${timezone}. Events near month edges may display on a neighboring local date. These are transit candidates, not ranked daily oracle entries.`);
    $('download').hidden=exportEvents.length===0;$('calculate').disabled=false;worker.terminate();worker=null;status('Calculation complete.');
  };
  worker.postMessage({birth,month});
});
$('import').addEventListener('change',async()=>{
  const file=$('import').files[0];if(!file)return;reset();
  try{if(file.size>5*1024*1024)throw Error('Choose a calendar smaller than 5 MB.');
    const events=OracleCore.parseICS(await file.text());
    render(events.map(e=>({title:e.SUMMARY||'Untitled event',when:e.DTSTART||'No date supplied',description:e.DESCRIPTION||''})),`${events.length} imported events from ${file.name}. Original dates and descriptions are shown as supplied; source facts and timezone labels have not been verified.`);status('Calendar imported locally.');
  }catch(error){status(error.message);}
});
$('download').addEventListener('click',()=>{const blob=new Blob([OracleCore.exportICS(exportEvents)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='astro-oracle-transits.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
