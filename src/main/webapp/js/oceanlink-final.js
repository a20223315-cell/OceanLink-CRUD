                                                               
document.addEventListener('DOMContentLoaded',()=>{
 'use strict';
 const O=window.OceanLink,U=window.OceanLinkUI,V=window.OceanLinkView;
 if(!U)return;
 const {$,$$,notify,askConfirmation,openModal,closeModal,validateForm,formValue,setSelectOptions,badge}=U,E=O.esc;
 const p=location.pathname.split('/').pop(),q=new URLSearchParams(location.search),code=q.get('codigo');
 const safe=fn=>async(...args)=>{try{return await fn(...args);}catch(e){notify(e.message||'No se pudo completar la operación.','error');}};
 const set=(s,v)=>{const x=$(s);if(x)x.textContent=v;};
 const freshButton=(selector)=>{const b=$(selector);if(!b)return;const n=b.cloneNode(true);b.replaceWith(n);return n;};

 $$('form').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const button=$('button.primary-button',form)||(form.classList.contains('report-builder-form')?$('[data-preview-report]'):null);if(button)button.click();}));
 for(const a of $$('.sidebar-logout'))a.addEventListener('click',()=>sessionStorage.removeItem('oceanlink.final.role'));

 const currentRole=O.roleForPage(p),selectedRole=sessionStorage.getItem('oceanlink.final.role');
 const crossReadOnly=q.get('consulta')==='1';
 if(selectedRole&&currentRole&&selectedRole!==currentRole&&!crossReadOnly){
  $('.content')?.replaceChildren();const c=$('.content');if(c)c.innerHTML=`<article class="panel access-note"><h1>Esta vista pertenece a otro rol</h1><p>Esta vista corresponde a otro rol. Vuelve al acceso para cambiar de rol.</p><a class="primary-button" href="login.html">Seleccionar rol</a></article>`;
  return;
 }

 for(const form of $$('.user-create-form,.user-edit-form')){
  const sel=$('select',form),out=$('[data-role-permissions]',form);
  const render=()=>{if(out)out.innerHTML=(O.permissions[sel.value]||[]).map(x=>`<span><i class="fa-solid fa-check" aria-hidden="true"></i>${E(x)}</span>`).join('');};
  sel?.addEventListener('change',render);form.addEventListener('reset',()=>setTimeout(render,0));render();
 }

 if(p==='admin_users.html'){
  const tbody=$('.users-panel tbody');
  const persist=()=>{const users={};for(const r of $$('tr',tbody)){const t=[...r.cells].map(x=>x.textContent.trim());if(!/^USR-\d+$/.test(t[0]))continue;users[t[0]]={name:t[1],email:t[2],role:t[3],last:t[4],state:t[5],phone:r.dataset.userPhone||'',hire:r.dataset.userHire||''};}O.write('users.overrides',users);};
  new MutationObserver(safe(persist)).observe(tbody,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-user-phone','data-user-hire']});
  document.addEventListener('click',e=>{if(e.target.closest('.user-view')){const role=e.target.closest('tr')?.cells[3]?.textContent.trim();const out=$('[data-profile-capabilities]');if(out)out.innerHTML=(O.permissions[role]||[]).map(x=>`<span><i class="fa-solid fa-check"></i>${E(x)}</span>`).join('');}});
 }
 if(p==='admin_station_detail.html'||p==='admin_segment_detail.html'){
  const btn=freshButton('.confirm-static-update');
  btn?.addEventListener('click',safe(async()=>{
   const form=btn.closest('form');if(!validateForm(form))return;
   if(!await askConfirmation({title:'Guardar cambios',message:'Se actualizará este registro en todas las consultas relacionadas.',confirmText:'Sí, guardar'}))return;
   if(p==='admin_station_detail.html'){
    const fields=$$('input',form),s=$('select',form);O.save('stations',code||'EST-001',{name:fields[0].value.trim().replace(/^Estación\s+/i,''),location:fields[1].value.trim(),energy:fields[2].value.trim(),state:s.value});
   }else{const selects=$$('select',form);O.editSegment(code||'SEG-101',{origin:selects[0].value,destination:selects[1].value,total:Number($('input[type="number"]',form).value),state:selects[2].value});}
   location.reload();
  }));
 }
 if(p==='cp_request_detail.html'){
  const id=code||'REQ-501';
  const render=()=>{
   O.refresh();const r=O.data.requests[id];if(!r){set('[data-request-title]','Solicitud no encontrada');$$('[data-request-action]').forEach(x=>x.hidden=true);return;}
   const d=O.data,v=O.viability(r),state=r.state,steps=['Registrada','En evaluación','Aprobada','Provisionada','Activa'];
   const titleData={'[data-request-title]':`Detalle de solicitud ${id}`,'[data-request-client]':`${r.clientCode} · ${r.client}`,'[data-request-capacity]':r.capacity,'[data-request-origin]':d.stations[r.origin]?.name,'[data-request-destination]':d.stations[r.destination]?.name,'[data-request-date]':r.date,'[data-request-route]':r.segments.join(' → ')||'Sin ruta disponible','[data-route-bottleneck]':`${v.limit??0} Tbps disponibles`,'[data-route-required]':r.capacity,'[data-request-current-badge]':state};
   for(const [sel,value] of Object.entries(titleData))set(sel,value);
   const st=$('[data-request-current-badge]');if(st)st.className=`status ${['Activa','Aprobada'].includes(state)?'ok':state==='Rechazada'?'danger':'info'}`;
   const rows=r.segments.map((c,i)=>{const s=d.segments[c];return `<tr><td>${i+1}</td><td>${c}</td><td>${E(V.route(s))}</td><td>${s.available}</td><td>${badge(s.state)}</td></tr>`;}).join('');
   const routeBody=$('[data-route-segments]');if(routeBody)routeBody.innerHTML=rows||'<tr><td colspan="5">No existe una ruta entre estas estaciones.</td></tr>';
   const rv=$('.reservation-route-list');if(rv)rv.innerHTML=r.segments.map(c=>`<div><span>${c}</span><small>${E(V.route(d.segments[c]))}</small><strong>${d.segments[c].available} Tbps disponibles</strong></div>`).join('');
   const input=$('.request-reserve-capacity');if(input){input.value=O.amount(r.capacity);input.readOnly=true;input.step='0.001';input.min='0.001';input.title='La reserva corresponde exactamente a la capacidad contratada.';}
   const health=['Provisionada','Activa'].includes(state)?'Ruta provisionada':v.message;
   set('[data-request-viability]',health);const h=$('.route-health');if(h){h.className=`route-health ${v.ok||['Provisionada','Activa'].includes(state)?'ok':'danger'}`;h.textContent=health;}
   const computed=$('#modal-reserva .computed-state');if(computed){computed.className=`computed-state ${v.ok?'ok':'danger'}`;computed.textContent=v.message;}
   const actionMap={'Registrada':['start'],'En evaluación':['approve','pending','reject'],'Aprobada':['reserve'],'Provisionada':['activate'],'Pendiente por capacidad':['reevaluate']};
   $$('[data-request-action]').forEach(x=>x.hidden=!(actionMap[state]||[]).includes(x.dataset.requestAction));
   $$('[data-request-step]').forEach((x,i)=>{x.classList.toggle('completed',steps.indexOf(state)>i);x.classList.toggle('active',steps.indexOf(state)===i);});
   const panel=$('[data-request-evaluation]');if(panel)panel.hidden=state==='Registrada';
   const exception=$('[data-request-exception]');if(exception){exception.hidden=!['Pendiente por capacidad','Rechazada'].includes(state);exception.textContent=state==='Rechazada'?'Solicitud rechazada: no continuará al provisionamiento.':'Solicitud en espera de capacidad disponible.';}
   const guidance={'Registrada':'Evalúe la ruta y la capacidad antes de aprobar.','En evaluación':v.message+'. Aprobar aún no reserva capacidad.','Aprobada':'Reserve la capacidad requerida en todos los segmentos de la ruta.','Provisionada':'Reserva confirmada. Puede activar si ningún segmento está fuera de servicio.','Activa':'Servicio registrado. La reserva se convirtió en capacidad utilizada.','Pendiente por capacidad':'Reevalúe cuando cambie la disponibilidad.','Rechazada':'Flujo finalizado sin consumir capacidad.'};
   set('[data-request-guidance-title]',state);set('[data-request-guidance]',guidance[state]);
   const a=$('[data-request-service-link]');if(a){a.hidden=state!=='Activa';a.href=`cp_service_detail.html?codigo=${r.service||'SRV-901'}`;}

   let select=$('[data-request-route-choice]');if(!select){const field=document.createElement('div');field.className='form-field request-route-choice';field.innerHTML='<label for="request-route-choice">Ruta propuesta</label><select id="request-route-choice" data-request-route-choice></select><small>Seleccione una ruta antes de reservar; se valida cada segmento.</small>';panel?.prepend(field);select=$('select',field);select.addEventListener('change',safe(()=>{if(rendering)return;const current=O.data.requests[id];if(!['Registrada','En evaluación','Aprobada','Pendiente por capacidad'].includes(current.state))return;O.save('requests',id,{segments:select.value.split(',')});renderOnce();}));}
   const paths=O.routes(r.origin,r.destination);setSelectOptions(select,paths.length?paths.map(path=>({value:path.join(','),label:path.join(' → ')})):[{value:'',label:'Sin ruta disponible'}],r.segments.join(','));select.closest('.request-route-choice').hidden=['Provisionada','Activa','Rechazada'].includes(state);
   U.enhanceResponsiveTables();
  };

  let rendering=false;const renderOnce=()=>{if(rendering)return;rendering=true;try{render();}finally{rendering=false;}};
  $$('[data-request-action]').forEach(btn=>btn.addEventListener('click',safe(async()=>{
   const action=btn.dataset.requestAction;if(action==='reserve'){openModal($('#modal-reserva'),btn);return;}
   if(!['start','reevaluate'].includes(action)&&!await askConfirmation({title:btn.textContent.trim(),message:'Confirme el cambio de estado. Las reglas de capacidad y ruta se volverán a validar.',confirmText:'Sí, continuar',tone:action==='reject'?'danger':'primary'}))return;
   const r=O.requestAction(id,action);renderOnce();notify(`Solicitud ${id}: ${r.state}.`);
  })));
  $('[data-confirm-reservation]')?.addEventListener('click',safe(async()=>{if(!await askConfirmation({title:'Confirmar reserva',message:`Se reservarán ${O.data.requests[id].capacity} en cada segmento de la ruta seleccionada.`,confirmText:'Sí, reservar'}))return;O.requestAction(id,'reserve');closeModal();renderOnce();notify('Reserva registrada en todos los segmentos.');}));
  renderOnce();
 }
 if(p==='cp_service_detail.html'){
  const id=code||'SRV-901',service=O.data.services[id];
  const cancel=$$('.danger-button').find(x=>O.normalize(x.textContent).includes('cancelar servicio'));
  if(service?.state==='Pendiente'&&service.request){const a=document.createElement('a');a.className='primary-button';a.href=`cp_request_detail.html?codigo=${service.request}`;a.textContent='Reservar y activar desde la solicitud';$('.detail-actions')?.append(a);}
  cancel?.addEventListener('click',safe(async()=>{if(!await askConfirmation({title:'Cancelar servicio',message:'Se liberará su capacidad utilizada en todos los segmentos de su ruta.',confirmText:'Sí, cancelar',tone:'danger'}))return;O.cancelService(id);U.setDetailStatus('Estado','Cancelado');cancel.hidden=true;notify('Servicio cancelado. La capacidad está disponible en toda su ruta.');}));
  const route=$('.route-visual');if(route&&service){let at=service.origin;route.innerHTML=`<div class="route-node"><div class="node-icon"><i class="fa-solid fa-anchor"></i></div>${E(O.data.stations[at]?.name)} (${at})</div>`;for(const c of service.segments){const s=O.data.segments[c];at=s.origin===at?s.destination:s.origin;route.insertAdjacentHTML('beforeend',`<div class="route-line"><span>${c}</span></div><div class="route-node"><div class="node-icon"><i class="fa-solid fa-anchor"></i></div>${E(O.data.stations[at]?.name)} (${at})</div>`);}}
 }
 if(p==='cp_client_detail.html'){
  const client=O.data.clients[code||'CLI-001'];if(client){const active=client.services.map(c=>O.data.services[c]).filter(s=>s.state==='Activo');const note=document.createElement('div');note.className='report-note';note.textContent=`Capacidad contratada activa: ${O.num(active.reduce((sum,s)=>sum+O.amount(s.capacity),0))} Tbps · ${active.length} servicios activos.`;$('.detail-grid')?.insertAdjacentElement('afterend',note);}
 }
 if(p==='cp_services.html'){
  const service=$('.service-route-service'),route=$('.service-route-option'),save=$('[data-save-service-route]');let rendering=false;
  const render=()=>{if(rendering)return;rendering=true;try{O.refresh();const s=O.data.services[service.value];if(!s)return;const paths=O.routes(s.origin,s.destination),chosen=route.value;setSelectOptions(route,paths.map(path=>({value:path.join(','),label:path.join(' → ')})),paths.some(path=>path.join(',')===chosen)?chosen:s.segments.join(','));const segments=route.value.split(',').filter(Boolean),v=O.viability({...s,segments},s);const tbody=$('[data-service-route-segments]');if(tbody)tbody.innerHTML=segments.map((c,i)=>{const seg=O.data.segments[c],free=O.num(seg.available+(s.state==='Activo'&&s.segments.includes(c)?O.amount(s.capacity):0));return `<tr><td>${i+1}</td><td>${c}</td><td>${badge(seg.state)}</td><td>${free}</td></tr>`;}).join('');const card=$('[data-route-validation]');if(card){card.classList.toggle('invalid',!v.ok);card.innerHTML=`<div class="route-validation-icon"><i class="fa-solid ${v.ok?'fa-circle-check':'fa-circle-xmark'}"></i></div><div><strong>${E(v.message)}</strong><p>Ruta conectada entre ${E(V.route(s))}. La disponibilidad incluye la capacidad que este servicio liberaría en su ruta actual.</p></div>`;}save.disabled=!v.ok||s.state==='Cancelado';}finally{rendering=false;}};
  setSelectOptions(service,Object.entries(O.data.services).filter(([,s])=>s.state!=='Cancelado').map(([c,s])=>({value:c,label:`${c} · ${s.client} · ${s.capacity}`})),Object.keys(O.data.services)[0]);
  service?.addEventListener('change',render);route?.addEventListener('change',render);render();
  document.addEventListener('click',e=>{const a=e.target.closest('[data-service-route-code]');if(a){service.value=a.dataset.serviceRouteCode;service.dispatchEvent(new Event('change',{bubbles:true}));}});
  save?.addEventListener('click',safe(async()=>{if(save.disabled)return;if(!await askConfirmation({title:'Guardar ruta del servicio',message:'Se validarán la continuidad, el estado y la capacidad de todos los segmentos.',confirmText:'Sí, guardar'}))return;O.setRoute(service.value,route.value.split(','));closeModal();notify('Ruta guardada; capacidad recalculada.');}));
 }

 for(const button of $$('.filter-submit'))button.addEventListener('click',()=>{
  const panel=button.closest('.panel'),fields=$$('.filter-field',button.closest('.filter-panel')),table=$('table',panel);if(!table)return;
  const headers=$$('thead th',table).map(x=>O.normalize(x.textContent));
  for(const f of fields){const label=O.normalize($('label',f)?.textContent),sel=$('select',f);if(!sel||!label.includes('estado')||/todos|todas/.test(O.normalize(sel.value)))continue;const idx=headers.findIndex(h=>h.includes('estado'));if(idx<0)continue;for(const row of $$('tbody tr',table)){if(!row.cells[idx])continue;if(O.normalize(row.cells[idx].textContent)!==O.normalize(sel.value))row.dataset.filteredOut='1';}}
  table._oceanlinkRefreshPagination?.(true);
 });

 for(const a of $$('a[href*="_detail.html"]')){const dest=a.getAttribute('href').split('?')[0],role=O.roleForPage(dest);if(role&&role!==currentRole){const url=new URL(a.href);url.searchParams.set('consulta','1');if((selectedRole||q.get('origen'))==='Supervisor'||q.get('origen')==='supervisor')url.searchParams.set('origen','supervisor');a.href=url.pathname.split('/').pop()+url.search;}}
 if(crossReadOnly){
  const supervisorContext=selectedRole==='Supervisor'||q.get('origen')==='supervisor';
  $$('.detail-actions,.confirm-static-update,.danger-button,.primary-button:not(.sidebar-mobile-toggle)').forEach(x=>x.hidden=true);
  for(const a of $$('a[href*="_detail.html"],a[href*="_history.html"]')){const url=new URL(a.href);url.searchParams.set('consulta','1');a.href=url.pathname.split('/').pop()+url.search;}
  if(supervisorContext){
   document.body.classList.add('supervisor-related-view');$('.content')?.classList.add('supervisor-view');
   const incidentView=p==='no_incident_detail.html',maintenanceView=p==='mc_maintenance_detail.html',fromHistory=q.get('historial')==='1',nav=$('.sidebar nav');
   if(nav)nav.innerHTML=`<a aria-label="Indicadores" href="sup_dashboard.html" title="Indicadores"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-chart-pie"></i></span><span class="nav-label">Indicadores</span></a><a aria-label="Red y capacidad" href="sup_network_capacity.html" title="Red y capacidad"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-network-wired"></i></span><span class="nav-label">Red y capacidad</span></a><a aria-label="Incidencias" class="${!fromHistory&&incidentView?'active':''}" href="sup_incidents.html" title="Incidencias"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><span class="nav-label">Incidencias</span></a><a aria-label="Servicios afectados" href="sup_affected_services.html" title="Servicios afectados"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-users-viewfinder"></i></span><span class="nav-label">Servicios afectados</span></a><a aria-label="Mantenimientos" class="${!fromHistory&&maintenanceView?'active':''}" href="sup_maintenance.html" title="Mantenimientos"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-screwdriver-wrench"></i></span><span class="nav-label">Mantenimientos</span></a><a aria-label="Históricos" class="${fromHistory?'active':''}" href="sup_history.html" title="Históricos"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-clock-rotate-left"></i></span><span class="nav-label">Históricos</span></a><a aria-label="Reportes" href="sup_reports.html" title="Reportes"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-chart-column"></i></span><span class="nav-label">Reportes</span></a>`;
   const back=$('.back-row a');if(back){
    if(fromHistory){back.href=incidentView?'sup_history.html#incidencias':'sup_history.html#mantenimientos';back.innerHTML=`<i class="fa-solid fa-arrow-left"></i> Volver a históricos`;}
    else if(incidentView){back.href='sup_incidents.html';back.innerHTML=`<i class="fa-solid fa-arrow-left"></i> Volver a incidencias`;}
    else if(maintenanceView){back.href='sup_maintenance.html';back.innerHTML=`<i class="fa-solid fa-arrow-left"></i> Volver a mantenimientos`;}
   }
   const role=$('.session-data .role');if(role)role.textContent='Supervisor';
  }else{
   const note=document.createElement('div');note.className='read-only-note';note.textContent='Consulta relacionada · solo lectura';$('.page-heading')?.append(note);
   const back=document.createElement('button');back.type='button';back.className='secondary-button';back.textContent='Volver a la consulta';back.addEventListener('click',()=>history.back());note.append(back);
   $('.sidebar nav')?.replaceChildren();
  }
 }

 document.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const modal=$$('.modal.is-open').at(-1);if(!modal)return;const controls=$$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',modal).filter(x=>!x.hidden&&!x.closest('[hidden]')&&x.type!=='hidden'&&!x.classList.contains('modal-background')&&!x.classList.contains('native-select-hidden'));if(!controls.length)return;const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
 U.enhanceResponsiveTables();
});

                                                                                    
document.addEventListener('DOMContentLoaded',()=>{
  'use strict';
  const O=window.OceanLink,U=window.OceanLinkUI;
  if(!O||!U)return;
  const {$,$$}=U;
  const page=location.pathname.split('/').pop();

                                                                               
  const applyTableAlignment=table=>{
    const headers=$$('thead th',table);
    if(!headers.length)return;
    headers.forEach((th,index)=>{
      th.classList.remove('cell-left');
      th.classList.add('cell-center');
      for(const row of $$('tbody tr',table)){
        const td=row.cells[index];if(!td)continue;
        td.classList.remove('cell-left');td.classList.add('cell-center');
      }
    });
  };
  const alignAll=()=>$$('table').forEach(applyTableAlignment);
  alignAll();
  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('table,tr,td,th')||n.querySelector?.('table,tr,td,th')))))alignAll();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  if(page!=='sup_history.html')return;
  O.refresh();
  const setText=(selector,value)=>{const el=$(selector);if(el)el.textContent=value;};
  const statusBadge=value=>{const n=O.normalize(value),cls=/critica|fuera|cancel|rechaz/.test(n)?'danger':/alta|degrad|correctivo|pendiente|ejecucion|media/.test(n)?'warning':/finalizado|cerrada|restaurado|operativo|normal|baja/.test(n)?'ok':'info',severity=/^(critica|alta|media|baja)$/.test(n)?` severity-${n}`:'';return `<span class="status ${cls}${severity}">${O.esc(value)}</span>`;};
  const parseISO=iso=>{const [y,m,d]=String(iso).split('-').map(Number);return new Date(y,m-1,d);};
  const isoDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const formatDate=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:'—';};
  const shortDate=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}`:iso;};
  const makeBins=(start,end)=>{const a=parseISO(start),b=parseISO(end),days=Math.max(0,Math.round((b-a)/86400000)),out=[];let cursor=new Date(a);while(cursor<=b){const from=new Date(cursor),to=new Date(cursor);to.setDate(to.getDate()+(days>70?29:6));if(to>b)to.setTime(b.getTime());out.push([`${shortDate(isoDate(from))}–${shortDate(isoDate(to))}`,isoDate(from),isoDate(to)]);cursor=new Date(to);cursor.setDate(cursor.getDate()+1);}return out.slice(0,12);};

  const drawIncidentStacked=(host,entries,bins)=>{
    if(!host)return;
    const severities=[['Crítica','critical'],['Alta','high'],['Media','medium'],['Baja','low']];
    const matrix=bins.map(([,a,b])=>severities.map(([sev])=>entries.filter(([,item])=>{const iso=O.dateISO(item.date);return iso>=a&&iso<=b&&item.severity===sev;}).length));
    const totals=matrix.map(row=>row.reduce((a,b)=>a+b,0));
    const W=980,H=320,left=55,right=28,top=32,bottom=66,plotW=W-left-right,plotH=H-top-bottom,max=Math.max(4,...totals),axisMax=Math.ceil(max/4)*4,y=v=>top+plotH-(v/axisMax)*plotH;
    const ticks=[0,axisMax/4,axisMax/2,axisMax*3/4,axisMax];
    const grid=ticks.map(v=>`<line class="history-stat-grid" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"></line><text class="history-stat-axis" x="${left-10}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('');
    const gap=26,barW=Math.min(92,(plotW-gap*(bins.length+1))/bins.length),totalW=barW*bins.length+gap*(bins.length-1),sx=left+(plotW-totalW)/2;
    const bars=matrix.map((parts,i)=>{let acc=0,out='';parts.forEach((v,j)=>{if(!v)return;const h=plotH*v/axisMax,yy=y(acc+v);out+=`<rect class="history-stack-${severities[j][1]}" x="${sx+i*(barW+gap)}" y="${yy}" width="${barW}" height="${h}" rx="${acc+v===totals[i]?6:0}"></rect>`;acc+=v;});out+=`<text class="history-stat-value" x="${sx+i*(barW+gap)+barW/2}" y="${y(totals[i])-9}" text-anchor="middle">${totals[i]}</text><text class="history-stat-label" x="${sx+i*(barW+gap)+barW/2}" y="${H-27}" text-anchor="middle">${bins[i][0]}</text>`;return out;}).join('');
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" aria-label="Incidencias por semana y severidad">${grid}${bars}</svg><div class="history-chart-legend">${severities.map(([n,c])=>`<span><i class="chart-tone-${c}"></i>${n}</span>`).join('')}</div>`;
  };

  const drawMaintenanceTimeline=(host,entries,bins)=>{
    if(!host)return;
    const types=[['Preventivo','preventive'],['Correctivo','corrective']];
    const matrix=bins.map(([,a,b])=>types.map(([type])=>entries.filter(([,item])=>{const iso=O.dateISO(item.start);return iso>=a&&iso<=b&&item.type===type;}).length));
    const totals=matrix.map(row=>row.reduce((a,b)=>a+b,0)),W=980,H=320,left=55,right=28,top=32,bottom=66,plotW=W-left-right,plotH=H-top-bottom,max=Math.max(4,...totals),axisMax=Math.ceil(max/4)*4,y=v=>top+plotH-v/axisMax*plotH;
    const grid=[0,axisMax/4,axisMax/2,axisMax*3/4,axisMax].map(v=>`<line class="history-stat-grid" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"></line><text class="history-stat-axis" x="${left-10}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('');
    const gap=26,barW=Math.min(92,(plotW-gap*(bins.length+1))/Math.max(1,bins.length)),sx=left+(plotW-barW*bins.length-gap*(bins.length-1))/2;
    const bars=matrix.map((parts,i)=>{let acc=0;return parts.map((v,j)=>{if(!v)return '';const yy=y(acc+v),h=plotH*v/axisMax;acc+=v;return `<rect class="history-stack-${types[j][1]}" x="${sx+i*(barW+gap)}" y="${yy}" width="${barW}" height="${h}" rx="${acc===totals[i]?6:0}"></rect>`;}).join('')+`<text class="history-stat-value" x="${sx+i*(barW+gap)+barW/2}" y="${y(totals[i])-9}" text-anchor="middle">${totals[i]}</text><text class="history-stat-label" x="${sx+i*(barW+gap)+barW/2}" y="${H-27}" text-anchor="middle">${bins[i][0]}</text>`;}).join('');
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" aria-label="Mantenimientos por semana y tipo">${grid}${bars}</svg><div class="history-chart-legend">${types.map(([name,tone])=>`<span><i class="chart-tone-${tone}"></i>${name}</span>`).join('')}</div>`;
  };

  const distribution=(host,entries,field)=>{
    if(!host)return;const counts={};entries.forEach(([,item])=>{const key=item[field]||'Sin estado';counts[key]=(counts[key]||0)+1;});const total=Math.max(1,entries.length);
    host.innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>{const n=O.normalize(name),tone=/critica|fuera|cancel|rechaz/.test(n)?'danger':/alta|degrad|correctivo|pendiente|ejecucion|reparacion/.test(n)?'warning':/finalizado|cerrada|restaurado|operativo/.test(n)?'ok':'info';return `<div class="history-distribution-row"><div><span>${O.esc(name)}</span><strong>${count}</strong></div><div class="history-distribution-track"><span class="${tone}" style="width:${count/total*100}%"></span></div><small>${Math.round(count/total*100)}%</small></div>`;}).join('')||'<div class="history-chart-empty">Sin registros para estos criterios.</div>';
  };
  const utilization=(scope,start,end)=>{
    const anchors=['2026-01-31','2026-02-28','2026-03-31','2026-04-30','2026-05-31','2026-06-30','2026-07-31','2026-08-31','2026-09-20'],labels=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep'],values=O.historyValues(scope),points=anchors.map((date,i)=>({date,label:labels[i],value:values[i]})).filter(x=>x.date>=start.slice(0,7)+'-01'&&x.date<=end);
    const host=$('.history-line-chart'),heading=$('.history-heading h2'),subtitle=$('.history-heading p');if(heading)heading.textContent=scope==='Toda la red'?'Utilización de toda la red':`Utilización del segmento ${scope}`;if(subtitle)subtitle.textContent=`${formatDate(start)} – ${formatDate(end)}`;
    if(!points.length){host.innerHTML='<div class="history-chart-empty">Sin datos para estos criterios.</div>';['[data-history-average]','[data-history-max]','[data-history-trend]'].forEach(s=>setText(s,'—'));return;}
    const vals=points.map(x=>x.value),average=vals.reduce((a,b)=>a+b,0)/vals.length,trend=vals.at(-1)-vals[0];setText('[data-history-average]',average.toFixed(1)+'%');setText('[data-history-max]',Math.max(...vals).toFixed(1)+'%');setText('[data-history-trend]',`${trend>=0?'+':''}${trend.toFixed(1)} pp`);
    const W=1000,H=330,left=62,right=32,top=24,bottom=48,cw=W-left-right,ch=H-top-bottom,y=v=>top+ch-(v/100)*ch,x=i=>points.length===1?left+cw/2:left+cw*i/(points.length-1),line=points.map((p,i)=>`${x(i)},${y(p.value)}`).join(' '),area=`${left},${y(0)} ${line} ${x(points.length-1)},${y(0)}`;
    const grid=[0,20,40,60,80,100].map(v=>`<line class="history-grid-line" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"></line><text class="history-axis-label" x="${left-12}" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join(''),dots=points.map((p,i)=>`<circle class="history-point" cx="${x(i)}" cy="${y(p.value)}" r="6"></circle><text class="history-value-label" x="${x(i)}" y="${y(p.value)-13}" text-anchor="middle">${Number(p.value).toFixed(1)}%</text><text class="history-month-label" x="${x(i)}" y="${H-16}" text-anchor="middle">${p.label}</text>`).join('');
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de utilización"><defs><linearGradient id="historyAreaGradientFinal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0e9aa4" stop-opacity=".22"/><stop offset="100%" stop-color="#0e9aa4" stop-opacity=".02"/></linearGradient></defs>${grid}<line class="history-threshold-high" x1="${left}" x2="${W-right}" y1="${y(80)}" y2="${y(80)}"></line><line class="history-threshold-critical" x1="${left}" x2="${W-right}" y1="${y(95)}" y2="${y(95)}"></line><polygon fill="url(#historyAreaGradientFinal)" points="${area}"></polygon><polyline class="history-line-path" points="${line}"></polyline>${dots}</svg>`;
  };
  const render=()=>{
    O.refresh();const scope=$('.history-segment-select')?.value||'Toda la red',start=$('.history-date-start')?.value||'2026-08-20',end=$('.history-date-end')?.value||'2026-09-30';if(start>end){U.notify('La fecha inicial debe ser anterior a la fecha final.','error');return;}const bins=makeBins(start,end),between=date=>{const iso=O.dateISO(date);return !!iso&&iso>=start&&iso<=end;},segmentMatch=segments=>scope==='Toda la red'||(segments||[]).includes(scope),segment=O.data.segments[scope];
    utilization(scope,start,end);
    const incidents=Object.entries(O.data.incidents).filter(([,item])=>between(item.date)&&segmentMatch(item.segments)),closed=incidents.filter(([,item])=>item.state==='Cerrada'),critical=incidents.filter(([,item])=>item.severity==='Crítica'),affectedServices=new Set(incidents.flatMap(([,item])=>item.services||[]));
    setText('[data-history-inc-total]',incidents.length);setText('[data-history-inc-closed]',closed.length);setText('[data-history-inc-critical]',critical.length);setText('[data-history-inc-services]',affectedServices.size);setText('[data-history-inc-period]',`${formatDate(start)} – ${formatDate(end)}`);drawIncidentStacked($('[data-history-incidents-chart]'),incidents,bins);distribution($('[data-history-incidents-status]'),incidents,'state');
    const incBody=$('[data-history-incidents-body]');if(incBody)incBody.innerHTML=closed.length?closed.map(([code,item])=>`<tr><td>${code}</td><td>${O.esc(item.segments.join(' · '))}</td><td>${statusBadge(item.severity)}</td><td>${O.esc(item.closed||'—')}</td><td>${O.esc(item.result||'—')}</td><td class="action-cell"><a class="icon-action" href="no_incident_detail.html?codigo=${code}&historial=1&consulta=1&origen=supervisor" aria-label="Ver detalle de ${code}" title="Ver detalle"><i class="fa-regular fa-eye"></i></a></td></tr>`).join(''):'<tr class="table-empty-row"><td colspan="6">Sin incidencias cerradas para estos criterios.</td></tr>';
    const maint=Object.entries(O.data.maint).filter(([,item])=>between(item.start)&&(scope==='Toda la red'||item.element===scope||[segment?.origin,segment?.destination].includes(item.element))),finished=maint.filter(([,item])=>item.state==='Finalizado'),planned=maint.filter(([,item])=>item.state==='Programado'),maintenanceServices=new Set(maint.flatMap(([,item])=>item.services||[]));
    setText('[data-history-mnt-total]',maint.length);setText('[data-history-mnt-finished]',finished.length);setText('[data-history-mnt-planned]',planned.length);setText('[data-history-mnt-services]',maintenanceServices.size);setText('[data-history-mnt-period]',`${formatDate(start)} – ${formatDate(end)}`);drawMaintenanceTimeline($('[data-history-maintenance-chart]'),maint,bins,start,end);distribution($('[data-history-maintenance-status]'),maint,'state');
    const mntBody=$('[data-history-maintenance-body]');if(mntBody)mntBody.innerHTML=finished.length?finished.map(([code,item])=>`<tr><td>${code}</td><td>${O.esc(item.type)}</td><td>${O.esc(item.element)}</td><td>${O.esc(item.closed||item.end||'—')}</td><td>${O.esc(item.result||'—')}</td><td class="action-cell"><a class="icon-action" href="mc_maintenance_detail.html?codigo=${code}&historial=1&consulta=1&origen=supervisor" aria-label="Ver detalle de ${code}" title="Ver detalle"><i class="fa-regular fa-eye"></i></a></td></tr>`).join(''):'<tr class="table-empty-row"><td colspan="6">Sin mantenimientos finalizados para estos criterios.</td></tr>';
    alignAll();
  };
  $('.history-filter-submit')?.addEventListener('click',render);render();
});
