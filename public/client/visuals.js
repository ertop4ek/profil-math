import {graphSVG,diagramSVG} from './graph-renderer.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,label,anchor='middle',cls='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${esc(label)}</text>`;
const line=(x1,y1,x2,y2,cls='')=>`<path class="${cls}" d="M${x1} ${y1}L${x2} ${y2}"/>`;
const point=(x,y,name,dx=0,dy=0)=>`<circle cx="${x}" cy="${y}" r="3.5" class="geometry-point"/>${text(x+dx,y+dy,name)}`;
function svg(content,label){return `<svg class="condition-diagram" viewBox="0 0 520 360" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><defs><marker id="figureArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0 0 6 3 0 6" fill="none" stroke="currentColor"/></marker></defs>${content}</svg>`;}
const figure=(content,label,caption)=>`<figure class="condition-figure">${svg(content,label)}<figcaption>${esc(caption)}</figcaption></figure>`;
const rotateLabel=(x,y,label,angle=0)=>`<text x="${x}" y="${y}" text-anchor="middle" transform="rotate(${angle} ${x} ${y})">${esc(label)}</text>`;
function plane(t){const m=t.audit;
 if(t.template==='right')return figure(`<path d="M100 55V235H340Z"/><path d="M100 214h21v21"/>${point(100,55,'A',-15,-15)}${point(340,235,'B',18,8)}${point(100,235,'C',-19,15)}${text(61,150,3*m.k)}${text(220,273,4*m.k)}${text(249,133,'AB = ?')}`,`Прямоугольный треугольник ABC: AC=${3*m.k}, BC=${4*m.k}, угол C прямой.`,`Дано: AC = ${3*m.k}, BC = ${4*m.k}, ∠C = 90°. Найти AB.`);
 if(t.template==='circle'){
  const arc=2*m.a,rad=x=>x*Math.PI/180,R=100,cx=260,cy=158;
  const A=[cx+R*Math.cos(rad(90-arc/2)),cy+R*Math.sin(rad(90-arc/2))],B=[cx+R*Math.cos(rad(90+arc/2)),cy+R*Math.sin(rad(90+arc/2))],C=[cx,cy-R];
  return figure(`<circle cx="${cx}" cy="${cy}" r="${R}"/><path d="M${A}L${C}L${B}Z"/><path class="geometry-accent" d="M${A}A${R} ${R} 0 0 1 ${B}"/>${point(...A,'A',16,14)}${point(...B,'B',-16,14)}${point(...C,'C',0,-17)}${text(260,294,`дуга AB = ${arc}°`)}${text(260,105,'?')}`,`Окружность, вписанный угол ACB и малая дуга AB ${arc} градусов.`,`C лежит на большой дуге AB. Отмечена малая дуга AB = ${arc}°. Найти ∠ACB.`);
 }
 if(t.template==='trapezoid'){
  const k=Math.min(320/m.b,170/m.h),base=m.b*k,top=m.a*k,h=m.h*k,cx=260,y=245,A=[cx-base/2,y],B=[cx+base/2,y],D=[cx-top/2,y-h],C=[cx+top/2,y-h];
  return figure(`<path d="M${A}L${B}L${C}L${D}Z"/>${line(...D,D[0],y,'diagram-dash')}${line(D[0],y-17,D[0]+17,y-17)}${line(D[0]+17,y-17,D[0]+17,y)}${text(cx,y-h-22,`a = ${m.a}`)}${text(cx,y+35,`b = ${m.b}`)}${text(D[0]+30,y-h/2,`h = ${m.h}`)}`,`Трапеция с основаниями ${m.a} и ${m.b} и перпендикулярной высотой ${m.h}.`,`Основания a = ${m.a}, b = ${m.b}; высота h = ${m.h}. Требуется площадь.`);
 }
 if(t.template==='tangent'){
  const P=[60,180],O=[294,180],R=90,B=[204,180],C=[384,180],A=[60+72/13*36,180-30/13*36];
  return figure(`<circle cx="${O[0]}" cy="${O[1]}" r="${R}"/>${line(...P,...C)}${line(...P,...A)}${line(...O,...A,'diagram-dash')}${point(...P,'P',-15,8)}${point(...B,'B',-10,25)}${point(...C,'C',13,18)}${point(...A,'A',-5,-17)}${point(...O,'O',10,24)}${text(130,117,'PA = ?')}${line(60,295,204,295)}${line(204,295,384,295)}${text(132,326,`PB = ${4*m.k}`)}${text(294,326,`BC = ${5*m.k}`)}`,`Из P проведена касательная PA и секущая PBC. B между P и C, PB=${4*m.k}, BC=${5*m.k}.`,`PA — касательная. На секущей точки идут в порядке P–B–C. PB = ${4*m.k}, BC = ${5*m.k}.`);
 }
 return '';
}
function vectorPlot(arrows,caption,label){
 const xs=[0],ys=[0];for(const a of arrows){xs.push(a.from[0],a.to[0]);ys.push(a.from[1],a.to[1]);}
 let minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys);if(maxx===minx)maxx++;if(maxy===miny)maxy++;
 const padX=(maxx-minx)*.2,padY=(maxy-miny)*.2;minx-=padX;maxx+=padX;miny-=padY;maxy+=padY;
 const X=x=>65+(x-minx)/(maxx-minx)*390,Y=y=>285-(y-miny)/(maxy-miny)*230;
 let out=line(45,Y(0),475,Y(0),'chart-axis')+line(X(0),310,X(0),40,'chart-axis')+text(486,Y(0)+6,'x')+text(X(0)+15,30,'y')+text(X(0)-12,Y(0)+22,'0');
 for(const a of arrows){const x1=X(a.from[0]),y1=Y(a.from[1]),x2=X(a.to[0]),y2=Y(a.to[1]);out+=`<path class="vector-line ${a.cls||''}" d="M${x1} ${y1}L${x2} ${y2}" marker-end="url(#figureArrow)"/>`+text((x1+x2)/2+(a.dx||0),(y1+y2)/2+(a.dy||-15),a.name);}
 return figure(out,label,caption);
}
function vectors(t){const m=t.audit;
 if(t.template==='dot')return vectorPlot([{from:[0,0],to:[m.a,m.b],name:'a',dx:-13},{from:[0,0],to:[m.c,m.d],name:'b',cls:'second-vector',dy:24}],`a = (${m.a}; ${m.b}), b = (${m.c}; ${m.d}). Найти a · b.`,`Два вектора из начала координат: a=(${m.a};${m.b}), b=(${m.c};${m.d}).`);
 if(t.template==='length')return vectorPlot([{from:[0,0],to:[m.a,m.b],name:'a'},{from:[m.a,m.b],to:[3*m.k,4*m.k],name:'b',cls:'second-vector'},{from:[0,0],to:[3*m.k,4*m.k],name:'a + b',cls:'diagram-dash',dy:30}],`a = (${m.a}; ${m.b}), b = (${3*m.k-m.a}; ${4*m.k-m.b}). Сложение показано по правилу треугольника.`,`Вектор b отложен от конца a; сумма идёт от начала a к концу b.`);
 if(t.template==='orthogonal')return figure(`<path class="vector-line" d="M150 190H400" marker-end="url(#figureArrow)"/><path class="vector-line second-vector" d="M150 190V60" marker-end="url(#figureArrow)"/><path d="M150 168h22v22"/>${text(335,174,'a')}${text(127,90,'b')}${text(260,275,`a = (${m.a}; ${m.b})`)}${text(260,311,`b = (t; ${-m.a*m.b})`)}`,`Схема двух перпендикулярных векторов a и b. Неизвестна координата t.`,`Схема перпендикулярности, без координатного масштаба. Неизвестная t не вычислена на рисунке.`);
 if(t.template==='space')return figure(`<path class="chart-axis" d="M150 235H450M150 235 55 305M150 235V40"/>${text(466,242,'x')}${text(40,322,'y')}${text(152,28,'z')}<path class="vector-line" d="M150 235 170 99" marker-end="url(#figureArrow)"/><path class="vector-line second-vector" d="M150 235 230 295" marker-end="url(#figureArrow)"/>${text(185,108,'a')}${text(230,285,'b')}${text(337,72,`a = (${m.k}; ${2*m.k}; ${3*m.k})`)}${text(343,111,`b = (${m.k}; 0; ${-m.k})`)}${text(315,180,'Найти |2a − b|²')}`,`Схема пространственных векторов a и b с их заданными координатами.`,`Пространственная схема. Координаты берутся из условия; длины нельзя измерять по перспективному рисунку.`);
 return '';
}
function solids(t){const m=t.audit;
 if(t.template==='pyramid')return figure(`<path d="M85 240 310 295 440 215 215 165Z"/><path d="M85 240 262 40 310 295M262 40 440 215"/>${line(262,40,215,165,'diagram-dash')}${line(262,40,262,230,'geometry-accent diagram-dash')}<path d="m262 214 16 5v16"/>${text(272,28,'S')}${text(290,154,`h = ${m.h}`)}${text(195,299,`a = ${m.a}`)}${text(398,278,`b = ${m.b}`)}${text(261,257,'O')}`,`Пирамида с прямоугольным основанием ${m.a} на ${m.b}, высота ${m.h}.`,`Дано: прямоугольное основание ${m.a} × ${m.b}; высота SO = ${m.h}. Требуется объём.`);
 if(t.template==='cylinder')return figure(`<ellipse cx="250" cy="70" rx="110" ry="30"/><path d="M140 70V270a110 30 0 0 0 220 0V70"/><path class="diagram-dash" d="M140 270a110 30 0 0 1 220 0M250 70V270M250 70H360"/>${text(305,58,`r = ${m.r}`)}${text(400,177,`h = ${m.h}`)}${text(250,326,'Sполная / π = ?')}`,`Цилиндр: радиус ${m.r}, высота ${m.h}.`,`Радиус r = ${m.r}, высота h = ${m.h}. Полная поверхность включает боковую часть и оба основания.`);
 if(t.template==='sphere')return figure(`<circle cx="250" cy="160" r="110"/><path class="geometry-accent" d="M162 94H338"/><path class="diagram-dash" d="M250 160V94H338M250 160 338 94"/><path d="M250 110h16V94"/>${point(250,160,'O',-15,22)}${text(225,128,`d = ${3*m.k}`,'end')}${text(326,150,`R = ${5*m.k}`,'start')}${text(295,80,'r = ?')}${text(250,317,'Sсечения / π = ?')}`,`Сечение шара: радиус шара ${5*m.k}, расстояние от центра до плоскости ${3*m.k}.`,`Показано центральное сечение: R = ${5*m.k}, d = ${3*m.k}. Секущая плоскость даёт круг неизвестного радиуса r.`);
 if(t.template==='cone')return figure(`<ellipse cx="135" cy="80" rx="67" ry="20"/><path d="M68 80V252a67 20 0 0 0 134 0V80"/><path class="diagram-dash" d="M68 252a67 20 0 0 1 134 0M135 80V252M135 80H202"/><path d="M320 252 387 80 454 252"/><ellipse cx="387" cy="252" rx="67" ry="20"/><path class="diagram-dash" d="M387 80V252H454"/>${text(220,173,'h')}${text(407,173,'h')}${text(172,67,'r')}${text(424,240,'r')}${text(135,308,`V = ${81*m.k}`)}${text(387,308,'Vконуса = ?')}`,`Цилиндр объёма ${81*m.k} и конус с равными основаниями и высотами.`,`Радиусы r и высоты h у двух тел одинаковы. Объём цилиндра ${81*m.k}. Требуется разность объёмов.`);
 return '';
}
export function renderTaskVisual(t){
 if(typeof t.visual==='string')return t.visual;
 if(t.graph)return `<figure class="condition-figure graph-figure">${graphSVG({...t.graph,asymptoteY:t.ege===11&&['hyperbola','exponent'].includes(t.template)?t.audit.c:undefined})}<figcaption>${esc(t.prompt)} ${t.graph.points?.length?'Отмеченные точки: '+t.graph.points.map(p=>`${p[2]}(${p[0]}; ${p[1]})`).join(', ')+'.':''}</figcaption></figure>`;
 if(t.ege===1)return plane(t);if(t.ege===2)return vectors(t);if(t.ege===3)return solids(t);
 return t.diagram?diagramSVG(t.diagram):'';
}
