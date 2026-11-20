import {tasks as legacyTasks,levelNames} from './tasks.js';
import {bankTasks,examLines} from './bank.js';
import {fiveHints} from '../../public/client/learning.js';
import {makeTask} from './schema.js';
import {selectTasks} from '../../public/client/filters.js';
export {examLines,levelNames};
export const tasks=[...legacyTasks.map(t=>({...t,ege:t.type==='parameters'?18:15,type:t.type==='parameters'?'n18':'n15',template:`legacy-${t.id}`,variant:1,answerKind:'set',answerLabel:'Твой ответ',source:'Авторская задача · исходная подборка',criteria:['ОДЗ и все ограничения записаны.','Переходы обоснованы, граничные случаи проверены.','Полученный ответ соответствует условию.']})),...bankTasks].map(t=>makeTask({...t,hints:fiveHints(t)},examLines[t.ege-1]));
export const filterTasks = filters => selectTasks(tasks,filters);
