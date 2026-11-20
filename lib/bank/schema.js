import {lessonsForTask} from '../../public/client/lesson-library.js';
const reference='https://doc.fipi.ru/ege/dlya-predmetnyh-komissiy-subektov-rf/2026/matematika_mr_ege_2026.pdf';
const focuses={
13:'Обоснуй общее решение и отбор всех корней на указанном отрезке.',
14:'Сверь доказательство и вычисления, включая зависимость пункта б) от пункта а).',
15:'Сверь ОДЗ, равносильность переходов, интервалы и каждую границу.',
16:'Проверь модель, порядок начислений и платежей, вычисления и единицы.',
17:'Сверь доказательство геометрических соотношений и расчёт величины.',
18:'Проверь все случаи параметра, число корней и критические значения.',
19:'Проверь каждый пункт, примеры, доказательства невозможности и достижимость оценки.'
};
export function makeTask(t,line){
 return {...t,schemaVersion:1,part:line.part,topic:line.name,subtopic:t.tag,
 responseType:line.part===1?'short':'written',
 inputFormat:line.part===1?'decimal':t.answerKind==='number'?'expression':t.ege===13?'roots':'set',
 lessons:lessonsForTask(t).map(l=>'/lessons/'+l.id+'?task='+t.id),
 figure:t.graph?{kind:'graph',data:t.graph}:t.diagram?{kind:'diagram',model:t.diagram,data:t.audit}:null,
 provenance:{kind:'authored',description:t.source,reference:'https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2026/ma_11_2026.zip'},
 rubric:line.part===2?{maxPoints:[2,3,2,2,3,4,4][t.ege-13],focus:focuses[t.ege],reference}:null};
}
