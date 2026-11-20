import test from 'node:test';
import assert from 'node:assert/strict';
import {tasks} from '../lib/bank/catalog.js';
import {guides,deepMethods,lessonsForTask,relatedExample,lessonBody,fullGuideHTML,lessonCards,externalForTask,sourceCards,topicKey} from '../public/client/lesson-library.js';
import {topicMethods} from '../public/client/topic-methods.js';
import {lessonSources} from '../public/client/lesson-sources.js';

test('all 2298 tasks have seven navigable lessons and multiple direct topic resources',()=>{
 for(const t of tasks){const deck=lessonsForTask(t,tasks);assert.equal(deck.length,7,t.id);assert.equal(new Set(deck.map(l=>l.id)).size,7,t.id);assert.ok(deck.every(l=>l.number===t.ege),t.id);assert.deepEqual(deck.map(l=>l.kind),['basics','formulas','algorithm','type','example','errors','check']);assert.ok(externalForTask(t).length>=2,t.id);}
 const keys=new Set(tasks.map(topicKey));assert.equal(keys.size,94);assert.deepEqual(new Set(Object.keys(topicMethods)),keys);
});
test('every worked example differs from the active condition and retains figures for visual tasks',()=>{
 for(const t of tasks){const e=relatedExample(t,tasks);assert.ok(e.steps.length>0&&e.answer,t.id);if(t.template.startsWith('legacy-')){assert.equal(e.source,'Отдельный учебный пример');continue;}
 const other=tasks.find(x=>x.id===e.taskId);assert.ok(other&&other.id!==t.id,t.id);assert.equal(other.template,t.template);assert.equal(other.ege,t.ege);assert.notEqual(JSON.stringify([other.prompt,other.plain,other.graph]),JSON.stringify([t.prompt,t.plain,t.graph]));assert.equal(e.answer,other.answer);if(t.graph||(t.ege>=1&&t.ege<=3))assert.match(e.visual,/<svg/);
 }
});
test('lesson routes render complete content for all tasks without leaking the active solution',()=>{
 for(const t of tasks){const secretTask={...t,answer:'PRIVATE_ACTIVE_ANSWER',steps:['PRIVATE_ACTIVE_STEPS']};for(const l of lessonsForTask(secretTask,tasks)){const html=lessonBody(l,secretTask,tasks);assert.ok(html.length>250,t.id+l.kind);assert.doesNotMatch(html,/undefined|NaN|PRIVATE_ACTIVE_ANSWER|PRIVATE_ACTIVE_STEPS/);if(l.kind==='example'){assert.match(html,/<details class="example-solution">/);assert.doesNotMatch(html,/<details[^>]*\bopen\b/);}}}
});
test('each exam line has a detailed guide with prerequisites, formulas, algorithm and independent worked example',()=>{
 assert.equal(Object.keys(guides).length,19);for(let n=1;n<=19;n++){const g=guides[n];assert.ok(g.basics.length>=3);assert.ok(g.formulas.length>=2);assert.ok(g.algorithm.length>=5);assert.ok(g.errors.length>=3);assert.ok(g.check.length>=3);const html=fullGuideHTML(n);assert.match(html,/Формулы с ограничениями/);assert.match(html,/Пошаговый алгоритм/);assert.match(html,/Частые ошибки/);assert.match(html,/example-solution/);assert.ok(html.length>1800);}
 assert.equal(deepMethods.length,3);assert.ok(deepMethods.find(x=>x.id==='function-parameter').title.includes('дискриминанта'));
});
test('lesson search, progress markings, safe escaping and direct external links',()=>{
 const t=tasks.find(x=>x.ege===18&&x.template==='exponential'),l=lessonsForTask(t,tasks)[3];assert.ok(lessonCards(t,tasks,{[l.id]:true}).includes('✓ Изучено'));assert.equal(lessonCards(t,tasks,{},'zzz-no-such-lesson'),'');assert.ok(lessonCards(t,tasks,{},'ФОРМУЛЫ').includes('Формулы'));assert.ok(!lessonCards(t,tasks,{},'<script>').includes('<script>'));
 for(const s of Object.values(lessonSources)){const url=new URL(s.url);assert.equal(url.protocol,'https:');assert.ok(['ege-study.ru','trushinbv.ru','ege.sdamgia.ru'].includes(url.hostname));assert.ok(!url.pathname.includes('search'));assert.equal(s.checked,'2026-11-18');assert.ok(s.title&&s.description&&s.provider);}
 const html=sourceCards(t);assert.match(html,/target="_blank" rel="noopener noreferrer"/);assert.match(html,/Графический метод/);
});
