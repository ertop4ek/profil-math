import {accountRequest,accountSession} from './accounts.mjs';
import {tasks} from './bank/catalog.js';
import {checkTaskAnswer} from '../public/client/engine.js';
import {publicCatalogue} from './bank/public.js';
import {empty,normalize} from './progress.mjs';
const byId=new Map(tasks.map(t=>[t.id,t]));
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
export function session(req){const secure=new URL(req.url).protocol==='https:',name=secure?'__Host-profile_session':'profile_session';let id=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);if(!/^[a-f0-9]{64}$/.test(id||''))id=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');return {id,cookie:`${name}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure?'; Secure':''}`};}
export async function service(req,db,env){try{const url=new URL(req.url),path=url.pathname.slice(5);if(req.method!=='GET'&&req.headers.get('origin')&&req.headers.get('origin')!==url.origin)return json({error:'Запрос должен отправляться с этого сайта.'},403);
if(path.startsWith('account/'))return await accountRequest(req,db,env,path.slice(8));
if(path==='catalog'&&req.method==='GET')return new Response(publicCatalogue(),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
if(path==='solution'&&req.method==='GET'){
 const t=byId.get(url.searchParams.get('id'));
 return t?json({id:t.id,answer:t.answer,steps:t.steps,criteria:t.criteria||[],rubric:t.rubric}):json({error:'Задание не найдено.'},404);
}
if(path==='health')return json({ok:true,total:tasks.length,server:true});
if(path==='check'&&req.method==='POST'){const body=await req.json(),task=byId.get(body.id);if(!task)return json({error:'Задание не найдено.'},404);if(typeof body.answer!=='string'||body.answer.length>1000)return json({error:'Слишком длинный или некорректный ответ.'},400);return json(checkTaskAnswer(body.answer,task));}
if(path!=='progress'&&path!=='account-progress')return json({error:'Адрес не найден.'},404);
const personal=path==='account-progress';
const account=personal?await accountSession(req,db):null;
if(personal&&(!account||req.headers.get('X-Profile-Account')!==account.id))return json({error:'Войди в нужный аккаунт повторно.'},401);
const s=account?{id:'account:'+account.id}:session(req),headers=account?{}:{'Set-Cookie':s.cookie};if(!db)return json({error:'Серверное сохранение недоступно. Прогресс остаётся на устройстве.'},503,headers);
const row=await db.prepare('SELECT state, revision FROM learner_progress WHERE session_id = ?').bind(s.id).first();
if(req.method==='GET')return json({document:row?JSON.parse(row.state):empty(),revision:row?.revision||0},200,headers);
if(req.method!=='PUT')return json({error:'Метод не поддерживается.'},405,headers);
const text=await req.text();if(text.length>2000000)return json({error:'Прогресс превышает 2 МБ. Сохрани его в файл.'},413,headers);const body=JSON.parse(text),revision=row?.revision||0;
if(body.revision!==revision)return json({error:'Прогресс обновлён в другой вкладке.',revision,document:row?JSON.parse(row.state):empty()},409,headers);
const data=JSON.stringify(normalize(body.document));let result;
if(row)result=await db.prepare('UPDATE learner_progress SET state = ?, revision = revision + 1, updated_at = ? WHERE session_id = ? AND revision = ?').bind(data,Date.now(),s.id,revision).run();
else result=await db.prepare('INSERT OR IGNORE INTO learner_progress (session_id,state,revision,updated_at) VALUES (?,?,1,?)').bind(s.id,data,Date.now()).run();
if(!result.meta?.changes)return json({error:'Повтори сохранение.',revision},409,headers);
return json({saved:true,revision:revision+1},200,headers);
}catch(e){return json({error:e instanceof SyntaxError?'Не удалось прочитать данные.':'Сервер временно недоступен. Данные остаются на устройстве.'},e instanceof SyntaxError?400:500);}}
