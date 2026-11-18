const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const ROOT=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(ROOT,name),"utf8");
const HTML=read("index.html"),CARDS=read("jobs-public-cards-world10.js");
const LANGS=["fr","en","es","pt","de","it","nl","ar","wo","zh"];
const match=CARDS.match(/const rows=(\[[\s\S]*?\]);\nconst dictionaries=/);
assert.ok(match,"Static public copy rows must be JSON literal");
const ROWS=JSON.parse(match[1]);
test("all authored card strings have one complete ten-language translation",()=>{
 assert.ok(ROWS.length>=45);
 assert.equal(new Set(ROWS.map(r=>r[0])).size,ROWS.length);
 for(const row of ROWS){assert.equal(row.length,10,row[0]);for(const value of row)assert.ok(value&&value.trim(),row[0]);}
 for(const phrase of ["EMPLACEMENT LIBRE","CARTE COMMERCIALE · RECRUTEUR","Mission publique actuelle.","QR · MISSION","Maçon polyvalent chantier villa","Candidature spontanée"]){
  assert.ok(ROWS.some(x=>x[0]===phrase||x[0].startsWith(phrase)),phrase);
 }
 for(const label of ["mission.html","postuler.html"]){
   assert.ok(HTML.includes(label+"?"),label);
 }
 assert.ok(HTML.includes("jobs-public-cards-world10.js"));
});
test("switching FR → WO → ZH → FR translates card text without changing offer data",()=>{
 let watcher=()=>{};
 const texts=["  EMPLACEMENT LIBRE  ","Maçon polyvalent chantier villa","90 000 à 140 000 FCFA"];
 const nodes=texts.map(nodeValue=>({nodeValue}));
 const card={querySelectorAll:()=>[]};
 const doc={documentElement:{lang:"wo"},querySelectorAll:sel=>sel==="article.listing"?[card]:[],
  createTreeWalker:(root,kind)=>{let i=0;return{nextNode(){return nodes[i++]||null}}}};
 const sandbox={document:doc,NodeFilter:{SHOW_TEXT:4},WeakMap,Map,Object,
  MutationObserver:class{constructor(fn){watcher=fn}observe(){}}};
 vm.runInNewContext(CARDS,sandbox,{timeout:3000});
 assert.equal(nodes[0].nodeValue.trim(),"BÉRÉB BU FÉEX");
 assert.match(nodes[1].nodeValue,/Tabaxkat/);
 assert.equal(nodes[2].nodeValue,"90 000 à 140 000 FCFA");
 doc.documentElement.lang="zh";watcher();
 assert.equal(nodes[0].nodeValue.trim(),"空置展示位");
 assert.match(nodes[1].nodeValue,/泥瓦工/);
 doc.documentElement.lang="fr";watcher();
 assert.deepEqual(nodes.map(n=>n.nodeValue),texts);
});
test("switching the public home to Wolof fixes actual link destinations, ids and recruitment labels",()=>{
 const anchors=[
  {href:"https://jobs.digiylyfe.com/mission.html?id=5e978d75-339a-465f-b984-4e82362f71db&lang=fr"},
  {href:"https://jobs.digiylyfe.com/postuler.html?offer=5e978d75-339a-465f-b984-4e82362f71db&lang=fr"},
  {href:"https://jobs.digiylyfe.com/missions.html"},
  {href:"https://digiylyfe.com/?lang=fr"},
  {href:"https://jobs.digiylyfe.com/acces-recruteur-v2.html"}
 ];
 const buttons=[],contexts=[];
 const doc={documentElement:{lang:"fr",dir:"ltr"},
 querySelectorAll:(sel)=>sel==="a[href]"?anchors:sel==="#langs button"?buttons:[]};
 const start="https://jobs.digiylyfe.com/?lang=wo",loc={href:start,origin:"https://jobs.digiylyfe.com",search:"?lang=wo"};
 const history={replaceState(...args){contexts.push(args[2])}};
 const match=HTML.match(/<script>\s*(const T = [\s\S]*?)<\/script>/);
 assert.ok(match,"real public language script must exist");
 vm.runInNewContext(match[1],{document:doc,location:loc,URL,URLSearchParams,history},{timeout:3000});
 assert.equal(doc.documentElement.lang,"wo");
 assert.equal(doc.documentElement.dir,"ltr");
 for(const a of anchors){
  const u=new URL(a.href);
  assert.equal(u.searchParams.get("lang"),"wo",u.href);
 }
 assert.equal(new URL(anchors[0].href).searchParams.get("id"),"5e978d75-339a-465f-b984-4e82362f71db");
 assert.equal(new URL(anchors[1].href).searchParams.get("offer"),"5e978d75-339a-465f-b984-4e82362f71db");
});
test("secondary public pages preserve WO and ZH without changing user applications or Supabase",()=>{
 const engine=read("jobs-pages-i18n.js"),mission=read("mission.html");
 assert.ok(engine.includes('"wo","zh"'));
 assert.ok(mission.includes('"pt","de","it","nl","ar","wo","zh"'));
 assert.ok(mission.includes("Object.assign(COPY,"));
 const base=read("jobs-pages-i18n-en.js");
 const english=JSON.parse(base.split("=").slice(1).join("=").trim().replace(/;\s*$/,""));
 for(const lang of ["wo","zh"]){
  const src=read("jobs-pages-i18n-"+lang+".js");
  const dictionary=JSON.parse(src.slice(src.indexOf("window.DIGIY_JOBS_TRANSLATIONS=")+"window.DIGIY_JOBS_TRANSLATIONS=".length).trim().replace(/;\s*$/,""));
  const missing=Object.keys(english).filter(k=>!dictionary[k]);
  assert.deepEqual(missing,[],lang);
  assert.ok(dictionary["Envoyer ma candidature"]);
  assert.ok(dictionary["Chargement des missions…"]);
 }
 for(const src of [CARDS,engine,...["wo","zh"].map(l=>read("jobs-pages-i18n-"+l+".js"))]){
  assert.doesNotThrow(()=>new vm.Script(src));
 }
 for(const phrase of ['digiy_jobs_public_apply','digiy_jobs_public_offers','digiy_jobs_owner_workspaces']){
  assert.ok(!CARDS.includes(phrase),"Cards must not touch personal data: "+phrase);
 }
});
