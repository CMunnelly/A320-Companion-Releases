const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../ipad/index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
for(const script of scripts)new vm.Script(script[1]);
const code=html.match(/<script id="techlogIntegration">([\s\S]*?)<\/script>/)[1];
function setup(href,saved){
 const elements={},storage=new Map(saved?[['a320-techlog-url',saved]]:[]);
 for(const id of ['techlogFrame','techlogAddress','techlogOpen','techlogStatus','techlogConnect','techlogReload','techlogDefault']){
  elements[id]={value:'',events:{},addEventListener(name,fn){this.events[name]=fn;}};
 }
 const button={addEventListener(name,fn){this.click=fn;}};
 const context={URL,location:{href},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:id=>elements[id],querySelectorAll:()=>[button]}};
 vm.runInNewContext(code,context);
 return {elements,storage,button};
}
let s=setup('http://100.98.16.71:8080/ipad?anything=1');
assert.equal(s.elements.techlogOpen.href,'http://100.98.16.71:7733/#log');
assert.equal(s.elements.techlogFrame.src,undefined); // Do not load an unused embedded app.
s.button.click();assert.equal(s.elements.techlogFrame.src,'http://100.98.16.71:7733/#log');
s.elements.techlogFrame.src='keep-live-state';s.button.click();assert.equal(s.elements.techlogFrame.src,'keep-live-state');
s.elements.techlogAddress.value='http://192.168.1.20:7733/#log';s.elements.techlogConnect.onclick();
assert.equal(s.storage.get('a320-techlog-url'),'http://192.168.1.20:7733/#log');
assert.equal(s.elements.techlogOpen.href,s.elements.techlogFrame.src);
for(const unsafe of ['javascript:alert(1)','file:///etc/passwd','http://name:password@example.com']){
 s.elements.techlogAddress.value=unsafe;s.elements.techlogConnect.onclick();
 assert.equal(s.elements.techlogFrame.src,'http://192.168.1.20:7733/#log');
 assert.match(s.elements.techlogStatus.textContent,/http/);
}
s.elements.techlogDefault.onclick();assert.equal(s.elements.techlogFrame.src,'http://100.98.16.71:7733/#log');
assert.equal(setup('http://localhost:8080/ipad').elements.techlogOpen.href,'http://localhost:7733/#log');
assert.equal(setup('http://192.168.1.212:8080/ipad','javascript:alert(1)').elements.techlogOpen.href,'http://192.168.1.212:7733/#log');
assert.match(html,/data-page="techlogPage"/);assert.match(html,/id="techlogFrame" title="Fenix TechLog tablet interface"/);
console.log('TechLog checks passed: script syntax, lazy loading, retained frame state, address settings, safe URLs and Tailscale/LAN/PC defaults.');

