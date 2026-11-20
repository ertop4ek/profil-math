import {checkTaskAnswer} from './engine.js';
const root=new URL('../',import.meta.url);
const cache=new Map();
export const location={
 get pathname(){return (window.location.hash.slice(1)||'/').split('?')[0];},
 get search(){const route=window.location.hash.slice(1);return route.includes('?')?'?'+route.split('?').slice(1).join('?'):'';},
 get origin(){return window.location.origin;},
};
const path=route=>root.pathname+'#'+route;
export const history={
 pushState(state,title,route){window.history.pushState(state,title,path(route));},
 replaceState(state,title,route){window.history.replaceState(state,title,path(route));}
};
async function readNumber(number){
 if(!cache.has(number))cache.set(number,fetch(new URL('data/'+number+'.json',root)).then(r=>{if(!r.ok)throw Error('Раздел не загрузился');return r.json();}).catch(e=>{cache.delete(number);throw e;}));
 return cache.get(number);
}
let index;
async function task(id){
 index??=await (await fetch(new URL('data/index.json',root))).json();
 const number=index.numbers[id];
 if(!number)throw Error('Задание не найдено');
 return (await readNumber(number)).find(t=>t.id===id);
}
export async function fetchStatic(input,options={}){
 const url=new URL(input,window.location.href);
 if(url.pathname==='/api/catalog')return fetch(new URL('data/catalog.json',root));
 if(url.pathname==='/api/check'){
  const body=JSON.parse(options.body),t=await task(body.id);
  return Response.json(checkTaskAnswer(body.answer,t));
 }
 if(url.pathname==='/api/solution'){
  const t=await task(url.searchParams.get('id'));
  return Response.json({id:t.id,answer:t.answer,steps:t.steps,criteria:t.criteria,rubric:t.rubric});
 }
 return fetch(input,options);
}
window.addEventListener('hashchange',()=>window.dispatchEvent(new PopStateEvent('popstate')));
function rewrite(){
 document.querySelectorAll('a[href^="/"]').forEach(a=>{
  const href=a.getAttribute('href');
  if(/^\/(bank|practice|lessons|methods|progress|saved|about|exam)(\/|\?|$)/.test(href)||href==='/')a.href=path(href);
 });
}
new MutationObserver(rewrite).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',event=>{
 const a=event.target.closest('a[href]');
 if(!a||a.target||a.download||event.ctrlKey||event.metaKey||event.shiftKey||event.button!==0)return;
 const url=new URL(a.href);
 if(url.origin===window.location.origin&&url.pathname===root.pathname&&url.hash.startsWith('#/')){
  event.preventDefault();event.stopImmediatePropagation();
  if(window.location.hash===url.hash)window.dispatchEvent(new PopStateEvent('popstate'));
  else window.location.hash=url.hash;
  window.scrollTo(0,0);
 }
},true);
rewrite();
