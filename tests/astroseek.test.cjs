const assert=require('node:assert/strict');
const fs=require('node:fs');
const {parseICS,parseAstroSeek}=require('../web/core.js');
const samplePath='astroseek_personal_transit_calendar_aspects_2026_November (2).ics';
const hasPrivateSample=fs.existsSync(samplePath);
const synthetic='BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:Tr. Moon trine IC\r\nDESCRIPTION:Transit Moon (Leo 2°04’) - trine - Natal IC \\nTransit Moon in Natal 12th house:\r\nDTSTART:20261101T075100Z\r\nUID:synthetic-moon\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
const text=hasPrivateSample?fs.readFileSync(samplePath,'utf8'):synthetic;
const result=parseAstroSeek(text);
assert.equal(result.sourceEventCount,hasPrivateSample?146:1);
assert.equal(result.transits.length,hasPrivateSample?146:1);
assert.deepEqual(result.issues,[]);
const moon=result.transits[0],neptune=result.transits[2];
assert.equal(moon.exactAt,'2026-11-01T07:51:00Z');
assert.equal(moon.movingLongitude,120+2+4/60);
assert.equal(moon.movingHouse,12);
assert.equal(moon.targetBody,'IC');
if(hasPrivateSample){assert.equal(neptune.movingHouse,8);assert.equal(neptune.movingSign,'Aries');}
for(const t of result.transits){assert.equal(t.natalLongitude,null);assert.equal(t.natalHouse,null);assert.equal(t.verification,'parsed_source_only');}
assert.equal(moon.source.DESCRIPTION,parseICS(text)[0].DESCRIPTION);
const first=text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/)[0];
const wrap=events=>'BEGIN:VCALENDAR\r\n'+events+'\r\nEND:VCALENDAR\r\n';
assert.equal(parseAstroSeek(wrap(first+'\r\n'+first)).transits.length,1);
assert.equal(parseAstroSeek(wrap(first+'\r\n'+first.replace('20261101T075100Z','20261101T085100Z'))).transits.length,0);
assert.equal(parseAstroSeek(wrap(first.replace('20261101T075100Z','20260230T075100Z'))).issues[0].code,'invalid_timestamp');
assert.equal(parseAstroSeek(wrap(first.replace('DTSTART:20261101T075100Z','DTSTART:20261101T075100'))).issues[0].code,'requires_exact_utc_timestamp');
assert.equal(parseAstroSeek(wrap(first.replace('Leo 2°04','Leo 30°04'))).issues[0].code,'invalid_position');
assert.equal(parseAstroSeek(wrap(first.replace('SUMMARY:Tr. Moon trine IC','SUMMARY:Tr. Moon trine MC'))).issues[0].code,'summary_description_conflict');
console.log(`Passed: ${result.transits.length} Astro-Seek records (${hasPrivateSample?'local sample':'synthetic fixture'}), source preservation, missing natal facts, duplicates/conflicts, timestamps, positions, and contradictory summaries.`);
