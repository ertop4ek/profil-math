export function selectTasks(tasks, f={}){
 const q=(f.query||'').trim().toLocaleLowerCase('ru');
 return tasks.filter(t=>(!f.ege||t.ege===Number(f.ege))&&(!f.part||t.part===Number(f.part))&&(!f.topic||t.topic===f.topic||t.subtopic===f.topic)&&(!f.level||t.level===Number(f.level))&&(!f.tag||t.tag===f.tag)&&(!f.status||f.status==='all'||(f.status==='unsolved'?!f.records?.[t.id]?.solved:f.status==='solved'?!!f.records?.[t.id]?.solved:!!f.records?.[t.id]?.seenSolution))&&(!q||[t.id,t.ege,t.title,t.prompt,t.tag,t.topic].join(' ').toLocaleLowerCase('ru').includes(q)));
}
