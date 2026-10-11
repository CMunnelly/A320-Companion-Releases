const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../ipad/index.html'),'utf8');
const code=html.slice(html.indexOf('async function skyOwnRoute()'),html.indexOf('async function skyRoute(r)'));
async function run(data,stale=false){
 let displayed=null,status='',calls=[];
 const state={seq:0};
 const ctx={SKY_ROUTE:state,SKY:{data:{own:{lat:52,lng:3}}},
  skyRouteClear:()=>state.seq++,skySetFollow:()=>{},set:(_,value)=>status=value,
  skyPosition:(lat,lng)=>Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null,
  fetch:async url=>{calls.push(url);if(stale)state.seq++;return {ok:true,json:async()=>data};},
  skyRoute:async record=>displayed=record};
 vm.createContext(ctx);vm.runInContext(code,ctx);await ctx.skyOwnRoute();
 return {displayed,status,calls};
}
(async()=>{
 const good={connected:true,route_match:true,origin:'EGGW',destination:'EHAM',route_weather:[{lat:52,lon:2},{lat:NaN,lon:5}]};
 let r=await run(good);
 assert.equal(r.displayed.source,'OWN');assert.equal(r.displayed.simbrief_points.length,1);
 assert.deepEqual(r.calls,['/api/simbrief']);
 for(const data of [{...good,route_match:false},{...good,route_match:undefined},{...good,connected:false},{...good,origin:''}]){
  r=await run(data);assert.equal(r.displayed,null);assert.match(r.status,/unavailable|match/);
 }
 assert.equal((await run(good,true)).displayed,null);
 assert.equal((await run({...good,route_weather:[]})).displayed.simbrief_points.length,0);
 console.log('SimBrief map tests passed: own-plan identity, coordinate filtering, mismatch/unavailable rejection and stale selection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
