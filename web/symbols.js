/* Presentation only: source text and astronomical values are never rewritten. */
(function(root){
  const definitions=[
    ['Sun','☉','planet'],['Moon','☽','planet'],['Mercury','☿','planet'],['Venus','♀','planet'],['Mars','♂','planet'],
    ['Jupiter','♃','planet'],['Saturn','♄','planet'],['Uranus','♅','planet'],['Neptune','♆','planet'],['Pluto','♇','planet'],
    ['Aries','♈','fire'],['Taurus','♉','earth'],['Gemini','♊','air'],['Cancer','♋','water'],
    ['Leo','♌','fire'],['Virgo','♍','earth'],['Libra','♎','air'],['Scorpio','♏','water'],
    ['Sagittarius','♐','fire'],['Capricorn','♑','earth'],['Aquarius','♒','air'],['Pisces','♓','water'],
    ['conjunction','☌','aspect'],['sextile','⚹','harmonious'],['square','□','challenging'],['trine','△','harmonious'],['opposition','☍','challenging'],
    ['Ascendant','ASC','angle'],['Descendant','DSC','angle'],['MC','MC','angle'],['IC','IC','angle'],
    ['North Node','☊','angle'],['South Node','☋','angle'],['Chiron','⚷','planet']
  ];
  const lookup=new Map();
  for(const [name,glyph,kind] of definitions){const d={name,glyph,kind};lookup.set(name.toLowerCase(),d);if(glyph.length===1)lookup.set(glyph,d);}
  lookup.set('asc',lookup.get('ascendant'));lookup.set('dsc',lookup.get('descendant'));
  const words=[...lookup.keys()].filter(k=>k.length>1).sort((a,b)=>b.length-a.length);
  const chars=[...lookup.keys()].filter(k=>k.length===1).join('');
  function tokens(text){
    const pattern=new RegExp(`\\b(?:${words.join('|')})\\b|[${chars}]`,'giu');
    const result=[];let cursor=0;
    for(const match of String(text).matchAll(pattern)){
      if(match.index>cursor)result.push({text:text.slice(cursor,match.index)});
      result.push({text:match[0],...lookup.get(match[0].toLowerCase())});cursor=match.index+match[0].length;
    }
    if(cursor<text.length)result.push({text:text.slice(cursor)});return result;
  }
  function write(element,text){
    element.textContent='';
    for(const token of tokens(String(text))){
      const span=document.createElement('span');
      if(token.name){
        span.className=`astro-term astro-${token.kind}`;span.title=token.name;
        const standalone=token.text===token.glyph;
        if(standalone||token.text.toUpperCase()===token.glyph){span.textContent=token.text;span.setAttribute('aria-label',token.name);}
        else{
          const glyph=document.createElement('span');glyph.className='astro-symbol';glyph.textContent=token.glyph;glyph.setAttribute('aria-hidden','true');
          const name=document.createElement('span');name.textContent=token.text;span.append(glyph,name);
        }
      }else span.textContent=token.text;
      element.append(span);
    }
  }
  root.OracleSymbols={tokens,write};
  if(typeof module!=='undefined')module.exports=root.OracleSymbols;
})(globalThis);
