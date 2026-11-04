// Exercise application event wiring and actual card rendering in a minimal DOM.
// This supplements worker tests; it is not a real-browser compatibility test.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
let document;
class Element{
  constructor(tag='div'){this.tag=tag;this.children=[];this.handlers={};this.hidden=false;this.disabled=false;this.open=false;this._value='';this.attributes={};this.classList={add(){},remove(){}};}
  get value(){return this._value;}
  set value(v){this._value=String(v);}
  append(...nodes){const empty=!this.children.length;this.children.push(...nodes);if(this.tag==='select'&&empty&&nodes.length)this.value=nodes[0].value;}
  replaceChildren(...nodes){this.children=[];if(this.tag==='select')this.value='';this.append(...nodes);}
  addEventListener(type,handler){(this.handlers[type]??=[]).push(handler);}
  fire(type,event={}){for(const handler of this.handlers[type]||[])handler({preventDefault(){},...event});}
  setAttribute(k,v){this.attributes[k]=v;}
  removeAttribute(k){delete this.attributes[k];}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
}
const html=fs.readFileSync('web/index.html','utf8'),elements=new Map();
for(const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"/g))elements.set(match[2],new Element(match[1]));
document={getElementById:id=>{assert.ok(elements.has(id),`Missing HTML element ${id}`);return elements.get(id);},createElement:tag=>new Element(tag)};
const workers=[];
class Worker{constructor(){workers.push(this);}postMessage(data){this.request=data;}terminate(){this.terminated=true;}}
const context=vm.createContext({document,Worker,Date,Intl,Math,console,TextEncoder,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,matchMedia:()=>({matches:true})});
for(const file of ['core.js','birth.js','calendar.js','app.js'])vm.runInContext(fs.readFileSync('web/'+file,'utf8'),context,{filename:file});
const $=id=>elements.get(id);
for(const [id,value] of Object.entries({'birth-date':'1990-06-15','birth-time':'14:30','place-name':'Berlin, Germany',latitude:'52.52',longitude:'13.41','birth-timezone':'Europe/Berlin',month:'2026-11',timezone:'UTC'}))$(id).value=value;
$('calculate-form').fire('submit');
assert.equal($('birth-review').open,true,'Calculate must surface confirmation directly');
assert.equal(workers.length,0,'No calculation before explicit confirmation');
assert.equal($('confirm-birth').textContent,'Confirm & calculate');
$('confirm-birth').fire('click');
assert.equal($('birth-review').open,false);
assert.equal(workers.length,1,'Confirmation must actually start the worker');
assert.equal(workers[0].request.birth,'1990-06-15T12:30:00.000Z');
workers[0].onmessage({data:{hits:[{moving:'Moon',target:'Sun',aspect:'square',at:Date.parse('2026-11-04T12:00:00Z'),longitude:90,natalLongitude:0}]}});
assert.equal($('results').hidden,false,'Results must become visible');
const walk=node=>[node,...node.children.flatMap(walk)];
const card=walk($('entries')).find(e=>e.className==='oracle-card');
assert.ok(card,'Calculated results must render a daily card');
const [front,back]=card.children;
assert.equal(back.hidden,true);
front.fire('click');assert.equal(front.hidden,true);assert.equal(back.hidden,false);
back.fire('keydown',{key:'Escape'});assert.equal(front.hidden,false);assert.equal(back.hidden,true);
$('birth-time').value='14:31';$('birth-time').fire('input');$('calculate-form').fire('submit');
assert.equal($('birth-review').open,true,'Edited data must require fresh confirmation');
assert.equal(workers.length,1);
$('cancel-birth').fire('click');assert.equal($('birth-review').open,false);
console.log('Passed application flow: Calculate → confirmation → worker → visible weekly card → flip/back; edits require reconfirmation and cancel starts no worker.');
