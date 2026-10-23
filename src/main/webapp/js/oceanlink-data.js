                                                                                                     
                                                                               
(() => {
 'use strict';
 const key='oceanlink.final.', clone=v=>JSON.parse(JSON.stringify(v));
 const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const read=(name,fallback=null)=>{try{const raw=localStorage.getItem(key+name);return raw===null?fallback:JSON.parse(raw);}catch(_){return fallback;}};
 const text=(name,fallback='')=>{try{return localStorage.getItem(key+name)||fallback;}catch(_){return fallback;}};
 const write=(name,value)=>{try{localStorage.setItem(key+name,JSON.stringify(value));}catch(_){throw Error('No se pudo guardar. Habilita el almacenamiento del navegador y vuelve a intentar.');}};
 const setText=(name,value)=>{try{localStorage.setItem(key+name,String(value));}catch(_){throw Error('El almacenamiento local no está disponible.');}};
 const num=v=>Math.round((Number(v)||0)*10000)/10000;
 const amount=v=>typeof v==='number'?v:num(parseFloat(v)/(String(v).includes('Gbps')?1000:1));
 const dateISO=v=>{if(!v)return '';if(/^\d{4}-/.test(v))return v.slice(0,10);const m=String(v).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';};
 const now=()=>new Date().toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',','');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data;
 const stationCode=v=>data.stations[v]?v:Object.keys(data.stations).find(c=>normalize(data.stations[c].name)===normalize(String(v).replace(/^Estación\s+/i,'')))||v;
 const clientCode=v=>data.clients[v]?v:Object.keys(data.clients).find(c=>normalize(data.clients[c].name)===normalize(v))||v;
 function routes(origin,destination){
  origin=stationCode(origin);destination=stationCode(destination);const out=[];
  function walk(at,path,seen){if(at===destination){if(path.length)out.push(path);return;}if(path.length>=Object.keys(data.stations).length)return;
   Object.entries(data.segments).forEach(([code,s])=>{let next=s.origin===at?s.destination:s.destination===at?s.origin:null;if(next&&!seen.has(next))walk(next,[...path,code],new Set([...seen,next]));});}
  walk(origin,[],new Set([origin]));return out.sort((a,b)=>a.length-b.length);
 }
 function validRoute(origin,destination,segments){let at=stationCode(origin);const seen=new Set([at]);if(!segments?.length)return false;for(const c of segments){const s=data.segments[c];if(!s)return false;const next=s.origin===at?s.destination:s.destination===at?s.origin:null;if(!next||seen.has(next))return false;seen.add(next);at=next;}return at===stationCode(destination);}
 const servicesFor=elements=>Object.entries(data.services).filter(([,s])=>s.state==='Activo'&&s.segments.some(c=>elements.includes(c)||elements.includes(data.segments[c]?.origin)||elements.includes(data.segments[c]?.destination))).map(([c])=>c);
 function recalc(){
  for(const s of Object.values(data.segments)){s.used=0;s.reserved=0;}
  for(const s of Object.values(data.services)){if(s.state==='Activo')for(const c of s.segments)if(data.segments[c])data.segments[c].used+=amount(s.capacity);}
  for(const r of Object.values(data.requests)){if(r.state==='Provisionada')for(const c of r.segments)if(data.segments[c])data.segments[c].reserved+=amount(r.capacity);}
  for(const s of Object.values(data.segments)){s.used=num(s.used);s.reserved=num(s.reserved);s.available=num(s.total-s.used-s.reserved);s.utilization=num(s.total?s.used/s.total*100:0);}
  for(const [code,c] of Object.entries(data.clients))c.services=Object.keys(data.services).filter(id=>data.services[id].clientCode===code);
  for(const i of Object.values(data.incidents)){i.services=servicesFor(i.segments);i.clients=[...new Set(i.services.map(c=>data.services[c].client))];}
  for(const m of Object.values(data.maint))m.services=servicesFor([m.element]);
 }
 function refresh(){
  data=clone(window.OceanLinkSeed);
  for(const [entity,list] of [['stations','createdStations'],['segments','createdSegments'],['clients','createdClients'],['services','generatedServices'],['incidents','createdIncidents'],['maint','createdMaintenances'],['requests','createdRequests']]){
   for(const item of read(list,[])){if(!item?.code)continue;data[entity][item.code]={...data[entity][item.code],...item};}
  }
  for(const entity of ['stations','segments','clients','services','requests','users'])Object.assign(data[entity],read(entity+'.overrides',{}));
  for(const s of Object.values(data.segments)){s.origin=stationCode(s.origin);s.destination=stationCode(s.destination);s.total=Number(s.total);}
  for(const s of Object.values(data.services)){s.segments=Array.isArray(s.segments)?s.segments:String(s.segments).match(/SEG-\d+/g)||[];s.clientCode=clientCode(s.clientCode||s.client);s.client=data.clients[s.clientCode]?.name||s.client;s.origin=stationCode(s.origin);s.destination=stationCode(s.destination);}
  for(const [c,r] of Object.entries(data.requests)){r.clientCode=clientCode(r.clientCode||r.client);r.client=data.clients[r.clientCode]?.name||r.client;r.origin=stationCode(r.origin);r.destination=stationCode(r.destination);r.amount=amount(r.capacity);r.segments=r.segments||routes(r.origin,r.destination)[0]||[];r.state=text(`request.${c}.state`,r.state);}
  for(const [c,i] of Object.entries(data.incidents)){i.state=text(`incident.${c}.state`,i.state);i.closed=text(`incident.${c}.closed`,i.closed);i.result=text(`incident.${c}.result`,i.result);i.observations=i.observations||[[i.state,i.date,i.description]];}
  for(const [c,m] of Object.entries(data.maint)){m.state=text(`maintenance.${c}.state`,m.state);m.result=text(`maintenance.${c}.result`,m.result);m.closed=text(`maintenance.${c}.closed`,m.closed);m.activities=m.activities||[];for(const prop of ['start','end'])if(/^\d{4}-/.test(m[prop]))m[prop]=new Date(m[prop]).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',','');}
  recalc();if(window.OceanLink)window.OceanLink.data=data;return data;
 }
 function save(entity,code,patch){const dict=read(entity+'.overrides',{});dict[code]={...data[entity][code],...patch};write(entity+'.overrides',dict);refresh();return data[entity][code];}
 function nextCode(prefix){refresh();const entity={USR:'users',EST:'stations',SEG:'segments',CLI:'clients',SRV:'services',REQ:'requests',INC:'incidents',MNT:'maint'}[prefix];return prefix+'-'+String(Math.max(0,...Object.keys(data[entity]||{}).map(c=>Number(c.split('-')[1])||0))+1).padStart(3,'0');}
 function viability(r,creditService){
  if(!(amount(r.capacity)>0))return {ok:false,message:'La capacidad requerida debe ser mayor que cero.'};
  if(!validRoute(r.origin,r.destination,r.segments))return {ok:false,message:'La ruta no conecta el origen con el destino.'};
  const bad=r.segments.find(c=>data.segments[c].state==='Fuera de servicio');if(bad)return {ok:false,message:`${bad} está fuera de servicio.`};
  const capacities=r.segments.map(c=>data.segments[c].available+(creditService?.state==='Activo'&&creditService.segments.includes(c)?amount(creditService.capacity):0));
  const min=Math.min(...capacities);return {ok:min+1e-8>=amount(r.capacity),limit:num(min),message:min+1e-8>=amount(r.capacity)?'Ruta viable':`Capacidad insuficiente: ${num(min)} Tbps disponibles en el segmento limitante.`};
 }
 function requestAction(code,action){
  refresh();const r=data.requests[code];if(!r)throw Error('Solicitud inexistente.');
  const transitions={start:['Registrada','En evaluación'],reevaluate:['Pendiente por capacidad','En evaluación'],approve:['En evaluación','Aprobada'],pending:['En evaluación','Pendiente por capacidad'],reject:['En evaluación','Rechazada'],reserve:['Aprobada','Provisionada'],activate:['Provisionada','Activa']};
  const t=transitions[action];if(!t||r.state!==t[0])throw Error('Transición no permitida para el estado actual.');
  if(['approve','reserve'].includes(action)){const v=viability(r);if(!v.ok)throw Error(v.message);}
  let srv;
  if(action==='activate'){
   if(!validRoute(r.origin,r.destination,r.segments)||r.segments.some(c=>data.segments[c]?.state==='Fuera de servicio'))throw Error('La ruta reservada contiene un segmento fuera de servicio o dejó de ser válida.');
   if(r.segments.some(c=>data.segments[c].available<0))throw Error('La reserva supera la capacidad del segmento.');
   const id=r.pendingService||nextCode('SRV');srv={code:id,clientCode:r.clientCode,client:r.client,capacity:r.capacity,origin:r.origin,destination:r.destination,segments:r.segments,state:'Activo',activation:now().split(' ')[0],request:code};
   const dict=read('services.overrides',{});dict[id]=srv;write('services.overrides',dict);r.service=id;
  }
  r.state=t[1];const dict=read('requests.overrides',{});dict[code]=r;write('requests.overrides',dict);setText(`request.${code}.state`,r.state);refresh();return data.requests[code];
 }
 function cancelService(code){refresh();if(data.services[code]?.state!=='Activo')throw Error('Solo se puede cancelar un servicio activo.');return save('services',code,{state:'Cancelado'});}
 function editSegment(code,patch){refresh();const old=data.segments[code];if(!old)throw Error('Segmento inexistente.');const s={...old,...patch};s.origin=stationCode(s.origin);s.destination=stationCode(s.destination);s.total=Number(s.total);
  if(!data.stations[s.origin]||!data.stations[s.destination]||s.origin===s.destination)throw Error('Seleccione dos estaciones distintas y registradas.');
  if(!Number.isFinite(s.total)||s.total<=0||s.total+1e-8<old.used+old.reserved)throw Error('La capacidad total no puede ser menor que la utilizada más la reservada.');
  if((s.origin!==old.origin||s.destination!==old.destination)&&(old.used>0||old.reserved>0||Object.values(data.services).some(x=>x.segments.includes(code))||Object.values(data.requests).some(x=>x.segments.includes(code))))throw Error('Este segmento tiene rutas asociadas. Cree otro segmento para cambiar sus extremos sin romper la trazabilidad.');
  return save('segments',code,s);
 }
 function setRoute(code,segments){refresh();const s=data.services[code];if(!s||s.state==='Cancelado')throw Error('El servicio no admite cambios de ruta.');const v=viability({...s,segments},s);if(!v.ok)throw Error(v.message);return save('services',code,{segments});}
 const roleForPage=p=>p.startsWith('admin_')||p==='dashboard.html'?'Administrador':p.startsWith('cp_')?'Planificador de capacidad':p.startsWith('no_')?'Operador de red':p.startsWith('mc_')?'Coordinador de mantenimiento':p.startsWith('sup_')?'Supervisor':null;
 const permissions={
  'Administrador':['RF01 · Registrar y editar usuarios','RF02 · Asignar roles y permisos','RF03 · Activar y desactivar cuentas','RF04 · Gestionar estaciones','RF05 · Gestionar segmentos y asociaciones','RF06 · Consultar el estado general'],
  'Planificador de capacidad':['RF07 · Consultar capacidad','RF08–RF09 · Registrar y evaluar solicitudes','RF10 · Reservar capacidad en rutas','RF11 · Registrar servicios y rutas','RF12 · Identificar alta utilización','RF13 · Consultar historial de capacidad'],
  'Operador de red':['RF14 · Consultar estado de red','RF15–RF17 · Registrar incidencias y segmentos','RF18–RF19 · Avanzar estados y observaciones','RF20–RF21 · Consultar servicios y clientes afectados','RF22 · Registrar restauración','RF23 · Consultar incidencias cerradas'],
  'Coordinador de mantenimiento':['RF24–RF26 · Programar intervenciones','RF27 · Consultar impacto antes de programar','RF28–RF29 · Gestionar ejecución y actividades','RF30 · Finalizar con resultado','RF31 · Consultar historial'],
  'Supervisor':['RF32 · Consultar indicadores','RF33–RF34 · Consultar red e incidencias','RF35 · Consultar servicios y clientes afectados','RF36–RF37 · Consultar mantenimiento y alta utilización','RF38 · Filtrar y exportar reportes','RF39 · Consultar indicadores históricos']
 };
 const historyValues=code=>{
  const series={
   'SEG-101':[68,70,72,73,75,76,78,79,80],
   'SEG-102':[18,19,20,21,22,23,23.5,24,25],
   'SEG-103':[82,84,86,88,90,92,94,95,96.6667],
   'SEG-205':[70,72,73,75,77,79,81,82,83.75],
   'SEG-310':[55,57,58,60,62,64,65,67,68.3333],
   'SEG-411':[45,42,38,35,28,18,10,4,0]
  };
  if(series[code])return series[code].slice();
  if(code!=='Toda la red')return [];
  const values=Object.values(series);return values[0].map((_,i)=>num(values.reduce((sum,row)=>sum+row[i],0)/values.length));
 };
 refresh();window.OceanLink={data,refresh,read,write,text,setText,num,amount,dateISO,now,esc,normalize,save,nextCode,stationCode,clientCode,routes,validRoute,servicesFor,viability,requestAction,cancelService,editSegment,setRoute,roleForPage,permissions,historyValues,snapshotDate:'2026-09-20'};
})();
