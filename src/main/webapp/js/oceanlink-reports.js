                                                                                  
(() => {
'use strict';
const O=window.OceanLink,V=window.OceanLinkView;if(!O||!V)return;
const E=O.esc,DEFAULT_START='2026-08-20',DEFAULT_END='2026-09-30',SNAPSHOT=O.snapshotDate||'2026-09-20';
const types=['Operación general','Capacidad y utilización','Incidencias','Mantenimientos','Servicios y clientes','Indicadores históricos'];
const severityOrder=['Crítica','Alta','Media','Baja'];
const formatDate=value=>{if(!value)return'—';const iso=O.dateISO(value)||String(value).slice(0,10),m=iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(value);};
const formatPeriod=(a,b)=>`${formatDate(a)} - ${formatDate(b)}`;
const parseIso=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]):null;};
const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const shortDate=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}`:iso;};
const round=(n,d=1)=>Number(Number(n||0).toFixed(d));
const avg=a=>a.length?a.reduce((x,y)=>x+Number(y||0),0)/a.length:0;
const sum=a=>a.reduce((x,y)=>x+Number(y||0),0);
const level=u=>u>95?'Crítica':u>=80?'Alta':'Normal';
const fmtPct=v=>V.fmtPct?V.fmtPct(v):(Math.abs(Number(v)-Math.round(Number(v)))<.05?String(Math.round(Number(v))):Number(v).toFixed(1));
const anchors=['2026-01-31','2026-02-28','2026-03-31','2026-04-30','2026-05-31','2026-06-30','2026-07-31','2026-08-31',SNAPSHOT];

function historySeries(scope){
 O.refresh();return O.historyValues(scope);
}
function utilAt(scope,iso){
 const d=parseIso(iso),vals=historySeries(scope),dates=anchors.map(parseIso);if(!d||!vals.length)return 0;
 if(d<=dates[0])return vals[0];if(d>=dates.at(-1))return vals.at(-1);
 for(let i=0;i<dates.length-1;i++)if(d>=dates[i]&&d<=dates[i+1]){const t=(d-dates[i])/(dates[i+1]-dates[i]);return round(vals[i]+(vals[i+1]-vals[i])*t,4);}return vals.at(-1);
}
function samples(scope,start,end,count=8){
 const a=parseIso(start),b=parseIso(end);if(!a||!b||b<a)return{dates:[],labels:[],values:[]};
 const days=Math.round((b-a)/86400000),n=Math.max(2,Math.min(count,days+1));
 const dates=Array.from({length:n},(_,i)=>{const off=i===n-1?days:Math.round(days*i/(n-1));return isoDate(new Date(a.getFullYear(),a.getMonth(),a.getDate()+off));});
 return{dates,labels:dates.map(shortDate),values:dates.map(x=>round(utilAt(scope,x),1))};
}
function closeSeg(code,end){
 const s=O.data.segments[code],u=round(utilAt(code,end),1),past=end<SNAPSHOT,used=past?round(s.total*u/100,2):round(s.used,2),reserved=past?0:round(s.reserved,2);
 return{code,...s,utilization:u,used,reserved,available:round(Math.max(0,s.total-used-reserved),2)};
}
function weeklyBins(start,end){
 const a=parseIso(start),b=parseIso(end),out=[];if(!a||!b||b<a)return out;const span=Math.round((b-a)/86400000),step=span>120?30:span>70?14:7;let cursor=new Date(a);
 while(cursor<=b){const from=new Date(cursor),to=new Date(cursor);to.setDate(to.getDate()+step-1);if(to>b)to.setTime(b.getTime());const fi=isoDate(from),ti=isoDate(to);out.push({from:fi,to:ti,label:`${shortDate(fi)}–${shortDate(ti)}`});cursor=new Date(to);cursor.setDate(cursor.getDate()+1);}return out;
}
function build(type,scope='Toda la red',start=DEFAULT_START,end=DEFAULT_END){
 if(!types.includes(type))throw Error('Tipo de reporte no válido.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end)throw Error('El rango de fechas no es válido.');
 O.refresh();const d=O.data;if(scope!=='Toda la red'&&!d.segments[scope])throw Error('Segmento no encontrado.');
 const within=date=>{const iso=O.dateISO(date);return !!iso&&iso>=start&&iso<=end;},match=segments=>scope==='Toda la red'||(segments||[]).includes(scope);
 const codes=Object.keys(d.segments).filter(c=>scope==='Toda la red'||c===scope),closing=codes.map(c=>closeSeg(c,end));
 const inc=Object.entries(d.incidents).filter(([,i])=>within(i.date)&&match(i.segments));
 const mnt=Object.entries(d.maint).filter(([,m])=>within(m.start)&&(scope==='Toda la red'||m.element===scope||[d.segments[scope]?.origin,d.segments[scope]?.destination].includes(m.element)));
 const srv=Object.entries(d.services).filter(([,x])=>{const a=O.dateISO(x.activation);return !!a&&a<=end&&x.state!=='Cancelado'&&match(x.segments);});
 const activated=Object.entries(d.services).filter(([,x])=>within(x.activation)&&match(x.segments));
 const r={type,scope,start,end,generatedAt:new Date().toISOString(),headers:[],rows:[],cards:[],charts:[],clientTotals:[]};

 if(type==='Operación general'){
  const total=sum(closing.map(x=>x.total)),used=sum(closing.map(x=>x.used)),weighted=total?used/total*100:0,active=srv.filter(([,x])=>x.state==='Activo');
  r.cards=[['Utilización global',`${fmtPct(weighted)}%`,'Capacidad usada / capacidad total'],['Incidencias',inc.length,'Detectadas en el periodo'],['Mantenimientos',mnt.length,'Intervenciones del periodo'],['Servicios activos',active.length,'Vigentes al cierre']];
  if(scope==='Toda la red'){
   const states=['Operativo','Degradado','En mantenimiento','Fuera de servicio'];
   r.charts.push({kind:'stackedH',title:'Estado operativo de la red',labels:['Red'],percent:true,series:states.map((name,i)=>({name,tone:['operational','degraded','maintaining','out'][i],values:[closing.filter(x=>x.state===name).length]}))});
   r.charts.push({kind:'groupedBar',title:'Actividad operativa por segmento',labels:closing.map(x=>x.code),integer:true,series:[{name:'Incidencias',tone:'incident',values:closing.map(x=>inc.filter(([,i])=>i.segments.includes(x.code)).length)},{name:'Mantenimientos',tone:'maintenance',values:closing.map(x=>mnt.filter(([,m])=>m.element===x.code||m.element===x.origin||m.element===x.destination).length)}]});
  }else{
   const serie=samples(scope,start,end);r.charts.push({kind:'line',title:`Evolución de utilización de ${scope}`,labels:serie.labels,values:serie.values,suffix:'%',max:100,thresholds:[80,95]});
  }
  r.headers=['Segmento','Ruta','Utilización (%)','Estado','Incidencias','Mantenimientos','Servicios activos'];
  r.rows=closing.map(x=>[x.code,V.route(x),x.utilization,x.state,inc.filter(([,i])=>i.segments.includes(x.code)).length,mnt.filter(([,m])=>m.element===x.code||m.element===x.origin||m.element===x.destination).length,active.filter(([,z])=>z.segments.includes(x.code)).length]);
 }
 else if(type==='Capacidad y utilización'){
  const total=sum(closing.map(x=>x.total)),used=sum(closing.map(x=>x.used)),weighted=total?used/total*100:0,available=sum(closing.map(x=>x.available)),high=closing.filter(x=>x.utilization>=80&&x.utilization<=95).length,critical=closing.filter(x=>x.utilization>95).length;
  r.cards=[['Utilización global',`${fmtPct(weighted)}%`,'Uso ponderado al cierre'],['Capacidad disponible',`${round(available,2)} Tbps`,'Disponible al cierre'],['Alta utilización',high,'Entre 80% y 95%'],['Críticos',critical,'Por encima de 95%']];
  if(scope==='Toda la red')r.charts.push({kind:'stackedH',title:'Distribución de capacidad por segmento',labels:closing.map(x=>x.code),suffix:' Tbps',series:[{name:'Utilizada',tone:'used',values:closing.map(x=>x.used)},{name:'Reservada',tone:'reserved',values:closing.map(x=>x.reserved)},{name:'Disponible',tone:'free',values:closing.map(x=>x.available)}]});
  else{const serie=samples(scope,start,end);r.charts.push({kind:'line',title:'Evolución de utilización',labels:serie.labels,values:serie.values,suffix:'%',max:100,thresholds:[80,95]});}
  r.headers=['Segmento','Total (Tbps)','Utilizada (Tbps)','Reservada (Tbps)','Disponible (Tbps)','Utilización (%)','Nivel'];
  r.rows=closing.map(x=>[x.code,x.total,x.used,x.reserved,x.available,x.utilization,level(x.utilization)]);
 }
 else if(type==='Incidencias'){
  const bins=weeklyBins(start,end),services=new Set(inc.flatMap(([,i])=>i.services||[]));
  const series=severityOrder.map((sev,idx)=>({name:sev,tone:['critical','high','medium','low'][idx],values:bins.map(b=>inc.filter(([,i])=>{const iso=O.dateISO(i.date);return iso>=b.from&&iso<=b.to&&i.severity===sev;}).length)}));
  r.cards=[['Registradas',inc.length,'Detectadas en el periodo'],['Sin cerrar',inc.filter(([,i])=>i.state!=='Cerrada').length,'Abiertas al cierre'],['Críticas',inc.filter(([,i])=>i.severity==='Crítica').length,'Eventos de máxima severidad'],['Servicios afectados',services.size,'Servicios únicos asociados']];
  r.charts.push({kind:'stackedBar',title:'Incidencias por periodo y severidad',labels:bins.map(x=>x.label),series,integer:true});
  const states=[...new Set(inc.map(([,i])=>i.state))];r.charts.push({kind:'stackedH',title:'Distribución por estado al cierre',labels:['Incidencias'],percent:true,series:states.map(name=>{const n=O.normalize(name),tone=/cerrad|restaurado/.test(n)?'operational':/reparacion programada/.test(n)?'high':/en reparacion/.test(n)?'maintenance':'maintaining';return{name,tone,values:[inc.filter(([,i])=>i.state===name).length]};})});
  r.headers=['Código','Detección','Segmentos','Severidad','Estado','Servicios','Clientes'];r.rows=inc.map(([c,i])=>[c,i.date,i.segments.join(' · '),i.severity,i.state,i.services.length,i.clients.length]);
 }
 else if(type==='Mantenimientos'){
  const bins=weeklyBins(start,end),services=new Set(mnt.flatMap(([,m])=>m.services||[])),preventive=mnt.filter(([,m])=>m.type==='Preventivo').length,corrective=mnt.filter(([,m])=>m.type==='Correctivo').length;
  r.cards=[['Intervenciones',mnt.length,'Dentro del periodo'],['Preventivos',preventive,'Planificados'],['Correctivos',corrective,'Atención de fallas'],['Servicios involucrados',services.size,'Servicios únicos relacionados']];
  r.charts.push({kind:'groupedBar',title:'Intervenciones por periodo y tipo',labels:bins.map(x=>x.label),integer:true,series:[{name:'Preventivo',tone:'preventive',values:bins.map(b=>mnt.filter(([,m])=>{const iso=O.dateISO(m.start);return iso>=b.from&&iso<=b.to&&m.type==='Preventivo';}).length)},{name:'Correctivo',tone:'corrective',values:bins.map(b=>mnt.filter(([,m])=>{const iso=O.dateISO(m.start);return iso>=b.from&&iso<=b.to&&m.type==='Correctivo';}).length)}]});
  const states=[...new Set(mnt.map(([,m])=>m.state))];r.charts.push({kind:'stackedH',title:'Distribución por estado al cierre',labels:['Mantenimientos'],percent:true,series:states.map(name=>{const n=O.normalize(name),tone=/finalizado/.test(n)?'operational':/ejecucion/.test(n)?'maintaining':/programado/.test(n)?'high':'out';return{name,tone,values:[mnt.filter(([,m])=>m.state===name).length]};})});
  r.headers=['Código','Tipo','Elemento','Inicio','Fin','Duración','Estado','Resultado'];r.rows=mnt.map(([c,m])=>[c,m.type,m.element,m.start,m.end,m.duration,m.state,m.result||'Pendiente']);
 }
 else if(type==='Servicios y clientes'){
  const active=srv.filter(([,x])=>x.state==='Activo'),clients=[...new Set(active.map(([,x])=>x.clientCode))];
  r.clientTotals=clients.map(c=>[d.clients[c]?.name||c,round(active.filter(([,x])=>x.clientCode===c).reduce((s,[,x])=>s+O.amount(x.capacity),0),2)]).sort((a,b)=>b[1]-a[1]);
  r.cards=[['Servicios vigentes',active.length,'Activos al cierre'],['Clientes',clients.length,'Con servicio activo'],['Capacidad contratada',`${round(sum(r.clientTotals.map(x=>x[1])),2)} Tbps`,'Suma de servicios activos'],['Activados en periodo',activated.filter(([,x])=>x.state==='Activo').length,'Nuevos servicios del rango']];
  r.charts.push({kind:'barH',title:'Capacidad activa por cliente',labels:r.clientTotals.map(x=>x[0]),values:r.clientTotals.map(x=>x[1]),suffix:' Tbps'});
  r.headers=['Servicio','Cliente','Ruta','Capacidad (Tbps)','Activación','Estado'];r.rows=active.map(([c,x])=>[c,x.client,x.segments.join(' → '),O.amount(x.capacity),x.activation,x.state]);
 }
 else {
  const serie=samples(scope,start,end),mean=avg(serie.values),trend=serie.values.length?serie.values.at(-1)-serie.values[0]:0;
  r.cards=[['Promedio',serie.values.length?`${fmtPct(mean)}%`:'—','Utilización media'],['Máximo',serie.values.length?`${fmtPct(Math.max(...serie.values))}%`:'—','Pico del periodo'],['Mínimo',serie.values.length?`${fmtPct(Math.min(...serie.values))}%`:'—','Valor mínimo'],['Tendencia',serie.values.length?`${trend>=0?'+':''}${trend.toFixed(1)} pp`:'—','Variación inicio-fin']];
  r.charts.push({kind:'line',title:'Tendencia histórica de utilización',labels:serie.labels,values:serie.values,suffix:'%',max:100,thresholds:[80,95]});
  r.headers=['Fecha','Alcance','Utilización (%)'];r.rows=serie.dates.map((x,i)=>[formatDate(x),scope,serie.values[i]]);
 }
 for(const chart of r.charts){
  if(type==='Mantenimientos'&&chart.kind==='groupedBar')chart.kind='stackedBar';
  if(chart.kind==='stackedH'&&chart.percent){
   chart.kind='distribution';
   chart.items=chart.series.map(s=>({name:s.name,value:Number(s.values[0]||0),tone:stateTone(s.name)})).sort((a,b)=>b.value-a.value);
  }
 }
 return r;
}
function stateTone(name){
 const n=O.normalize(name);return /finalizado|cerrada|restaurado|operativo/.test(n)?'operational':/ejecucion|reparacion|degradado/.test(n)?'high':/fuera|cancelado/.test(n)?'critical':'maintaining';
}
const toneColor=t=>({critical:'#cf4d48',high:'#d28c1f',medium:'#e3b647',low:'#2f9b67',incident:'#cf4d48',maintenance:'#0c9ba4',preventive:'#0c9ba4',corrective:'#d28c1f',operational:'#2f9b67',degraded:'#d28c1f',maintaining:'#3d86bd',out:'#cf4d48',used:'#0c9ba4',reserved:'#3d86bd',free:'#b9dfe0'}[t]||'#0c9ba4');

const toneClass=t=>({critical:'critical',high:'high',medium:'medium',low:'low',incident:'incident',maintenance:'maintenance',operational:'operational',degraded:'degraded',maintaining:'maintaining',out:'out',used:'used',reserved:'reserved',free:'free',preventive:'preventive',corrective:'corrective'}[t]||'used');
function legend(series){return series?.length?`<div class="report-chart-legend">${series.map(s=>`<span><i class="chart-tone-${toneClass(s.tone)}"></i>${E(s.name)}</span>`).join('')}</div>`:'';}
function chartSvg(c,compact=false){
 if(!c)return'<div class="report-chart-empty">Sin datos para representar.</div>';
 if(c.kind==='distribution'){
  const items=c.items||[],total=sum(items.map(x=>x.value));
  if(!total)return '<div class="report-chart-empty">Sin registros para estos criterios.</div>';
  return `<div class="history-distribution report-state-distribution">${items.map(item=>`<div class="history-distribution-row"><div><span>${E(item.name)}</span><strong>${item.value}</strong></div><div class="history-distribution-track"><span style="width:${item.value/total*100}%;background:${toneColor(item.tone)}"></span></div><small>${Math.round(item.value/total*100)}%</small></div>`).join('')}</div>`;
 }
 const W=compact?680:980,H=compact?340:300,L=58,R=28,T=34,B=52,PW=W-L-R,PH=H-T-B;
 const gridFor=(max,suffix='',integer=false)=>{const ticks=[0,max*.25,max*.5,max*.75,max],y=v=>T+PH-(v/max)*PH;return{y,grid:ticks.map(v=>`<line class="report-chart-grid" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"></line><text class="report-chart-label" x="${L-10}" y="${y(v)+4}" text-anchor="end">${integer?Math.round(v):Number(v.toFixed(1))}${suffix==='%'?'%':''}</text>`).join('')}};
 if(c.kind==='line'){
  if(!c.values?.length)return'<div class="report-chart-empty">Sin datos para representar.</div>';const raw=Math.max(...c.values.map(Number),1),max=c.max||Math.ceil(raw*1.2),{y,grid}=gridFor(max,c.suffix,c.integer),x=i=>c.values.length===1?L+PW/2:L+i*PW/(c.values.length-1),pts=c.values.map((v,i)=>`${x(i)},${y(v)}`).join(' '),area=`${L},${y(0)} ${pts} ${x(c.values.length-1)},${y(0)}`;
  const thresholds=(c.thresholds||[]).map((v,i)=>`<line class="${i?'report-chart-threshold-critical':'report-chart-threshold-high'}" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"></line><text class="report-threshold-label ${i?'critical':'high'}" x="${W-R}" y="${y(v)-7}" text-anchor="end">${i?'Crítica >95%':'Alta 80%'}</text>`).join('');
  const dots=c.values.map((v,i)=>`<circle class="report-chart-point" cx="${x(i)}" cy="${y(v)}" r="5"></circle><text class="report-chart-value" x="${x(i)}" y="${y(v)-12}" text-anchor="middle">${fmtPct(v)}${c.suffix||''}</text><text class="report-chart-label" x="${x(i)}" y="${H-17}" text-anchor="middle">${E(c.labels[i]||'')}</text>`).join('');
  return`<svg viewBox="0 0 ${W} ${H}">${grid}${thresholds}<polygon class="report-chart-area" points="${area}"></polygon><polyline class="report-chart-line" points="${pts}"></polyline>${dots}</svg>`;
 }
 if(c.kind==='stackedBar'||c.kind==='groupedBar'){
  const series=c.series||[],labels=c.labels||[],totals=labels.map((_,i)=>c.kind==='stackedBar'?sum(series.map(s=>s.values[i]||0)):Math.max(...series.map(s=>Number(s.values[i]||0)),0)),raw=Math.max(1,...totals),max=Math.max(4,Math.ceil(raw/4)*4),{y,grid}=gridFor(max,'',true),gap=24,groupW=Math.min(125,(PW-gap*(labels.length+1))/Math.max(labels.length,1)),sx=L+(PW-(groupW*labels.length+gap*(labels.length-1)))/2;
  let shapes='';labels.forEach((lab,i)=>{const gx=sx+i*(groupW+gap);if(c.kind==='stackedBar'){let acc=0;series.forEach((s,j)=>{const v=Number(s.values[i]||0);if(!v)return;const topY=y(acc+v),h=y(acc)-topY;shapes+=`<rect class="report-chart-stacked-${toneClass(s.tone)}" x="${gx}" y="${topY}" width="${groupW}" height="${h}" rx="${acc+v===totals[i]?6:0}"></rect>`;acc+=v;});shapes+=`<text class="report-chart-value" x="${gx+groupW/2}" y="${y(totals[i])-9}" text-anchor="middle">${totals[i]}</text>`;}else{const inner=8,bw=(groupW-inner*(series.length-1))/Math.max(series.length,1);series.forEach((s,j)=>{const v=Number(s.values[i]||0),x=gx+j*(bw+inner),h=PH*v/max;shapes+=`<rect class="report-chart-series-${toneClass(s.tone)}" x="${x}" y="${T+PH-h}" width="${bw}" height="${Math.max(v?4:0,h)}" rx="5"></rect><text class="report-chart-value" x="${x+bw/2}" y="${T+PH-h-7}" text-anchor="middle">${v}</text>`;});}shapes+=`<text class="report-chart-label" x="${gx+groupW/2}" y="${H-17}" text-anchor="middle">${E(lab)}</text>`;});
  return`<svg viewBox="0 0 ${W} ${H}">${grid}${shapes}</svg>${legend(series)}`;
 }
 if(c.kind==='stackedH'){
  const labels=c.labels||[],series=c.series||[],rowH=Math.min(36,180/Math.max(labels.length,1)),top=42,left=110,right=40,plotW=W-left-right;let shapes='';
  labels.forEach((lab,i)=>{const values=series.map(s=>Number(s.values[i]||0)),total=sum(values)||1,y=top+i*rowH;shapes+=`<text class="report-chart-value" x="${left-12}" y="${y+14}" text-anchor="end">${E(lab)}</text>`;let x=left;series.forEach((s,j)=>{const ratio=c.percent?values[j]/total:values[j]/Math.max(total,1),w=c.percent?plotW*ratio:plotW*values[j]/total;shapes+=`<rect class="report-${c.percent?'status':'cap'}-${toneClass(s.tone)}" x="${x}" y="${y}" width="${Math.max(values[j]?2:0,w)}" height="20" rx="${j===0?6:0}"></rect>`;if(values[j]>0&&w>48)shapes+=`<text x="${x+w/2}" y="${y+14}" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:700">${c.percent?Math.round(ratio*100)+'%':fmtPct(values[j])}</text>`;x+=w;});});
  return`<svg viewBox="0 0 ${W} ${H}">${shapes}</svg>${legend(series)}`;
 }
 if(c.kind==='barH'){
  const labels=c.labels||[],values=c.values||[],max=Math.max(1,...values.map(Number)),left=190,right=55,top=34,rowH=Math.min(42,190/Math.max(labels.length,1)),plotW=W-left-right;let out='';values.forEach((v,i)=>{const y=top+i*rowH,w=plotW*Number(v)/max;out+=`<text class="report-chart-value" x="${left-12}" y="${y+17}" text-anchor="end">${E(labels[i])}</text><rect class="report-chart-bar" x="${left}" y="${y}" width="${Math.max(v?4:0,w)}" height="22" rx="7"></rect><text class="report-chart-value" x="${Math.min(left+w+10,W-right)}" y="${y+16}">${fmtPct(v)}${E(c.suffix||'')}</text>`;});return`<svg viewBox="0 0 ${W} ${H}">${out}</svg>`;
 }
 if(c.kind==='gantt'){
  const a=parseIso(c.start),b=parseIso(c.end),days=Math.max(1,Math.round((b-a)/86400000)),items=c.items||[],left=128,right=30,top=34,rowH=Math.min(36,190/Math.max(items.length,1)),plotW=W-left-right,x=iso=>left+(Math.max(0,Math.min(days,Math.round((parseIso(iso)-a)/86400000)))/days)*plotW;let out='';
  const ticks=weeklyBins(c.start,c.end);ticks.forEach(t=>{const xx=x(t.from);out+=`<line class="report-chart-grid" x1="${xx}" x2="${xx}" y1="${top-8}" y2="${top+items.length*rowH}"></line><text class="report-gantt-label" x="${xx+3}" y="${H-18}">${E(shortDate(t.from))}</text>`;});items.forEach((m,i)=>{const y=top+i*rowH,x1=x(m.start),x2=Math.max(x1+8,x(m.end));out+=`<text class="report-gantt-code" x="${left-12}" y="${y+16}" text-anchor="end">${E(m.code)}</text><rect class="report-gantt-track" x="${left}" y="${y+3}" width="${plotW}" height="18" rx="9"></rect><rect class="report-gantt-${m.type==='Correctivo'?'corrective':'preventive'}" x="${x1}" y="${y+3}" width="${Math.max(8,x2-x1)}" height="18" rx="9"></rect><text class="report-gantt-label" x="${Math.min(x2+8,W-right-115)}" y="${y+16}">${E(m.type)} · ${E(m.state)}</text>`;});return`<svg viewBox="0 0 ${W} ${H}">${out}</svg><div class="report-chart-legend"><span><i class="chart-tone-preventive"></i>Preventivo</span><span><i class="chart-tone-corrective"></i>Correctivo</span></div>`;
 }
 return'<div class="report-chart-empty">Sin datos para representar.</div>';
}
function cellHtml(header,value){
 const key=O.normalize(header);if(/utilizacion|uso al cierre/.test(key)&&Number.isFinite(Number(value)))return V.usageMeter(Number(value));
 if(key==='severidad'){const n=O.normalize(value),cls=n==='critica'?'danger':n==='alta'||n==='media'?'warning':'ok';return `<span class="status ${cls} severity-${n}">${E(value)}</span>`;}
  if(key==='estado'||key.includes('estado del')){const n=O.normalize(value),tone=/finalizado|cerrada|restaurado|operativo|activo/.test(n)?'ok':/ejecucion|reparacion|degradado/.test(n)?'warning':/fuera|cancelado/.test(n)?'danger':'info';return `<span class="status ${tone}">${E(value)}</span>`;}
  if(key==='nivel')return V.badge(String(value));return E(value);
}
const metricPaths={
 percent:'M 5 19 L 19 5 M 8 6 C 8 8.7 4 8.7 4 6 C 4 3.3 8 3.3 8 6 Z M 20 18 C 20 20.7 16 20.7 16 18 C 16 15.3 20 15.3 20 18 Z',
 incidents:'M 9 3 L 15 3 L 15 6 L 9 6 Z M 7 4 L 4 4 L 4 21 L 20 21 L 20 4 L 17 4 M 8 11 L 16 11 M 8 15 L 16 15',
 clock:'M 21 12 C 21 17 17 21 12 21 C 7 21 3 17 3 12 C 3 7 7 3 12 3 C 17 3 21 7 21 12 Z M 12 7 L 12 12 L 16 14',
 critical:'M 12 3 L 22 21 L 2 21 Z M 12 9 L 12 14 M 12 17 L 12 18',
 tools:'M 20 3 C 16 1 12 5 14 9 L 3 18 L 6 21 L 17 11 C 21 12 24 8 21 5 L 18 8 L 16 6 Z',
 preventive:'M 12 2 L 21 6 L 20 14 C 19 18 15 21 12 22 C 9 21 5 18 4 14 L 3 6 Z M 7 12 L 11 16 L 17 9',
 database:'M 3 6 C 3 1 21 1 21 6 C 21 11 3 11 3 6 Z M 3 6 L 3 18 C 3 23 21 23 21 18 L 21 6 M 3 12 C 3 17 21 17 21 12',
 services:'M 8 3 L 16 3 L 16 9 L 8 9 Z M 12 9 L 12 14 M 5 17 L 5 14 L 19 14 L 19 17 M 2 17 L 8 17 L 8 22 L 2 22 Z M 16 17 L 22 17 L 22 22 L 16 22 Z',
 clients:'M 15 7 C 15 11 9 11 9 7 C 9 3 15 3 15 7 Z M 5 21 L 5 18 C 5 11 19 11 19 18 L 19 21 M 18 4 C 24 5 24 11 19 11 M 21 14 C 24 15 24 18 24 21',
 check:'M 21 12 C 21 17 17 21 12 21 C 7 21 3 17 3 12 C 3 7 7 3 12 3 C 17 3 21 7 21 12 Z M 7 12 L 11 16 L 17 9',
 high:'M 3 18 L 3 6 M 3 18 L 21 18 M 6 14 L 11 9 L 15 12 L 21 5 M 16 5 L 21 5 L 21 10',
 low:'M 3 18 L 3 6 M 3 18 L 21 18 M 6 6 L 11 11 L 15 8 L 21 15 M 16 15 L 21 15 L 21 10',
 trend:'M 3 4 L 3 21 L 22 21 M 6 16 L 11 10 L 15 13 L 21 5',
 pulse:'M 2 12 L 6 12 L 9 4 L 14 20 L 18 12 L 22 12',
 activation:'M 4 7 L 4 21 L 20 21 L 20 7 Z M 4 11 L 20 11 M 8 3 L 8 8 M 16 3 L 16 8 M 9 16 L 11 18 L 16 13'
};
function reportCardMeta(label){
 const n=O.normalize(label);
 if(/alta/.test(n))return['warning','pulse'];
 if(/maximo/.test(n))return['info','high'];
 if(/minimo/.test(n))return['info','low'];
 if(/tendencia/.test(n))return['ok','trend'];
 if(/utilizacion|promedio/.test(n))return['info','percent'];
 if(/crit/.test(n))return['danger','critical'];
 if(/sin cerrar/.test(n))return['warning','clock'];
 if(/incidencia|registrad/.test(n))return['danger','incidents'];
 if(/preventivo/.test(n))return['ok','preventive'];
 if(/mantenimiento|correctivo|intervencion/.test(n))return['warning','tools'];
 if(/capacidad/.test(n))return['info','database'];
 if(/cliente/.test(n))return['info','clients'];
 if(/activados/.test(n))return['ok','activation'];
 if(/servicio/.test(n))return['ok','services'];
 if(/cerrad|finaliz/.test(n))return['ok','check'];
 return['info','trend'];
}
function renderReport(r,host){
 const cards=r.cards.map(([k,v,d])=>{const[tone,icon]=reportCardMeta(k);return`<article class="report-summary-card report-summary-card--${tone}"><div class="metric-icon ${tone}"><svg aria-hidden="true" viewBox="0 0 26 26" width="32" height="32"><path d="${metricPaths[icon]}" transform="translate(1 1)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="metric-label">${E(k)}</span><strong>${E(v)}</strong><small>${E(d||'')}</small></article>`;}).join('');
 const ctx=`Alcance: ${r.scope} · Periodo: ${formatPeriod(r.start,r.end)}`;
  const visual=(r.charts||[]).map(c=>`<article class="panel report-visual-panel"><h2 class="report-section-title">${E(c.title)}</h2><p class="report-section-subtitle">${E(ctx)}</p><div class="report-line-chart">${chartSvg(c,(r.charts||[]).length===2)}</div></article>`).join('');
 const visualBlock=(r.charts||[]).length===2?`<div class="report-visual-grid">${visual}</div>`:visual;
 const rows=r.rows.length?r.rows.map(row=>'<tr>'+row.map((v,i)=>`<td>${cellHtml(r.headers[i],v)}</td>`).join('')+'</tr>').join(''):`<tr><td colspan="${r.headers.length}" class="cell-center">Sin registros para estos criterios.</td></tr>`;
 host.innerHTML=`<div class="report-summary-grid">${cards}</div>${visualBlock}<article class="panel"><h2 class="report-section-title">Detalle operativo</h2><p class="report-section-subtitle">${E(ctx)}</p><div class="table-container"><table class="report-table"><thead><tr>${r.headers.map(h=>`<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

async function pdf(r){
 if(!window.PDFLib)throw Error('No se pudo cargar el generador de PDF.');
 const {PDFDocument,StandardFonts,rgb}=window.PDFLib,doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),logo=await doc.embedPng(window.OceanLinkBrandPng);
 const W=842,H=595,M=42,navy=rgb(.02,.22,.35),teal=rgb(.04,.62,.64),blue=rgb(.18,.47,.72),muted=rgb(.36,.45,.49),warm=rgb(.998,.989,.973),grid=rgb(.82,.87,.88),amber=rgb(.82,.55,.12),gold=rgb(.89,.71,.28),red=rgb(.81,.30,.28),green=rgb(.18,.61,.40),pale=rgb(.72,.87,.88),white=rgb(1,1,1);
 const tones={critical:red,high:amber,medium:gold,low:green,incident:red,maintenance:teal,operational:green,degraded:amber,maintaining:blue,out:red,used:teal,reserved:blue,free:pale,preventive:teal,corrective:amber};
 const clean=v=>String(v??'').replace(/[→–—·]/g,m=>({'→':'->','–':'-','—':'-','·':'|'}[m])).replace(/[^\x20-\x7e\xa0-\xff]/g,'');
 const fit=(v,w,size,f=font)=>{const raw=clean(v);let t=raw;while(t.length>3&&f.widthOfTextAtSize(t,size)>w)t=t.slice(0,-2);return t===raw?t:t+'...';};
 const rounded=(pg,x,y,w,h,fill,border=grid,radius=9)=>{
  const r=Math.min(radius,w/2,h/2),off=r*(1-.5522847498);
  const path=`M ${r} 0 L ${w-r} 0 C ${w-off} 0 ${w} ${off} ${w} ${r} L ${w} ${h-r} C ${w} ${h-off} ${w-off} ${h} ${w-r} ${h} L ${r} ${h} C ${off} ${h} 0 ${h-off} 0 ${h-r} L 0 ${r} C 0 ${off} ${off} 0 ${r} 0 Z`;
  pg.drawSvgPath(path,{x,y:y+h,color:fill,...(border?{borderColor:border,borderWidth:.7}:{})});
 };
 const drawMetricIcon=(label,cx,cy)=>{const [tone,key]=reportCardMeta(label),accent={info:blue,danger:red,warning:amber,ok:teal}[tone],bg={info:rgb(.89,.94,.98),danger:rgb(.99,.90,.89),warning:rgb(1,.95,.83),ok:rgb(.87,.96,.95)}[tone];rounded(page,cx-13,cy-13,26,26,bg,null,8);page.drawSvgPath(metricPaths[key],{x:cx-8,y:cy+8,scale:2/3,borderColor:accent,borderWidth:1.8});return accent;};
 let page,pageNo=0,y;
 const footer=()=>{page.drawLine({start:{x:M,y:30},end:{x:W-M,y:30},thickness:.5,color:grid});page.drawText('OceanLink - Reporte operativo - Uso interno',{x:M,y:16,size:6.3,font,color:muted});const t=`Generado por Axel Leon - Pagina ${pageNo}`;page.drawText(t,{x:W-M-font.widthOfTextAtSize(t,6.3),y:16,size:6.3,font,color:muted});};
 const newPage=()=>{if(page)footer();page=doc.addPage([W,H]);pageNo++;page.drawRectangle({x:0,y:0,width:W,height:H,color:warm});page.drawRectangle({x:0,y:H-5,width:W*.66,height:5,color:navy});page.drawRectangle({x:W*.66,y:H-5,width:W*.34,height:5,color:teal});const lw=110,lh=lw*logo.height/logo.width;page.drawImage(logo,{x:M,y:H-56,width:lw,height:lh});const title=`Reporte: ${clean(r.type)}`;page.drawText(title,{x:W/2-bold.widthOfTextAtSize(title,18)/2,y:H-54,size:18,font:bold,color:navy});page.drawText('Resultados consolidados para supervisión operativa.',{x:W/2-font.widthOfTextAtSize('Resultados consolidados para supervisión operativa.',7.4)/2,y:H-69,size:7.4,font,color:muted});y=H-88;};
 const legendPdf=(series,x,yy,w)=>{if(!series?.length)return;let cx=x;series.forEach(s=>{const name=clean(s.name),tw=font.widthOfTextAtSize(name,5.8)+17;if(cx+tw>x+w){cx=x;yy-=10;}page.drawRectangle({x:cx,y:yy-1,width:7,height:7,color:tones[s.tone]||teal});page.drawText(name,{x:cx+11,y:yy,size:5.8,font,color:muted});cx+=tw+9;});};
 const drawChart=(c,x,top,w,h)=>{
  rounded(page,x,top-h,w,h,white);const title=clean(c.title);page.drawText(title,{x:x+w/2-bold.widthOfTextAtSize(title,8.6)/2,y:top-19,size:8.6,font:bold,color:navy});
  const ctx=fit(`Alcance: ${r.scope} | Periodo: ${formatPeriod(r.start,r.end)}`,w-40,5.7);page.drawText(ctx,{x:x+w/2-font.widthOfTextAtSize(ctx,5.7)/2,y:top-31,size:5.7,font,color:muted});
  const L=x+38,R=x+w-18,T=top-48,B=top-h+28,cw=R-L,ch=T-B;
  if(c.kind==='distribution'){
   const items=c.items||[],total=sum(items.map(item=>item.value)),rh=Math.min(36,(h-52)/Math.max(items.length,1)),contentH=items.length*rh,start=top-45-Math.max(0,(h-55-contentH)/2);
   if(!total){const message='Sin registros para estos criterios.';page.drawText(message,{x:x+w/2-font.widthOfTextAtSize(message,7)/2,y:top-h/2,size:7,font,color:muted});return;}
   items.forEach((item,i)=>{const yy=start-i*rh,xx=x+18,trackW=w-66,count=String(item.value),percent=Math.round(item.value/total*100)+'%';
    page.drawText(clean(item.name),{x:xx,y:yy,size:6.5,font:bold,color:navy});
    page.drawText(count,{x:xx+trackW-bold.widthOfTextAtSize(count,6.5),y:yy,size:6.5,font:bold,color:navy});
    rounded(page,xx,yy-12,trackW,4.5,rgb(.89,.93,.94),null,2.25);
    if(item.value)rounded(page,xx,yy-12,trackW*item.value/total,4.5,tones[item.tone]||blue,null,2.25);
    page.drawText(percent,{x:x+w-15-font.widthOfTextAtSize(percent,6.4),y:yy-12,size:6.4,font:bold,color:muted});
   });
  } else if(c.kind==='line'){
   const vals=c.values||[],max=c.max||Math.max(1,...vals),py=v=>B+ch*Number(v)/max,ticks=c.max===100?[0,25,50,75,100]:[0,max*.25,max*.5,max*.75,max];ticks.forEach(v=>{const yy=py(v);page.drawLine({start:{x:L,y:yy},end:{x:R,y:yy},thickness:.5,color:grid});const t=`${Math.round(v)}${c.suffix==='%'?'%':''}`;page.drawText(t,{x:L-9-font.widthOfTextAtSize(t,5.2),y:yy-2,size:5.2,font,color:muted});});(c.thresholds||[]).forEach((v,i)=>page.drawLine({start:{x:L,y:py(v)},end:{x:R,y:py(v)},thickness:.8,color:i?red:amber,dashArray:[4,3]}));const xp=i=>vals.length===1?L+cw/2:L+cw*i/(vals.length-1);for(let i=0;i<vals.length-1;i++)page.drawLine({start:{x:xp(i),y:py(vals[i])},end:{x:xp(i+1),y:py(vals[i+1])},thickness:2,color:teal});vals.forEach((v,i)=>{page.drawCircle({x:xp(i),y:py(v),size:3,color:white,borderColor:teal,borderWidth:1.2});const tx=`${fmtPct(v)}${c.suffix||''}`;page.drawText(tx,{x:xp(i)-bold.widthOfTextAtSize(tx,5.4)/2,y:py(v)+7,size:5.4,font:bold,color:navy});const lb=fit(c.labels[i],45,5);page.drawText(lb,{x:xp(i)-font.widthOfTextAtSize(lb,5)/2,y:B-14,size:5,font,color:muted});});
  } else if(c.kind==='groupedBar'||c.kind==='stackedBar'){
   const series=c.series||[],labels=c.labels||[],totals=labels.map((_,i)=>c.kind==='stackedBar'?sum(series.map(s=>s.values[i]||0)):Math.max(...series.map(s=>Number(s.values[i]||0)),0)),max=Math.max(4,Math.ceil(Math.max(1,...totals)/4)*4),py=v=>B+ch*Number(v)/max;[0,max/4,max/2,max*3/4,max].forEach(v=>{const yy=py(v);page.drawLine({start:{x:L,y:yy},end:{x:R,y:yy},thickness:.5,color:grid});page.drawText(String(Math.round(v)),{x:L-14,y:yy-2,size:5,font,color:muted});});const gap=8,gw=(cw-gap*(labels.length+1))/Math.max(labels.length,1);labels.forEach((lab,i)=>{const gx=L+gap+i*(gw+gap);if(c.kind==='stackedBar'){let acc=0;series.forEach(s=>{const v=Number(s.values[i]||0);if(!v)return;const hh=ch*v/max;page.drawRectangle({x:gx,y:py(acc),width:gw,height:hh,color:tones[s.tone]||teal});acc+=v;});const tt=String(totals[i]);page.drawText(tt,{x:gx+gw/2-bold.widthOfTextAtSize(tt,5.4)/2,y:py(totals[i])+5,size:5.4,font:bold,color:navy});}else{const bw=(gw-4*(series.length-1))/Math.max(series.length,1);series.forEach((s,j)=>{const v=Number(s.values[i]||0),hh=ch*v/max,xx=gx+j*(bw+4);page.drawRectangle({x:xx,y:B,width:bw,height:Math.max(v?1.5:0,hh),color:tones[s.tone]||[teal,blue,amber,red][j]});});}const lb=fit(lab,gw+8,4.7);page.drawText(lb,{x:gx+gw/2-font.widthOfTextAtSize(lb,4.7)/2,y:B-13,size:4.7,font,color:muted});});legendPdf(series,x+16,top-41,w-32);
  } else if(c.kind==='stackedH'){
   const labels=c.labels||[],series=c.series||[],rh=Math.min(26,ch/Math.max(labels.length,1)),barH=Math.min(12,rh*.52);labels.forEach((lab,i)=>{const yy=T-(i+1)*rh+5,vals=series.map(s=>Number(s.values[i]||0)),total=sum(vals)||1;page.drawText(fit(lab,52,5.3),{x:L-7-font.widthOfTextAtSize(fit(lab,52,5.3),5.3),y:yy+5,size:5.3,font:bold,color:navy});let xx=L;vals.forEach((v,j)=>{const ww=c.percent?cw*v/total:cw*v/total;page.drawRectangle({x:xx,y:yy,width:Math.max(v?1:0,ww),height:barH,color:tones[series[j].tone]||teal});xx+=ww;});});legendPdf(series,x+16,top-41,w-32);
  } else if(c.kind==='barH'){
   const vals=c.values||[],labels=c.labels||[],max=Math.max(1,...vals),rh=Math.min(28,(ch-4)/Math.max(vals.length,1));vals.forEach((v,i)=>{const yy=T-(i+1)*rh+5,lab=fit(labels[i],70,5.2);page.drawText(lab,{x:L-8-font.widthOfTextAtSize(lab,5.2),y:yy+5,size:5.2,font,color:navy});const ww=cw*Number(v)/max;page.drawRectangle({x:L,y:yy,width:ww,height:13,color:teal});const tx=`${fmtPct(v)}${c.suffix||''}`;page.drawText(tx,{x:Math.min(L+ww+5,R-40),y:yy+4,size:5.2,font:bold,color:navy});});
  } else if(c.kind==='gantt'){
   const a=parseIso(c.start),b=parseIso(c.end),days=Math.max(1,Math.round((b-a)/86400000)),items=c.items||[],rh=Math.min(25,(ch-4)/Math.max(items.length,1)),xp=iso=>L+cw*Math.max(0,Math.min(days,Math.round((parseIso(iso)-a)/86400000)))/days;weeklyBins(c.start,c.end).forEach(t=>{const xx=xp(t.from);page.drawLine({start:{x:xx,y:B},end:{x:xx,y:T},thickness:.45,color:grid});page.drawText(shortDate(t.from),{x:xx+2,y:B-12,size:4.8,font,color:muted});});items.forEach((m,i)=>{const yy=T-(i+1)*rh+4,lab=fit(m.code,50,5.3);page.drawText(lab,{x:L-8-font.widthOfTextAtSize(lab,5.3),y:yy+5,size:5.3,font:bold,color:navy});page.drawRectangle({x:L,y:yy,width:cw,height:11,color:rgb(.93,.96,.96)});page.drawRectangle({x:xp(m.start),y:yy,width:Math.max(4,xp(m.end)-xp(m.start)),height:11,color:m.type==='Correctivo'?amber:teal});});legendPdf([{name:'Preventivo',tone:'preventive'},{name:'Correctivo',tone:'corrective'}],x+16,top-41,w-32);
  }
 };

 newPage();
 const chipTexts=[`Tipo - ${r.type}`,`Alcance - ${r.scope}`,`Fechas - ${formatPeriod(r.start,r.end)}`],chipW=[190,150,185],gap=9,total=chipW.reduce((a,b)=>a+b,0)+gap*2;let cx=(W-total)/2;chipTexts.forEach((t,i)=>{rounded(page,cx,y-14,chipW[i],20,white);page.drawCircle({x:cx+11,y:y-4,size:2.3,color:i===0?teal:i===1?blue:amber});page.drawText(fit(t,chipW[i]-25,7),{x:cx+17,y:y-7,size:7,font,color:navy});cx+=chipW[i]+gap;});y-=34;
 const cardGap=12,cardW=(W-2*M-cardGap*3)/4,cardH=88;r.cards.slice(0,4).forEach((c,i)=>{
  const x=M+i*(cardW+cardGap),center=x+cardW/2;rounded(page,x,y-cardH,cardW,cardH,white);
  const accent=drawMetricIcon(c[0],center,y-24);rounded(page,x+10,y-4,cardW-20,2.5,accent,null,1.25);
  const label=fit(c[0],cardW-18,7.3,bold);page.drawText(label,{x:center-bold.widthOfTextAtSize(label,7.3)/2,y:y-47,size:7.3,font:bold,color:muted});
  const val=fit(c[1],cardW-18,16,bold);page.drawText(val,{x:center-bold.widthOfTextAtSize(val,16)/2,y:y-68,size:16,font:bold,color:navy});
  const desc=fit(c[2]||'',cardW-18,6.1);page.drawText(desc,{x:center-font.widthOfTextAtSize(desc,6.1)/2,y:y-79,size:6.1,font,color:muted});
 });y-=cardH+16;
 const charts=r.charts||[];if(charts.length===2){const cg=12,cw=(W-2*M-cg)/2,ch=140;drawChart(charts[0],M,y,cw,ch);drawChart(charts[1],M+cw+cg,y,cw,ch);y-=ch+16;}else if(charts.length===1){const ch=r.type==='Indicadores históricos'?130:140;drawChart(charts[0],M,y,W-2*M,ch);y-=ch+16;}

 const pdfText=(header,value)=>{const key=O.normalize(header);if(/utilizacion|uso al cierre/.test(key)&&Number.isFinite(Number(value)))return`${fmtPct(value)}% · ${level(Number(value))}`;return clean(value);};
 const weights=r.headers.map(h=>/Ruta|Resultado|Cliente|Estado|Inicio|Fin|Detecci|Activaci|Segmentos|Elemento/.test(clean(h))?1.35:/Utilizaci/.test(clean(h))?1.25:1),ws=sum(weights),cols=weights.map(w=>(W-2*M-30)*w/ws),headerH=20,rowH=r.type==='Indicadores históricos'?14:16,tableTop=43,tableBottom=9,footerSafe=36;let idx=0;
 while(idx<Math.max(1,r.rows.length)){
  if(y<135){newPage();y=H-92;}
  let maxRows=Math.max(1,Math.floor((y-footerSafe-tableTop-headerH-tableBottom)/rowH));const source=r.rows.length?r.rows:[Array(r.headers.length).fill('Sin registros')],remaining=source.length-idx;if(remaining>maxRows&&remaining-maxRows<4)maxRows=Math.max(1,remaining-4);const slice=source.slice(idx,idx+maxRows),boxH=tableTop+headerH+slice.length*rowH+tableBottom;
  rounded(page,M,y-boxH,W-2*M,boxH,white);page.drawText('Detalle operativo',{x:W/2-bold.widthOfTextAtSize('Detalle operativo',9.2)/2,y:y-20,size:9.2,font:bold,color:navy});const ctx=fit(`Alcance: ${r.scope} | Periodo: ${formatPeriod(r.start,r.end)}`,W-2*M-70,6.2);page.drawText(ctx,{x:W/2-font.widthOfTextAtSize(ctx,6.2)/2,y:y-32,size:6.2,font,color:muted});let yy=y-44,x=M+15;page.drawRectangle({x,y:yy-headerH,width:W-2*M-30,height:headerH,color:navy});r.headers.forEach((h,i)=>{const t=fit(h,cols[i]-7,5.4,bold);page.drawText(t,{x:x+cols[i]/2-bold.widthOfTextAtSize(t,5.4)/2,y:yy-13,size:5.4,font:bold,color:white});x+=cols[i];});yy-=headerH;
  for(const row of slice){x=M+15;page.drawLine({start:{x,y:yy-rowH},end:{x:W-M-15,y:yy-rowH},thickness:.4,color:grid});row.forEach((v,i)=>{const key=O.normalize(r.headers[i]),cellCenter=x+cols[i]/2;if(/utilizacion|uso al cierre/.test(key)&&Number.isFinite(Number(v))){const num=Number(v),pct=`${fmtPct(num)}%`,lv=level(num),sep='|',gap=5,sepW=bold.widthOfTextAtSize(sep,5.5),lvn=O.normalize(lv),lvColor=/critica/.test(lvn)?red:/alta/.test(lvn)?amber:green;page.drawText(pct,{x:cellCenter-gap-bold.widthOfTextAtSize(pct,5.5),y:yy-11,size:5.5,font:bold,color:navy});page.drawText(sep,{x:cellCenter-sepW/2,y:yy-11,size:5.5,font:bold,color:navy});page.drawText(lv,{x:cellCenter+gap,y:yy-11,size:5.5,font:bold,color:lvColor});x+=cols[i];return;}const raw=pdfText(r.headers[i],v),t=fit(raw,cols[i]-7,5.5);let color=navy;if(/severidad/.test(key)){const n=O.normalize(v);color=/critica/.test(n)?red:/media/.test(n)?rgb(.56,.42,.08):/alta/.test(n)?amber:/baja/.test(n)?green:navy;}page.drawText(t,{x:cellCenter-font.widthOfTextAtSize(t,5.5)/2,y:yy-11,size:5.5,font:/severidad/.test(key)?bold:font,color});x+=cols[i];});yy-=rowH;}idx+=slice.length;y-=boxH+12;if(idx<source.length){newPage();y=H-92;}
 }
 footer();doc.setTitle(`OceanLink - ${r.type}`);doc.setAuthor('OceanLink');return doc.save();
}
async function download(r){const bytes=await pdf(r),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download='OceanLink_'+r.type.replace(/\s+/g,'_')+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function previewPdf(r){const popup=window.open('about:blank','_blank');if(popup){popup.document.title='OceanLink · PDF';popup.document.body.innerHTML='<p style="font-family:system-ui;padding:24px">Generando vista previa del PDF…</p>';}const bytes=await pdf(r),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));if(popup)popup.location.replace(url);else{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.append(a);a.click();a.remove();}setTimeout(()=>URL.revokeObjectURL(url),5*60*1000);}
window.OceanLinkReports={build,pdf,download,previewPdf,types,formatDate,formatPeriod};

