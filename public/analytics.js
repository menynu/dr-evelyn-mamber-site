const T="callback_form_success",O="mmb_optout",E={pageview:1,tel:1,whatsapp:1,waze:1,google_maps:1,google_review:1,[T]:1};
function cfg(){try{return JSON.parse(document.getElementById("mmb-cfg").textContent)}catch{}}
function pagePath(){try{let p=location.pathname.split(/[?#]/)[0]||"/",b=(cfg()||{}).b||"/";b!="/"&&(b=b.replace(/\/$/,""),(p===b||p.startsWith(b+"/"))&&(p=p.slice(b.length)||"/"));return p}catch{return"/"}}
function day(){return new Date().toISOString().slice(0,10)}
function priv(){try{return localStorage[O]==1||navigator.globalPrivacyControl||navigator.doNotTrack==1}catch{}}
function store(){try{const o=JSON.parse(localStorage.mmb||0);return o.id&&o.f&&o}catch{}}
function nid(){let s="",a=crypto.getRandomValues(new Uint8Array(16));for(const x of a)s+=(256|x).toString(16).slice(1);return s}
function vid(){if(priv()){try{localStorage.removeItem("mmb")}catch{}return}const t=day();let o=store();!o||o.id.length!=32?o={id:nid(),f:t,l:t,c:t}:(o.l=t,(!o.c||Date.parse(t)-Date.parse(o.c)>=7776e6)&&(o.id=nid(),o.c=t));try{localStorage.mmb=JSON.stringify(o)}catch{}return o}
function post(b){try{const u=cfg()?.u;u&&navigator.sendBeacon(u.replace(/\/$/,"")+"/e",new Blob([JSON.stringify(b)],{type:"text/plain"}))}catch{}}
function send(e){if(!E[e])return;if(e==T){const o=priv()?0:store();return post({e,n:!o||o.f==day()?"new":"ret"})}if(e=="pageview"){let s;try{sessionStorage._s||(sessionStorage._s=1,s=1)}catch{}const v=vid(),b={e,p:pagePath(),n:!v||v.f==day()?"new":"ret"};s&&(b.s=1);v&&(b.v=v.id,b.f=v.f,b.l=v.l);return post(b)}const b={e},v=vid();v&&(b.v=v.id,b.f=v.f);post(b)}
export function track(n){try{const e=(""+n).trim();if(!e)return;(window.__mamberEvents=window.__mamberEvents||[]).push({event:e,path:pagePath()});E[e]&&send(e)}catch{}}
export function setupAnalytics(){const w=window;w.__mamberTrack=track;w.__mamberOptOut=on=>{try{on?(localStorage[O]=1,localStorage.removeItem("mmb")):localStorage.removeItem(O)}catch{}};w.__mamberIsOptOut=()=>{try{return localStorage[O]==1}catch{return!1}};track("pageview");try{/thanks\/?$/.test(pagePath())&&sessionStorage._t!=1&&(sessionStorage._t=1,track(T))}catch{}}
