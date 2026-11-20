import test from 'node:test';
import assert from 'node:assert/strict';
import {tasks} from '../lib/bank/catalog.js';
import {bankTasks} from '../lib/bank/bank.js';
import {tasks as originalTasks} from '../lib/bank/tasks.js';
import {renderTaskVisual} from '../public/client/visuals.js';
import {migrateHintCount,makeTutorPrompt,tutorURL,graphContext} from '../public/client/learning.js';

test('all 2298 tasks have five distinct authored cues, keeping original cues in order',()=>{
 const originals=new Map([...bankTasks,...originalTasks].map(t=>[t.id,t.hints]));for(const t of tasks){assert.equal(t.hints.length,5,t.id);assert.equal(new Set(t.hints).size,5,t.id);assert.ok(t.hints.every(h=>h.length>15),t.id);assert.deepEqual([t.hints[0],t.hints[2],t.hints[4]],originals.get(t.id));}
});
test('existing three-cue progress migrates without opening unseen original cues',()=>{
 assert.deepEqual([0,1,2,3].map(n=>migrateHintCount(n,1)),[0,1,3,5]);
 assert.deepEqual([0,1,2,3,4,5].map(n=>migrateHintCount(n,2)),[0,1,2,3,4,5]);
 assert.equal(migrateHintCount(99,2),5);assert.equal(migrateHintCount(-1,2),0);
});
test('every first-part geometry task has a named, annotated figure',()=>{
 const geometry=tasks.filter(t=>t.ege>=1&&t.ege<=3);assert.equal(geometry.length,360);
 for(const t of geometry){const html=renderTaskVisual(t);assert.match(html,/<svg/,t.id);assert.match(html,/<title>/,t.id);assert.match(html,/<figcaption>/,t.id);assert.ok(!/undefined|NaN|Infinity/.test(html),t.id);assert.ok(html.includes('aria-label='),t.id);}
 const tangent=tasks.find(t=>t.ege===1&&t.template==='tangent');const html=renderTaskVisual(tangent);assert.ok(html.includes('PA = ?'));assert.ok(html.includes(`PB = ${4*tangent.audit.k}`));assert.ok(html.includes(`BC = ${5*tangent.audit.k}`));
 const unknown=tasks.find(t=>t.ege===2&&t.template==='orthogonal');assert.ok(renderTaskVisual(unknown).includes('b = (t;'));assert.ok(!renderTaskVisual(unknown).includes('t = '));
});
test('all 240 graph tasks include actual SVG, their complete condition and marked coordinates',()=>{
 const graphs=tasks.filter(t=>t.ege<=12&&t.graph);assert.equal(graphs.length,240);
 for(const t of graphs){const html=renderTaskVisual(t);assert.match(html,/<svg/,t.id);assert.match(html,/<figcaption>/,t.id);assert.ok(html.includes(t.prompt.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))),t.id);assert.ok(!/NaN|Infinity|undefined/.test(html),t.id);assert.ok(graphContext(t).includes('Координаты точек кривой'));}
});
test('actual ChatGPT handoff contains condition and staged instructions, never the answer or stored solution',()=>{
 const t={...tasks.find(t=>t.ege===8),answer:'SECRET_ANSWER_VALUE',steps:['SECRET_SOLUTION_VALUE']};
 const prompt=makeTutorPrompt(t,{question:'Почему знак меняется?',stage:'why'});
 assert.ok(prompt.includes(t.prompt));assert.ok(prompt.includes('дожидайся моего ответа'));assert.ok(prompt.includes('непонят')||prompt.includes('ключевого перехода'));assert.ok(prompt.includes('Почему знак меняется?'));assert.ok(prompt.includes('Координаты точек кривой'));
 assert.ok(!prompt.includes(t.answer));assert.ok(!prompt.includes(t.steps[0]));
 const url=new URL(tutorURL(prompt));assert.equal(url.origin,'https://chatgpt.com');assert.equal(url.searchParams.get('q'),prompt);
 const noDraft=makeTutorPrompt(t);assert.ok(!noDraft.includes('Мой черновик:'));
 const withDraft=makeTutorPrompt(t,{working:'Начал с ОДЗ',stage:'check'});assert.ok(withDraft.includes('Мой черновик: Начал с ОДЗ'));assert.ok(withDraft.includes('первую найденную ошибку'));
});
test('every task can be passed to a real tutor without a fake in-page model response',()=>{
 for(const t of tasks){const prompt=makeTutorPrompt(t);assert.ok(prompt.length<6000,t.id);assert.ok(prompt.includes(`Задание №${t.ege}`));assert.ok(prompt.includes(t.prompt));}
});
const luminance=hex=>{const rgb=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
test('main text, secondary reading text and action buttons exceed WCAG AA contrast',()=>{
 const pairs=[['#17283d','#ffffff'],['#445a70','#ffffff'],['#41576c','#ffffff'],['#ffffff','#285f39'],['#ffffff','#244f82'],['#243c27','#eff5e9'],['#4e6245','#eff5e9'],['#d9e3ef','#192d46'],['#38536a','#ffffff'],['#22364c','#ffffff']];
 for(const [fg,bg]of pairs){const l=[luminance(fg),luminance(bg)].sort((a,b)=>b-a),ratio=(l[0]+.05)/(l[1]+.05);assert.ok(ratio>=4.5,`${fg} on ${bg}: ${ratio}`);}
});
