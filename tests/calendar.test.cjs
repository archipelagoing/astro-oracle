const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../web/core.js');
const calendar=require('../web/calendar.js');
const events=core.parseICS(fs.readFileSync('november_2026_oracle_final_revised.ics','utf8'));
const items=events.map(e=>({title:e.SUMMARY,start:e.DTSTART,description:e.DESCRIPTION}));
const grouped=calendar.group(items,'America/New_York');
assert.equal(grouped.days.size,30);assert.equal(grouped.undated.length,0);
assert.equal(grouped.first,'2026-10-26');assert.equal(grouped.last,'2026-11-30');
for(const entries of grouped.days.values()){
  assert.equal(entries.length,1);const e=entries[0];
  assert.ok(e.fortune&&e.meaning&&e.rank&&e.glyph);
  assert.ok(e.details.startsWith('C. HOUSES ACTIVATED'));
}
assert.equal(calendar.dayKey({start:'20261101'},'Pacific/Honolulu'),'2026-11-01');
assert.equal(calendar.dayKey({start:'20261101T003000Z'},'America/New_York'),'2026-10-31');
assert.equal(calendar.dayKey({start:'20261101T003000'},'UTC'),null);
assert.equal(calendar.dayKey({start:'20260230'},'UTC'),null);
assert.equal(calendar.addDays('2024-02-28',1),'2024-02-29');
const raw=calendar.content({title:'Moon square natal Sun',description:'Source facts only.'});
assert.equal(raw.fortune,'');assert.equal(raw.rank,null);assert.equal(raw.glyph,'☽ □ ☉');
assert.equal(calendar.group([{title:'No date'}],'UTC').undated.length,1);
console.log('Passed: all 30 oracle fortunes/meanings/ranks parsed, weekly boundaries, all-day preservation, timezone conversion, invalid-date handling, and unranked candidate labels.');
