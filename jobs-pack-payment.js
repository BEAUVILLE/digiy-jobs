(()=>{"use strict";
const LANGS=["fr","en","es","de","it","nl","ar"];
let lang=new URLSearchParams(location.search).get("lang");
try{lang=lang||localStorage.getItem("digiy-lang")}catch(_){}
if(!LANGS.includes(lang))lang="fr";
const copy={
fr:{pay:"Choisir ce pack → PAY",choose:"Choisis un pack ci-dessus",who:"Recruteur JOBS",info:"Bonjour DIGIY JOBS, je souhaite comprendre l’accès recruteur aux profils qualifiés."},
en:{pay:"Choose this pack → PAY",choose:"Choose a pack above",who:"JOBS recruiter",info:"Hello DIGIY JOBS, I would like to understand recruiter access to qualified profiles."},
es:{pay:"Elegir este pack → PAY",choose:"Elige un pack arriba",who:"Reclutador JOBS",info:"Hola DIGIY JOBS, quiero entender el acceso de reclutadores a perfiles cualificados."},
de:{pay:"Dieses Paket wählen → PAY",choose:"Wähle oben ein Paket",who:"JOBS-Recruiter",info:"Hallo DIGIY JOBS, ich möchte den Recruiter-Zugang zu qualifizierten Profilen verstehen."},
it:{pay:"Scegli questo pack → PAY",choose:"Scegli un pack qui sopra",who:"Recruiter JOBS",info:"Buongiorno DIGIY JOBS, desidero capire l’accesso recruiter ai profili qualificati."},
nl:{pay:"Kies dit pakket → PAY",choose:"Kies hierboven een pakket",who:"JOBS-recruiter",info:"Hallo DIGIY JOBS, ik wil de recruitertoegang tot gekwalificeerde profielen begrijpen."},
ar:{pay:"اختر هذه الباقة ← PAY",choose:"اختر باقة أعلاه",who:"صاحب عمل JOBS",info:"مرحبًا DIGIY JOBS، أريد فهم طريقة دخول أصحاب العمل إلى الملفات المؤهلة."}
}[lang];
const cleanAmount=value=>Number(String(value||"").replace(/[^0-9]/g,""))||0;
function payUrl(card,index){
  const title=(card.querySelector("h3")?.textContent||`Pack JOBS ${index+1}`).trim();
  const amount=cleanAmount(card.querySelector(".price")?.textContent);
  const raw=`recette JOBS ${amount} Wave — ${title}`;
  const draft={raw,text:raw,amount:String(amount),mode:"Wave",job:title,type:"income",who:copy.who};
  try{
    localStorage.setItem("DIGIY_JOBS_GO_LATEST",JSON.stringify(draft));
    localStorage.setItem("DIGIY_JOBS_PACK_SELECTED",JSON.stringify({source:"JOBS",pack:title,amount,currency:"XOF",lang,createdAt:new Date().toISOString()}));
  }catch(_){}
  const url=new URL("/pay-transition.html",location.origin);
  url.searchParams.set("lang",lang);
  url.searchParams.set("pack",title);
  url.searchParams.set("amount",String(amount));
  return url.href;
}
function localizeInfoWhatsApp(){
  const links=[...document.querySelectorAll('a[href*="wa.me"]')];
  const last=links.at(-1);
  if(last){
    const href=`https://wa.me/221771342889?text=${encodeURIComponent(copy.info)}`;
    if(last.href!==href)last.href=href;
  }
}
function install(){
  const section=document.getElementById("packs");
  if(!section)return;
  const cards=[...section.querySelectorAll(".grid > article.card")].slice(0,3);
  cards.forEach((card,index)=>{
    if(card.querySelector(".jobs-pack-pay"))return;
    const button=document.createElement("a");
    button.className="btn primary jobs-pack-pay";
    button.href="#";
    button.textContent=copy.pay;
    button.setAttribute("data-no-i18n","");
    button.addEventListener("click",event=>{
      event.preventDefault();
      const amount=cleanAmount(card.querySelector(".price")?.textContent);
      if(!amount)return;
      location.assign(payUrl(card,index));
    });
    card.appendChild(button);
  });
  const directActions=[...section.children].find(el=>el.classList?.contains("actions"));
  const oldButton=directActions?.querySelector("a.btn.primary");
  if(oldButton){
    oldButton.href="#packs";
    oldButton.removeAttribute("target");
    oldButton.removeAttribute("rel");
    oldButton.textContent=copy.choose;
    oldButton.setAttribute("data-no-i18n","");
  }
  localizeInfoWhatsApp();
  setTimeout(localizeInfoWhatsApp,300);
  setTimeout(localizeInfoWhatsApp,1200);
}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",install,{once:true}):install();
})();
