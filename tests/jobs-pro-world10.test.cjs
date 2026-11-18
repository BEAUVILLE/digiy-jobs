const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const files=['acces-recruteur-v2.html','gestion-jobs-v2.html'];
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=(s)=>[...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(x=>x.trim());
const langs=['fr','en','es','pt','it','de','nl','ar','wo','zh'];
test('both real recruiter screens expose exactly the same ten choices and valid JavaScript',()=>{
 for(const file of files){
  const html=read(file);
  assert.deepEqual([...html.matchAll(/<button data-lang="([a-z]{2})">/g)].map(x=>x[1]),langs,file);
  assert.ok(html.includes('data-i18n='),file);
  assert.ok(html.includes('Object.assign('),file);
  for(const script of scripts(html))assert.doesNotThrow(()=>new vm.Script(script,{filename:file}),file);
 }
});
test('auth security stays bound to user ID and private workspace, not to the chosen language',()=>{
 const html=read('gestion-jobs-v2.html');
 for(const required of [
  'window.DIGIY_OWNER_PHONE_MFA.guard',
  '.eq("auth_user_id",user.id)',
  '.eq("workspace_slug",workspaceSlug)',
  'sb.auth.getUser()',
  'sb.from("digiy_jobs_candidates_pro")',
  'sb.from("digiy_jobs_offers_pro")',
  'const JOBS_PRO_OPS=',
  'data-i18n="statusRejected"',
  'data-i18n-placeholder="noteInternal"'
 ])assert.ok(html.includes(required),required);
 assert.ok(!html.includes('?\"Fermer\":\"Réactiver\"'));
 assert.ok(!html.includes('msg("Intitulé et secteur requis.");'));
});
function makeOwnerView(language){
 const values=new Map();
 function node(id){if(!values.has(id))values.set(id,{
   id,hidden:true,value:'',textContent:'',innerHTML:'',href:'',placeholder:'',
   className:'',dataset:{},classList:{toggle(){}},
   querySelectorAll(){return[]},getAttribute(){return null}
 });return values.get(id)}
 const buttons=langs.map(lang=>({dataset:{lang},classList:{toggle(){}},onclick:null}));
 const labels=['manage','newOffer','candidates','lock','logout'].map(key=>({dataset:{i18n:key},textContent:''}));
 const placeholders=['sectorPlaceholder','contractPlaceholder'].map(key=>({dataset:{i18nPlaceholder:key},placeholder:''}));
 const elements={getElementById:node,documentElement:{lang:'fr',dir:'ltr'},
  querySelectorAll(sel){if(sel==='[data-lang]')return buttons;if(sel==='[data-i18n]')return labels;
   if(sel==='[data-i18n-placeholder]')return placeholders;return[]} };
 const calls=[];
 const offers=[{id:'job001',title:'Test job',city:'Saly',status:'active',contract_type:'CDD',description:'',requirements:'',pay:''}];
 const candidates=[{id:'candidate001',full_name:'Example candidate',city:'Saly',status:'new',note:'',phone:'',trade:'Tailor'}];
 function query(table){
   const q={
    select(){return q},eq(...args){calls.push([table,...args]);return q},order(){return q},limit(){return q},
    maybeSingle:async()=>({data:{workspace_slug:'pilot',display_name:'Pilot workspace',is_active:true},error:null}),
    then(onFulfilled,onRejected){const rows=table==='digiy_jobs_offers_pro'?offers:table==='digiy_jobs_candidates_pro'?candidates:[];return Promise.resolve({data:rows,error:null}).then(onFulfilled,onRejected)}
   };
   return q
 }
 const supa={auth:{getUser:async()=>({data:{user:{id:'user123',email:'owner@demo.invalid'}},error:null}),
    signOut:async()=>({error:null})},from:query};
 const localStorage={getItem(){return null},setItem(){}};
 const u='https://jobs.digiylyfe.com/gestion-jobs-v2.html?workspace=pilot&lang='+language;
 const ctx={document:elements,window:{supabase:{createClient:()=>supa},
   DIGIY_OWNER_PHONE_MFA:{guard:async()=>true}},URL,
   location:{href:u,origin:'https://jobs.digiylyfe.com'},
   history:{replaceState(){}},localStorage,console};
 vm.runInNewContext(scripts(read('gestion-jobs-v2.html')).at(-1),ctx,{timeout:2000});
 return{node,buttons,labels,placeholders,elements,calls,
  flush:async()=>{for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve))}};
}
test('Wolof recruiter sees translated controls behind the actual offer and candidate cards',async()=>{
 const p=makeOwnerView('wo');await p.flush();
 assert.equal(p.elements.documentElement.lang,'wo');
 assert.match(p.labels[0].textContent,/rekrutër/);
 assert.match(p.node('offersList').innerHTML,/data-i18n="saveAction"/);
 assert.match(p.node('offersList').innerHTML,/Denc/);
 assert.match(p.node('offersList').innerHTML,/Tëj/);
 assert.match(p.node('candidatesList').innerHTML,/data-i18n="statusNew"/);
 assert.match(p.node('candidatesList').innerHTML,/data-i18n-placeholder="noteInternal"/);
 assert.match(p.node('candidatesList').innerHTML,/data-csave/);
 assert.ok(p.calls.some(x=>x[0]==='digiy_jobs_owner_workspaces'&&x[1]==='auth_user_id'&&x[2]==='user123'));
 assert.ok(p.calls.some(x=>x[0]==='digiy_jobs_candidates_pro'&&x[1]==='workspace_slug'&&x[2]==='pilot'));
});
test('Chinese recruiter can switch to Arabic and back, without changing workspace queries',async()=>{
 const p=makeOwnerView('zh');await p.flush();
 assert.equal(p.elements.documentElement.lang,'zh');
 assert.match(p.labels[0].textContent,/[\u4e00-\u9fff]/);
 assert.match(p.node('offersList').innerHTML,/保存/);
 assert.match(p.node('candidatesList').innerHTML,/新收到/);
 p.buttons.find(b=>b.dataset.lang==='ar').onclick();
 assert.equal(p.elements.documentElement.dir,'rtl');
 assert.equal(p.elements.documentElement.lang,'ar');
 assert.match(p.placeholders[0].placeholder,/[\u0600-\u06ff]/);
 p.buttons.find(b=>b.dataset.lang==='wo').onclick();
 assert.equal(p.elements.documentElement.dir,'ltr');
 assert.equal(p.elements.documentElement.lang,'wo');
 assert.match(p.labels[1].textContent,/Liggéey/);
});
