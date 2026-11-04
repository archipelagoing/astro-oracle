const $=id=>document.getElementById(id);
let exportEvents=[],worker;
let reviewedBirth=null,placeResults=[],placeRequest=null,searchSequence=0,placeTimer=null,activePlace=-1,pendingCalculation=false;
const birthFields=['birth-date','birth-time','place-name','latitude','longitude','birth-timezone'];
const birthSignature=()=>JSON.stringify(birthFields.map(id=>$(id).value.trim()));
const zodiacSigns=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const position=n=>`${(n%30).toFixed(4)}° ${zodiacSigns[Math.floor(n/30)]}`;
$('month').value=new Date().toISOString().slice(0,7);
$('timezone').value=Intl.DateTimeFormat().resolvedOptions().timeZone;
function setStatus(message){$('status').textContent=message;}
function render(items,note){
  $('entries').replaceChildren();$('result-note').textContent=note;$('results').hidden=false;
  OracleCalendar.mount($('entries'),items,$('timezone').value.trim()||'UTC');
  $('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function reset(){if(worker){worker.terminate();worker=null;}$('calculate').disabled=false;$('calculate').textContent='Calculate my transits ↗';exportEvents=[];$('download').hidden=true;$('results').hidden=true;$('natal-preview').hidden=true;}
function invalidateBirth(){reviewedBirth=null;if($('birth-review').open)$('birth-review').close();reset();}
for(const id of birthFields)$(id).addEventListener('input',invalidateBirth);
$('birth-choice').addEventListener('change',()=>{$('confirm-birth').disabled=!$('birth-choice').value;});
function reviewBirth(){
  invalidateBirth();
  try{
    if(!$('place-name').value.trim())throw Error('Select your birthplace from the city suggestions.');
    const point=OracleBirth.coordinates($('latitude').value,$('longitude').value);
    const zone=$('birth-timezone').value.trim();
    const candidates=OracleBirth.resolveLocal($('birth-date').value,$('birth-time').value,zone);
    if(!candidates.length)throw Error('That local birth time did not exist in this timezone because the clock moved forward. Check the birth record and timezone; we will not shift the time automatically.');
    const choices=$('birth-choice');choices.replaceChildren();
    if(candidates.length>1){const prompt=document.createElement('option');prompt.value='';prompt.textContent='This clock time occurred twice. Choose the recorded offset.';choices.append(prompt);}
    for(const candidate of candidates){const option=document.createElement('option');option.value=candidate.iso;option.textContent=`${candidate.label} → ${candidate.iso}`;choices.append(option);}
    reviewedBirth={signature:birthSignature(),candidates,point,confirmed:false};
    $('birth-summary').textContent=`${$('birth-date').value} at ${$('birth-time').value} · ${$('place-name').value.trim()} · ${point.latitude}°, ${point.longitude}° · ${zone}. ${candidates.length>1?'The clock repeated this time; choose the correct occurrence.':'Confirm the birth details and resolved instant below.'}`;
    $('confirm-birth').disabled=!choices.value;
    $('confirm-birth').textContent=pendingCalculation?'Confirm & calculate':'Confirm birth details';
    $('birth-review').showModal();
  }catch(error){setStatus(error.message);}
}
$('review-birth').addEventListener('click',()=>{pendingCalculation=false;reviewBirth();});
$('cancel-birth').addEventListener('click',()=>{$('birth-review').close();pendingCalculation=false;});
$('birth-review').addEventListener('cancel',()=>{pendingCalculation=false;});
$('confirm-birth').addEventListener('click',()=>{
  if(!reviewedBirth||reviewedBirth.signature!==birthSignature()||!reviewedBirth.candidates.some(c=>c.iso===$('birth-choice').value))return;
  reviewedBirth.confirmed=true;$('birth-review').close();
  if(pendingCalculation){pendingCalculation=false;startCalculation();}else setStatus('Birth details confirmed. You can calculate your transits.');
});
function closeSuggestions(){
  $('place-suggestions').hidden=true;$('place-query').setAttribute('aria-expanded','false');
  $('place-query').removeAttribute('aria-activedescendant');activePlace=-1;
}
function cancelPlaceSearch(){clearTimeout(placeTimer);searchSequence++;placeRequest?.abort();closeSuggestions();}
function choosePlace(index){
  const place=placeResults[index];if(!place)return;
  cancelPlaceSearch();invalidateBirth();$('place-query').value=place.label;
  $('place-name').value=place.label;$('latitude').value=place.latitude;$('longitude').value=place.longitude;$('birth-timezone').value=place.timezone;
  $('place-status').textContent='Birthplace selected. You can now calculate your transits.';
}
function highlightPlace(index){
  activePlace=index;
  [...$('place-suggestions').children].forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));
  if(index>=0){const option=$('place-suggestions').children[index];$('place-query').setAttribute('aria-activedescendant',option.id);option.scrollIntoView({block:'nearest'});}
}
async function searchPlaces(){
  placeRequest?.abort();const sequence=++searchSequence,query=$('place-query').value.trim();
  closeSuggestions();
  if(query.length<3){$('place-status').textContent='Type at least three characters for birthplace suggestions.';return;}
  placeRequest=new AbortController();const controller=placeRequest;
  const timeout=setTimeout(()=>controller.abort(),12000);
  $('place-status').textContent='Finding birthplace suggestions…';$('place-query').setAttribute('aria-busy','true');
  try{
    const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:query,count:'10',language:'en',format:'json'});
    const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error('City search is unavailable. Please retry in a moment.');
    const places=OracleBirth.placesFromResponse(await response.json());if(sequence!==searchSequence)return;
    placeResults=places;const list=$('place-suggestions');list.replaceChildren();
    places.forEach((place,i)=>{
      const option=document.createElement('li');option.id=`place-option-${i}`;option.setAttribute('role','option');option.setAttribute('aria-selected','false');
      option.textContent=`${place.label} · ${place.timezone}`;
      option.addEventListener('mousedown',event=>event.preventDefault());
      option.addEventListener('click',()=>choosePlace(i));list.append(option);
    });
    if(document.activeElement===$('place-query')){list.hidden=places.length===0;$('place-query').setAttribute('aria-expanded',String(places.length>0));}
    $('place-status').textContent=places.length?`${places.length} suggestions. Use the arrow keys and Enter, or select a birthplace.`:'No places found. Try the city name followed by a comma and its state or country.';
  }catch(error){if(sequence===searchSequence)$('place-status').textContent=error.name==='AbortError'?'Search timed out. Please try again.':error.message;}
  finally{clearTimeout(timeout);if(sequence===searchSequence)$('place-query').setAttribute('aria-busy','false');}
}
function schedulePlaceSearch(event){
  cancelPlaceSearch();$('place-query').setAttribute('aria-busy','false');
  // Editing a selected name must not leave previously confirmed birthplace data active.
  invalidateBirth();$('place-name').value='';$('latitude').value='';$('longitude').value='';$('birth-timezone').value='';
  $('place-status').textContent='';
  if(event?.isComposing||$('place-query').value.trim().length<3)return;
  placeTimer=setTimeout(searchPlaces,350);
}
$('place-query').addEventListener('input',schedulePlaceSearch);
$('place-query').addEventListener('compositionend',schedulePlaceSearch);
$('place-query').addEventListener('keydown',event=>{
  if(event.isComposing)return;
  const open=!$('place-suggestions').hidden;
  if(event.key==='Escape'){event.preventDefault();cancelPlaceSearch();$('place-query').setAttribute('aria-busy','false');}
  else if(open&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();highlightPlace(event.key==='ArrowDown'?(activePlace+1)%placeResults.length:(activePlace<0?placeResults.length-1:(activePlace-1+placeResults.length)%placeResults.length));}
  else if(event.key==='Enter'){event.preventDefault();if(open&&activePlace>=0)choosePlace(activePlace);else{clearTimeout(placeTimer);searchPlaces();}}
  else if(event.key==='Tab')cancelPlaceSearch();
});
$('place-query').addEventListener('blur',()=>{cancelPlaceSearch();$('place-query').setAttribute('aria-busy','false');});
$('search-place').addEventListener('click',()=>{clearTimeout(placeTimer);$('place-query').focus();searchPlaces();});
$('calculate-form').addEventListener('invalid',event=>{
  const label=event.target.labels?.[0]?.textContent.trim()||'a required field';
  setStatus(`Check ${label}: ${event.target.validationMessage||'complete this field before calculating.'}`);
},true);
$('calculate-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!reviewedBirth||reviewedBirth.signature!==birthSignature()||!reviewedBirth.confirmed){pendingCalculation=true;reviewBirth();return;}
  startCalculation();
});
function startCalculation(){
  reset();
  const birth=$('birth-choice').value,month=$('month').value,timezone=$('timezone').value.trim();
  if(!reviewedBirth.candidates.some(c=>c.iso===birth)){setStatus('Choose which occurrence of the repeated birth time applies before continuing.');return;}
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<'1900-01'||month>'2100-12'){setStatus('Choose a transit month between 1900 and 2100.');return;}
  let format;try{format=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'long',timeZone:timezone});}catch{setStatus('Enter a valid timezone, such as America/New_York.');return;}
  $('calculate').disabled=true;$('calculate').textContent='Calculating…';setStatus('Calculating natal placements and scanning your month. Progress will appear here.');
  worker=new Worker('transits-worker.js');
  worker.onerror=()=>{reset();setStatus('The calculation engine could not load. Check the site files and try again.');};
  worker.onmessage=({data})=>{
    if(data.error){reset();setStatus('Calculation failed: '+data.error);return;}
    if(data.natal&&!data.hits){
      $('natal-placements').replaceChildren();
      for(const [body,longitude] of Object.entries(data.natal)){const p=document.createElement('p');p.textContent=`${body} · ${position(longitude)}`;$('natal-placements').append(p);}
      $('natal-preview').hidden=false;return;
    }
    if(data.progress!==undefined){$('calculate').textContent=`Calculating… ${data.progress}%`;setStatus('Scanning planetary transits… '+data.progress+'%');return;}
    exportEvents=data.hits.map(h=>({id:`calc-v1-${birth.replace(/[^0-9A-Za-z]/g,'')}-${h.moving}-${h.target}-${h.aspect}-${Math.round(h.at/1000)}`,at:h.at,title:`${h.moving} ${h.aspect} natal ${h.target}`,description:`Transiting ${h.moving}: ${position(h.longitude)}. Natal ${h.target}: ${position(h.natalLongitude)}.\nCalculated tropical geocentric aspect; numerical crossing estimate, not an AI fortune. Exact instant (UTC): ${new Date(h.at).toISOString()}.`}));
    render(exportEvents.map(e=>({...e,when:format.format(new Date(e.at))})),`${exportEvents.length} calculated crossings in ${month} (UTC boundaries), displayed in ${timezone}. Events near month edges may display on a neighboring local date. These are transit candidates, not ranked daily oracle entries.`);
    $('download').hidden=exportEvents.length===0;$('calculate').disabled=false;$('calculate').textContent='Calculate my transits ↗';worker.terminate();worker=null;setStatus('Calculation complete.');
  };
  worker.postMessage({birth,month});
}
$('import').addEventListener('change',async()=>{
  const file=$('import').files[0];if(!file)return;reset();
  try{if(file.size>5*1024*1024)throw Error('Choose a calendar smaller than 5 MB.');
    const text=await file.text();
    const events=OracleCore.parseICS(text);
    if(events.some(e=>(e.SUMMARY||'').startsWith('Tr. '))){
      const report=OracleCore.parseAstroSeek(text);
      render(report.transits.map(t=>({title:`${t.movingBody} ${t.aspect} natal ${t.targetBody}`,start:t.exactAt,when:t.exactAt,description:`Source position: ${t.movingDegree.toFixed(4)}° ${t.movingSign}. Transiting house: ${t.movingHouse??'not supplied'}.\nStill needed: ${t.missingFacts.join(', ').replaceAll('_',' ')}.\n\nOriginal description:\n${t.source.DESCRIPTION}`})),`${report.transits.length} structured transit records from ${report.sourceEventCount} source events. ${report.issues.length} import issue(s). Source facts are preserved; natal facts and astronomical verification remain pending.`);
      setStatus(report.issues.length?`Import issues: ${report.issues.map(i=>`${i.uid||'event '+i.event}: ${i.code}`).join('; ')}`:'Raw Astro-Seek import complete. No natal placements were inferred.');
      return;
    }
    render(events.map(e=>({title:e.SUMMARY||'Untitled event',start:e.DTSTART,when:e.DTSTART||'No date supplied',description:e.DESCRIPTION||''})),`${events.length} imported events from ${file.name}. Original dates and descriptions are shown as supplied; source facts and timezone labels have not been verified.`);setStatus('Calendar imported locally.');
  }catch(error){setStatus(error.message);}
});
$('download').addEventListener('click',()=>{const blob=new Blob([OracleCore.exportICS(exportEvents)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='astro-oracle-transits.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
