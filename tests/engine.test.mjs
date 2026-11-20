import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAnswer,checkAnswer,numberValue} from '../public/client/engine.js';
import {tasks} from '../lib/bank/tasks.js';
test('all 18 tasks have parseable answers and hidden guidance',()=>{assert.equal(tasks.length,18);for(const t of tasks){assert.equal(checkAnswer(t.answer,t.answer).status,'correct',t.id);assert.equal(t.hints.length,3);assert.ok(t.steps.length>=3);for(let level=1;level<=3;level++)assert.equal(tasks.filter(q=>q.type===t.type&&q.level===level).length,2);}});
test('equivalent notation, fractions, inequalities and decimal comma',()=>{for(const [a,b] of [
 ['a < 1','(-∞;1)'],['-9/4<a<0','(-2.25;0)'],['x∈(−∞; -2) ∪ (3; +∞)','(3;∞)∪(-∞;-2)'],['[-1,5; 0,25]','[-3/2;1/4]'],['x>=2','[2;∞)'],['a=4','{4}'],['[-3,1]','[-3;1]'],['{1;2;3}','{3}∪{2}∪{1}'],['[0;1]∪(1;2]','[0;2]'],['[0;1)∪{1}∪(1;2]','[0;2]'],['(-∞;1]∪[1;∞)','R'],['[sqrt(2);3]','[√2;3]'],['нет решений','∅'],['0≤x≤1','[0;1]'],['2>x>0','(0;2)'],['1/4 = a','{0.25}']])assert.equal(checkAnswer(a,b).status,'correct',`${a} vs ${b}`);});
test('excluded endpoints and isolated points matter',()=>{for(const [a,b] of [['[-1;0]','[-1;0)'],['(0;∞)','[0;∞)'],['(-∞;-2)∪[-1;∞)','(-∞;-2)∪[-1;1)∪(1;∞)'],['[2;4]','{1}∪[2;4]'],['[0;2)∪{1/4}','[0;2)∪{-1/4}']])assert.equal(checkAnswer(a,b).status,'incorrect');});
test('format mistakes do not count as wrong answers',()=>{for(const a of ['','hello','(3;1)','[−∞;1]','(0;∞]','1/0','Infinity/2','alert(1)','{∞}','(1;1)','1<2','x<','√(-1)','[0;1;2]'])assert.equal(checkAnswer(a,'(0;1)').status,'format',a);});
test('safe numeric expressions',()=>{assert.equal(numberValue('-(3/2)+1'),-.5);assert.equal(numberValue('sqrt(9)/2'),1.5);assert.throws(()=>numberValue('process.exit()'));});
// Independently sample each original mathematical condition against its answer set.
const contains=(ranges,x)=>ranges.some(r=>(x>r.l||r.lc&&x===r.l)&&(x<r.r||r.rc&&x===r.r));
const log2=x=>Math.log2(x),eps=1e-8;
const predicates={
 p1:a=>a<1,p2:a=>a>0,
 p3:a=>{if(a<0)return false;const roots=[];for(const z of [4+a,4-a])if(z>=0){for(const v of z===0?[0]:[-Math.sqrt(z),Math.sqrt(z)])if(!roots.some(q=>Math.abs(q-v)<eps))roots.push(v);}return roots.length===3;},
 p4:a=>{const v=a+2.25;if(v<0)return false;return [...new Set([1.5-Math.sqrt(v),1.5+Math.sqrt(v)])].filter(t=>t>eps).length===2;},
 p5:a=>{const v=a+1;if(v<0)return false;return [...new Set([1-Math.sqrt(v),1+Math.sqrt(v)])].filter(t=>t>=-eps).length===2;},
 p6:a=>{const v=a+.25;if(v<0)return false;return [...new Set([1.5-Math.sqrt(v),1.5+Math.sqrt(v)])].filter(t=>t>eps&&t<2-eps).length===1;},
 i1:x=>(x-1)*(x+3)<=0,i2:x=>x!==3&&(x+2)/(x-3)>0,
 i3:x=>1<Math.abs(2*x-1)&&Math.abs(2*x-1)<=3,
 i4:x=>x!==1&&x!==-2&&(x*x-1)/(x*x+x-2)>=0,
 i5:x=>Math.abs(x*x-4*x+3)<=x-1,
 i6:x=>x!==-1&&x!==3&&(x-2)/(Math.abs(x-1)-2)>=0,
 r1:x=>x>-1&&log2(x+1)-log2(3)>=-eps,
 r2:x=>x>-2&&x<4&&-log2(x+2)>-log2(4-x),
 r3:x=>x>-1&&x!==3&&(log2(x+1)-1)/(x-3)<=eps,
 r4:x=>x>0&&x!==1&&Math.log(x+2)/Math.log(x)<=2+eps,
 r5:x=>x>-1&&x!==0&&x!==2&&(Math.log(x*x)/Math.log(x+1)-2)/(x-2)>=-eps,
 r6:x=>x>-2&&x!==0&&(Math.sqrt(x+3)-2)/(log2(x+2)-1)<=eps
};
for(const t of tasks)test(`original mathematics matches the key: ${t.id}`,()=>{const ranges=parseAnswer(t.answer),values=new Set(Array.from({length:321},(_,i)=>i/16-10));for(const r of ranges)for(const x of [r.l,r.r])if(Number.isFinite(x)){values.add(x);values.add(x-.001);values.add(x+.001);}for(const x of values)assert.equal(contains(ranges,x),predicates[t.id](x),`${t.id} at ${x}`);});
