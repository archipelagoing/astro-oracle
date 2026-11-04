/* Local birth-time resolution. No network or persistence in this module. */
(function(root){
  function formatter(timezone){
    if(!timezone)throw Error('Enter a birth timezone, such as America/New_York.');
    try{return new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}
    catch{throw Error('The birth timezone is not recognized by this browser.');}
  }
  function partsAt(format,instant){
    const p=Object.fromEntries(format.formatToParts(new Date(instant)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
    return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
  }
  function wallTimestamp(date,time){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}(:\d{2})?$/.test(time))throw Error('Enter a complete birth date and local time.');
    const full=`${date}T${time.length===5?time+':00':time}Z`;
    if(!root.OracleCore.validBirth(full))throw Error('Enter a valid birth date and time between 1900 and 2100.');
    return Date.parse(full);
  }
  function offsetLabel(seconds){
    const a=Math.abs(seconds),h=Math.floor(a/3600),m=Math.floor(a%3600/60),s=a%60;
    return `UTC${seconds<0?'-':'+'}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}${s?':'+String(s).padStart(2,'0'):''}`;
  }
  function resolveLocal(date,time,timezone){
    const wall=wallTimestamp(date,time),format=formatter(timezone),offsets=new Set();
    // Sample both sides of nearby clock changes, including 24-hour date-line jumps.
    for(let hours=-48;hours<=48;hours+=3){const instant=wall+hours*3600000;offsets.add(partsAt(format,instant)-instant);}
    const candidates=[];
    for(const offset of offsets){const instant=wall-offset;if(partsAt(format,instant)===wall)candidates.push({iso:new Date(instant).toISOString(),offsetSeconds:offset/1000,label:offsetLabel(offset/1000)});}
    return candidates.sort((a,b)=>a.iso.localeCompare(b.iso));
  }
  function coordinates(latitude,longitude){
    if(String(latitude).trim()===''||String(longitude).trim()==='')throw Error('Confirm both birthplace coordinates.');
    const lat=Number(latitude),lon=Number(longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180)throw Error('Latitude must be between −90 and 90; longitude between −180 and 180.');
    return {latitude:lat,longitude:lon};
  }
  function placesFromResponse(data){
    if(!data||data.error||('results' in data&&!Array.isArray(data.results)))throw Error('The city service returned an invalid response. Enter the place manually.');
    return (data.results||[]).flatMap(place=>{
      try{const point=coordinates(place.latitude,place.longitude);formatter(place.timezone);
        if(typeof place.name!=='string'||!place.name.trim())return [];
        return [{...point,timezone:place.timezone,label:[place.name,place.admin1,place.country].filter(Boolean).join(', ')}];
      }catch{return [];}
    });
  }
  root.OracleBirth={resolveLocal,coordinates,placesFromResponse};
  if(typeof module!=='undefined')module.exports=root.OracleBirth;
})(globalThis);
