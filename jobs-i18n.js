/* DIGIY JOBS — moteur autonome FR EN ES DE IT NL AR */
(function(){
  'use strict';
  if(window.__DIGIY_JOBS_7LANG__)return;
  window.__DIGIY_JOBS_7LANG__=true;

  var D=window.DIGIY_JOBS_PACK_DATA||{rows:{},meta:{}};
  var VERSION='20260730-jobs8';
  var SUPPORTED=['fr','en','es','de','it','nl','ar'];
  var LABELS={fr:'🇫🇷 FR',en:'🇬🇧 EN',es:'🇪🇸 ES',de:'🇩🇪 DE',it:'🇮🇹 IT',nl:'🇳🇱 NL',ar:'🌙 AR'};
  var ORIGIN='https://jobs.digiylyfe.com/';

  function normalize(value){
    value=String(value||'').slice(0,2).toLowerCase();
    return SUPPORTED.indexOf(value)>=0?value:'fr';
  }

  function selected(){
    try{
      var q=new URL(location.href).searchParams.get('lang');
      if(SUPPORTED.indexOf(q)>=0)return q;
      var s=localStorage.getItem('digiy-lang');
      if(SUPPORTED.indexOf(s)>=0)return s;
    }catch(e){}
    return 'fr';
  }

  function navigate(lang){
    lang=normalize(lang);
    try{localStorage.setItem('digiy-lang',lang);}catch(e){}
    try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(e){}
    location.replace(ORIGIN+'?lang='+encodeURIComponent(lang)+'&v='+encodeURIComponent(VERSION));
  }

  function installStyles(){
    if(document.getElementById('jobs-seven-language-style'))return;
    var style=document.createElement('style');
    style.id='jobs-seven-language-style';
    style.textContent=
      '.lang{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:5px!important;width:min(100%,720px)!important;max-width:100%!important;flex:1 1 100%!important;order:20!important;padding:5px!important;pointer-events:auto!important}'+
      '.lang button{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:40px!important;padding:0 7px!important;border:1px solid rgba(21,95,67,.18)!important;border-radius:999px!important;background:rgba(255,255,255,.72)!important;color:#155f43!important;font-weight:1000!important;cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important;white-space:nowrap!important}'+
      '.lang button.active{background:linear-gradient(135deg,#155f43,#1f7a55)!important;color:#fff!important;border-color:#155f43!important}'+
      '@media(max-width:760px){.topbar-inner{flex-wrap:wrap!important}.top-actions{width:100%!important;flex-wrap:wrap!important}.lang{grid-template-columns:repeat(4,minmax(0,1fr))!important;width:100%!important;max-width:none!important}.lang button{font-size:.76rem!important;padding:0 4px!important}}'+
      '@media(max-width:390px){.lang button{font-size:.69rem!important}}';
    document.head.appendChild(style);
  }

  function renderBar(lang){
    var bar=document.querySelector('.lang');
    if(!bar)return false;
    bar.innerHTML='';
    bar.setAttribute('aria-label',lang==='ar'?'اختيار اللغة':'Choisir la langue');
    SUPPORTED.forEach(function(code){
      var button=document.createElement('button');
      button.type='button';
      button.dataset.jobsLang=code;
      button.textContent=LABELS[code];
      button.className=code===lang?'active':'';
      button.setAttribute('aria-pressed',code===lang?'true':'false');
      button.addEventListener('click',function(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        navigate(code);
      },true);
      bar.appendChild(button);
    });
    return true;
  }

  function applyContactMessage(message){
    if(!message)return;
    document.querySelectorAll('a[href*="wa.me/"],a[href^="sms:"]').forEach(function(anchor){
      var href=anchor.getAttribute('href')||'';
      if(href.indexOf('wa.me')>=0){
        try{
          var url=new URL(anchor.href);
          url.searchParams.set('text',message);
          anchor.href=url.toString();
        }catch(e){}
      }else{
        var base=href.split('?')[0];
        anchor.setAttribute('href',base+'?body='+encodeURIComponent(message));
      }
    });
  }

  function applyTranslatedPack(lang){
    var row=D.rows&&D.rows[lang];
    if(!row)return;
    document.querySelectorAll('[data-i18n]').forEach(function(element){
      var key=element.getAttribute('data-i18n');
      if(row[key]==null)return;
      if(key==='hero_title')element.innerHTML=row[key];
      else element.textContent=row[key];
    });
    var meta=D.meta&&D.meta[lang];
    if(meta){
      document.title=meta.title;
      var description=document.querySelector('meta[name="description"]');
      if(description)description.setAttribute('content',meta.description);
      applyContactMessage(meta.message);
    }
  }

  function init(){
    var lang=selected();
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    installStyles();
    renderBar(lang);
    if(lang!=='fr'&&lang!=='en')applyTranslatedPack(lang);
    setTimeout(function(){renderBar(lang);},120);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
