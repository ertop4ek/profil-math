export function mergeDocuments(remote,local){const out={practice:{...local.practice,records:{...remote.practice?.records}},learning:{},favorites:{...remote.favorites}};for(const[id,r]of Object.entries(local.practice?.records||{}))if(!out.practice.records[id]||(r.touched||0)>=(out.practice.records[id].touched||0))out.practice.records[id]=r;const latest=p=>Math.max(0,...Object.values(p?.records||{}).map(r=>r.touched||0));if(latest(remote.practice)>latest(local.practice))out.practice.current=remote.practice.current;for(const[id,f]of Object.entries(local.favorites||{}))if(!out.favorites[id]||(f.at||0)>=(out.favorites[id].at||0))out.favorites[id]=f;
const a=remote.learning||{},b=local.learning||{};out.learning=(a.updatedAt||0)===(b.updatedAt||0)?{completed:{...a.completed,...b.completed},checks:{...a.checks,...b.checks},updatedAt:a.updatedAt||b.updatedAt||0}:(a.updatedAt||0)>(b.updatedAt||0)?a:b;return out;}
export function createCloud({accountId,read,apply,status}) {
 const endpoint=accountId?'/api/account-progress':'/api/progress';
 const headers=accountId?{'X-Profile-Account':accountId}:{};
 const request=options=>fetch(endpoint,{credentials:'same-origin',signal:AbortSignal.timeout(12000),...options,headers:{...headers,...options?.headers}});
 const success=()=>status(accountId?'Сохранено в аккаунте':'Сохранено на устройстве и сервере');
 const offline=()=>status(accountId?'Прогресс пока не синхронизирован':'Сохранено на устройстве · сервер недоступен');
 let revision=0,ready=false,pending,timer,sequence=0,savedSequence=0;
 async function loadProgress() {
  const response=await request();
  if(!response.ok)throw Error();
  return response.json();
 }
 async function sync() {
  if(!ready) {
   const data=await loadProgress();
   revision=data.revision;
   apply(mergeDocuments(data.document,read()));
   ready=true;
  }
  for(let attempt=0;attempt<3;attempt++) {
   const version=sequence;
   const response=await request({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,document:read()})});
   if(response.status===409) {
    const conflict=await response.json();
    const fresh=conflict.document?conflict:await loadProgress();
    revision=fresh.revision;
    apply(mergeDocuments(fresh.document,read()));
    continue;
   }
   if(!response.ok)throw Error();
   revision=(await response.json()).revision;
   savedSequence=version;
   success();
   return true;
  }
  throw Error();
 }
 async function synchronize() {
  if(pending)return pending;
  clearTimeout(timer);
  status('Сохраняем прогресс');
  pending=sync().catch(()=>{offline();return false;});
  const saved=await pending;
  pending=undefined;
  if(saved&&savedSequence!==sequence)timer=setTimeout(synchronize,900);
  return saved;
 }
 async function flush() {
  do {
   if(!await synchronize())return false;
  } while(savedSequence!==sequence);
  return true;
 }
 function schedule(){sequence++;clearTimeout(timer);timer=setTimeout(synchronize,1200);}
 window.addEventListener('online',synchronize);
 return {load:synchronize,schedule,synchronize,flush};
}
