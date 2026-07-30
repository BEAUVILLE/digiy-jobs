/* DIGIY JOBS — moteur des pages métier intérieures */
(function(){
'use strict';
if(window.__DIGIY_JOBS_INNER_I18N__)return;
window.__DIGIY_JOBS_INNER_I18N__=true;

var VERSION='20260730-jobs-inner1';
var SUPPORTED=['fr','en','es','de','it','nl','ar'];
var LABELS={fr:'🇫🇷 FR',en:'🇬🇧 EN',es:'🇪🇸 ES',de:'🇩🇪 DE',it:'🇮🇹 IT',nl:'🇳🇱 NL',ar:'🌙 AR'};
var ROWS=window.DIGIY_JOBS_INNER_ROWS||[];
var PACKS={en:{},es:{},de:{},it:{},nl:{},ar:{}};
ROWS.forEach(function(row){if(!row||row.length<7)return;PACKS.en[row[0]]=row[1];PACKS.es[row[0]]=row[2];PACKS.de[row[0]]=row[3];PACKS.it[row[0]]=row[4];PACKS.nl[row[0]]=row[5];PACKS.ar[row[0]]=row[6];});
var state={lang:'fr',page:'index.html',busy:false};

function normalizeLang(value){value=String(value||'').slice(0,2).toLowerCase();return SUPPORTED.indexOf(value)>=0?value:'fr';}
function params(){try{return new URL(location.href).searchParams;}catch(e){return new URLSearchParams();}}
function selected(){var p=params();var q=p.get('lang');if(SUPPORTED.indexOf(q)>=0)return q;try{var s=localStorage.getItem('digiy-lang');if(SUPPORTED.indexOf(s)>=0)return s;}catch(e){}return'fr';}
function currentPage(){var p=params().get('page')||document.documentElement.getAttribute('data-jobs-page')||'';p=String(p).split('/').pop().split('?')[0];return p||'index.html';}
function preserveSpace(raw,value){var lead=(String(raw).match(/^\s*/)||[''])[0];var tail=(String(raw).match(/\s*$/)||[''])[0];return lead+value+tail;}
function dictionary(){return PACKS[state.lang]||{};}
function translateString(raw){
 if(state.lang==='fr')return raw;
 var text=String(raw||'');var compact=text.trim();if(!compact)return text;
 var pack=dictionary();
 if(Object.prototype.hasOwnProperty.call(pack,compact))return preserveSpace(text,pack[compact]);
 var out=compact;
 Object.keys(pack).sort(function(a,b){return b.length-a.length;}).forEach(function(source){
   if(source.length<4||out.indexOf(source)<0)return;
   out=out.split(source).join(pack[source]);
 });
 return out===compact?text:preserveSpace(text,out);
}
function excluded(element){return !element||/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(element.tagName)||element.closest('#jobs-inner-language-bar');}
function translateText(node){if(!node||node.nodeType!==Node.TEXT_NODE||!node.parentElement||excluded(node.parentElement))return;var next=translateString(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;}
function translateElement(element){
 if(!element||element.nodeType!==Node.ELEMENT_NODE||excluded(element))return;
 ['placeholder','title','aria-label','data-empty-message'].forEach(function(attr){if(element.hasAttribute(attr)){var old=element.getAttribute(attr)||'';var next=translateString(old);if(next!==old)element.setAttribute(attr,next);}});
 if(element.tagName==='META'&&element.getAttribute('name')==='description'){var c=element.getAttribute('content')||'';var n=translateString(c);if(n!==c)element.setAttribute('content',n);}
}
function translateRoot(root){
 if(state.lang==='fr'||!root)return;
 state.busy=true;
 try{
   if(root.nodeType===Node.TEXT_NODE){translateText(root);return;}
   translateElement(root);
   var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);var node;while((node=walker.nextNode()))translateText(node);
   if(root.querySelectorAll)root.querySelectorAll('[placeholder],[title],[aria-label],[data-empty-message],meta[name="description"]').forEach(translateElement);
   document.title=translateString(document.title);
 }finally{state.busy=false;}
}
function buildRoute(anchor,lang){
 try{
   var source=new URL(anchor.href,location.href);
   if(source.hostname!=='jobs.digiylyfe.com')return null;
   var file=source.pathname.split('/').filter(Boolean).pop()||'index.html';
   if(file==='lang.html')return source.toString();
   if(file==='index.html'||source.pathname==='/'||source.pathname===''){
     var home=new URL('https://jobs.digiylyfe.com/');home.searchParams.set('lang',lang);home.searchParams.set('v',VERSION);return home.toString();
   }
   if(!/\.html$/i.test(file))return null;
   var route=new URL('https://jobs.digiylyfe.com/lang.html');route.searchParams.set('lang',lang);route.searchParams.set('page',file);
   source.searchParams.forEach(function(value,key){if(key!=='lang'&&key!=='page'&&key!=='v')route.searchParams.append(key,value);});
   if(source.hash)route.hash=source.hash;
   return route.toString();
 }catch(e){return null;}
}
function rewriteLinks(root){
 var scope=root&&root.querySelectorAll?root:document;
 scope.querySelectorAll('a[href]').forEach(function(anchor){var routed=buildRoute(anchor,state.lang);if(routed)anchor.href=routed;});
}
function languageUrl(lang){
 var url=new URL('https://jobs.digiylyfe.com/lang.html');url.searchParams.set('lang',normalizeLang(lang));url.searchParams.set('page',state.page);
 params().forEach(function(value,key){if(key!=='lang'&&key!=='page'&&key!=='v')url.searchParams.append(key,value);});
 if(location.hash)url.hash=location.hash;
 return url.toString();
}
function navigate(lang){lang=normalizeLang(lang);try{localStorage.setItem('digiy-lang',lang);}catch(e){}try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(e){}location.replace(languageUrl(lang));}
function installBar(){
 var old=document.getElementById('jobs-inner-language-bar');if(old)old.remove();
 var style=document.getElementById('jobs-inner-language-style');
 if(!style){style=document.createElement('style');style.id='jobs-inner-language-style';style.textContent='#jobs-inner-language-bar{position:fixed;z-index:2147483600;top:max(8px,env(safe-area-inset-top));right:8px;display:flex;gap:4px;max-width:calc(100vw - 16px);overflow-x:auto;padding:5px;border:1px solid rgba(244,185,52,.65);border-radius:999px;background:rgba(7,23,17,.94);box-shadow:0 12px 30px rgba(0,0,0,.3);backdrop-filter:blur(12px)}#jobs-inner-language-bar button{flex:0 0 auto;min-width:42px;height:36px;padding:0 7px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.08);color:#fff;font:900 10px/1 system-ui;cursor:pointer}#jobs-inner-language-bar button.active{background:linear-gradient(135deg,#facc15,#f59e0b);color:#071711;border-color:#facc15}html[dir=rtl] #jobs-inner-language-bar{right:auto;left:8px}@media(max-width:560px){#jobs-inner-language-bar{top:auto;right:8px;left:8px;bottom:calc(8px + env(safe-area-inset-bottom));justify-content:flex-start}html[dir=rtl] #jobs-inner-language-bar{right:8px;left:8px}}';document.head.appendChild(style);}
 var bar=document.createElement('nav');bar.id='jobs-inner-language-bar';bar.setAttribute('aria-label',state.lang==='ar'?'اختيار اللغة':'Choisir la langue');
 SUPPORTED.forEach(function(code){var b=document.createElement('button');b.type='button';b.dataset.jobsInnerLang=code;b.textContent=LABELS[code];b.className=code===state.lang?'active':'';b.setAttribute('aria-pressed',code===state.lang?'true':'false');b.addEventListener('click',function(event){event.preventDefault();event.stopImmediatePropagation();navigate(code);},true);bar.appendChild(b);});
 document.body.appendChild(bar);
}
function localizedNdimbal(){
 var values={type:value('type'),zone:value('zone'),date:value('date'),budget:value('budget'),detail:value('detail')};
 var map={
 en:['Hello DIGIY JOBS, I want to prepare a NDIMBAL Express post.','Type','Area','When','Budget','Details','Please review it before publication.'],
 es:['Hola DIGIY JOBS, quiero preparar un anuncio NDIMBAL Express.','Tipo','Zona','Cuándo','Presupuesto','Detalle','Gracias por validarlo antes de publicarlo.'],
 de:['Hallo DIGIY JOBS, ich möchte eine NDIMBAL-Express-Anzeige vorbereiten.','Art','Gebiet','Wann','Budget','Details','Bitte vor der Veröffentlichung prüfen.'],
 it:['Buongiorno DIGIY JOBS, voglio preparare un annuncio NDIMBAL Express.','Tipo','Zona','Quando','Budget','Dettagli','Grazie per la verifica prima della pubblicazione.'],
 nl:['Hallo DIGIY JOBS, ik wil een NDIMBAL Express-melding voorbereiden.','Type','Zone','Wanneer','Budget','Details','Graag controleren vóór publicatie.'],
 ar:['مرحباً DIGIY JOBS، أريد إعداد إعلان NDIMBAL Express.','النوع','المنطقة','متى','الميزانية','التفاصيل','يرجى التحقق قبل النشر.']
 };
 if(state.lang==='fr')return null;var m=map[state.lang];return [m[0],m[1]+' : '+values.type,m[2]+' : '+values.zone,m[3]+' : '+values.date,m[4]+' : '+values.budget,m[5]+' : '+values.detail,m[6]].join('\n');
}
function localizedFollow(){
 var map={
 en:['Hello DIGIY JOBS, I would like to follow up on my submission.','Name','WhatsApp','Submission date','Mission / job','Message'],
 es:['Hola DIGIY JOBS, quiero hacer seguimiento de mi envío.','Nombre','WhatsApp','Fecha del envío','Misión / oficio','Mensaje'],
 de:['Hallo DIGIY JOBS, ich möchte meine Einreichung nachverfolgen.','Name','WhatsApp','Datum der Einreichung','Auftrag / Beruf','Nachricht'],
 it:['Buongiorno DIGIY JOBS, desidero seguire il mio invio.','Nome','WhatsApp','Data dell’invio','Incarico / lavoro','Messaggio'],
 nl:['Hallo DIGIY JOBS, ik wil mijn inzending opvolgen.','Naam','WhatsApp','Datum van inzending','Opdracht / beroep','Bericht'],
 ar:['مرحباً DIGIY JOBS، أود متابعة إرسالي.','الاسم','واتساب','تاريخ الإرسال','المهمة / المهنة','الرسالة']
 };
 if(state.lang==='fr')return null;var m=map[state.lang];return [m[0],m[1]+' : '+value('nom'),m[2]+' : '+value('tel'),m[3]+' : '+value('date'),m[4]+' : '+value('mission'),m[5]+' : '+value('message')].join('\n');
}
function value(id){var el=document.getElementById(id);return el?String(el.value||'').trim():'';}
function showResult(text){var box=document.getElementById('result');if(box){box.textContent=text;box.classList.add('show');}return text;}
function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).catch(function(){});}
function installActionOverrides(){
 if(state.lang==='fr')return;
 document.addEventListener('click',function(event){
   var button=event.target&&event.target.closest?event.target.closest('#buildBtn,#copyBtn,#waBtn'):null;if(!button)return;
   var text=null;
   if(state.page==='ndimbal-express.html')text=localizedNdimbal();
   if(state.page==='suivi.html')text=localizedFollow();
   if(!text)return;
   event.preventDefault();event.stopImmediatePropagation();showResult(text);
   if(button.id==='copyBtn')copyText(text);
   if(button.id==='waBtn')window.open('https://wa.me/221771342889?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
 },true);
}
function init(){
 state.lang=selected();state.page=currentPage();try{localStorage.setItem('digiy-lang',state.lang);}catch(e){}
 document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';document.documentElement.setAttribute('data-jobs-page',state.page);
 translateRoot(document.body);rewriteLinks(document);installBar();installActionOverrides();
 var observer=new MutationObserver(function(mutations){if(state.busy)return;mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){translateRoot(node);if(node.querySelectorAll)rewriteLinks(node);});if(mutation.type==='characterData')translateText(mutation.target);});rewriteLinks(document);});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:false});
 setTimeout(function(){translateRoot(document.body);rewriteLinks(document);installBar();},300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
