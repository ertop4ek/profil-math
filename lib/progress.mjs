import {tasks} from './bank/catalog.js';
import {migrateHintCount} from '../public/client/learning.js';
const ids=new Set(tasks.map(t=>t.id)),obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
export const empty=()=>({practice:{current:'e26-1-right-1',records:{},hintVersion:2},learning:{completed:{},checks:{}},favorites:{}});
export function normalize(value){const s=obj(value),out=empty(),p=obj(s.practice);if(ids.has(p.current))out.practice.current=p.current;
for(const[id,v]of Object.entries(obj(p.records))){if(!ids.has(id))continue;const r=obj(v);out.practice.records[id]={answer:String(r.answer||'').slice(0,1000),working:String(r.working||'').slice(0,12000),hints:migrateHintCount(r.hints,p.hintVersion||1),measuredAttempts:Math.max(0,Number(r.measuredAttempts)||0),correctAttempts:Math.max(0,Number(r.correctAttempts)||0),lastResult:r.lastResult,hadError:r.hadError===true,selfChecked:r.selfChecked===true,attempts:Math.max(0,Math.min(100000,Number(r.attempts)||0)),solved:r.solved===true,independent:r.independent===true,seenSolution:r.seenSolution===true,solutionOpen:r.solutionOpen===true,aiUsed:r.aiUsed===true,criteria:Array.isArray(r.criteria)?r.criteria.map(Boolean).slice(0,10):[],touched:Math.max(0,Math.min(Date.now()+86400000,Number(r.touched)||0))};}
for(const[id,v]of Object.entries(obj(s.favorites)))if(ids.has(id)){const f=obj(v);out.favorites[id]={saved:f.saved===true,at:Number(f.at)||0};}
for(const[id,v]of Object.entries(obj(s.learning?.completed)))if(/^[a-z0-9-]{1,100}$/.test(id)&&v===true)out.learning.completed[id]=true;
for(const[id,v]of Object.entries(obj(s.learning?.checks)))if(/^[a-z0-9-]{1,100}$/.test(id)&&Array.isArray(v))out.learning.checks[id]=v.map(Boolean).slice(0,20);
out.learning.updatedAt=Number(s.learning?.updatedAt)||0;return out;}
export function merge(remote,local){const a=normalize(remote),b=normalize(local),out=empty();out.practice.records={...a.practice.records};for(const[id,r]of Object.entries(b.practice.records))if(!out.practice.records[id]||r.touched>=out.practice.records[id].touched)out.practice.records[id]=r;
const last=d=>Math.max(0,...Object.values(d.practice.records).map(r=>r.touched||0));out.practice.current=last(b)>=last(a)?b.practice.current:a.practice.current;
out.favorites={...a.favorites};for(const[id,f]of Object.entries(b.favorites))if(!out.favorites[id]||f.at>=out.favorites[id].at)out.favorites[id]=f;
out.learning={completed:{...a.learning.completed,...b.learning.completed},checks:{...a.learning.checks,...b.learning.checks}};return out;}
