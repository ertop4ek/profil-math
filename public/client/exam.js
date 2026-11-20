import {esc} from './ui-shared.js';
const key='profile-math-exam-v1';
export function createExam({tasks,examLines,host,check,solution}){
 let exam=null,index=0;
 try{
  const saved=JSON.parse(localStorage.getItem(key));
  if(saved?.version===1&&saved.ids?.length===19&&saved.ids.every((id,i)=>tasks.some(t=>t.id===id&&t.ege===i+1)))exam=saved;
 }catch{}
 function save(){try{localStorage.setItem(key,JSON.stringify(exam));}catch{host.querySelector('[role=status]').textContent='Сохранение недоступно. Оставь страницу открытой.';}}
 function newExam(){
  exam={version:1,ids:examLines.map(line=>{const list=tasks.filter(t=>t.ege===line.number);return list[Math.floor(Math.random()*list.length)].id;}),startedAt:Date.now(),finishedAt:null,answers:{},working:{},later:{},results:{},checks:{}};
  index=0;save();render();
 }
 function render(){
  if(!exam){host.innerHTML='<h1>Пробный ЕГЭ</h1><p>19 номеров · 235 минут. До завершения доступны условия, ответы и черновики. После завершения — проверка и разборы.</p><button class="primary" id="startExam">Начать вариант</button>';host.querySelector('button').onclick=newExam;return;}
  const task=tasks.find(t=>t.id===exam.ids[index]);
  if(exam.finishedAt){renderResults();return;}
  const remaining=Math.max(0,235*60000-(Date.now()-exam.startedAt));
  host.innerHTML=`<h1>Пробный ЕГЭ</h1><p>Осталось по таймеру <strong id="examTimer">${Math.floor(remaining/60000)} мин</strong>. Время начала и ответы сохраняются на устройстве.</p>
  <div class="exam-numbers">${exam.ids.map((id,i)=>`<button data-exam-index="${i}" aria-pressed="${i===index}">${i+1}${exam.later[id]?' ★':''}</button>`).join('')}</div>
  <article class="exam-panel"><h2>№${task.ege} · ${esc(task.title)}</h2><p>${esc(task.prompt)}</p><div class="lesson-formula">${task.formula||''}</div>${task.visual||''}
  <label for="examAnswer">${esc(task.answerLabel||'Ответ')}</label><input id="examAnswer" maxlength="1000" value="${esc(exam.answers[task.id]||'')}">
  <label for="examWorking">Черновик / полное решение</label><textarea id="examWorking" maxlength="12000">${esc(exam.working[task.id]||'')}</textarea>
  <label><input type="checkbox" id="examLater" ${exam.later[task.id]?'checked':''} style="width:auto">Вернуться позже</label></article>
  <div class="exam-actions"><button id="finishExam" class="primary">Завершить вариант</button></div><p role="status"></p>`;
  host.querySelectorAll('[data-exam-index]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.examIndex);render();});
  for(const [selector,field] of [['#examAnswer','answers'],['#examWorking','working']])host.querySelector(selector).oninput=e=>{exam[field][task.id]=e.target.value;save();};
  host.querySelector('#examLater').onchange=e=>{exam.later[task.id]=e.target.checked;save();};
  host.querySelector('#finishExam').onclick=()=>{
   const b=host.querySelector('#finishExam');b.outerHTML='<p>Завершить и открыть проверку?</p><button id="confirmExam" class="primary">Завершить и проверить</button>';
   host.querySelector('#confirmExam').onclick=finish;
  };
 }
 async function finish(){
  const button=host.querySelector('#confirmExam');button.disabled=true;button.textContent='Проверяем…';
  try{
   const results={};
   for(let i=0;i<12;i++)results[exam.ids[i]]=await check(exam.ids[i],exam.answers[exam.ids[i]]||'');
   exam.results=results;exam.finishedAt=Date.now();save();render();
  }catch{button.disabled=false;button.textContent='Повторить проверку';}
 }
 function renderResults(){
  const score=Object.values(exam.results).filter(r=>r.status==='correct').length;
  host.innerHTML=`<h1>Результат варианта</h1><p>Первая часть — ${score} из 12. Вторая часть — отдельная самопроверка.</p><p>Затрачено ${Math.floor((exam.finishedAt-exam.startedAt)/60000)} мин.</p>
  ${exam.ids.map(id=>{const t=tasks.find(t=>t.id===id);return `<section class="exam-panel"><h2>№${t.ege} · ${esc(t.title)}</h2><p>${t.ege<=12?esc(exam.results[id]?.message||''):'Сверь каждый пункт по эталону и критериям.'}</p><p>Твой ответ — ${esc(exam.answers[id]||'не указан')}</p><pre style="white-space:pre-wrap">${esc(exam.working[id]||'')}</pre><div class="exam-actions"><a href="/practice/${id}">Условие</a><a href="/lessons?task=${id}&number=${t.ege}">Уроки</a><button data-exam-solution="${id}">Открыть решение</button></div><div data-exam-result="${id}"></div></section>`;}).join('')}
  <details><summary>Новый вариант</summary><p>Текущий результат будет заменён после начала нового варианта.</p><button id="newExam">Начать новый вариант</button></details><p role="status"></p>`;
  host.querySelector('#newExam').onclick=newExam;
  host.querySelectorAll('[data-exam-solution]').forEach(b=>b.onclick=async()=>{
   b.disabled=true;
   try{
    const id=b.dataset.examSolution,s=await solution(id),box=host.querySelector('[data-exam-result="'+id+'"]');
    box.innerHTML=(s.rubric?'<p>'+esc(s.rubric.focus)+' <a target="_blank" rel="noopener" href="'+esc(s.rubric.reference)+'">Критерии ФИПИ</a></p>':'')+'<ol>'+s.steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol><p>Ответ — '+esc(s.answer)+'</p>';
    if(tasks.find(t=>t.id===id).ege>=13){
     box.insertAdjacentHTML('beforeend',(s.criteria||[]).map((c,i)=>`<label style="display:block"><input type="checkbox" data-exam-check="${i}" style="width:auto" ${exam.checks[id]?.[i]?'checked':''}>${esc(c)}</label>`).join(''));
     box.querySelectorAll('[data-exam-check]').forEach(input=>input.onchange=()=>{(exam.checks[id]??=[])[Number(input.dataset.examCheck)]=input.checked;save();});
    }
   }catch{b.disabled=false;b.textContent='Повторить загрузку';}
  });
 }
 setInterval(()=>{const timer=host.querySelector('#examTimer');if(timer&&exam&&!exam.finishedAt)timer.textContent=Math.max(0,Math.ceil((235*60000-Date.now()+exam.startedAt)/60000))+' мин';},30000);
 return {render};
}
