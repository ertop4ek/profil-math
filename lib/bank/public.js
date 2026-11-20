import {tasks,examLines,levelNames} from './catalog.js';
import {renderTaskVisual} from '../../public/client/visuals.js';
import {graphContext} from '../../public/client/learning.js';
let cached;
export function publicCatalogue(){
 return cached??=JSON.stringify({examLines,levelNames,tasks:tasks.map(t=>{
 const {id,ege,type,part,topic,subtopic,title,tag,level,template,variant,prompt,plain,formula,answerKind,answerLabel,hints,inputFormat}=t;
 return {id,ege,type,part,topic,subtopic,title,tag,level,template,variant,prompt,plain,formula,answerKind,answerLabel,hints,inputFormat,visual:renderTaskVisual(t),graph:!!t.graph,graphDescription:graphContext(t)};
 })});
}
