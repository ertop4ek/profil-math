import test from 'node:test';
import assert from 'node:assert/strict';
import {tasks,filterTasks,examLines} from '../lib/bank/catalog.js';
import {bankTasks,graphSVG,diagramSVG} from '../lib/bank/bank.js';
import {numberValue,parseAnswer,checkTaskAnswer} from '../public/client/engine.js';
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-6,`${msg}: ${a} vs ${b}`);
const contains=(ranges,x)=>ranges.some(r=>(x>r.l||r.lc&&x===r.l)&&(x<r.r||r.rc&&x===r.r));
const gcd=(a,b)=>b?gcd(b,a%b):a;
const vec={dot:(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len:a=>Math.hypot(...a)};
test('stable bank: 2298 distinct tasks, 76 families, all 19 lines and 3 levels',()=>{
 assert.equal(tasks.length,2298);assert.equal(new Set(tasks.map(t=>t.id)).size,2298);assert.equal(bankTasks.length,2280);assert.equal(examLines.length,19);
 for(const n of examLines){const subset=bankTasks.filter(t=>t.ege===n.number),families=new Set(subset.map(t=>t.template));assert.equal(subset.length,120);assert.equal(families.size,4);assert.deepEqual([...new Set(subset.map(t=>t.level))].sort(),[1,2,3]);for(const f of families){const group=subset.filter(t=>t.template===f);assert.equal(new Set(group.map(t=>t.prompt+' '+t.plain+(t.graph?graphSVG(t.graph):''))).size,30,`${n.number}-${f} must have 30 different conditions`);}}
 for(const t of tasks){assert.equal(checkTaskAnswer(t.answer,t).status,'correct',t.id);assert.equal(t.hints.length,5);assert.ok(t.steps.length);assert.ok(!JSON.stringify(t).includes('undefined'));if(t.ege<=12)assert.match(t.answer,/^-?\d+(\.\d+)?$/,t.id);}
});
test('catalog combinations, search and independent progress filters',()=>{
 assert.equal(filterTasks().length,2298);assert.equal(filterTasks({ege:13}).length,120);assert.equal(filterTasks({ege:15}).length,132);assert.equal(filterTasks({ege:18}).length,126);assert.equal(filterTasks({query:'кредит'}).length,60);
 const one=bankTasks[0];assert.equal(filterTasks({ege:1,tag:one.tag}).length,30);
 const records={[one.id]:{solved:true}};assert.equal(filterTasks({status:'solved',records}).length,1);assert.equal(filterTasks({status:'unsolved',records}).length,2297);assert.equal(filterTasks({query:'нет_такой_темы'}).length,0);
});
test('exact forms with pi, implicit products, fractions and roots',()=>{
 for(const [input,target]of [['3π/2','{3*pi/2}'],['-pi;0;pi/2','{-π;0;π/2}'],['6sqrt(3)/3','2√3'],['(3+1)/2','2'],['sqrt(65)/8','√65/8'],['2^3','8']])assert.equal(checkTaskAnswer(input,{answer:target,ege:13}).status,'correct',input);
 for(const s of ['process.exit()','<img>','1/0','sqrt(-1)','∪[0;1]','[0;1]∪'])assert.equal(checkTaskAnswer(s,{answer:'1'}).status,'format');
});
// Numerical checks use original conditions, independent counting, physical balances,
// vector geometry and direct evaluation rather than just parsing answer keys.
const shortOracles={
 '1-right':(m,a)=>near(a*a,(3*m.k)**2+(4*m.k)**2,'Pythagoras'),
 '1-circle':(m,a)=>near(2*a,2*m.a,'inscribed angle'),
 '1-trapezoid':(m,a)=>near(2*a,m.h*(m.a+m.b),'trapezoid area'),
 '1-tangent':(m,a)=>near(a*a,4*m.k*(4*m.k+5*m.k),'tangent power'),
 '2-dot':(m,a)=>near(a,vec.dot([m.a,m.b],[m.c,m.d]),'dot product'),
 '2-length':(m,a)=>near(a,Math.hypot(m.a+(3*m.k-m.a),m.b+(4*m.k-m.b)),'vector length'),
 '2-orthogonal':(m,a)=>near(vec.dot([m.a,m.b],[a,-m.a*m.b]),0,'orthogonal vectors'),
 '2-space':(m,a)=>near(a,vec.dot([m.k,4*m.k,7*m.k],[m.k,4*m.k,7*m.k]),'squared norm'),
 '3-pyramid':(m,a)=>near(3*a,m.a*m.b*m.h,'pyramid volume'),
 '3-cylinder':(m,a)=>near(a,2*m.r*m.h+2*m.r*m.r,'surface area'),
 '3-sphere':(m,a)=>near(a+(3*m.k)**2,(5*m.k)**2,'cross section'),
 '3-cone':(m,a)=>near((81*m.k-a)*3,81*m.k,'cone ratio'),
 '4-balls':(m,a)=>near(a*100,m.i+5,'favorable balls'),
 '4-tickets':(m,a)=>near(a*200+2*m.i+8,200,'losing tickets'),
 '4-integer':(m,a)=>near(a*100,Array.from({length:100},(_,i)=>i+1).filter(x=>x%2===0&&x<=2*(m.i+1)).length,'count integers'),
 '4-sector':(m,a)=>near(a*100,Array.from({length:100},(_,i)=>i+1).filter(x=>x>=m.i+1&&x<=3*m.i+7).length,'count sectors'),
 '5-independent':(m,a)=>near(a,m.p*m.q+m.p*(1-m.q)+(1-m.p)*m.q,'sum outcomes'),
 '5-binomial':(m,a)=>{let sum=0;for(let mask=0;mask<8;mask++){let successes=0,p=1;for(let j=0;j<3;j++){const hit=!!(mask&(1<<j));successes+=hit;p*=hit?m.p:1-m.p;}if(successes===2)sum+=p;}near(a,sum,'binomial enumeration');},
 '5-bayes':(m,a)=>near(a*(.5*m.p+.5*m.q),.5*m.p,'conditional identity'),
 '5-reliability':(m,a)=>near(a,m.q*(m.p*m.p+2*m.p*(1-m.p)),'system configurations'),
 '6-exponential':(m,a)=>near(m.b**(a-m.h),m.b**m.k,'equation substitution'),
 '6-logarithm':(m,a)=>{assert.ok(a+m.s>0);near(Math.log(a+m.s)/Math.log(m.b),m.k,'log substitution');},
 '6-rational':(m,a)=>{assert.notEqual(a,m.p);near((a-m.p-m.d)/(a-m.p),2,'rational substitution');},
 '6-radical':(m,a)=>near(Math.sqrt(a+m.s),m.a,'radical substitution'),
 '7-powers':(m,a)=>near(a,m.b**(m.n+2)/m.b**m.n,'power division'),
 '7-logs':(m,a)=>near(a,m.m*(Math.log(m.b**m.k)/Math.log(m.b)+Math.log(m.b**3)/Math.log(m.b)),'log evaluation'),
 '7-trig':(m,a)=>{const x=.57;near(a,m.k*Math.sin(x)**2+m.k*Math.cos(x)**2+m.m*Math.tan(x)/Math.tan(x),'trig identity');},
 '7-roots':(m,a)=>near(a,Math.sqrt(3*m.k*m.k)*Math.sqrt(3),'root expression'),
 '8-minimum':(m,a)=>{near(a,m.a,'minimum location');assert.ok((a-.01-m.a)<0&&(a+.01-m.a)>0);},
 '8-increasing':(m,a)=>{near(a,m.b-m.a,'positive derivative interval');assert.ok(-(m.a+.1-m.a)*(m.a+.1-m.b)>0);},
 '8-tangent':(m,a)=>near(a,(1+2*m.k-1)/2,'tangent slope'),
 '8-extrema':(m,a)=>near(a,[m.a,m.b,m.c].filter(x=>{const f=t=>(t-m.a)*(t-m.b)*(t-m.c);return f(x-.01)<0&&f(x+.01)>0;}).reduce((s,x)=>s+x,0),'minima classification'),
 '9-energy':(m,a)=>near(m.m*a*a/2,m.E,'energy balance'),
 '9-electric':(m,a)=>near(a*a/m.R,m.P,'electric power'),
 '9-cooling':(m,a)=>near(m.a+m.d*2**(-a/m.k),m.a+m.d/4,'temperature model'),
 '9-freefall':(m,a)=>near(a*a,20*m.h,'fall model'),
 '10-work':(m,a)=>near(a/(2*m.k)+a/(3*m.k),1,'completed work'),
 '10-motion':(m,a)=>{assert.ok(a>0);near(m.D/a-m.D/(a+3),6,'time difference');},
 '10-alloy':(m,a)=>near(3*m.m*a,m.m*m.p+2*m.m*m.q,'solute balance'),
 '10-average':(m,a)=>near(a,2/(1/m.v+1/m.w),'average speed'),
 '11-line':(m,a)=>near(a,m.c+m.k*3,'linear prediction'),
 '11-parabola':(m,a)=>near(a,m.a*2**2+m.c,'quadratic prediction'),
 '11-hyperbola':(m,a)=>near((a-m.c)*2,m.k,'hyperbola substitution'),
 '11-exponent':(m,a)=>near(a-m.c,m.b**2,'exponential prediction'),
 '12-cubic':(m,a)=>{const f=x=>x**3-3*m.a*m.a*x+m.c;assert.ok(f(a)>f(a-.01)&&f(a)>f(a+.01));},
 '12-segment':(m,a)=>{let max=-Infinity;for(let j=0;j<=200;j++){const x=m.a-2+(m.d+2)*j/200;max=Math.max(max,x*x-2*m.a*x+m.b);}near(a,max,'sample segment maximum');},
 '12-log':(m,a)=>{assert.ok(a>m.a);near(1-m.b/(a-m.a),0,'log stationary point');assert.ok(1-m.b/(a-.01-m.a)<0&&1-m.b/(a+.01-m.a)>0);},
 '12-exp':(m,a)=>{near(1-a+m.a,0,'exponential stationary point');assert.ok(1-(a-.01)+m.a>0&&1-(a+.01)+m.a<0);}
};
for(let line=1;line<=12;line++)test(`all 120 original numerical conditions of line ${line}`,()=>{for(const t of bankTasks.filter(t=>t.ege===line)){const oracle=shortOracles[`${line}-${t.template}`];assert.ok(oracle,t.id);oracle(t.audit,numberValue(t.answer));}});
test('13: root residuals and complete selection for all 120 equations',()=>{
 for(const t of bankTasks.filter(t=>t.ege===13)){const m=t.audit,roots=parseAnswer(t.answer).map(r=>{assert.equal(r.l,r.r);return r.l;});let expected=[];
  if(t.template==='sin'||t.template==='cos'){
   const lo=2*m.m*Math.PI,hi=lo+2*Math.PI,fn=t.template==='sin'?x=>2*Math.sin(x)-1:x=>2*Math.cos(x)**2-Math.cos(x)-1;
   for(const x of roots){assert.ok(x>=lo-1e-7&&x<=hi+1e-7);near(fn(x),0,t.id);}
   const offsets=t.template==='sin'?[1/6,5/6]:[0,2/3,4/3,2];expected=offsets.map(v=>lo+v*Math.PI);
  }else if(t.template==='exponential')expected=[m.h+m.p,m.h+m.q].filter(x=>x>=m.h&&x<=m.h+m.q-1);
  else expected=[2**m.p-m.h,2**m.q-m.h].filter(x=>x>=1-m.h&&x<=2**(m.p+1)-m.h);
  assert.equal(roots.length,expected.length,t.id);roots.forEach((x,i)=>near(x,expected[i],t.id));
 }
});
test('14 and 17: independently verify spatial and plane geometry quantities',()=>{for(const t of bankTasks.filter(t=>t.ege===14||t.ege===17)){const m=t.audit,a=numberValue(t.answer);if(t.ege===14){
 if(t.template==='pyramid')near(a*Math.hypot(m.a,m.a),m.h,t.id);
 if(t.template==='distance'){near(vec.dot([1,-1,1],[1,1,0]),0,t.id);near(a*vec.len([1,-1,1]),m.a,t.id);}
 if(t.template==='skew'){const cross=vec.cross([m.a,0,m.h],[0,m.b,m.h]);near(a*vec.len(cross),Math.abs(vec.dot([m.a,0,0],cross)),t.id);}
 if(t.template==='section'){const c=vec.cross([m.a,0,m.a],[0,m.a,m.a]);near(a,vec.len(c)/2,t.id);}
 }else{
 if(t.template==='inradius')near(a*(3*m.k+4*m.k+5*m.k)/2,3*m.k*4*m.k/2,t.id);
 if(t.template==='trapezoid')near(a,m.a*(m.h*m.a/(m.a+m.b))/2,t.id);
 if(t.template==='centers'){const k=m.k;near(Math.hypot(5*k,12*k),13*k,t.id);near(Math.hypot(9*k,12*k),15*k,t.id);near(a,Math.hypot(7*k-6*k,33*k/8-4*k),t.id);}
 if(t.template==='tangent-trapezoid'){const leg=(m.a+m.b)/2,h=Math.sqrt(leg*leg-((m.b-m.a)/2)**2);near(a,(m.a+m.b)*h/2,t.id);}
 }} });
test('15: every variant agrees with the original inequality on intervals and boundaries',()=>{for(const t of bankTasks.filter(t=>t.ege===15)){const m=t.audit,ranges=parseAnswer(t.answer);let fn;
 if(t.template==='rational')fn=x=>x!==m.c&&(x-m.a)*(x-m.b)/(x-m.c)>=0;
 if(t.template==='logs')fn=x=>x>-m.s&&x!==m.p&&(Math.log2(x+m.s)-m.k)/(x-m.p)<=1e-9;
 if(t.template==='base')fn=x=>x+m.s>0&&x+m.s!==1&&Math.log(x+m.s+2)/Math.log(x+m.s)<=2+1e-9;
 if(t.template==='absolute')fn=x=>Math.abs((x-m.a)*(x-m.a-m.d))<=x-m.a+1e-9;
 const samples=new Set(Array.from({length:161},(_,j)=>j/2-40));for(const r of ranges)for(const x of [r.l,r.r])if(Number.isFinite(x)){samples.add(x);samples.add(x-.001);samples.add(x+.001);}for(const x of samples)assert.equal(contains(ranges,x),fn(x),`${t.id}, x=${x}`);
}});
test('16: payment schedules, interest balances and optimization',()=>{for(const t of bankTasks.filter(t=>t.ege===16)){const m=t.audit,a=numberValue(t.answer);
 if(t.template==='loan'){let debt=m.S,paid=0;for(let y=0;y<m.n;y++){const next=y===m.n-1?0:m.S*(m.n-y-1)/m.n;paid+=debt*1.1-next;debt=next;}near(paid,a,t.id);near(debt,0,t.id);}
 if(t.template==='annuity')near((m.S*1.2-a)*1.2-a,0,t.id);
 if(t.template==='deposit')near((m.S*1.1+a)*1.1,m.F,t.id);
 if(t.template==='profit'){const f=p=>(p-m.c)*(m.a-m.b*p);for(let p=m.c;p<=m.a/m.b;p++)assert.ok(f(a)>=f(p)-1e-6);}
}});
test('18: complete root count cases including excluded t=0 and open endpoints',()=>{for(const t of bankTasks.filter(t=>t.ege===18)){const m=t.audit,ranges=parseAnswer(t.answer),samples=new Set([-10000,-100,-1,0,1,100]);for(const r of ranges)for(const v of [r.l,r.r])if(Number.isFinite(v)){samples.add(v);samples.add(v-.01);samples.add(v+.01);}for(const a of samples){let count=0,target=2;
 if(t.template==='absolute'){target=3;if(a>=0){const roots=[];for(const z of [m.m+a,m.m-a])if(z>=0)for(const x of z===0?[0]:[-Math.sqrt(z),Math.sqrt(z)])if(!roots.includes(x))roots.push(x);count=roots.length;}}
 else {const shift=m.b*m.b+a;if(shift>=0){const all=[...new Set([m.b-Math.sqrt(shift),m.b+Math.sqrt(shift)])];if(t.template==='exponential')count=all.filter(x=>x>1e-8).length;if(t.template==='radical')count=all.filter(x=>x>=-1e-8).length;if(t.template==='interval'){target=1;count=all.filter(x=>x>1e-8&&x<m.R-1e-8).length;}}else if(t.template==='interval')target=1;}
 assert.equal(contains(ranges,a),count===target,`${t.id}, a=${a}`);
 }} });
test('19: brute-force digit minima, diophantine maxima and divisibility bounds',()=>{for(const t of bankTasks.filter(t=>t.ege===19)){const m=t.audit,a=numberValue(t.answer);
 if(t.template==='gcd'){let best=0;for(let x=1;x<m.S;x++)if(x!==m.S-x)best=Math.max(best,gcd(x,m.S-x));assert.equal(a,best,t.id);}
 if(t.template==='digits'){let min;for(let x=1000;x<=9999;x++)if([...String(x)].reduce((s,d)=>s+Number(d),0)===m.s){min=x;break;}assert.equal(a,min,t.id);}
 if(t.template==='fractions'){let max=0;for(let d=1;d<=m.n*m.n;d++)if(m.n*m.n%d===0){const x=m.n+d,y=m.n+m.n*m.n/d;if(x<=y)max=Math.max(max,y);}assert.equal(a,max,t.id);}
 if(t.template==='pigeonhole'){assert.equal(a,m.n);const selected=Array.from({length:m.n},(_,j)=>m.n+j+1);for(let x of selected)for(let y of selected)if(x!==y)assert.notEqual(x%y,0);const oddParts=new Set();for(let x=1;x<=2*m.n;x++){let v=x;while(v%2===0)v/=2;oddParts.add(v);}assert.equal(oddParts.size,m.n);}
}});
test('all graphs and diagrams render finite, accessible SVG without answer insertion',()=>{for(const t of bankTasks){if(t.graph){const svg=graphSVG(t.graph);assert.match(svg,/<svg/);assert.match(svg,/aria-label=/);assert.ok(!/NaN|Infinity|undefined/.test(svg),t.id);}if(t.diagram)assert.match(diagramSVG(t.diagram),/<svg/);}});
