'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const access=fs.readFileSync(path.join(__dirname,'..','acces-recruteur-v2.html'),'utf8');
const management=fs.readFileSync(path.join(__dirname,'..','gestion-jobs-v2.html'),'utf8');
const accessJs=access.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
const manageJs=management.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(accessJs && manageJs);
const pilot='pilote-jobs-baptiste-digiy';
function page(){
 const nodes=new Map();
 const $=id=>{if(!nodes.has(id))nodes.set(id,{
  id,hidden:true,disabled:false,href:'',textContent:'',className:'',value:'',innerHTML:'',
  classList:{toggle(){},add(){}},addEventListener(){},querySelector(){return $(id+'-child')},
  querySelectorAll(){return []},checked:false
 });return nodes.get(id)};
 return {$,document:{
  documentElement:{lang:'fr',dir:'ltr'},getElementById:$,
  querySelectorAll:()=>[],querySelector:()=>$('i18n')
 }};
}
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve))};
async function login({workspace=pilot,valid=true}={}){
 const d=page(),sent=[],cache={};
 const params=workspace?'?workspace='+workspace+'&lang=fr':'?lang=fr';
 const location={href:'https://jobs.digiylyfe.com/acces-recruteur-v2.html'+params,origin:'https://jobs.digiylyfe.com'};
 const sb={auth:{signInWithOtp:async args=>{sent.push(args);return {error:valid?null:{message:'Not allowed'}}}}};
 vm.runInNewContext(accessJs,{window:{supabase:{createClient:()=>sb}},document:d.document,URL,location,
  localStorage:{getItem:()=>null,setItem:(k,v)=>cache[k]=v}},{timeout:1000});
 d.$('email').value='owner@example.test';await d.$('send').onclick();
 return {d,sent,cache};
}
async function manager({authenticated=true,hasWorkspace=true,workspace='',wrongOwner=false,guardAllows=true}={}){
 const d=page(),reads=[],writes=[],historyWrites=[],cache={};
 const location={href:'https://jobs.digiylyfe.com/gestion-jobs-v2.html'+(workspace?'?workspace='+workspace:''),
  origin:'https://jobs.digiylyfe.com'};
 const user=authenticated?{id:'real-owner-fixture',email:'owner@example.test'}:null;
 const sb={
  auth:{getUser:async()=>({data:{user},error:null}),signOut:async()=>({error:null})},
  from(table){
   reads.push(table);
   const filters={};
   const q={select(){return q},eq(k,v){filters[k]=v;return q},
    limit:async()=>({data:hasWorkspace && !wrongOwner ? [{workspace_slug:pilot}]:[],error:null}),
    maybeSingle:async()=>({data:hasWorkspace && !wrongOwner && filters.auth_user_id==='real-owner-fixture'
      && filters.workspace_slug===pilot ? {workspace_slug:pilot,display_name:'Atelier pilote',is_active:true}:null,error:null}),
    order:async()=>({data:[],error:null}),
    update(){writes.push('update');return q},insert(){writes.push('insert');return q}
   };
   return q;
  }
 };
 const ctx={window:{supabase:{createClient:()=>sb},DIGIY_OWNER_PHONE_MFA:{guard:async()=>guardAllows}},
  document:d.document,location,URL,console,history:{replaceState:(_a,_b,x)=>historyWrites.push(x)},
  localStorage:{getItem:()=>null,setItem:(k,v)=>cache[k]=v},setTimeout};
 vm.runInNewContext(manageJs,ctx,{timeout:1000});
 await flush();
 return {d,reads,writes,historyWrites,cache};
}
test('JOBS pilot: link sends email magic link to existing owner only',async()=>{
 const r=await login();
 assert.equal(r.sent.length,1);
 assert.equal(r.sent[0].options.shouldCreateUser,false);
 assert.match(r.sent[0].options.emailRedirectTo,/workspace=pilote-jobs-baptiste-digiy/);
 assert.equal(r.cache.digiy_jobs_owner_workspace,pilot);
 assert.match(r.d.$('openManagement').href,/gestion-jobs-v2\.html/);
});
test('JOBS future member: generic entry requests email without workspace argument',async()=>{
 const r=await login({workspace:''});
 assert.equal(r.sent.length,1);
 assert.equal(r.sent[0].options.shouldCreateUser,false);
 assert.match(r.sent[0].options.emailRedirectTo,/gestion-jobs-v2\.html/);
 assert.doesNotMatch(r.sent[0].options.emailRedirectTo,/workspace=/);
});
test('JOBS returns from email: discovers only authenticated owner workspace',async()=>{
 const r=await manager();
 assert.equal(r.d.$('workspaceCard').hidden,false);
 assert.equal(r.d.$('candidatesCard').hidden,false);
 assert.equal(r.d.$('workspaceName').textContent,'Atelier pilote');
 assert.equal(r.historyWrites.length,1);
 assert.match(r.historyWrites[0],/workspace=pilote-jobs-baptiste-digiy/);
 assert.deepEqual(r.writes,[]);
});
test('JOBS unprovisioned user: clear next-step message and no candidate reads',async()=>{
 const r=await manager({hasWorkspace:false});
 assert.equal(r.d.$('workspaceCard').hidden,true);
 assert.match(r.d.$('msg').textContent,/pas encore activé/);
 assert.ok(!r.reads.includes('digiy_jobs_candidates_pro'));
 assert.deepEqual(r.writes,[]);
});
test('JOBS no email session: no workspace or candidate reads',async()=>{
 const r=await manager({authenticated:false});
 assert.deepEqual(r.reads,[]);
 assert.equal(r.d.$('workspaceCard').hidden,true);
});
test('JOBS wrong explicit workspace denied even for logged-in owner',async()=>{
 const r=await manager({workspace:'another-tenant'});
 assert.equal(r.d.$('workspaceCard').hidden,true);
 assert.ok(!r.reads.includes('digiy_jobs_candidates_pro'));
});
