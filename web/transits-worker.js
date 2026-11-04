importScripts('vendor/astronomy.browser.min.js','core.js');
const {bodies,aspects,norm,signed}=OracleCore;
const longitude=(body,ms)=>Astronomy.Ecliptic(Astronomy.GeoVector(body,new Date(ms),true)).elon;
self.onmessage=({data})=>{
  try {
    const birth=Date.parse(data.birth), start=Date.parse(data.month+'-01T00:00:00Z');
    const endDate=new Date(start);endDate.setUTCMonth(endDate.getUTCMonth()+1);const end=+endDate;
    const natal=Object.fromEntries(bodies.map(b=>[b,longitude(b,birth)]));
    const hits=[],step=3600000;
    for(let bi=0;bi<bodies.length;bi++){
      const moving=bodies[bi];let before=longitude(moving,start);
      for(let t=start;t<end;t+=step){
        const next=Math.min(t+step,end),after=longitude(moving,next);
        for(const target of bodies) for(const [angle,name] of aspects) for(const branch of (angle===0||angle===180?[angle]:[angle,-angle])){
          const desired=norm(natal[target]+branch),f0=signed(before-desired),f1=signed(after-desired);
          // Reject the discontinuity opposite the target; retain genuine crossings.
          if(Math.abs(f1-f0)>180 || (f0!==0 && f0*f1>0)) continue;
          let lo=t,hi=next,fl=f0;
          if(f0===0)hi=lo;
          else while(hi-lo>1000){const mid=(lo+hi)/2,fm=signed(longitude(moving,mid)-desired);if(fl*fm<=0)hi=mid;else{lo=mid;fl=fm;}}
          const at=(lo+hi)/2;if(at>=end)continue;
          if(hits.some(h=>h.moving===moving&&h.target===target&&h.aspect===name&&Math.abs(h.at-at)<2000))continue;
          hits.push({moving,target,aspect:name,angle,at,longitude:longitude(moving,at),natalLongitude:natal[target]});
        }
        before=after;
      }
      self.postMessage({progress:Math.round(100*(bi+1)/bodies.length)});
    }
    hits.sort((a,b)=>a.at-b.at);
    self.postMessage({hits,natal});
  }catch(error){self.postMessage({error:error.message});}
};
