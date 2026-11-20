// A small, deliberately restricted parser: no eval and no execution of input.
export function numberValue(source) {
  const s=String(source).toLowerCase().replace(/−|–/g,'-').replace(/,/g,'.').replace(/\s+/g,'').replace(/sqrt|корень/g,'√').replace(/pi|пи/g,'π').replace(/[×·]/g,'*');
  if (/^[+]?∞$|^[+]?inf(?:inity)?$/.test(s)) return Infinity;
  if (/^-∞$|^-inf(?:inity)?$/.test(s)) return -Infinity;
  if (s.length>1000) throw Error('Слишком длинная запись числа.');
  let p=0,depth=0;
  function primary(){
    if(++depth>50)throw Error('Слишком много вложенных скобок.');
    let v;
    if(s[p]==='π'){p++;v=Math.PI;}
    else if(s[p]==='('){p++;v=sum();if(s[p++]!==')')throw Error('Не хватает скобки.');}
    else {const m=s.slice(p).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(!m)throw Error('Не удалось прочитать число.');p+=m[0].length;v=Number(m[0]);}
    depth--;return v;
  }
  function power(){let v=primary();if(s[p]==='^'){p++;v=v**unary();}return v;}
  function unary(){if(s[p]==='+'){p++;return unary();}if(s[p]==='-'){p++;return -unary();}if(s[p]==='√'){p++;const v=unary();if(v<0)throw Error('Корень из отрицательного числа.');return Math.sqrt(v);}return power();}
  function product(){let v=unary();while(s[p]==='*'||s[p]==='/'||s[p]==='π'||s[p]==='√'||s[p]==='('){const explicit=s[p]==='*'||s[p]==='/';const op=explicit?s[p++]:'*',n=unary();if(op==='/'&&n===0)throw Error('Деление на ноль.');v=op==='*'?v*n:v/n;}return v;}
  function sum(){let v=product();while(s[p]==='+'||s[p]==='-'){const op=s[p++],n=product();v=op==='+'?v+n:v-n;}return v;}
  const v=sum();if(p!==s.length||!Number.isFinite(v))throw Error('Проверьте число: например, -1/4, √2 или 3pi/2.');return v;
}
const close=(a,b)=>a===b||Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9;
export function normalizeIntervals(items){
  const sorted=items.map(i=>({...i,lc:Number.isFinite(i.l)&&i.lc,rc:Number.isFinite(i.r)&&i.rc})).filter(i=>i.l<i.r||close(i.l,i.r)&&i.lc&&i.rc).sort((a,b)=>a.l-b.l||Number(b.lc)-Number(a.lc));
  const out=[];
  for(const q of sorted){const last=out.at(-1);if(!last){out.push(q);continue;}if(q.l<last.r||close(q.l,last.r)&&(last.rc||q.lc)){if(q.r>last.r){last.r=q.r;last.rc=q.rc;}else if(close(q.r,last.r))last.rc=last.rc||q.rc;}else out.push(q);}
  return out;
}
function interval(l,r,lc=false,rc=false){return {l,r,lc,rc};}
function intersect(a,b){const l=Math.max(a.l,b.l),r=Math.min(a.r,b.r);return interval(l,r,(l===a.l?a.lc:true)&&(l===b.l?b.lc:true),(r===a.r?a.rc:true)&&(r===b.r?b.rc:true));}
function relation(l,op,r){
  const lv=/^[xaа]$/.test(l),rv=/^[xaа]$/.test(r);
  if(lv===rv)throw Error('В неравенстве должна быть одна переменная x или a.');
  const n=numberValue(lv?r:l);let o=op;
  if(!lv)o={'<':'>','>':'<','<=':'>=','>=':'<=','=':'='}[o];
  return o==='<'?interval(-Infinity,n):o==='<='?interval(-Infinity,n,false,true):o==='>'?interval(n,Infinity):o==='>='?interval(n,Infinity,true,false):interval(n,n,true,true);
}
export function parseAnswer(input){
  let s=input.trim().toLowerCase().replace(/−|–/g,'-').replace(/\s+/g,'').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/∈/g,'in').replace(/бесконечность/g,'∞').replace(/\\infty|infinity|inf/g,'∞').replace(/\\cup|union|или/g,'∪');
  if(!s)throw Error('Сначала запишите свой ответ.');
  s=s.replace(/^[xaа](?:in|:)/,'');
  if(['∅','{}','нетрешений','пусто','empty'].includes(s))return [];
  if(['r','ℝ','(-∞;+∞)','(-∞;∞)'].includes(s))return [interval(-Infinity,Infinity)];
  if(s.includes(';')&&!/^[({[]/.test(s)&&!/[<>∪=]/.test(s))s='{'+s+'}';
  const parts=s.split(/∪|\bu\b/);if(parts.some(p=>!p))throw Error('Запишите множество решений.');
  const items=[];
  for(let piece of parts){
    if(piece.startsWith('{')&&piece.endsWith('}')){for(const n of piece.slice(1,-1).split(';')){const v=numberValue(n);if(!Number.isFinite(v))throw Error('Бесконечность не является отдельным числом.');items.push(interval(v,v,true,true));}continue;}
    if((piece[0]==='('||piece[0]==='[')&&(piece.at(-1)===')'||piece.at(-1)===']')&&/[;,]/.test(piece)){
      const inner=piece.slice(1,-1);let sep=inner.includes(';')?';':',';
      const values=inner.split(sep);if(values.length!==2)throw Error('Разделяйте границы интервала точкой с запятой: [1; 3).');
      const l=numberValue(values[0]),r=numberValue(values[1]);if(l>r||l===Infinity||r===-Infinity)throw Error('Левая граница должна быть меньше правой.');
      if(!Number.isFinite(l)&&piece[0]==='['||!Number.isFinite(r)&&piece.at(-1)===']')throw Error('У бесконечности всегда круглая скобка.');
      if(l===r&&!(piece[0]==='['&&piece.at(-1)===']'))throw Error('Для отдельной точки используйте {число}.');
      items.push(interval(l,r,piece[0]==='[',piece.at(-1)===']'));continue;
    }
    const split=piece.split(/(<=|>=|<|>|=)/);
    if(split.length===3){items.push(relation(...split));continue;}
    if(split.length===5){items.push(intersect(relation(split[0],split[1],split[2]),relation(split[2],split[3],split[4])));continue;}
    if(split.length!==1)throw Error('Проверьте знаки неравенства.');
    const v=numberValue(piece);if(!Number.isFinite(v))throw Error('Бесконечность не является отдельным числом.');items.push(interval(v,v,true,true));
  }
  return normalizeIntervals(items);
}
export function checkAnswer(input,expected){
  let actual;try{actual=parseAnswer(input);}catch(e){return {status:'format',message:e.message};}
  const target=typeof expected==='string'?parseAnswer(expected):normalizeIntervals(expected);
  const correct=actual.length===target.length&&actual.every((q,i)=>close(q.l,target[i].l)&&close(q.r,target[i].r)&&q.lc===target[i].lc&&q.rc===target[i].rc);
  if(correct)return {status:'correct',message:'Верно! Все интервалы и границы на месте.'};
  const sameBounds=actual.length===target.length&&actual.every((q,i)=>close(q.l,target[i].l)&&close(q.r,target[i].r));
  return {status:'incorrect',message:sameBounds?'Границы найдены. Проверьте, какие из них входят в ответ: круглые и квадратные скобки имеют значение.':'Пока не сходится. Проверьте ОДЗ, знаки на промежутках и граничные случаи. Ответ пока остаётся скрытым.'};
}

export function checkTaskAnswer(input, task) {

  if(task.ege>=1 && task.ege<=12){
    const canonical=value=>{
      const s=value.trim().replace(/^−/,'-').replace(',','.');
      if(!/^-?\d+(?:\.\d+)?$/.test(s))return null;
      const [whole,tail='']=s.replace(/^-/,'').split('.');
      const w=whole.replace(/^0+(?=\d)/,''),f=tail.replace(/0+$/,'');
      return (s.startsWith('-')&&(w!=='0'||f)?'-':'')+w+(f?'.'+f:'');
    };
    const value=canonical(input);
    if(value===null)return {status:'format',message:'Введи целое число или конечную десятичную дробь без единиц измерения.'};
    return value===canonical(task.answer)?{status:'correct',message:'Верно! Числовой ответ совпал.'}:{status:'incorrect',message:'Ответ пока не совпал. Проверь вычисления.'};
  }
  if(task.inputFormat==='expression'){
    try{if(!Number.isFinite(numberValue(input)))throw Error();}catch{return {status:'format',message:'Нужно одно число, дробь или выражение с корнем.'};}
  }
  if(task.inputFormat==='roots'){
    try{if(parseAnswer(input).some(v=>v.l!==v.r))throw Error();}catch{return {status:'format',message:'Перечисли отдельные корни через точку с запятой.'};}
  }
  const result=checkAnswer(input,task.answer);
  if(result.status==='correct')return {...result,message:task.ege>=13?'Итоговый ответ совпал. Это проверка ответа; обоснование и все пункты решения сверь с разбором самостоятельно.':task.answerKind==='number'?'Верно! Числовой ответ совпал.':result.message};
  if(result.status==='incorrect'&&task.answerKind==='number')return {...result,message:'Пока не совпадает. Проверь вычисления, единицы измерения и то, какую величину требуется найти.'};
  return result;
}
