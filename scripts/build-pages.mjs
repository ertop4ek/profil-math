import {mkdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {tasks} from '../lib/bank/catalog.js';
import {publicCatalogue} from '../lib/bank/public.js';
const out='pages-dist';
await rm(out,{recursive:true,force:true});
await mkdir(out+'/data',{recursive:true});
await cp('public/client',out+'/client',{recursive:true});
const source=await readFile('app/template.ts','utf8');
const template=JSON.parse(source.slice(source.indexOf('=')+1).trim().replace(/;$/,''));
const css=(await readFile('app/globals.css','utf8'))+'\n'+await readFile('app/website.css','utf8');
await writeFile(out+'/style.css',css);
await cp('public/favicon.svg',out+'/favicon.svg');
await writeFile(out+'/.nojekyll','');
await writeFile(out+'/index.html','<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Профиль — тренажёр математики</title><link rel="icon" href="./favicon.svg"><link rel="stylesheet" href="./style.css"></head><body>'+template+'<script type="module" src="./client/app.js"></script></body></html>');
await writeFile(out+'/404.html',await readFile(out+'/index.html','utf8'));
await writeFile(out+'/data/catalog.json',publicCatalogue());
await writeFile(out+'/data/index.json',JSON.stringify({version:1,numbers:Object.fromEntries(tasks.map(t=>[t.id,t.ege]))}));
for(let n=1;n<=19;n++)await writeFile(out+'/data/'+n+'.json',JSON.stringify(tasks.filter(t=>t.ege===n).map(({graph,audit,...t})=>t)));
await cp('deploy/pages/runtime.js',out+'/client/runtime.js');
for(const name of ['app.js','catalog.js','lesson-library.js']){
 let text=await readFile(out+'/client/'+name,'utf8');
 text="import {fetchStatic as fetch,location,history} from './runtime.js';\n"+text;
 if(name==='app.js'){
  text=text.replace("function startCloud(){cloud=createCloud", "function startCloud(){ $('#cloudStatus').textContent='Прогресс хранится на этом устройстве';cloud=createCloud");
  const start=text.indexOf('function startCloud(){'),end=text.indexOf('function applyRoute()',start);
  text=text.slice(0,start)+"function startCloud(){ $('#cloudStatus').textContent='Прогресс хранится на этом устройстве'; }\n"+text.slice(end);
  text=text.replace("$('#syncNow').addEventListener('click',()=>cloud?.synchronize())","$('#syncNow').addEventListener('click',()=>{save();$('#transferStatus').textContent='Сохранено на этом устройстве.';})");
  text=text.replace("location.origin+'/practice/'","window.location.href.split('#')[0]+'#/practice/'");
  const tutor=text.indexOf('function openTutor(){'),tutorEnd=text.indexOf("$('#openTutor').addEventListener",tutor);
  text=text.slice(0,tutor)+"function openTutor(){openDialog('Пошаговый ИИ-разбор','<p>ИИ-сервис пока не настроен. Пять подсказок и готовое решение доступны в карточке задания.</p>');}\n"+text.slice(tutorEnd);
 }
 text=text.replaceAll('Сервер проверяет итоговый ответ.','Браузер проверяет итоговый ответ.').replaceAll('Прогресс хранится на устройстве и в базе сайта.','Прогресс хранится в этом браузере.').replaceAll('Для браузера создаётся случайная сессия без имени и почты. Без аккаунта другой браузер начинает отдельную практику.','Другой браузер начинает отдельную практику.').replaceAll('ChatGPT работает в отдельной вкладке, где может потребоваться вход.','Интерактивный ИИ-сервис пока не настроен.');
 await writeFile(out+'/client/'+name,text);
}
console.log('Static build ready: '+out+', '+tasks.length+' tasks, 19 data sections');