function historyRecords(){
 const current=O.read('reportHistory',[])||[];let legacy=[];try{legacy=JSON.parse(localStorage.getItem('oceanlink.reportHistory')||'[]');if(!Array.isArray(legacy))legacy=[];}catch(_){legacy=[];}
 const merged=[...(Array.isArray(current)?current:[]),...legacy],out=[],seen=new Set();for(const item of merged){const source=item?.report||item||{},type=source.type,scope=source.scope||source.segment||item?.segment||'Toda la red',start=source.start||DEFAULT_START,end=source.end||DEFAULT_END;if(!types.includes(type))continue;let report;try{report=build(type,scope,start,end);}catch(_){continue;}report.generatedAt=source.generatedAt||item?.generatedAt||report.generatedAt;const signature=[type,scope,start,end,report.generatedAt||''].join('|');if(seen.has(signature))continue;seen.add(signature);const id=item?.id||`legacy-${Math.abs([...signature].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,0))}`;out.push({id,report});}out.sort((a,b)=>new Date(b.report.generatedAt||0)-new Date(a.report.generatedAt||0));const trimmed=out.slice(0,20);try{O.write('reportHistory',trimmed);}catch(_){}return trimmed;
}
document.addEventListener('DOMContentLoaded',()=>{
 const U=window.OceanLinkUI;if(!U)return;const {$,$$,notify,askConfirmation,validateForm}=U,p=location.pathname.split('/').pop(),q=new URLSearchParams(location.search),safe=fn=>async(...args)=>{try{return await fn(...args);}catch(e){notify(e.message||'No se pudo completar la operación.','error');}},history=historyRecords;
 if(p==='sup_reports.html'){
  for(const[param,selector]of[['tipo','.report-type-select'],['segmento','.report-segment-select'],['desde','.report-start-date'],['hasta','.report-end-date']])if(q.get(param)&&$(selector)){$(selector).value=q.get(param);$(selector).dispatchEvent(new Event('change',{bubbles:true}));}
  const start=$('.report-start-date'),end=$('.report-end-date');if(start&&!q.get('desde'))start.value=DEFAULT_START;if(end&&!q.get('hasta'))end.value=DEFAULT_END;
  $('[data-preview-report]')?.addEventListener('click',safe(()=>{if(!validateForm($('.report-builder-form')))return;const type=$('.report-type-select').value,scope=$('.report-segment-select').value,s=start.value,e=end.value;build(type,scope,s,e);location.href='sup_report_detail.html?'+new URLSearchParams({modo:'previsualizar',tipo:type,segmento:scope,desde:s,hasta:e});}));
  const tbody=$('[data-report-history-body]'),list=history().filter(x=>x?.id&&x?.report);if(tbody)tbody.innerHTML=list.length?list.map(item=>{const r=item.report,g=new Date(r.generatedAt).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');return`<tr><td><strong>${E(r.type)}</strong></td><td>${E(r.scope)}</td><td>${E(formatPeriod(r.start,r.end))}</td><td>Axel Leon</td><td>${E(g)}</td><td class="action-cell"><div class="report-row-actions"><a class="report-view-button" title="Ver reporte" aria-label="Ver reporte" href="sup_report_detail.html?modo=ver&id=${encodeURIComponent(item.id)}"><i class="fa-regular fa-eye"></i></a><button class="report-download-button" data-preview-pdf="${E(item.id)}" type="button" title="Ver PDF" aria-label="Ver PDF"><i class="fa-solid fa-file-pdf"></i></button></div></td></tr>`;}).join(''):'<tr class="table-empty-row"><td colspan="6">Aún no hay reportes generados.</td></tr>';
  $$('[data-preview-pdf]').forEach(btn=>btn.addEventListener('click',safe(()=>{const item=list.find(x=>x.id===btn.dataset.previewPdf);if(!item)throw Error('No se encontró el reporte.');return previewPdf(item.report);})));tbody?.closest('table')?._oceanlinkRefreshPagination?.(true);
 }
 if(p==='sup_report_detail.html'){
  const list=history(),record=list.find(x=>x.id===q.get('id'));let r;try{r=record?.report||build(q.get('tipo')||types[0],q.get('segmento')||'Toda la red',q.get('desde')||DEFAULT_START,q.get('hasta')||DEFAULT_END);}catch(e){$('[data-report-content]').textContent=e.message;$('[data-confirm-generate-report]').hidden=true;return;}
  $('[data-report-title]').textContent=record?`Reporte: ${r.type}`:`Vista previa: ${r.type}`;$('[data-report-subtitle]').textContent=record?`Periodo ${formatPeriod(r.start,r.end)}.`:'Contenido calculado con los criterios seleccionados.';$('[data-report-filter-summary]').innerHTML=[`Tipo: ${r.type}`,`Alcance: ${r.scope}`,`Periodo: ${formatPeriod(r.start,r.end)}`].map(x=>`<span class="report-filter-chip">${E(x)}</span>`).join('');renderReport(r,$('[data-report-content]'));
  const back=$('[data-report-back]');if(back){back.innerHTML='<i class="fa-solid fa-arrow-left"></i> Reportes';back.href='sup_reports.html?'+new URLSearchParams({tipo:r.type,segmento:r.scope,desde:r.start,hasta:r.end});}
  const generate=$('[data-confirm-generate-report]'),pdfButton=$('[data-report-pdf-download]');if(pdfButton){pdfButton.removeAttribute('download');pdfButton.href='#';pdfButton.innerHTML='<i class="fa-solid fa-file-pdf"></i> Ver PDF';pdfButton.hidden=!record;pdfButton.addEventListener('click',safe(e=>{e.preventDefault();return previewPdf(r);}));}
  if(generate){generate.hidden=!!record;generate.addEventListener('click',safe(async()=>{if(!await askConfirmation({title:'Generar reporte',message:'El reporte se añadirá al historial y quedará disponible para consulta en PDF.',confirmText:'Sí, generar'}))return;const id=String(Date.now())+'-'+Math.random().toString(36).slice(2,7),items=history();r.generatedAt=new Date().toISOString();items.unshift({id,report:r});O.write('reportHistory',items.slice(0,20));generate.hidden=true;if(pdfButton)pdfButton.hidden=false;window.history.replaceState({},'',`sup_report_detail.html?modo=ver&id=${encodeURIComponent(id)}`);$('[data-report-subtitle]').textContent=`Generado el ${new Date(r.generatedAt).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','')}.`;notify('Reporte generado correctamente. Puede revisarlo en PDF o volver al historial.');}));}
  U.enhanceResponsiveTables();
 }
});
})();
