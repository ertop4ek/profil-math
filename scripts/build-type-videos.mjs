import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {promisify} from 'node:util';
import {tasks} from '../lib/bank/catalog.js';
import {topicKey, topicMethods} from '../public/client/topic-methods.js';

const run = promisify(execFile);
const destination = resolve('pages-dist/videos');
const temp = await mkdtemp(join(tmpdir(), 'profil-videos-'));
const examples = new Map();
for (const task of tasks) {
  const key = topicKey(task);
  if (!examples.has(key) || task.variant === 2) examples.set(key, task);
}

const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360
WrapStyle: 0
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Body,DejaVu Sans,23,&H00FFFFFF,&H00FFFFFF,&H001E1010,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,38,38,18,1
Style: Top,DejaVu Sans,17,&H00E6C683,&H00FFFFFF,&H001E1010,&H00000000,1,0,0,0,100,100,0,0,1,0,0,8,30,30,20,1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text`;

const clock = seconds => `0:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.00`;
const clean = text => String(text ?? '').replace(/[{}\\]/g, ' ').replace(/\s+/g, ' ').trim();
function paginate(text) {
  const chunks = [];
  let line = '';
  for (const word of clean(text).split(' ')) {
    if (line && line.length + word.length > 230) {
      chunks.push(line);
      line = '';
    }
    line += (line ? ' ' : '') + word;
  }
  if (line) chunks.push(line);
  return chunks;
}
function scenes(task, key) {
  const [title, method, formula, caution] = topicMethods[key];
  const condition = [task.prompt, task.plain].filter(Boolean).join(' ');
  return [
    ['Учебный пример', task.title],
    ['Условие', condition],
    ['Метод · ' + title, method],
    ['Формула', formula],
    ...task.steps.map((step, index) => [`Шаг ${index + 1} из ${task.steps.length}`, step]),
    ['Что проверить', caution],
    ['Ответ учебного примера', task.answer],
  ].flatMap(([label, body]) => paginate(body).map(text => [label, text]));
}
async function encode(key, task) {
  let end = 0;
  const entries = [];
  for (const [label, body] of scenes(task, key)) {
    const start = end;
    end += Math.max(5, Math.ceil(body.length / 15));
    const prefix = `Dialogue: 0,${clock(start)},${clock(end)},`;
    entries.push(prefix + 'Top,,0,0,0,,№' + task.ege + ' · ' + clean(label));
    entries.push(prefix + 'Body,,0,0,0,,' + body);
  }
  const subtitle = key + '.ass';
  await writeFile(join(temp, subtitle), [header, ...entries, ''].join('\n'));
  await run('ffmpeg', [
    '-v', 'error', '-nostdin', '-f', 'lavfi', '-i', 'color=c=0x131f35:s=640x360:r=2',
    '-t', String(end), '-vf', 'ass=' + subtitle, '-c:v', 'libx264', '-threads', '1',
    '-preset', 'fast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-y', join(destination, key + '.mp4'),
  ], {cwd:temp});
}

try {
  await mkdir(destination, {recursive:true});
  const items = [...examples];
  for (let index = 0; index < items.length; index += 6) {
    await Promise.all(items.slice(index, index + 6).map(([key, task]) => encode(key, task)));
  }
  const manifest = Object.fromEntries(items.map(([key, task]) => [key, task.id]));
  await writeFile('pages-dist/client/type-video-manifest.js', `export default ${JSON.stringify(manifest)};\n`);
  console.log(`Encoded ${items.length} MP4 explanations`);
} finally {
  await rm(temp, {recursive:true,force:true});
}
