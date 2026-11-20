export function migrateRecord(record={}){
 const attempts=Number.isSafeInteger(record.attempts)?Math.max(0,record.attempts):0;
 return {...record,attempts,measuredAttempts:Math.min(attempts,Math.max(0,Number(record.measuredAttempts)||0)),correctAttempts:Math.min(attempts,Math.max(0,Number(record.correctAttempts)||0)),
 lastResult:['correct','incorrect'].includes(record.lastResult)?record.lastResult:null,
 hadError:record.hadError===true||record.feedback?.status==='incorrect',
 selfChecked:record.selfChecked===true};
}
export function progressSummary(tasks,records){
 return tasks.map(t=>({...t,record:migrateRecord(records[t.id])})).reduce((out,t)=>{
  const r=t.record,line=out.lines[t.ege]??={attempts:0,measuredAttempts:0,correct:0,solved:0,selfChecked:0};
  line.attempts+=r.attempts;line.measuredAttempts+=r.measuredAttempts;line.correct+=r.correctAttempts;line.solved+=r.solved?1:0;line.selfChecked+=r.selfChecked?1:0;
  if(r.hadError&&r.lastResult!=='correct')out.errors.push(t);
  return out;
 },{lines:{},errors:[]});
}
export function validateBackup(input,ids){
 if(input?.format!=='profile-math-progress'||![1,2].includes(input.version)||!input.document?.practice?.records||typeof input.document.practice.records!=='object'||Array.isArray(input.document.practice.records))throw Error('Неподдерживаемый формат файла прогресса.');
 const document=input.document;
 for(const [id,r] of Object.entries(document.practice.records)){
  if(!ids.has(id))throw Error('Файл содержит неизвестное задание '+id);
  if(!r||typeof r!=='object'||Array.isArray(r)||typeof r.answer!=='string'||(r.working!==undefined&&typeof r.working!=='string')||!Number.isSafeInteger(r.attempts)||r.attempts<0||r.attempts>100000)throw Error('Повреждена запись '+id);
 }
 return document;
}
