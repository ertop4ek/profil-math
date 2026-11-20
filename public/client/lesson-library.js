import {guides,deepMethods} from './guides.js';
import {topicMethods,topicKey} from './topic-methods.js';
import {lessonSources,sourcesByNumber} from './lesson-sources.js';
import {esc} from './ui-shared.js';
import {renderTaskVisual} from './visuals.js';
export {guides,deepMethods,topicKey};
const list=(items,ordered=false)=>`<${ordered?'ol':'ul'}>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</${ordered?'ol':'ul'}>`;
const formulas=items=>items.map(x=>`<div class="lesson-formula">${esc(x)}</div>`).join('');
export function relatedExample(task,allTasks){
 if(task.template.startsWith('legacy-'))return {...guides[task.ege].example,source:'Отдельный учебный пример'};
 const signature=t=>JSON.stringify([t.prompt,t.plain,t.graphDescription||t.graph]);
 const sample=allTasks.find(t=>t.ege===task.ege&&t.template===task.template&&t.id!==task.id&&signature(t)!==signature(task));
 if(!sample)throw new Error(`No independent example for ${task.id}`);
 return {prompt:sample.prompt,formula:sample.formula,plain:sample.plain,steps:sample.steps,answer:sample.answer,visual:renderTaskVisual(sample),source:`Тот же тип · другой вариант ${sample.variant}`,taskId:sample.id};
}
export function lessonsForTask(task,allTasks){
 const g=guides[task.ege],key=topicKey(task),topic=topicMethods[key];
 if(!g||!topic)throw new Error(`Missing lesson mapping: ${key}`);
 return [
 {id:`n${task.ege}-basics`,kind:'basics',title:'Основы и понятия',description:g.basics[0],label:'Начни здесь',number:task.ege},
 {id:`n${task.ege}-formulas`,kind:'formulas',title:'Формулы и условия применения',description:'Что означают обозначения и когда формулы работают.',label:'Теория',number:task.ege},
 {id:`n${task.ege}-algorithm`,kind:'algorithm',title:'Алгоритм от условия до проверки',description:g.algorithm[0],label:'По шагам',number:task.ege},
 {id:`type-${key}`,kind:'type',title:topic[0],description:topic[1],label:'Именно этот тип',number:task.ege},
 {id:`example-${key}`,kind:'example',title:'Разобранный пример этого типа',description:'Другое условие: сначала попробуй сам, затем открой подробный разбор.',label:'Практикум',number:task.ege},
 {id:`n${task.ege}-errors`,kind:'errors',title:'Ошибки и способы их заметить',description:g.errors[0],label:'Разбор ошибок',number:task.ege},
 {id:`n${task.ege}-check`,kind:'check',title:'Самопроверка решения',description:'Вопросы, которые помогают проверить ход решения и оформление.',label:'Закрепление',number:task.ege}
 ];
}
export function externalForTask(t){return sourcesByNumber[t.ege].map(id=>({...lessonSources[id],id}));}
export const additionalForTask=t=>deepMethods.filter(m=>m.numbers.includes(t.ege));
export function exampleHTML(e){return `<p class="lesson-kicker">${esc(e.source||'Отдельный учебный пример')}</p><p class="lesson-example-condition">${esc(e.prompt)}</p>${e.formula?`<div class="example-math" role="math" aria-label="${esc(e.plain||'')}">${e.formula}</div>`:''}${e.visual?`<div class="lesson-example-visual">${e.visual}</div>`:''}<details class="example-solution"${e.taskId&&!e.steps?` data-example-id="${esc(e.taskId)}"`:''}><summary>Открыть разбор учебного примера</summary>${e.steps?`${list(e.steps,true)}<p class="example-answer"><strong>Ответ примера:</strong> ${esc(e.answer)}</p>`:'<div data-example-result></div>'}</details>`;}
export function lessonBody(lesson,task,allTasks){const g=guides[task.ege],topic=topicMethods[topicKey(task)];switch(lesson.kind){
 case 'basics':return `<p>${esc(g.intro)}</p><h3>Разберись с понятиями</h3>${list(g.basics)}<div class="lesson-callout">Попробуй объяснить каждое понятие своими словами. Если термин непонятен, сначала уточни его, а затем переходи к формулам.</div>`;
 case 'formulas':return `<p>Формула полезна вместе с условиями её применения. Перед подстановкой назови смысл каждой буквы.</p>${formulas(g.formulas)}<h3>Как пользоваться</h3>${list(['Сверь область определения и ограничения.','Запиши формулу в буквенном виде.','Подставь данные, сохранив скобки и единицы.','Оцени знак и порядок величины ответа.'],true)}`;
 case 'algorithm':return `<p>${esc(g.intro)}</p><h3>Порядок действий</h3>${list(g.algorithm,true)}<h3>Проверь результат</h3>${list(g.check)}`;
 case 'type':return `<p>${esc(topic[1])}</p>${formulas([topic[2]])}<h3>Тонкость этого типа</h3><div class="lesson-callout">${esc(topic[3])}</div><h3>Примени приём</h3>${list(['Назови элементы или выражения своего условия, которые соответствуют буквам в формуле.','Запиши первый переход самостоятельно.','Проверь ограничения до вычислений.','Вернись к тренировке и закончи решение.'],true)}<p class="support-note">Это объяснение общего приёма. Числа и ответ текущей задачи здесь не подставлены.</p>`;
 case 'example':return `<p>Пример использует тот же приём, но другое условие. Решение твоего задания остаётся скрытым.</p>${exampleHTML(relatedExample(task,allTasks))}`;
 case 'errors':return `<p>Проверяй не только вычисления, но и равносильность переходов.</p>${g.errors.map((e,i)=>`<section class="lesson-error"><h3>Ловушка ${i+1}</h3><p>${esc(e)}</p></section>`).join('')}<h3>Что проверить вместо догадки</h3>${list(g.check)}<div class="lesson-callout">Если нашёл ошибку, исправь первый неверный переход и пересчитай последующие шаги.</div>`;
 case 'check':return `<p>Пройди список после собственного решения. Отметки помогут организовать проверку, но не являются оценкой эксперта ЕГЭ.</p><div class="lesson-checklist">${[...g.check,'Я могу объяснить каждый переход словами.','Я ответил на точный вопрос и проверил граничные случаи.'].map((c,i)=>`<label><input type="checkbox" data-lesson-check="${i}"><span>${esc(c)}</span></label>`).join('')}</div><h3>Если что-то не сходится</h3><p>Вернись к алгоритму, найди шаг, после которого возникло сомнение, и проверь его на отдельном простом примере.</p>`;
 default:throw new Error('Unknown lesson kind');
}}
export function fullGuideHTML(number){const g=guides[number];return `<p>${esc(g.intro)}</p><h3>Что нужно понимать</h3>${list(g.basics)}<h3>Формулы с ограничениями</h3>${formulas(g.formulas)}<h3>Пошаговый алгоритм</h3>${list(g.algorithm,true)}<h3>Отдельный учебный пример</h3>${exampleHTML(g.example)}<h3>Частые ошибки</h3>${list(g.errors)}<h3>Проверка перед ответом</h3>${list(g.check)}`;}
export function deepMethodHTML(method){return `<p>${esc(method.intro)}</p><h3>Опорные формулы</h3>${formulas(method.formulas)}<h3>Порядок действий</h3>${list(method.steps,true)}<h3>Пример</h3>${exampleHTML(method.example)}<div class="lesson-callout">${esc(method.check)}</div>`;}
export function lessonCards(task,allTasks,completed={},query=''){const q=query.toLocaleLowerCase('ru').trim();return lessonsForTask(task,allTasks).filter(l=>!q||`${l.title} ${l.description} ${l.label} ${task.tag}`.toLocaleLowerCase('ru').includes(q)).map((l,i)=>`<button class="lesson-card ${completed[l.id]?'lesson-complete':''}" data-open-lesson="${esc(l.id)}"><span class="lesson-card-top"><span>${esc(l.label)}</span><b>${completed[l.id]?'✓ Изучено':String(i+1).padStart(2,'0')}</b></span><h3>${esc(l.title)}</h3><p>${esc(l.description)}</p><span class="lesson-card-link">Открыть урок</span></button>`).join('');}
export function sourceCards(task,query=''){const q=query.toLocaleLowerCase('ru').trim();return externalForTask(task).filter(s=>!q||`${s.title} ${s.description} ${s.provider}`.toLocaleLowerCase('ru').includes(q)).map(s=>`<a class="lesson-source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span class="lesson-source-meta">${esc(s.provider)} · ${esc(s.format)}</span><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p><span>Открыть на сайте автора</span></a>`).join('');}

if(typeof document!=='undefined')document.addEventListener('toggle',async event=>{
 const details=event.target;
 if(!details.matches?.('details[data-example-id]')||!details.open)return;
 const box=details.querySelector('[data-example-result]');
 if(box.dataset.loaded)return;
 box.textContent='Загружаем разбор…';
 try{
  const response=await fetch('/api/solution?id='+encodeURIComponent(details.dataset.exampleId));
  if(!response.ok)throw Error();
  const solution=await response.json();
  box.innerHTML=list(solution.steps,true)+'<p>Ответ примера — '+esc(solution.answer)+'</p>';
  box.dataset.loaded='true';
 }catch{box.textContent='Загрузка не удалась. Закрой и открой разбор ещё раз.';}
},true);
