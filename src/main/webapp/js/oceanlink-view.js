                                                                                        
(() => {
 const O=window.OceanLink,E=O.esc,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const b=v=>{const n=O.normalize(v);if(n==='critica')return `<span class="status severity-critica">${E(v)}</span>`;if(n==='alta')return `<span class="status severity-alta">${E(v)}</span>`;if(n==='media')return `<span class="status severity-media">${E(v)}</span>`;if(n==='baja')return `<span class="status severity-baja">${E(v)}</span>`;const cls=/fuera|rechaz|cancel|inactiv/.test(n)?'danger':/degrad|pendiente|ejecucion/.test(n)?'warning':/cerrad/.test(n)?'neutral':/analisis|programad|reparacion|mantenimiento|registrada|evaluacion|provisionada/.test(n)?'info':'ok';return `<span class="status ${cls}">${E(v)}</span>`;};
 const link=(page,code,extra='')=>`<a class="icon-action" href="${page}?codigo=${encodeURIComponent(code)}${extra}" title="Ver detalle de ${E(code)}" aria-label="Ver detalle de ${E(code)}"><i class="fa-regular fa-eye" aria-hidden="true"></i></a>`;
 const row=(cells,classes=[])=>'<tr>'+cells.map((c,i)=>`<td${classes[i]?` class="${E(classes[i])}"`:''}>${c}</td>`).join('')+'</tr>';
 const table=(n,rows)=>{const t=$$('table')[n];if(!t?.tBodies[0])return;const headers=[...(t.tHead?.rows[0]?.cells||[])],count=headers.length||1,original=[...(t.tBodies[0].rows[0]?.cells||[])];const classes=headers.map((h,i)=>/Acci[oó]n/i.test(h.textContent)?'action-cell':(original[i]?.className||h.className));t.tBodies[0].innerHTML=rows.length?rows.map(cells=>row(cells,classes)).join(''):`<tr class="table-empty-row"><td colspan="${count}">Sin registros para estos criterios.</td></tr>`;t._oceanlinkRefreshPagination?.(true);};
 const metrics=values=>$$('.summary-card > strong').forEach((el,i)=>{if(values[i]!==undefined)el.textContent=values[i];});
 const level=v=>v>95?'Crítica':v>=80?'Alta':'Normal';
 const fmtPct=v=>{const n=Number(v)||0;return Math.abs(n-Math.round(n))<.05?String(Math.round(n)):n.toFixed(1);};
 const usageMeter=v=>{const n=O.num(v),lv=level(n),cls=n>95?'danger':n>=80?'warning':'ok',bar=n>95?'critical':n>=80?'high':'';return `<div class="usage-meter"><span class="status ${cls}">${fmtPct(n)}% · ${lv}</span><div class="progress"><span class="${bar}" style="width:${Math.max(0,Math.min(n,100))}%"></span></div></div>`;};
 const route=s=>`${O.data.stations[s.origin]?.name||s.origin} - ${O.data.stations[s.destination]?.name||s.destination}`;
 const opts=(select,options)=>{if(!select)return;const before=select.value;select.innerHTML=options.map(([value,label])=>`<option value="${E(value)}">${E(label)}</option>`).join('');const match=options.find(o=>o[0]===before||o[1]===before);if(match)select.value=match[0];};
 const activeImpact=()=>Object.entries(O.data.incidents).filter(([,i])=>!['Cerrada','Servicio restaurado'].includes(i.state));
 const impactFor=inc=>{const services=[...new Set(inc.flatMap(([,i])=>i.services))];return {services,clients:[...new Set(services.map(c=>O.data.services[c].clientCode))],capacity:O.num(services.reduce((s,c)=>s+O.amount(O.data.services[c].capacity),0))};};
 const impactButton=(kind,code,services)=>{const count=Number(services)||0;if(!count)return '<div class="impact-summary-static"><strong>0 servicios</strong><small>Sin impacto identificado</small></div>';const label=kind==='maintenance'?'potencialmente afectados':'afectados';return `<button class="impact-detail-trigger" type="button" data-impact-kind="${kind}" data-impact-code="${E(code)}" title="Ver ${count} ${count===1?'servicio':'servicios'} ${label}" aria-label="Ver detalle de ${count} ${count===1?'servicio':'servicios'} ${label} en ${E(code)}"><span class="impact-detail-count">${count} ${count===1?'servicio':'servicios'}</span></button>`;};
 function ensureImpactModal(){
  let modal=$('#modal-impact-oceanlink');if(modal)return modal;
  modal=document.createElement('div');modal.id='modal-impact-oceanlink';modal.className='modal impact-detail-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.innerHTML=`<button aria-label="Cerrar ventana" class="modal-background" type="button"></button><div class="modal-box modal-wide"><div class="modal-header"><div><span class="modal-eyebrow" data-impact-eyebrow>IMPACTO OPERATIVO</span><h2 data-impact-title>Servicios relacionados</h2></div><button aria-label="Cerrar" class="modal-close" title="Cerrar" type="button"><i class="fa-solid fa-xmark"></i></button></div><div class="modal-body"><div class="impact-modal-summary" data-impact-summary></div><p class="modal-intro impact-modal-copy" data-impact-copy></p><div class="table-container impact-modal-table-wrap"><table class="impact-modal-table"><thead><tr><th>Servicio</th><th>Cliente</th><th>Ruta</th><th>Capacidad</th><th>Estado</th></tr></thead><tbody data-impact-body></tbody></table></div></div></div>`;document.body.appendChild(modal);return modal;
 }
 function showImpactDetail(kind,code,opener){
  O.refresh();const d=O.data,record=kind==='maintenance'?d.maint[code]:d.incidents[code];if(!record)return;
  const ids=[...new Set(record.services||[])],clients=[...new Set(ids.map(id=>d.services[id]?.client).filter(Boolean))],modal=ensureImpactModal();
  $('[data-impact-eyebrow]',modal).textContent=kind==='maintenance'?'SERVICIOS POTENCIALMENTE AFECTADOS':'SERVICIOS Y CLIENTES AFECTADOS';
  $('[data-impact-title]',modal).textContent=`${kind==='maintenance'?'Mantenimiento':'Incidencia'} ${code}`;
  const meta=kind==='maintenance'?[['Infraestructura',record.element],['Estado',record.state],['Servicios',ids.length],['Clientes',clients.length]]:[['Segmentos',(record.segments||[]).join(' · ')],['Severidad',record.severity],['Servicios',ids.length],['Clientes',clients.length]];
  $('[data-impact-summary]',modal).innerHTML=meta.map(([k,v])=>{const semantic=/^(Severidad|Estado)$/.test(k);return `<div><span>${E(k)}</span><strong>${semantic?b(v):E(v)}</strong></div>`;}).join('');
  $('[data-impact-copy]',modal).textContent=kind==='maintenance'?'Servicios activos cuya ruta utiliza la infraestructura de la intervención. La consulta es de solo lectura para el Supervisor.':'Servicios activos asociados a los segmentos de la incidencia y clientes relacionados. La consulta es de solo lectura para el Supervisor.';
  const body=$('[data-impact-body]',modal);body.innerHTML=ids.length?ids.map(id=>{const srv=d.services[id];if(!srv)return'';return `<tr><td><strong>${E(id)}</strong></td><td>${E(srv.client)}</td><td>${E(route(srv))}<small class="impact-route-segments">${E((srv.segments||[]).join(' · '))}</small></td><td>${E(O.amount(srv.capacity))} Tbps</td><td>${b(srv.state)}</td></tr>`;}).join(''):'<tr class="table-empty-row"><td colspan="5">No se identificaron servicios activos relacionados.</td></tr>';
  window.OceanLinkUI?.openModal?.(modal,opener);
 }
 function bindImpactDetails(){if(document.body.dataset.impactDetailsBound==='1')return;document.body.dataset.impactDetailsBound='1';document.addEventListener('click',e=>{const trigger=e.target.closest('.impact-detail-trigger');if(!trigger)return;e.preventDefault();showImpactDetail(trigger.dataset.impactKind,trigger.dataset.impactCode,trigger);});}

 function hydrate(){
  const d=O.data,p=location.pathname.split('/').pop(),S=Object.entries(d.segments),I=Object.entries(d.incidents),M=Object.entries(d.maint),A=I.filter(([,i])=>i.state!=='Cerrada'),live=activeImpact(),impact=impactFor(live),pending=M.filter(([,m])=>m.state!=='Finalizado');
  const pageRole=O.roleForPage(p),params=new URLSearchParams(location.search);let relatedRole='';
  try{if(params.get('consulta')==='1')relatedRole=params.get('origen')==='supervisor'?'Supervisor':sessionStorage.getItem('oceanlink.final.role')||'';}catch(_){}
  const role=relatedRole||pageRole,user=Object.values(d.users).find(u=>u.role===role&&u.state==='Activo'),userLabel=$('.session-data .user'),roleLabel=$('.session-data .role');
  if(roleLabel)roleLabel.textContent=role;
  else if(role&&$('.session-data')){const label=document.createElement('span');label.className='role';label.textContent=role;$('.session-data').prepend(label);}
  if(user&&userLabel){userLabel.innerHTML=E(user.name)+' <span aria-hidden="true" class="user-mark">U</span>';userLabel.title=user.name+' · '+role;}
  if(p==='admin_users.html'){
   table(0,Object.entries(d.users).map(([c,u])=>[E(c),E(u.name),E(u.email),E(u.role),E(u.last),b(u.state),`<div class="icon-actions"><a class="icon-action user-view" href="#modal-usuario-perfil" aria-label="Ver perfil de ${E(u.name)}" title="Ver perfil"><i class="fa-regular fa-eye"></i></a><a class="icon-action edit user-edit" href="#modal-usuario-editar" aria-label="Editar a ${E(u.name)}" title="Editar usuario"><i class="fa-regular fa-pen-to-square"></i></a><a class="icon-action user-toggle ${u.state==='Activo'?'danger':'positive'}" href="#" aria-label="Cambiar estado de ${E(u.name)}" title="Cambiar estado"><i class="fa-solid fa-user-check"></i><span>${u.state==='Activo'?'Desactivar':'Activar'}</span></a></div>`]));
   for(const r of $$('.users-panel tbody tr')){const u=d.users[r.cells[0].textContent];if(u)Object.assign(r.dataset,{userPhone:u.phone,userHire:u.hire,userCreated:u.hire,userLastLogin:u.last,userUpdated:u.hire});}
  }
  if(p==='admin_stations.html')table(0,Object.entries(d.stations).map(([c,s])=>[E(c),E(s.name),E(s.location),b(s.state),link('admin_station_detail.html',c)]));
  if(p==='admin_segments.html')table(0,S.map(([c,s])=>[E(c),E(d.stations[s.origin]?.name),E(d.stations[s.destination]?.name),s.total,b(s.state),`<div class="icon-actions">${link('admin_segment_detail.html',c)}<a class="icon-action positive" href="admin_segment_stations.html?codigo=${c}" title="Gestionar estaciones" aria-label="Gestionar estaciones de ${c}"><i class="fa-solid fa-link"></i></a></div>`]));
  if(p==='cp_capacity.html')table(0,S.map(([c,s])=>[`<div class="segment-cell"><strong>${c}</strong><small>${E(route(s))}</small></div>`,s.total,s.used,s.reserved,s.available,usageMeter(s.utilization),link('cp_capacity_detail.html',c)]));
  if(p==='cp_clients.html')table(0,Object.entries(d.clients).map(([c,x])=>[c,E(x.name),E(x.email),x.services.length,b(x.state),link('cp_client_detail.html',c)]));
  if(p==='cp_requests.html')table(0,Object.entries(d.requests).map(([c,r])=>[c,E(r.client),E(route(r)),O.amount(r.capacity),b(r.state),link('cp_request_detail.html',c)]));
  if(p==='cp_services.html')table(0,Object.entries(d.services).map(([c,s])=>[c,E(s.client),E(route(s)),O.amount(s.capacity),b(s.state),`<div class="icon-actions">${link('cp_service_detail.html',c)}${s.state==='Cancelado'?'':`<a class="icon-action edit" data-service-route-code="${c}" href="#modal-ruta" title="Gestionar ruta de ${c}" aria-label="Gestionar ruta de ${c}"><i class="fa-solid fa-route"></i></a>`}</div>`]));
  if(p==='no_network.html'){metrics(['Operativo','Degradado','En mantenimiento','Fuera de servicio'].map(state=>S.filter(([,s])=>s.state===state).length));table(0,S.map(([c,s])=>[c,E(route(s)),usageMeter(s.utilization),b(s.state),link('no_segment_detail.html',c)]));}
  if(p==='no_incidents.html')table(0,A.map(([c,i])=>[c,E(i.segments.join(' · ')),b(i.severity),E(i.date),b(i.state),link('no_incident_detail.html',c)]));
  if(p==='no_incident_history.html')table(0,I.filter(([,i])=>i.state==='Cerrada').map(([c,i])=>[c,E(i.segments.join(' · ')),b(i.severity),E(i.closed),E(i.result||i.observations?.at(-1)?.[2]),link('no_incident_detail.html',c,'&historial=1')]));
  if(p==='mc_maintenance.html')table(0,pending.map(([c,m])=>[c,E(m.type),E(m.element),E(m.start),b(m.state),link('mc_maintenance_detail.html',c)]));
  if(p==='mc_history.html')table(0,M.filter(([,m])=>m.state==='Finalizado').map(([c,m])=>[c,E(m.element),E(m.type),E(m.closed||m.end),E(m.result),link('mc_maintenance_detail.html',c,'&historial=1')]));
  if(p==='dashboard.html'){
   metrics([Object.values(d.users).filter(u=>u.state==='Activo').length,Object.keys(d.stations).length,S.filter(([,s])=>s.state==='Operativo').length,A.length]);
   table(0,[...S.map(([c,s])=>['Segmento',c,b(s.state),'20/09/2026']),...Object.entries(d.stations).filter(([,s])=>s.state!=='Operativa').map(([c,s])=>['Estación',c,b(s.state),'20/09/2026'])]);
  }
  const mean=segments=>segments.length?O.num(segments.reduce((sum,[,s])=>sum+s.utilization,0)/segments.length):0;
  if(p==='sup_network_capacity.html'){
   metrics([mean(S).toFixed(1)+'%',S.filter(([,s])=>s.utilization>95).length,S.filter(([,s])=>s.utilization>=80&&s.utilization<=95).length,O.num(S.reduce((sum,[,s])=>sum+s.available,0))+' Tbps']);
   table(0,S.map(([c,s])=>[c,E(route(s)),usageMeter(s.utilization),b(s.state),link('sup_report_detail.html',c,`&modo=previsualizar&tipo=${encodeURIComponent('Capacidad y utilización')}&segmento=${encodeURIComponent(c)}&desde=2026-01-01&hasta=${encodeURIComponent(O.snapshotDate)}`)]));
  }
  if(p==='sup_incidents.html'){metrics([A.length,A.filter(([,i])=>i.severity==='Crítica').length,impact.services.length,impact.clients.length]);table(0,A.map(([c,i])=>{const services=i.state==='Servicio restaurado'?0:i.services.length,lastUpdate=i.observations?.at(-1)?.[1]||i.closed||i.date;return[c,E(i.segments.join(' · ')),b(i.severity),b(i.state),impactButton('incident',c,services),E(lastUpdate)];}));}
  if(p==='sup_affected_services.html'){
   const critical=impactFor(live.filter(([,i])=>i.severity==='Crítica'));
   metrics([impact.services.length,impact.clients.length,impact.capacity+' Tbps',critical.services.length]);
   table(0,live.flatMap(([c,i])=>i.services.map(id=>{const s=d.services[id];return [c,E(i.segments.filter(seg=>s.segments.includes(seg)).join(' · ')),id,E(s.client),O.amount(s.capacity),b(i.severity)];})));
  }
  if(p==='sup_maintenance.html'){
   metrics([pending.filter(([,m])=>m.state==='Programado').length,pending.filter(([,m])=>m.state==='En ejecución').length,new Set(pending.flatMap(([,m])=>m.services)).size,M.filter(([,m])=>m.state==='Finalizado'&&O.dateISO(m.closed||m.end).startsWith('2026-09')).length]);
   table(0,pending.map(([c,m])=>[c,E(m.type),E(m.element),`<div class="table-stack"><strong>${E(m.start)}</strong><small>${E(m.end)} · ${E(m.duration)}</small></div>`,impactButton('maintenance',c,m.services.length),b(m.state)]));
   table(1,M.filter(([,m])=>m.state==='Finalizado').map(([c,m])=>[c,E(m.element),E(m.closed||m.end),E(m.result)]));
  }
  if(p==='sup_dashboard.html'){
   const update=()=>{
    const scope=$('.supervisor-scope-select')?.value||'Toda la red',days=parseInt($('.supervisor-period-select')?.value)||30;
    const end=new Date(O.snapshotDate+'T12:00:00'),start=new Date(end);start.setDate(end.getDate()-days+1);const first=start.toISOString().slice(0,10);
    const segs=scope==='Toda la red'?S:S.filter(([c])=>c===scope),ins=A.filter(([,i])=>(scope==='Toda la red'||i.segments.includes(scope))&&O.dateISO(i.date)>=first&&O.dateISO(i.date)<=O.snapshotDate),affected=impactFor(ins.filter(([,i])=>i.state!=='Servicio restaurado'));
    const maintenance=pending.filter(([,m])=>(scope==='Toda la red'||m.element===scope||[d.segments[scope]?.origin,d.segments[scope]?.destination].includes(m.element))&&O.dateISO(m.start)>=first);
    metrics([mean(segs).toFixed(1)+'%',ins.length,affected.services.length,maintenance.length]);
    const notes=['Estado actual · promedio por segmento',`${ins.filter(([,i])=>i.severity==='Crítica').length} críticas · eventos del periodo`,`${affected.clients.length} clientes · sin duplicados`,`${maintenance.filter(([,m])=>m.state==='Programado').length} programados · ${maintenance.filter(([,m])=>m.state==='En ejecución').length} en ejecución`];
    $$('.summary-card > small').forEach((el,i)=>el.textContent=notes[i]);
    $$('.priority-segment').forEach(el=>el.remove());const host=$('.supervisor-priority-card');
    segs.slice().sort((a,b)=>b[1].utilization-a[1].utilization).slice(0,3).forEach(([c,s])=>host?.insertAdjacentHTML('beforeend',`<div class="priority-segment"><div><strong>${c}</strong><span>${E(route(s))}</span></div><div class="priority-meter"><span class="${s.utilization>95?'critical':'high'}" style="width:${Math.min(s.utilization,100)}%"></span></div><b>${s.utilization.toFixed(1)}%</b>${b(level(s.utilization))}</div>`));
    const feed=$('.alert-feed');if(feed)feed.innerHTML=ins.slice().sort((a,b)=>['Crítica','Alta','Media','Baja'].indexOf(a[1].severity)-['Crítica','Alta','Media','Baja'].indexOf(b[1].severity)).slice(0,2).map(([c,i])=>`<a href="sup_incidents.html"><i class="fa-solid fa-triangle-exclamation"></i><span><strong>${c} · ${E(i.severity)}</strong><small>${E(i.segments.join(' · '))} · ${E(i.state)}</small></span></a>`).join('')+`<a href="sup_affected_services.html"><i class="fa-solid fa-users"></i><span><strong>${affected.clients.length} clientes afectados en el periodo</strong><small>${affected.services.length} servicios únicos</small></span></a>`;
   };
   opts($('.supervisor-scope-select'),[['Toda la red','Toda la red'],...S.map(([c])=>[c,c])]);
   $$('.supervisor-period-select,.supervisor-scope-select').forEach(x=>x.addEventListener('change',update));update();
   const p=$('.supervisor-toolbar-copy p');if(p)p.textContent='Capacidad, incidencias, servicios y mantenimiento en una sola vista.';
  }
  if(p==='sup_history.html'){
   for(const [kind,records,dateProp] of [['incidencias',I.filter(([,i])=>i.state==='Cerrada'),'closed'],['mantenimientos',M.filter(([,m])=>m.state==='Finalizado'),'end']]){
    const host=$(`[data-history-panel="${kind}"] .ranking-list`);if(!host)continue;const grouped={};for(const [c,x] of records){const month=O.dateISO(x.closed||x[dateProp]).slice(0,7);(grouped[month]||=[]).push(c);}host.innerHTML=Object.entries(grouped).sort().reverse().map(([month,codes])=>`<div><span>${E(month)} · ${E(codes.join(', '))}</span><strong>${codes.length} ${kind==='incidencias'?'cerradas':'finalizados'}</strong></div>`).join('')||'<p>Sin registros históricos.</p>';
   }
  }


  for(const chart of $$('.history-line-chart')){
   for(const [c] of S)chart.dataset['series'+c.replace('-','').toLowerCase().replace(/^s/,'S')]=O.historyValues(c).join(',');
   chart.dataset.seriesGlobal=O.historyValues('Toda la red').join(',');
                                                                    
  }
 }
 function inputs(){
  const d=O.data,stationOptions=Object.entries(d.stations).map(([c,s])=>[c,s.name]);
  for(const f of $$('.form-field')){const label=O.normalize($('label',f)?.textContent),sel=$('select',f);if(!sel)continue;
   if(/origen|destino/.test(label))opts(sel,stationOptions);
   else if(label==='cliente')opts(sel,Object.entries(d.clients).filter(([,c])=>c.state==='Activo').map(([c,x])=>[x.name,x.name]));
   else if(label.includes('elemento'))opts(sel,[...Object.entries(d.stations).map(([c,s])=>[c,`${c} · ${s.name}`]),...Object.entries(d.segments).map(([c,s])=>[c,`${c} · ${route(s)}`])]);
  }
  for(const sel of $$('.report-segment-select,.history-segment-select'))opts(sel,[['Toda la red','Toda la red'],...Object.entries(d.segments).map(([c,s])=>[c,`${c} · ${route(s)}`])]);

  $$('.form-field,.filter-field').forEach((field,i)=>{const label=$('label',field),control=$('input,select,textarea',field);if(label&&control){control.id=control.id||`ol-control-${i}`;label.htmlFor=control.id;}});
 }
 window.OceanLinkView={hydrate,inputs,metrics,table,row,badge:b,level,route,impactFor,activeImpact,usageMeter,fmtPct};
 document.addEventListener('DOMContentLoaded',()=>{hydrate();inputs();bindImpactDetails();});
})();
