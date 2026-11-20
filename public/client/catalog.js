import {selectTasks} from './filters.js';
const response=await fetch('/api/catalog');
if(!response.ok)throw Error('Не удалось загрузить банк заданий.');
export const {tasks,examLines,levelNames}=await response.json();
export const filterTasks=f=>selectTasks(tasks,f);
