const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const decimal=n=>String(Number(n.toFixed(9)));
// Graphs are rendered from the same analytic function used to construct a task.
// Tick labels are actual coordinates; gaps are preserved at discontinuities.
export function graphSVG(g){
 const W=640,H=340,L=75,R=30,T=40,B=55,xmin=g.xmin,xmax=g.xmax;
 const vals=[];for(let j=0;j<=300;j++){const x=xmin+(xmax-xmin)*j/300;for(const c of g.curves){const y=c.fn(x);if(Number.isFinite(y))vals.push(y);}}
 for(const p of g.points||[])vals.push(p[1]);
 vals.sort((a,b)=>a-b);let lo=Math.min(0,vals[Math.floor(vals.length*.02)]??-1),hi=Math.max(0,vals[Math.floor(vals.length*.98)]??1);
 const pad=Math.max(1,(hi-lo)*.13);lo-=pad;hi+=pad;
 const X=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R),Y=y=>H-B-(y-lo)/(hi-lo)*(H-T-B);
 const zeroY=Y(0),zeroX=X(Math.max(xmin,Math.min(xmax,0)));let lines='';
 const xStep=Math.max(1,Math.ceil((xmax-xmin)/10)),yRaw=(hi-lo)/5,mag=10**Math.floor(Math.log10(yRaw)),yStep=([1,2,5,10].find(k=>k*mag>=yRaw)||10)*mag;
 for(let x=Math.ceil(xmin/xStep)*xStep;x<=xmax;x+=xStep)lines+=`<path class="chart-grid" d="M${X(x)} ${T}V${H-B}"/><text x="${X(x)}" y="${H-10}" text-anchor="middle">${decimal(x)}</text>`;
 for(let y=Math.ceil(lo/yStep)*yStep;y<=hi;y+=yStep)lines+=`<path class="chart-grid" d="M${L} ${Y(y)}H${W-R}"/><text x="${L-8}" y="${Y(y)+4}" text-anchor="end">${decimal(y)}</text>`;
 lines+=`<path class="chart-axis" d="M${L} ${zeroY}H${W-R}M${zeroX} ${T}V${H-B}"/>`;
 if(Number.isFinite(g.asymptote)&&g.asymptote>xmin&&g.asymptote<xmax)lines+=`<path class="graph-asymptote" d="M${X(g.asymptote)} ${T}V${H-B}"/>`;
 if(Number.isFinite(g.asymptoteY)&&g.asymptoteY>lo&&g.asymptoteY<hi)lines+=`<path class="graph-asymptote" d="M${L} ${Y(g.asymptoteY)}H${W-R}"/>`;
 const colors=['#205d3b','#a24c1c'];g.curves.forEach((c,idx)=>{let d='',prev=null;for(let j=0;j<=450;j++){const x=xmin+(xmax-xmin)*j/450,y=c.fn(x);if(!Number.isFinite(y)||y<lo||y>hi||prev!==null&&Math.abs(Y(y)-Y(prev))>H*.7){prev=null;continue;}d+=`${prev===null?'M':'L'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;prev=y;}lines+=`<path fill="none" stroke="${colors[idx%2]}" stroke-width="3.2" d="${d}"/>`;});
 for(const [x,y,label]of g.points||[])lines+=`<circle cx="${X(x)}" cy="${Y(y)}" r="4" fill="#a24c1c"/><text x="${X(x)+7}" y="${Y(y)-9}">${escape(label)}</text>`;
 return `<svg class="task-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Координатный график ${escape(g.curves[0].label)}. Диапазон x от ${xmin} до ${xmax}."><title>График ${escape(g.curves[0].label)}; координаты подписаны на осях</title>${lines}<text x="${W-R-2}" y="${zeroY-9}">x</text><text x="${L+6}" y="17">${escape(g.curves[0].label||'y')}</text></svg>`;
}
export function diagramSVG(kind){
 const shapes={'right-triangle':'<path d="M55 35V160H280Z"/><path d="M55 147h13v13"/><text x="40" y="28">A</text><text x="288" y="177">B</text><text x="37" y="178">C</text>',triangle:'<path d="M50 160H280L125 35Z"/><text x="32" y="178">A</text><text x="287" y="177">B</text><text x="121" y="25">C</text>',
 trapezoid:'<path d="M95 35H225L285 160H35Z"/><path class="diagram-dash" d="M95 35 285 160M225 35 35 160"/><text x="19" y="179">A</text><text x="290" y="179">B</text><text x="228" y="27">C</text><text x="80" y="27">D</text><text x="158" y="113">O</text>',
 cube:'<path d="M55 75H210V170H55ZM55 75 110 30H265V125L210 170M210 75 265 30"/><path class="diagram-dash" d="M110 30V125H265M110 125 55 170"/><text x="40" y="188">A</text><text x="211" y="188">B</text><text x="271" y="136">C</text><text x="96" y="140">D</text><text x="35" y="72">A₁</text><text x="197" y="67">B₁</text><text x="269" y="25">C₁</text><text x="96" y="22">D₁</text>',
 pyramid:'<path d="m35 140 165 35 85-57-165-30ZM35 140 156 20 200 175M156 20 285 118"/><path class="diagram-dash" d="M120 88 156 20 160 132M35 140 285 118M120 88 200 175"/><text x="143" y="15">S</text><text x="17" y="146">A</text><text x="198" y="192">B</text><text x="292" y="125">C</text><text x="106" y="84">D</text><text x="163" y="147">O</text>',
 circle:'<circle cx="165" cy="100" r="75"/><path d="M100 142 230 142 165 25Z"/><text x="84" y="157">A</text><text x="235" y="157">B</text><text x="162" y="18">C</text>',
 cylinder:'<ellipse cx="160" cy="40" rx="85" ry="23"/><path d="M75 40V150a85 23 0 0 0 170 0V40"/><path class="diagram-dash" d="M75 150a85 23 0 0 1 170 0M160 40V150M160 40H245"/><text x="170" y="96">h</text><text x="203" y="34">r</text>',
 sphere:'<circle cx="160" cy="100" r="83"/><ellipse cx="160" cy="70" rx="77" ry="20"/><path class="diagram-dash" d="M160 100V70H236M160 100 236 70"/><text x="144" y="115">O</text><text x="206" y="102">R</text>'};
 return `<figure class="geometry-figure"><svg viewBox="0 0 330 205" role="img" aria-label="${['circle'].includes(kind)?'Схема окружности':'Схема геометрической фигуры'}" fill="none" stroke="#7b8d68" stroke-width="1.7">${shapes[kind]||shapes.triangle}</svg><figcaption>Схема; размеры и положение точек уточняй по условию. Не в масштабе.</figcaption></figure>`;
}
