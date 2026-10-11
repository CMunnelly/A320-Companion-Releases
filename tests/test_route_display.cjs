const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../ipad/index.html'), 'utf8');
const source = html.slice(html.indexOf('async function skyRoute(r)'), html.indexOf('function skyOwnCourse'));
async function render(result, stale=false) {
  const label = {};
  const banner = {style:{}, querySelector:()=>label};
  const state = {seq:0,labels:[],restore:null};
  let line, bounds, status;
  const ctx = {
    SKY_ROUTE:state,
    SKY:{markers:new Map(),map:{getCenter:()=>({lat:0,lng:0}),getZoom:()=>5,fitBounds:b=>{bounds=b.points;}}},
    skyRouteClear:()=>{state.seq++;}, skyRouteBanner:()=>banner, skyIcon:()=>({}),
    skyRouteStatus:t=>{status=t;}, skyAirport:async code=>code==='TEST'?{lat:52,lng:3}:{lat:54,lng:5},
    skyPosition:(lat,lng)=>Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null,
    fetch:async()=>{if(stale)state.seq++;return {ok:true,json:async()=>result};},
    encodeURIComponent,
    google:{maps:{LatLngBounds:class {constructor(){this.points=[];}extend(p){this.points.push(p);}},
      Polyline:class {constructor(options){line=options;}}, Marker:class {},SymbolPath:{CIRCLE:'circle'}}}
  };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  await ctx.skyRoute({id:'SKYNET:test',source:'SKYNET',callsign:'TEST',origin:'TEST',destination:'DEST',lat:53,lng:4});
  return {line,bounds,label:label.textContent,status};
}
(async()=>{
  const geometry=[{lat:52,lng:3},{lat:53,lng:4},{lat:54,lng:5}];
  const good={ok:true,quality:'complete',unresolved:[],geometry};
  let rendered=await render(good);
  assert.equal(rendered.line.path.length,3);
  assert.equal(rendered.line.icons.length,0);
  assert.equal(rendered.bounds.length,4); // Route plus own/selected aircraft for auto-zoom.
  assert.match(rendered.label,/resolved filed route/);
  for (const result of [{...good,quality:'partial'},{...good,unresolved:['SID unavailable']},
      {...good,unresolved:undefined},{...good,geometry:[...geometry,{lat:NaN,lng:4}]},{ok:false}]) {
    rendered=await render(result);
    assert.equal(rendered.line.path.length,2);
    assert.equal(rendered.line.icons.length,1);
    assert.match(rendered.label,/approximate route/);
  }
  assert.equal((await render(good,true)).line,undefined); // Late results cannot redraw old aircraft.
  console.log('Route display tests passed: resolved path, 5 fallback cases, auto-zoom and stale selection.');
})().catch(error=>{console.error(error);process.exitCode=1;});
