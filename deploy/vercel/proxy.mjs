const BACKEND='https://profil-math-yaroslav.livelyanole2050.chatgpt.site';
const response=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function proxy(request,transport=fetch){
 const url=new URL(request.url),action=url.pathname.slice(5);
 if(!['health','check','progress'].includes(action))return response('Адрес не найден.',404);
 if(!(request.method==='GET'&&['health','progress'].includes(action)||request.method==='POST'&&action==='check'||request.method==='PUT'&&action==='progress'))return response('Метод не поддерживается.',405);
 if(request.method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return response('Запрос должен отправляться с этого сайта.',403);
 const headers=new Headers({'Accept':'application/json'});
 const session=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>/^__Host-profile_session=[a-f0-9]{64}$/.test(x));
 if(session)headers.set('cookie',session);
 let body;
 if(request.method!=='GET'){
  if(!request.headers.get('content-type')?.startsWith('application/json'))return response('Нужны данные в формате JSON.',415);
  if(Number(request.headers.get('content-length'))>2000000)return response('Данные превышают 2 МБ.',413);
  body=await request.text();if(body.length>2000000)return response('Данные превышают 2 МБ.',413);
  headers.set('Content-Type','application/json');headers.set('Origin',BACKEND);
 }
 try{
  const upstream=await transport(BACKEND+'/api/'+action,{method:request.method,headers,body,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!upstream.headers.get('content-type')?.includes('application/json'))return response('Сервер временно недоступен. Прогресс остаётся на устройстве.',502);
  const resultHeaders=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  const cookies=upstream.headers.getSetCookie?.()||[upstream.headers.get('set-cookie')].filter(Boolean);
  for(const cookie of cookies)if(/^__Host-profile_session=[a-f0-9]{64};/.test(cookie))resultHeaders.append('Set-Cookie',cookie);
  return new Response(upstream.body,{status:upstream.status,headers:resultHeaders});
 }catch{return response('Сервер временно недоступен. Прогресс остаётся на устройстве.',502);}
}
