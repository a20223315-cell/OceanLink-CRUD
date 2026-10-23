document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const html = document.documentElement;
  if (html.classList.contains('sidebar-collapsed-init')) {
    body.classList.add('sidebar-collapsed');
    html.classList.remove('sidebar-collapsed-init');
  }
  let activeRow = null;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const normalize = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();


  if (body.classList.contains('login-page')) {
    const loginForm = $('.login-form');
    const loginInputs = ['#usuario', '#contrasena'].map(selector => $(selector)).filter(Boolean);
    const clearLoginError = input => {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      input.closest('.login-input-shell')?.classList.remove('has-error');
    };
    const showLoginErrors = () => {
      let firstInvalid = null;
      loginInputs.forEach(input => {
        const empty = !input.value.trim();
        input.classList.toggle('input-error', empty);
        input.closest('.login-input-shell')?.classList.toggle('has-error', empty);
        if (empty) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
        if (empty && !firstInvalid) firstInvalid = input;
      });
      firstInvalid?.scrollIntoView({block:'nearest', behavior:'smooth'});
      return !firstInvalid;
    };
    loginInputs.forEach(input => {
      input.addEventListener('focus', () => clearLoginError(input));
      input.addEventListener('pointerdown', () => clearLoginError(input));
      input.addEventListener('input', () => {
        if (input.value.length > 0) clearLoginError(input);
      });
    });
    $$('.olp-password-toggle').forEach(button => button.addEventListener('click', () => {
      const input = $('#contrasena');
      if (!input) return;
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.setAttribute('aria-label', reveal ? 'Ocultar contraseña' : 'Mostrar contraseña');
      button.setAttribute('title', reveal ? 'Ocultar contraseña' : 'Mostrar contraseña');
      const icon = $('i', button);
      if (icon) icon.className = reveal ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      input.focus({preventScroll:true});
    }));
    $$('.role-login-check').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      showLoginErrors();
    }));
    $$('.role-login-entry').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      if (!showLoginErrors()) return;
      const target = link.dataset.loginTarget || link.getAttribute('href');
      if (target && target !== '#') {
        const roleForLoginTarget = page => page.startsWith('admin_') || page === 'dashboard.html' ? 'Administrador'
          : page.startsWith('cp_') ? 'Planificador de capacidad'
          : page.startsWith('no_') ? 'Operador de red'
          : page.startsWith('mc_') ? 'Coordinador de mantenimiento'
          : page.startsWith('sup_') ? 'Supervisor'
          : null;
        const role = window.OceanLink?.roleForPage?.(target) || roleForLoginTarget(target);
        try { if (role) sessionStorage.setItem('oceanlink.final.role', role); } catch (_) {}
        window.location.href = target;
      }
    }));
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    loginForm?.addEventListener('submit', event => { event.preventDefault(); showLoginErrors(); });
  }

  
  const collapseToggle = $('.sidebar-collapse-toggle');
  const mobileToggle = $('.sidebar-mobile-toggle');
  const overlay = $('.sidebar-overlay');
  const sidebar = $('.sidebar');
  const mobileQuery = window.matchMedia('(max-width: 900px)');

  const syncToggleState = () => {
    const mobileOpen = body.classList.contains('sidebar-mobile-open');
    const collapsed = body.classList.contains('sidebar-collapsed');

    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', String(mobileOpen));
      mobileToggle.setAttribute('aria-label', mobileOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral');
      mobileToggle.setAttribute('title', mobileOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral');
    }
    if (collapseToggle) {
      if (mobileQuery.matches) {
        collapseToggle.setAttribute('aria-expanded', String(mobileOpen));
        collapseToggle.setAttribute('aria-label', 'Cerrar menú lateral');
        collapseToggle.setAttribute('title', 'Cerrar menú lateral');
        const icon = $('i', collapseToggle);
        if (icon) icon.className = 'fa-solid fa-xmark';
      } else {
        collapseToggle.setAttribute('aria-expanded', String(!collapsed));
        collapseToggle.setAttribute('aria-label', collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral');
        collapseToggle.setAttribute('title', collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral');
        const icon = $('i', collapseToggle);
        if (icon) icon.className = collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
      }
    }
  };

  const closeMobile = () => {
    body.classList.remove('sidebar-mobile-open');
    syncToggleState();
  };

  if (sidebar && collapseToggle) {
    collapseToggle.addEventListener('click', () => {
      if (mobileQuery.matches) {
        closeMobile();
      } else {
        body.classList.toggle('sidebar-collapsed');
        try {
          localStorage.setItem('oceanlink.final.sidebarCollapsed', body.classList.contains('sidebar-collapsed') ? '1' : '0');
        } catch (_) {}
        syncToggleState();
      }
    });
  }

  if (sidebar && mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      if (!mobileQuery.matches) return;
      body.classList.toggle('sidebar-mobile-open');
      syncToggleState();
    });
  }

  if (!mobileQuery.matches) {
    try {
      if (localStorage.getItem('oceanlink.final.sidebarCollapsed') === '1') body.classList.add('sidebar-collapsed');
    } catch (_) {}
  }

  if (overlay) overlay.addEventListener('click', closeMobile);
  const onViewportChange = () => {
    if (!mobileQuery.matches) body.classList.remove('sidebar-mobile-open');
    syncToggleState();
  };
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', onViewportChange);
  else if (mobileQuery.addListener) mobileQuery.addListener(onViewportChange);
  syncToggleState();

  let toastTimer;
  const notify = (message, type = 'success') => {
    let toast = $('.app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'app-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      body.appendChild(toast);
    }
    toast.className = `app-toast ${type}`;
    const icon = type === 'error' ? 'fa-circle-exclamation'
      : type === 'warning' ? 'fa-triangle-exclamation'
      : type === 'info' ? 'fa-circle-info'
      : 'fa-circle-check';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  const syncModalBodyState = () => {
    body.classList.toggle('modal-open', Boolean($('.modal.is-open')));
  };

  const closeModal = modal => {
    const target = modal || $$('.modal.is-open').at(-1) || (location.hash ? $(location.hash) : null);
    if(target?._cancel){target._cancel();return;}
    if (target?.classList.contains('modal')) {target.classList.remove('is-open');target._opener?.focus();}
    if (location.hash && location.hash.startsWith('#modal-')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    syncModalBodyState();
  };

  const openModal = (modal, opener = null) => {
    if (!modal) return;
    $$('.modal.is-open').forEach(item => item.classList.remove('is-open'));
    activeRow = opener?.closest('tr') || activeRow;
    modal._opener=opener||document.activeElement;setTimeout(()=>modal.querySelector('input:not([type=hidden]),textarea,button.modal-close,button')?.focus(),0);
    modal.classList.add('is-open');
    body.classList.add('modal-open');
  };

  document.addEventListener('click', event => {
    const opener = event.target.closest('a[href^="#modal-"]');
    if (opener) {
      const target = $(opener.getAttribute('href'));
      if (target?.classList.contains('modal')) {
        event.preventDefault();
        openModal(target, opener);
        return;
      }
    }
    const closer = event.target.closest('.modal-background, .modal-close, .modal .form-actions a[href="#"]');
    if (closer) {
      event.preventDefault();
      closeModal(closer.closest('.modal'));
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('.modal.is-open')) closeModal($$('.modal.is-open').at(-1));
  });

  document.addEventListener('click', event => { const cancel = event.target.closest('.modal-cancel-button'); if (!cancel) return; event.preventDefault(); closeModal(cancel.closest('.modal')); });

  if (location.hash?.startsWith('#modal-')) {
    const initialModal = $(location.hash);
    if (initialModal?.classList.contains('modal')) openModal(initialModal);
  }

  const showInfoModal = (title, html) => {
    let modal = $('#modal-info-oceanlink');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-info-oceanlink';
      modal.className = 'modal app-info-modal';
      modal.innerHTML = `
        <button class="modal-background" type="button" aria-label="Cerrar ventana"></button>
        <div class="modal-box">
          <div class="modal-header"><h2></h2><button class="modal-close app-modal-close" type="button" aria-label="Cerrar">×</button></div>
          <div class="modal-body"><div class="app-info-content"></div></div>
        </div>`;
      body.appendChild(modal);
      $('.modal-background', modal).addEventListener('click', () => closeModal(modal));
      $('.app-modal-close', modal).addEventListener('click', () => closeModal(modal));
    }
    $('.modal-header h2', modal).textContent = title;
    $('.app-info-content', modal).innerHTML = html;
    modal.classList.add('is-open');
    body.classList.add('modal-open');
  };

  const askConfirmation = ({ title = 'Confirmar acción', message = '', confirmText = 'Confirmar', tone = 'primary' } = {}) => new Promise(resolve => {
    let modal = $('#modal-confirm-oceanlink');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'modal-confirm-oceanlink'; modal.className = 'modal app-confirm-modal';
      modal.innerHTML = `<button class="modal-background" type="button" aria-label="Cerrar ventana"></button><div class="modal-box confirm-box"><div class="confirm-icon"><i class="fa-solid fa-circle-question"></i></div><div class="confirm-copy"><h2></h2><p></p></div><div class="confirm-actions"><button class="secondary-button confirm-cancel" type="button">Volver</button><button class="primary-button confirm-ok" type="button"></button></div></div>`; body.appendChild(modal);
    }
    const previousFocus=document.activeElement;
    const finish = value => { modal._cancel=null; modal.classList.remove('is-open'); syncModalBodyState();previousFocus?.focus();resolve(value); };
    modal._cancel=()=>finish(false);modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
    $('.confirm-copy h2', modal).textContent = title; $('.confirm-copy p', modal).textContent = message;
    const ok = $('.confirm-ok', modal); ok.textContent = confirmText; ok.className = `${tone === 'danger' ? 'danger-button' : 'primary-button'} confirm-ok`;
    $('.confirm-cancel', modal).onclick = () => finish(false); $('.modal-background', modal).onclick = () => finish(false); ok.onclick = () => finish(true);
    modal.classList.add('is-open'); body.classList.add('modal-open'); setTimeout(() => ok.focus(), 0);
  });

  const setupPagination = table => {
    const tbody = table.tBodies[0];
    const container = table.closest('.table-container');
    if (!tbody || !container) return;
    let pagination = container.nextElementSibling?.classList.contains('table-pagination') ? container.nextElementSibling : null;
    if (!pagination) {
      pagination = document.createElement('div');
      pagination.className = 'table-pagination';
      pagination.innerHTML = `
        <label class="pagination-size">Mostrar
          <select aria-label="Registros por página"><option value="10">10</option><option value="25">25</option><option value="50">50</option></select>
          registros
        </label>
        <div class="pagination-info" aria-live="polite"></div>
        <div class="pagination-controls" aria-label="Paginación"></div>`;
      container.insertAdjacentElement('afterend', pagination);
    }

    let pageSize = Number(table.dataset.pageSize || 10);
    let currentPage = 1;
    const sizeSelect = $('select', pagination);
    const info = $('.pagination-info', pagination);
    const controls = $('.pagination-controls', pagination);
    sizeSelect.value = String(pageSize);

    const button = (label, aria, disabled, click, active = false) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pagination-button' + (active ? ' active' : '');
      b.textContent = label;
      b.setAttribute('aria-label', aria);
      b.disabled = disabled;
      b.addEventListener('click', click);
      return b;
    };

    const render = () => {
      const allRows = Array.from(tbody.rows);
      const rows = allRows.filter(row => row.dataset.filteredOut !== '1');
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      const start = total === 0 ? 0 : (currentPage - 1) * pageSize;
      const end = Math.min(start + pageSize, total);

      allRows.forEach(row => { row.hidden = true; });
      rows.slice(start, end).forEach(row => { row.hidden = false; });
      info.textContent = total === 0 ? 'Sin registros para mostrar' : `Mostrando ${start + 1}–${end} de ${total}`;

      controls.replaceChildren();
      controls.append(button('‹', 'Página anterior', currentPage === 1, () => { currentPage--; render(); }));
      const pages = [];
      if (totalPages <= 5) {
        for (let p = 1; p <= totalPages; p++) pages.push(p);
      } else {
        pages.push(1);
        if (currentPage > 3) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < totalPages - 2) pages.push('…');
        pages.push(totalPages);
      }
      pages.forEach(p => {
        if (p === '…') {
          const span = document.createElement('span');
          span.textContent = '…';
          controls.append(span);
        } else {
          controls.append(button(String(p), `Página ${p}`, false, () => { currentPage = p; render(); }, p === currentPage));
        }
      });
      controls.append(button('›', 'Página siguiente', currentPage === totalPages, () => { currentPage++; render(); }));
    };

    sizeSelect.addEventListener('change', () => {
      pageSize = Number(sizeSelect.value);
      currentPage = 1;
      render();
    });
    table._oceanlinkRefreshPagination = (reset = false) => {
      if (reset) currentPage = 1;
      render();
    };
    render();
  };
  $$('table[data-paginate="true"]').forEach(setupPagination);

  const customSelects = new Map();
  const closeCustomSelect = widget => {
    if (!widget) return;
    widget.classList.remove('open');
    widget._menu?.classList.remove('open');
    widget._trigger?.setAttribute('aria-expanded','false');
  };
  const syncCustomSelect = select => {
    const widget = customSelects.get(select); if (!widget) return;
    const option = select.options[select.selectedIndex];
    $('.ol-select-value', widget).textContent = option?.textContent?.trim() || 'Seleccione';
    $$('.ol-select-option', widget._menu || document).forEach((item,index)=>(item.classList.toggle('selected',index===select.selectedIndex),item.setAttribute('aria-selected',String(index===select.selectedIndex))));
  };
  const closeCustomSelects = except => customSelects.forEach(widget => { if (widget !== except) closeCustomSelect(widget); });
  const positionCustomSelect = widget => {
    const trigger=widget?._trigger, menu=widget?._menu;
    if(!trigger||!menu||!widget.classList.contains('open')) return;
    const rect=trigger.getBoundingClientRect();
    if(rect.width<4 || rect.bottom<0 || rect.top>window.innerHeight){ closeCustomSelect(widget); return; }
    const margin=12, gap=8;
    const width=Math.min(rect.width, window.innerWidth-margin*2);
    let left=Math.max(margin, Math.min(rect.left, window.innerWidth-width-margin));
    menu.style.width=`${width}px`;
    menu.style.left=`${left}px`;
    menu.style.maxHeight=`${Math.max(120,Math.min(320,window.innerHeight-margin*2))}px`;
    const desired=Math.min(menu.scrollHeight||260,320);
    const below=Math.max(0,window.innerHeight-rect.bottom-gap-margin);
    const above=Math.max(0,rect.top-gap-margin);
    const openAbove=below<Math.min(desired,190) && above>below;
    const available=Math.max(120,Math.min(320,openAbove?above:below));
    menu.style.maxHeight=`${available}px`;
    const top=openAbove ? Math.max(margin,rect.top-gap-Math.min(desired,available)) : Math.min(window.innerHeight-margin-available,rect.bottom+gap);
    menu.style.top=`${Math.max(margin,top)}px`;
    menu.classList.toggle('opens-upward',openAbove);
  };
  const enhanceSelect = select => {
    if (!select || select.multiple || select.dataset.enhanced === '1' || select.closest('.pagination-size') || select.matches('.datetime-hour,.datetime-minute')) return;
    select.dataset.enhanced='1';
    const widget=document.createElement('div'); widget.className='ol-select';
    const trigger=document.createElement('button'); trigger.type='button'; trigger.className='ol-select-trigger'; trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false'); trigger.innerHTML='<span class="ol-select-value"></span><i class="fa-solid fa-chevron-down"></i>';trigger.setAttribute('aria-label',select.getAttribute('aria-label')||select.labels?.[0]?.textContent.trim()||'Seleccionar opción');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const menu=document.createElement('div'); menu.className='ol-select-menu ol-select-menu--portal'; menu.setAttribute('role','listbox');
    Array.from(select.options).forEach((option,index)=>{
      const item=document.createElement('button'); item.type='button'; item.className='ol-select-option'; item.setAttribute('role','option'); item.textContent=option.textContent.trim();
      item.addEventListener('click',event=>{event.stopPropagation();select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));closeCustomSelect(widget);trigger.focus();});
      menu.appendChild(item);
    });
    select.classList.add('native-select-hidden');
    select.insertAdjacentElement('afterend',widget); widget.append(trigger); document.body.appendChild(menu);
    widget._menu=menu; widget._trigger=trigger; widget._select=select; customSelects.set(select,widget); syncCustomSelect(select);
    trigger.addEventListener('click',event=>{
      event.stopPropagation(); const opening=!widget.classList.contains('open'); closeCustomSelects(widget);
      if(opening){widget.classList.add('open');menu.classList.add('open');trigger.setAttribute('aria-expanded','true');positionCustomSelect(widget);requestAnimationFrame(()=>positionCustomSelect(widget));}
      else closeCustomSelect(widget);
    });
    trigger.addEventListener('keydown',event=>{
      if(!['ArrowDown','ArrowUp','Enter',' '].includes(event.key))return;
      if(!widget.classList.contains('open')){event.preventDefault();trigger.click();return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();const items=$$('.ol-select-option',menu);let idx=items.indexOf(document.activeElement);if(idx<0)idx=select.selectedIndex;idx=(idx+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[idx]?.focus();
      }
    });
    menu.addEventListener('keydown',event=>{
      const items=$$('.ol-select-option',menu);const idx=items.indexOf(document.activeElement);
      if(event.key==='Escape'){event.preventDefault();closeCustomSelect(widget);trigger.focus();}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const next=(Math.max(idx,0)+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
    });
    select.addEventListener('change',()=>syncCustomSelect(select));
  };
  $$('select').forEach(enhanceSelect);
  document.addEventListener('click',event=>{if(!event.target.closest('.ol-select')&&!event.target.closest('.ol-select-menu--portal'))closeCustomSelects();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCustomSelects();});
  window.addEventListener('resize',()=>customSelects.forEach(positionCustomSelect));
  document.addEventListener('scroll',()=>customSelects.forEach(positionCustomSelect),true);
  $$('form').forEach(form=>form.addEventListener('reset',()=>setTimeout(()=>$$('select',form).forEach(syncCustomSelect),0)));

  const datePickers=[];
  const parseIsoDateOnly=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):null;};
  const isoDateOnly=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const displayDateOnly=value=>{const d=parseIsoDateOnly(value);return d?`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`:'Seleccionar fecha';};
  const dateAtMidnight=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const closeDatePickers=except=>datePickers.forEach(item=>{if(item.picker!==except)item.picker.classList.remove('open');});
  const enhanceDateInput=input=>{
    if(!input||input.dataset.dateEnhanced==='1'||input.disabled||input.readOnly)return;
    input.dataset.dateEnhanced='1'; input.classList.add('native-date-hidden');
    const button=document.createElement('button');button.type='button';button.className='date-display';button.innerHTML='<span class="date-display-value"></span><i class="fa-regular fa-calendar"></i>';
    input.insertAdjacentElement('afterend',button);
    const picker=document.createElement('div');picker.className='ol-datetime ol-date-only';picker.setAttribute('role','dialog');picker.setAttribute('aria-label','Seleccionar fecha');
    picker.innerHTML=`<div class="datetime-header"><button class="datetime-nav date-prev" type="button" aria-label="Mes anterior"><i class="fa-solid fa-chevron-left"></i></button><strong class="date-month-title"></strong><button class="datetime-nav date-next" type="button" aria-label="Mes siguiente"><i class="fa-solid fa-chevron-right"></i></button></div><div class="datetime-weekdays"><span>LU</span><span>MA</span><span>MI</span><span>JU</span><span>VI</span><span>SÁ</span><span>DO</span></div><div class="datetime-days date-days"></div><div class="datetime-footer"><button class="datetime-today date-today" type="button">Hoy</button><span class="datetime-footer-spacer"></span><button class="datetime-cancel date-cancel" type="button">Cancelar</button><button class="datetime-apply date-apply" type="button">Aplicar</button></div>`;
    document.body.appendChild(picker);
    const bounds=()=>({min:parseIsoDateOnly(input.min),max:parseIsoDateOnly(input.max)});
    const isBlocked=date=>{const d=dateAtMidnight(date);const {min,max}=bounds();return Boolean((min&&d<dateAtMidnight(min))||(max&&d>dateAtMidnight(max)));};
    const clamp=date=>{let d=dateAtMidnight(date);const {min,max}=bounds();if(min&&d<dateAtMidnight(min))d=dateAtMidnight(min);if(max&&d>dateAtMidnight(max))d=dateAtMidnight(max);return d;};
    let selected=clamp(parseIsoDateOnly(input.value)||new Date());let view=new Date(selected.getFullYear(),selected.getMonth(),1);
    const sync=()=>{const value=$('.date-display-value',button);if(value)value.textContent=displayDateOnly(input.value);button.classList.toggle('placeholder',!input.value);};
    const monthAllowed=(year,month)=>{const first=new Date(year,month,1);const last=new Date(year,month+1,0);const {min,max}=bounds();if(min&&last<dateAtMidnight(min))return false;if(max&&first>dateAtMidnight(max))return false;return true;};
    const render=()=>{
      const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];$('.date-month-title',picker).textContent=`${months[view.getMonth()]} ${view.getFullYear()}`;
      const prevBtn=$('.date-prev',picker),nextBtn=$('.date-next',picker);if(prevBtn)prevBtn.disabled=!monthAllowed(view.getFullYear(),view.getMonth()-1);if(nextBtn)nextBtn.disabled=!monthAllowed(view.getFullYear(),view.getMonth()+1);
      const grid=$('.date-days',picker);grid.innerHTML='';const first=(new Date(view.getFullYear(),view.getMonth(),1).getDay()+6)%7;const count=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();const prev=new Date(view.getFullYear(),view.getMonth(),0).getDate();
      for(let i=0;i<42;i++){const offset=i-first+1;let day,month=view.getMonth(),year=view.getFullYear(),muted=false;if(offset<1){day=prev+offset;month--;muted=true}else if(offset>count){day=offset-count;month++;muted=true}else day=offset;const candidate=new Date(year,month,day);const blocked=isBlocked(candidate);const b=document.createElement('button');b.type='button';b.className='datetime-day';if(muted)b.classList.add('muted');if(blocked){b.disabled=true;b.classList.add('date-disabled');b.setAttribute('aria-disabled','true');}if(candidate.toDateString()===selected.toDateString())b.classList.add('selected');const today=dateAtMidnight(new Date());if(candidate.toDateString()===today.toDateString())b.classList.add('today');b.textContent=String(day);if(!blocked)b.addEventListener('click',event=>{event.stopPropagation();selected=candidate;view=new Date(selected.getFullYear(),selected.getMonth(),1);render();});grid.appendChild(b);}
      const todayBtn=$('.date-today',picker);if(todayBtn)todayBtn.disabled=isBlocked(new Date());
      const applyBtn=$('.date-apply',picker);if(applyBtn)applyBtn.disabled=isBlocked(selected);
    };
    button.addEventListener('click',event=>{
      event.stopPropagation();closeCustomSelects();const opening=!picker.classList.contains('open');closeDatePickers(picker);
      if(opening){
        if(input.dataset.defaultToday==='1'){const today=isoDateOnly(new Date());input.max=today;if(!input.value){input.value=today;sync();}}
        selected=clamp(parseIsoDateOnly(input.value)||new Date());view=new Date(selected.getFullYear(),selected.getMonth(),1);render();picker.classList.add('open');
      }
    });
    $('.date-prev',picker).addEventListener('click',()=>{if($('.date-prev',picker).disabled)return;view=new Date(view.getFullYear(),view.getMonth()-1,1);render();});
    $('.date-next',picker).addEventListener('click',()=>{if($('.date-next',picker).disabled)return;view=new Date(view.getFullYear(),view.getMonth()+1,1);render();});
    $('.date-today',picker).addEventListener('click',()=>{const now=dateAtMidnight(new Date());if(isBlocked(now))return;selected=now;view=new Date(selected.getFullYear(),selected.getMonth(),1);render();});
    $('.date-cancel',picker).addEventListener('click',()=>picker.classList.remove('open'));
    $('.date-apply',picker).addEventListener('click',()=>{if(isBlocked(selected))return;input.value=isoDateOnly(selected);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));sync();picker.classList.remove('open');});
    input._syncDateDisplay=sync;input._refreshDatePicker=()=>{selected=clamp(parseIsoDateOnly(input.value)||new Date());view=new Date(selected.getFullYear(),selected.getMonth(),1);sync();if(picker.classList.contains('open'))render();};datePickers.push({input,button,picker});sync();
    input.closest('form')?.addEventListener('reset',()=>setTimeout(sync,0));
  };
  $$('input[type="date"]').forEach(enhanceDateInput);
  const setUserCreateHireDateToToday=()=>{
    const input=$('#modal-usuario-crear [data-user-hire-date]');if(!input)return;
    const today=isoDateOnly(new Date());input.max=today;input.value=today;input._refreshDatePicker?.();input._syncDateDisplay?.();
  };
  document.addEventListener('click',event=>{if(event.target.closest('a[href="#modal-usuario-crear"]'))setUserCreateHireDateToToday();});
  if($('#modal-usuario-crear')?.classList.contains('is-open'))setUserCreateHireDateToToday();
  document.addEventListener('click',event=>{if(!event.target.closest('.ol-date-only')&&!event.target.closest('.date-display'))closeDatePickers();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDatePickers();});

  
  const parseDate = value => {
    if (!value) return null;
    const text = value.trim();
    let m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return null;
  };

  const filterKey = label => {
    const l = normalize(label).replace(/^filtrar por /, '');
    if (l.includes('fecha desde') || l === 'fecha desde') return 'fecha-desde';
    if (l.includes('fecha hasta') || l === 'fecha hasta') return 'fecha-hasta';
    if (l === 'id') return 'id';
    if (l.includes('codigo')) return 'codigo';
    if (l.includes('estado actual')) return 'estado actual';
    if (l.includes('estado')) return 'estado';
    if (l.includes('utilizacion')) return 'utilizacion';
    if (l.includes('severidad')) return 'severidad';
    if (l.includes('segmento')) return 'segmento';
    if (l.includes('usuario')) return 'usuario';
    if (l.includes('rol')) return 'rol';
    if (l.includes('cliente')) return 'cliente';
    if (l.includes('elemento')) return 'elemento';
    if (l.includes('tipo')) return 'tipo';
    if (l.includes('nivel')) return 'nivel';
    return l;
  };

  const categoryValue = value => normalize(value).replace(/\s*\([^)]*\)\s*/g, '').trim();

  const historyMonths = [
    { label: 'Ene', date: new Date(2026,0,1) }, { label: 'Feb', date: new Date(2026,1,1) },
    { label: 'Mar', date: new Date(2026,2,1) }, { label: 'Abr', date: new Date(2026,3,1) },
    { label: 'May', date: new Date(2026,4,1) }, { label: 'Jun', date: new Date(2026,5,1) },
    { label: 'Jul', date: new Date(2026,6,1) }, { label: 'Ago', date: new Date(2026,7,1) },
    { label: 'Sep', date: new Date(2026,8,1) }
  ];

  const formatDateEs = value => {
    const date = parseDate(value);
    if (!date) return '—';
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
  };

  const renderHistoryChart = panel => {
    const chart = $('.history-line-chart', panel);
    const filterPanel = $('.filter-panel', panel) || $('.history-global-filters');
    if (!chart || !filterPanel) return;
    const fields = $$('.filter-field', filterPanel);
    const segment = fields[0]?.querySelector('select')?.value || 'Toda la red';
    const startRaw = fields[1]?.querySelector('input')?.value || '';
    const endRaw = fields[2]?.querySelector('input')?.value || '';
    const start = parseDate(startRaw);
    const end = parseDate(endRaw);
    const historyCode = segment.match(/SEG-\d+/)?.[0]?.replace('SEG-','seg') || 'global';
    const key = historyCode;
    const rawSeries=chart.dataset[`series${key[0].toUpperCase()}${key.slice(1)}`]||'';
    const allValues=rawSeries?rawSeries.split(',').map(Number):[];
    const points = historyMonths.map((month, i) => ({...month, value: allValues[i]})).filter(item => {
      const monthEnd = new Date(item.date.getFullYear(), item.date.getMonth()+1, 0, 23,59,59);
      if (start && monthEnd < start) return false;
      if (end && item.date > end) return false;
      return Number.isFinite(item.value);
    });

    const heading = $('.history-heading h2', panel);
    const subtitle = $('.history-heading p', panel);
    const code = segment.match(/SEG-\d+/)?.[0];
    if (heading) heading.textContent = code ? `Utilización del segmento ${code}` : 'Utilización de toda la red';
    if (subtitle) subtitle.textContent = `${formatDateEs(startRaw)} – ${formatDateEs(endRaw)}`;

    const averageEl = $('[data-history-average]', panel);
    const maxEl = $('[data-history-max]', panel);
    const trendEl = $('[data-history-trend]', panel);
    if (!points.length) {
      if (averageEl) averageEl.textContent = '—';
      if (maxEl) maxEl.textContent = '—';
      if (trendEl) trendEl.textContent = '—';
      chart.innerHTML = '<div class="history-chart-empty"><div><i class="fa-solid fa-circle-info"></i><br>No hay datos históricos para el periodo seleccionado.</div></div>';
      return false;
    }

    const values = points.map(p => p.value);
    const average = values.reduce((a,b)=>a+b,0)/values.length;
    const max = Math.max(...values);
    const trend = values[values.length-1]-values[0];
    if (averageEl) averageEl.textContent = `${average.toFixed(1)}%`;
    if (maxEl) maxEl.textContent = `${max.toFixed(1)}%`;
    if (trendEl) trendEl.textContent = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)} pp`;

    const W=1000, H=330, left=62, right=32, top=24, bottom=48;
    const chartW=W-left-right, chartH=H-top-bottom;
    const y=v => top + chartH - (v/100)*chartH;
    const x=i => points.length===1 ? left+chartW/2 : left + (i/(points.length-1))*chartW;
    const linePoints = points.map((p,i)=>`${x(i)},${y(p.value)}`).join(' ');
    const areaPoints = `${left},${y(0)} ${linePoints} ${x(points.length-1)},${y(0)}`;
    const gridValues=[0,20,40,60,80,100];
    const grid = gridValues.map(v=>`<line class="history-grid-line" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"></line><text class="history-axis-label" x="${left-12}" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join('');
    const months = points.map((p,i)=>`<text class="history-month-label" x="${x(i)}" y="${H-16}" text-anchor="middle">${p.label}</text>`).join('');
    const dots = points.map((p,i)=>`<circle class="history-point" cx="${x(i)}" cy="${y(p.value)}" r="6"></circle><text class="history-value-label" x="${x(i)}" y="${y(p.value)-13}" text-anchor="middle">${Number(p.value).toFixed(1)}%</text>`).join('');
    chart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de utilización en el periodo seleccionado">
      <defs><linearGradient id="historyAreaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0e9aa4" stop-opacity=".22"/><stop offset="100%" stop-color="#0e9aa4" stop-opacity=".02"/></linearGradient></defs>
      ${grid}
      <line class="history-threshold-high" x1="${left}" x2="${W-right}" y1="${y(80)}" y2="${y(80)}"></line>
      <text class="history-threshold-label high" x="${W-right}" y="${y(80)-7}" text-anchor="end">Alta utilización · 80%</text>
      <line class="history-threshold-critical" x1="${left}" x2="${W-right}" y1="${y(95)}" y2="${y(95)}"></line>
      <text class="history-threshold-label critical" x="${W-right}" y="${y(95)-7}" text-anchor="end">Crítica · &gt;95%</text>
      <polygon class="history-line-area" points="${areaPoints}"></polygon>
      <polyline class="history-line-path" points="${linePoints}"></polyline>
      ${dots}${months}
    </svg>`;
    return true;
  };

  const setTableEmptyState = (table, filterPanel, visible, triggerButton) => {
    const container = table.closest('.table-container');
    if (!container) return;
    let state = $('.table-empty-state', container);
    if (!state) {
      state = document.createElement('div');
      state.className = 'table-empty-state';
      state.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i><div class="empty-copy"><strong>No se encontraron registros</strong><span>Pruebe con otros criterios de búsqueda.</span></div><button class="table-empty-reset" type="button">Limpiar filtros</button>';
      container.appendChild(state);
      $('.table-empty-reset', state).addEventListener('click', () => {
        $$('.filter-field input', filterPanel).forEach(input => { input.value = ''; });
        $$('.filter-field select', filterPanel).forEach(select => { select.selectedIndex = 0; select.dispatchEvent(new Event('change', { bubbles: true })); });
        triggerButton.click();
      });
    }
    state.classList.toggle('show', visible === 0);
  };

  $$('.filter-submit').forEach(button => {
    button.addEventListener('click', () => {
      const filterPanel = button.closest('.filter-panel');
      const panel = button.closest('.panel') || filterPanel?.parentElement;
      const table = panel?.querySelector('table');

      if (!table && panel?.querySelector('.history-line-chart')) {
        const rendered = renderHistoryChart(panel);
        notify(rendered ? 'Historial actualizado para el periodo seleccionado.' : 'No hay datos para el periodo seleccionado.', rendered ? 'success' : 'info');
        return;
      }
      if (!table || !table.tBodies[0]) return;

      const headers = $$('thead th', table).map(th => normalize(th.textContent));
      const indexFor = key => {
        const exact = headers.findIndex(h => h === key);
        if (exact >= 0) return exact;
        if (key === 'id') return headers.findIndex(h => h === 'id');
        if (key === 'codigo') return headers.findIndex(h => h.includes('codigo'));
        if (key.startsWith('fecha-')) return headers.findIndex(h => /fecha|cierre|inicio/.test(h));
        return headers.findIndex(h => h.includes(key));
      };

      const criteria = $$('.filter-field', filterPanel).map(field => {
        const label = $('label', field)?.textContent || '';
        const control = $('input, select', field);
        return { key: filterKey(label), control, value: control?.value || '' };
      });

      Array.from(table.tBodies[0].rows).forEach(row => {
        let matches = true;
        criteria.forEach(({ key, control, value }) => {
          if (!matches || !control) return;
          const raw = value.trim();
          const normalizedValue = normalize(raw);
          if (!raw || ['todos', 'todas', 'red global', 'toda la red'].includes(normalizedValue)) return;
          const idx = indexFor(key);
          if (idx < 0) return;
          const cellText = normalize((row.cells[idx]?.textContent || '') + (key==='usuario' ? ' '+(row.cells[2]?.textContent||'') : ''));

          if (key === 'fecha-desde' || key === 'fecha-hasta') {
            const rowDate = parseDate(row.cells[idx]?.textContent || '');
            const filterDate = parseDate(raw);
            if (rowDate && filterDate) {
              if (key === 'fecha-desde' && rowDate < filterDate) matches = false;
              if (key === 'fecha-hasta' && rowDate > filterDate) matches = false;
            }
          } else if (control.tagName === 'SELECT') {
            const semantic = categoryValue(raw);
            if (key === 'utilizacion' || key === 'nivel') {
              if (!cellText.includes(semantic)) matches = false;
            } else if (cellText !== semantic) {
              matches = false;
            }
          } else if (!cellText.includes(normalizedValue)) {
            matches = false;
          }
        });
        row.dataset.filteredOut = matches ? '0' : '1';
        row.hidden = !matches;
      });
      if (table._oceanlinkRefreshPagination) table._oceanlinkRefreshPagination(true);
      const visible = Array.from(table.tBodies[0].rows).filter(row => row.dataset.filteredOut !== '1').length;
      setTableEmptyState(table, filterPanel, visible, button);
      if (visible === 0) notify('No se encontraron registros con los filtros aplicados.', 'info');
      else notify(visible === 1 ? 'Se encontró 1 registro.' : `Se encontraron ${visible} registros.`);
    });

    const filterPanel = button.closest('.filter-panel');
    $$('input', filterPanel).forEach(input => input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        button.click();
      }
    }));
  });

  const formValue = (form, labelText) => {
    const wanted = normalize(labelText);
    const fields = $$('.form-field', form);
    for (const field of fields) {
      const label = normalize($('label', field)?.textContent || '');
      if (label.includes(wanted)) {
        const control = $('input, select, textarea', field);
        if (!control) return '';
        if (control.multiple) return Array.from(control.selectedOptions).map(o => o.value || o.textContent.trim()).join(', ');
        return control.value.trim();
      }
    }
    return '';
  };

  const setFieldError = (control, message = '') => {
    if (!control) return;
    const field = control.closest('.form-field');
    if (!field) return;
    const error = $('.field-error', field);
    const hasError = Boolean(message);
    field.classList.toggle('has-error', hasError);
    control.classList.toggle('input-error', hasError);
    control.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    if (error) {
      if (!error.dataset.defaultMessage) error.dataset.defaultMessage = error.textContent.trim();
      error.textContent = message || error.dataset.defaultMessage || '';
      error.classList.toggle('is-visible', hasError);
    }
  };

  const validateForm = form => {
    if (!form) return true;
    let firstInvalid = null;
    $$('input, select, textarea', form).forEach(control => {
      if (control.disabled || control.type === 'hidden' || control.readOnly) return;
      const invalid = !control.checkValidity() || (control.required && !control.value.trim()) || (!['checkbox','radio'].includes(control.type) && /[<>]/.test(control.value));
      if (invalid) {
        const field = control.closest('.form-field');
        const error = field ? $('.field-error', field) : null;
        const message = error?.dataset.defaultMessage || error?.textContent.trim() || 'Revise este campo antes de continuar.';
        setFieldError(control, message);
        if (!firstInvalid) firstInvalid = control;
      } else if (!control.dataset.customInvalid) {
        setFieldError(control, '');
      }
    });
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      notify('Revise los campos marcados antes de continuar.', 'error');
      return false;
    }
    return true;
  };

  $$('form input, form select, form textarea').forEach(control => {
    ['input','change'].forEach(eventName => control.addEventListener(eventName, () => {
      if (!control.dataset.customInvalid && control.checkValidity()) setFieldError(control, '');
    }));
  });

  const updateIncidentSegmentPicker = form => {
    if (!form) return;
    const checks = $$('[data-incident-segment]', form);
    const selected = checks.filter(input => input.checked);
    const counter = $('[data-segment-count]', form);
    if (counter) counter.textContent = `${selected.length} ${selected.length === 1 ? 'seleccionado' : 'seleccionados'}`;
    const group = $('[data-incident-segment-group]', form);
    if (selected.length) {
      group?.classList.remove('is-invalid');
      const error = $('.segment-group-error', form); if (error) error.classList.remove('show');
    }
  };
  const incidentRegisterForm = $('#modal-incidencia form');
  if (incidentRegisterForm) {
    $$('[data-incident-segment]', incidentRegisterForm).forEach(input => input.addEventListener('change', () => updateIncidentSegmentPicker(incidentRegisterForm)));
    updateIncidentSegmentPicker(incidentRegisterForm);
  }

  const statusClass = value => {
    const v = normalize(value);
    if (['inactivo','inactiva'].includes(v)) return 'danger';
    if (['cerrado','cerrada','archivado','archivada'].includes(v)) return 'neutral';
    if (['critica','fuera de servicio','rechazada','cancelado','cancelada'].some(x => v.includes(x))) return 'danger';
    if (['alta','degradado','en ejecucion','pendiente','media'].some(x => v.includes(x))) return 'warning';
    if (['en analisis','reparacion programada','en reparacion','en mantenimiento','programado','registrada','en evaluacion','provisionada'].some(x => v.includes(x))) return 'info';
    if (['activo','activa','operativo','operativa','aprobada','servicio restaurado','finalizado','finalizada','viable','baja'].includes(v)) return 'ok';
    return 'neutral';
  };

  const badge = value => {
    const v = normalize(value);
    const severity = v === 'critica' ? 'severity-critical'
      : v === 'alta' ? 'severity-high'
      : v === 'media' ? 'severity-medium'
      : v === 'baja' ? 'severity-low'
      : null;
    return `<span class="status ${severity || statusClass(value)}">${value}</span>`;
  };
  const capacityTableValue = value => {
    const text = String(value ?? '').trim();
    const gbps = Number((text.match(/([0-9.]+)\s*Gbps/i) || [])[1]);
    const tbps = Number((text.match(/([0-9.]+)\s*Tbps/i) || [])[1]);
    const numeric = Number(text);
    const valueTbps = Number.isFinite(tbps) ? tbps : Number.isFinite(gbps) ? gbps / 1000 : Number.isFinite(numeric) ? numeric : null;
    if (valueTbps === null) return text;
    return Number.isInteger(valueTbps) ? String(valueTbps) : String(Number(valueTbps.toFixed(3)));
  };
  const nextCode = (table,prefix) => OceanLink.nextCode(prefix);

  const appendRow = (table, cells) => {
    if (!table?.tBodies?.[0]) return null;
    const tbody = table.tBodies[0];
    const referenceRow = Array.from(tbody.rows).find(r => !r.classList.contains('table-empty-row'));
    const headers = table.tHead?.rows?.[0]?.cells || [];
    const row = tbody.insertRow();
    row.innerHTML = cells.map((html, i) => {
      const referenceClass = referenceRow?.cells?.[i]?.className || headers?.[i]?.className || '';
      const classes = new Set(referenceClass.split(/\s+/).filter(Boolean));
      if (i === cells.length - 1) classes.add('action-cell');
      const classAttr = classes.size ? ` class="${Array.from(classes).join(' ')}"` : '';
      return `<td${classAttr}>${html}</td>`;
    }).join('');
    row.dataset.filteredOut = '0';
    if (table._oceanlinkRefreshPagination) table._oceanlinkRefreshPagination();
    return row;
  };

  const page = location.pathname.split('/').pop() || '';
  const readLocalList = key => { try { const value=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(value)?value:[]; } catch(_) { return []; } };
  const upsertLocalList = (key, entry, idKey='code', limit=10000) => { try { const list=readLocalList(key).filter(item=>item?.[idKey]!==entry?.[idKey]); list.unshift(entry); localStorage.setItem(key,JSON.stringify(list.slice(0,limit))); } catch(_) {} };

  $$('form button.primary-button[type="button"]').forEach(button => {
    button.addEventListener('click', async () => {
      const form = button.closest('form');
      const action = normalize(button.textContent);
      if (!validateForm(form)) return;
      if (button.matches('[data-save-service-route], [data-create-client], [data-confirm-reservation], [data-detail-incident-update], [data-detail-maintenance-activity], .confirm-static-update')) return;

      if (action.includes('previsualizar reporte')) {
        const type = $('.report-type-select', form)?.value || formValue(form, 'tipo de reporte') || 'Operación general';
        const segment = $('.report-segment-select', form)?.value || 'Toda la red';
        const start = $('.report-start-date', form)?.value || formValue(form, 'fecha inicial');
        const end = $('.report-end-date', form)?.value || formValue(form, 'fecha final');
        if (start && end && new Date(start) > new Date(end)) {
          notify('La fecha inicial no puede ser posterior a la fecha final.', 'error');
          return;
        }
        const params = new URLSearchParams({ modo: 'previsualizar', tipo: type, segmento: segment, desde: start, hasta: end });
        window.location.href = `sup_report_detail.html?${params.toString()}`;
        return;
      }

      if (action.includes('guardar asociacion')) {
        const origin = formValue(form, 'origen');
        const destination = formValue(form, 'destino');
        if (origin === destination) {
          notify('Origen y destino deben ser estaciones distintas.', 'error');
          return;
        }
        try { OceanLink.editSegment(new URLSearchParams(location.search).get('codigo')||'SEG-101',{origin,destination}); notify('Asociación de estaciones guardada correctamente.'); } catch(e) { notify(e.message,'error'); }
        return;
      }

      if (action.includes('guardar y finalizar')) {
        if (body.dataset.maintenanceCanFinalize !== '1') {
          notify('Antes de finalizar, registre al menos una actividad realizada durante la ejecución.', 'warning');
          return;
        }
        const result = formValue(form, 'resultado del mantenimiento');
        if (!result.trim()) {
          notify('Debe registrar el resultado antes de finalizar.', 'error');
          return;
        }
        const code = new URLSearchParams(location.search).get('codigo') || 'MNT-046';
        const confirmed = await askConfirmation({
          title: `Finalizar mantenimiento ${code}`,
          message: 'Se cerrará la ejecución, el resultado quedará registrado y el mantenimiento pasará al historial. ¿Desea continuar?',
          confirmText: 'Sí, finalizar'
        });
        if (!confirmed) return;
        try {
          localStorage.setItem(`oceanlink.final.maintenance.${code}.state`, 'Finalizado');
          localStorage.setItem(`oceanlink.final.maintenance.${code}.result`, result.trim());
          localStorage.setItem(`oceanlink.final.maintenance.${code}.closed`, new Date().toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',',''));
          const activityKey=`oceanlink.final.maintenance.${code}.activities`;
          const storedActivities=JSON.parse(localStorage.getItem(activityKey)||'[]');
          storedActivities.push(['Finalizado',OceanLink.now(),result.trim()]);
          localStorage.setItem(activityKey,JSON.stringify(storedActivities.slice(-30)));
        } catch (_) {}
        const stateItem = $$('.detail-item').find(item => normalize($('strong', item)?.textContent) === 'estado');
        if (stateItem) {
          const span = $('span', stateItem);
          if (span) { span.className = 'status ok'; span.textContent = 'Finalizado'; }
        }
        const steps = $$('.flow-step');
        steps.forEach(step => { step.classList.remove('active'); step.classList.add('completed'); });
        const activityAction = $('[data-maintenance-activity-action]'); if (activityAction) activityAction.remove();
        const finishAction = $('[data-maintenance-finish-action]'); if (finishAction) finishAction.remove();
        const guide = $('[data-maintenance-guidance]');
        if (guide) {
          guide.classList.add('completed');
          const title = $('[data-maintenance-guidance-title]', guide); if (title) title.textContent = 'Mantenimiento finalizado';
          const text = $('[data-maintenance-guidance-text]', guide); if (text) text.textContent = 'El resultado quedó registrado y el mantenimiento ya puede consultarse desde el historial.';
        }
        body.dataset.maintenanceCanFinalize = '0';
        const timeline=$('.activity-timeline');if(timeline){const item=document.createElement('div');item.className='timeline-item';item.innerHTML=`<span class="timeline-dot"></span><div><strong>Finalizado</strong><small>Ahora · Coordinador de mantenimiento</small><p>${result.trim()}</p></div>`;timeline.appendChild(item);}
        const resultCard=document.createElement('div');resultCard.className='maintenance-result-card';resultCard.innerHTML=`<span>Resultado registrado</span><strong>${result.trim()}</strong>`;$('.detail-grid')?.insertAdjacentElement('afterend',resultCard);
        closeModal();
        notify('Mantenimiento finalizado con resultado registrado.');
        return;
      }

      const panelTable = document.querySelector('.panel table');
      if (action.includes('guardar segmento') && panelTable) {
        const code = nextCode(panelTable, 'SEG');
        const origin = formValue(form, 'origen');
        const destination = formValue(form, 'destino');
        if (origin === destination) { notify('Origen y destino deben ser distintos.', 'error'); return; }
        const capacity = formValue(form, 'capacidad total');
        const state = formValue(form, 'estado');
        appendRow(panelTable, [code, origin, destination, capacityTableValue(capacity), badge(state), `<div class="icon-actions"><a class="icon-action" href="admin_segment_detail.html?codigo=${code}" title="Ver y editar segmento"><i class="fa-regular fa-eye"></i></a><a class="icon-action positive" href="admin_segment_stations.html?codigo=${code}" title="Gestionar estaciones"><i class="fa-solid fa-link"></i></a></div>`]);
        upsertLocalList('oceanlink.final.createdSegments',{code,origin,destination,total:Number(capacity)||0,used:0,reserved:0,available:Number(capacity)||0,utilization:0,state});
        closeModal(); form.reset(); notify(`Segmento ${code} registrado.`); return;
      }
      if (action.includes('guardar estacion') && panelTable) {
        const code = nextCode(panelTable, 'EST');
        const name = formValue(form, 'nombre de estacion').replace(/^Estación\s+/i,'');
        const locationText = formValue(form, 'ubicacion');
        const state = formValue(form, 'estado');
        appendRow(panelTable, [code, name, locationText, badge(state), `<div class="icon-actions"><a class="icon-action" href="admin_station_detail.html?codigo=${code}" title="Ver y editar estación"><i class="fa-regular fa-eye"></i></a></div>`]);
        upsertLocalList('oceanlink.final.createdStations',{code,name,location:locationText,state,energy:formValue(form,'capacidad de energia')||'—',date:new Date().toLocaleDateString('es-PE')});
        closeModal(); form.reset(); notify(`Estación ${code} registrada.`); return;
      }
      if (page === 'admin_users.html' && panelTable && (action.includes('guardar usuario') || action.includes('guardar cambios'))) {
        const name=formValue(form,'nombre completo'), role=formValue(form,'rol'), hireIso=formValue(form,'fecha de ingreso');
        const emailAliasInput=$('[data-user-email-alias]',form), phoneInput=$('[data-user-phone]',form);
        const emailAlias=sanitizeEmailAlias(emailAliasInput?.value||''), phoneDigits=digitsOnlyPhone(phoneInput?.value||'');
        if(emailAlias.length<3){notify('Usa al menos 3 caracteres antes de @oceanlink.pe.','error');emailAliasInput?.focus();return;}
        if(phoneDigits.length!==9){notify('El teléfono debe tener 9 dígitos.','error');phoneInput?.focus();return;}
        const email=companyEmailFromAlias(emailAlias), phone=companyPhoneFromDigits(phoneDigits);
        const editingCode=form.classList.contains('user-edit-form')?activeRow?.cells[0]?.textContent.trim():null;
        if(Array.from(panelTable.tBodies[0].rows).some(row=>row.cells[0]?.textContent.trim()!==editingCode&&row.cells[2]?.textContent.trim().toLowerCase()===email)){notify('Ya existe un usuario con ese correo.','error');return;}
        const hire=hireIso?formatReportDateEs(hireIso):'—'; const now=new Date(); const stamp=now.toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',','');
        if (action.includes('guardar cambios') && activeRow) { const currentState=activeRow.cells[5]?.textContent.trim()||'Activo'; const confirmed=await askConfirmation({title:`Guardar cambios de ${activeRow.cells[1]?.textContent.trim()||name}`,message:'Se actualizarán los datos del usuario y el rol asignado. El estado de acceso se mantiene sin cambios.',confirmText:'Sí, guardar cambios'}); if(!confirmed)return; activeRow.cells[1].textContent=name; activeRow.cells[2].textContent=email; activeRow.cells[3].textContent=role; activeRow.dataset.userPhone=phone; activeRow.dataset.userUpdated=stamp; saveStoredProfile(activeRow.cells[0]?.textContent.trim()||'',{email,phone}); const toggle=$('.user-toggle',activeRow); if(toggle) syncUserToggleAction(toggle,currentState,name); closeModal(); notify(`Datos de ${name} actualizados correctamente.`); return; }
        const state='Pendiente de activación';
        const code=nextCode(panelTable,'USR'); const lastAccess='Sin ingreso registrado'; const lastAccessCell=`<span class="user-no-access">${lastAccess}</span>`; const row=appendRow(panelTable,[code,name,email,role,lastAccessCell,badge(state),`<div class="icon-actions"><a class="icon-action user-view" href="#modal-usuario-perfil" title="Ver perfil"><i class="fa-regular fa-eye"></i></a><a class="icon-action edit user-edit" href="#modal-usuario-editar" title="Editar usuario"><i class="fa-regular fa-pen-to-square"></i></a><a class="icon-action positive user-toggle" href="#" title="Activar usuario" aria-label="Activar a ${name}"><i class="fa-solid fa-user-check"></i><span>Activar</span></a></div>`]); if(row){row.dataset.userPhone=phone; row.dataset.userHire=hire; row.dataset.userLastLogin=lastAccess; row.dataset.userCreated=stamp; row.dataset.userUpdated=stamp; row.dataset.userEverActivated='false'; saveStoredProfile(code,{email,phone});} closeModal(); form.reset(); notify(`Usuario ${code} registrado. La cuenta queda pendiente de activación.`,'warning'); return;
      }
      if (action.includes('guardar solicitud') && panelTable) {
        const code = nextCode(panelTable, 'REQ');
        const client = formValue(form, 'cliente');
        const capacity = formValue(form, 'capacidad requerida');
        const origin = formValue(form, 'origen');
        const destination = formValue(form, 'destino');
        if (origin === destination) { notify('Origen y destino deben ser distintos.', 'error'); return; }
        const row = appendRow(panelTable, [code, client, `${origin} - ${destination}`, capacityTableValue(`${capacity} Gbps`), badge('Registrada'), `<a class="icon-action" href="cp_request_detail.html?codigo=${code}" title="Ver solicitud" aria-label="Ver ${code}"><i class="fa-regular fa-eye"></i></a>`]);
        if (row) { row.dataset.requestCode = code; row.cells[4]?.classList.add('request-state-cell'); }
        try { localStorage.setItem(`oceanlink.final.request.${code}.state`, 'Registrada'); } catch (_) {}
        upsertLocalList('oceanlink.final.createdRequests',{code,client,capacity:`${capacity} Gbps`,origin,destination,date:new Date().toLocaleDateString('es-PE'),state:'Registrada'});
        closeModal(); form.reset(); notify(`Solicitud ${code} registrada.`); return;
      }
      if (action.includes('guardar mantenimiento') && panelTable) {
        const startInput = $('.maintenance-start', form);
        const endInput = $('.maintenance-end', form);
        const startDisplay = $('[data-datetime-display="inicio"]', form);
        const endDisplay = $('[data-datetime-display="fin"]', form);
        if (!startInput?.value || !endInput?.value) {
          const target = !startInput?.value ? startDisplay : endDisplay;
          if (target) setFieldError(target, 'Seleccione la fecha y hora antes de continuar.');
          notify('Complete la ventana de mantenimiento.', 'error');
          return;
        }
        if (new Date(endInput.value) <= new Date(startInput.value)) {
          if (endDisplay) {
            endDisplay.dataset.customInvalid = 'true';
            setFieldError(endDisplay, 'La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.');
            endDisplay.focus({ preventScroll: true });
          }
          notify('Revise la ventana horaria del mantenimiento.', 'error');
          return;
        }
        const code = nextCode(panelTable, 'MNT');
        const type = formValue(form, 'tipo');
        const elementText = formValue(form, 'elemento');
        const element = (elementText.match(/(?:EST|SEG)-\d+/i) || [elementText])[0];
        const dateRaw = startInput?.value || '';
        const d = dateRaw ? new Date(dateRaw) : null;
        const dateText = d && !Number.isNaN(d.valueOf()) ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : '—';
        appendRow(panelTable, [code, type, element, dateText, badge('Programado'), `<div class="icon-actions"><a class="icon-action" href="mc_maintenance_detail.html?codigo=${code}" title="Ver y gestionar mantenimiento" aria-label="Ver y gestionar ${code}"><i class="fa-regular fa-eye"></i></a></div>`]);
        upsertLocalList('oceanlink.final.createdMaintenances',{code,type,element,start:startInput?.value||'',end:endInput?.value||'',duration:$('.maintenance-duration',form)?.value||'—',description:formValue(form,'descripcion'),state:'Programado'});
        closeModal(); form.reset();
        const durationField = $('.maintenance-duration', form); if (durationField) durationField.value = '';
        notify(`Mantenimiento ${code} programado.`); return;
      }
      if ((action.includes('guardar incidencia') || action.includes('registrar incidencia')) && panelTable) {
        const code = nextCode(panelTable, 'INC');
        const segmentChecks = $$('[data-incident-segment]:checked', form);
        const segmentGroup = $('[data-incident-segment-group]', form);
        const segments = segmentChecks.map(input => input.value);
        if (!segments.length) {
          segmentGroup?.classList.add('is-invalid');
          const error = $('.segment-group-error', form); if (error) error.classList.add('show');
          notify('Seleccione al menos un segmento afectado.', 'error');
          return;
        }
        const segment = segments.join(' · ');
        const severity = formValue(form, 'severidad');
        const description=formValue(form,'descripcion');
        const relatedServices = Object.entries(servicesCatalog).filter(([,srv]) => (srv.segments||[]).some(seg => segments.includes(seg))).map(([srvCode]) => srvCode);
        const relatedClients = [...new Set(relatedServices.map(srvCode => servicesCatalog[srvCode]?.client).filter(Boolean))];
        const now = new Date();
        const dateText = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
        appendRow(panelTable, [code, segment, badge(severity), dateText, badge('Detectada'), `<div class="icon-actions"><a class="icon-action" href="no_incident_detail.html?codigo=${code}" title="Ver y gestionar incidencia" aria-label="Ver y gestionar ${code}"><i class="fa-regular fa-eye"></i></a></div>`]);
        upsertLocalList('oceanlink.final.createdIncidents',{code,segments,severity,state:'Detectada',date:`${dateText} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,description,services:relatedServices,clients:relatedClients});
        closeModal(); form.reset(); $$('[data-incident-segment]',form).forEach(input=>input.checked=false); updateIncidentSegmentPicker?.(form); notify(`Incidencia ${code} registrada.`); return;
      }

      closeModal();
      notify('Cambios guardados correctamente.');
    });
  });

  const historyPanel = $('.history-line-chart')?.closest('.panel');
  if (historyPanel) renderHistoryChart(historyPanel);

  if (page === 'mc_maintenance.html') {
    const form = $('#modal-mantenimiento form');
    if (form) {
      const fields = $$('.form-field', form);
      const fieldByLabel = text => fields.find(field => normalize($('label', field)?.textContent || '').includes(normalize(text)));
      const startInput = $('.maintenance-start', form);
      const endInput = $('.maintenance-end', form);
      const durationInput = $('.maintenance-duration', form);
      const elementSelect = $('select', fieldByLabel('elemento'));
      const startDisplay = $('[data-datetime-display="inicio"]', form);
      const endDisplay = $('[data-datetime-display="fin"]', form);

      const formatEstimatedDuration = totalMinutes => {
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        const parts = [];
        if (days) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
        if (hours) parts.push(`${hours} h`);
        if (minutes || !parts.length) parts.push(`${minutes} min`);
        return parts.join(' ');
      };
      const formatDateTimeDisplay = iso => {
        if (!iso) return 'Seleccionar fecha y hora';
        const d = new Date(iso);
        if (Number.isNaN(d.valueOf())) return 'Seleccionar fecha y hora';
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      };
      const isoLocal = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

      const setMaintenanceWindowError = (message = '') => {
        if (!endDisplay) return;
        if (message) {
          endDisplay.dataset.customInvalid = 'true';
          setFieldError(endDisplay, message);
          if (durationInput) {
            durationInput.value = '';
            durationInput.placeholder = 'Revise las fechas seleccionadas';
            durationInput.closest('.computed-field-wrap')?.classList.add('computed-invalid');
          }
        } else {
          delete endDisplay.dataset.customInvalid;
          setFieldError(endDisplay, '');
          if (durationInput) {
            durationInput.placeholder = 'Se calcula automáticamente';
            durationInput.closest('.computed-field-wrap')?.classList.remove('computed-invalid');
          }
        }
      };

      const updateMaintenanceDuration = () => {
        if (durationInput) durationInput.value = '';
        setMaintenanceWindowError('');
        if (!startInput?.value || !endInput?.value) return;
        const startDate = new Date(startInput.value);
        const finish = new Date(endInput.value);
        if (Number.isNaN(startDate.valueOf()) || Number.isNaN(finish.valueOf())) return;
        const diff = finish.getTime() - startDate.getTime();
        if (diff <= 0) {
          setMaintenanceWindowError('La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.');
          return;
        }
        if (durationInput) durationInput.value = formatEstimatedDuration(Math.round(diff / 60000));
      };

      const closePickers = except => $$('.ol-datetime.open', form).forEach(picker => { if (picker !== except) picker.classList.remove('open'); });
      const setupDateTimePicker = (hiddenInput, displayButton) => {
        if (!hiddenInput || !displayButton) return;
        const host = displayButton.closest('.datetime-field');
        if (!host) return;
        const popover = $('.ol-datetime', host);
        if (!popover) return;
        const title = $('.datetime-month-title', popover);
        const daysGrid = $('.datetime-days', popover);
        const hourSelect = $('.datetime-hour', popover);
        const minuteSelect = $('.datetime-minute', popover);
        let selected = hiddenInput.value ? new Date(hiddenInput.value) : new Date();
        if (Number.isNaN(selected.valueOf())) selected = new Date();
        let view = new Date(selected.getFullYear(), selected.getMonth(), 1);

        const syncDisplay = () => {
          const value = formatDateTimeDisplay(hiddenInput.value);
          $('.datetime-display-value', displayButton).textContent = value;
          displayButton.classList.toggle('placeholder', !hiddenInput.value);
        };
        const render = () => {
          const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
          if (title) title.textContent = `${months[view.getMonth()]} ${view.getFullYear()}`;
          if (!daysGrid) return;
          daysGrid.innerHTML = '';
          const firstDay = (new Date(view.getFullYear(), view.getMonth(), 1).getDay()+6)%7;
          const daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
          const prevDays = new Date(view.getFullYear(), view.getMonth(), 0).getDate();
          for (let i=0;i<42;i++) {
            const offset=i-firstDay+1;
            let day, month=view.getMonth(), year=view.getFullYear(), muted=false;
            if (offset<1) { day=prevDays+offset; month-=1; muted=true; }
            else if (offset>daysInMonth) { day=offset-daysInMonth; month+=1; muted=true; }
            else day=offset;
            const candidate=new Date(year,month,day,selected.getHours(),selected.getMinutes());
            const btn=document.createElement('button');btn.type='button';btn.className='datetime-day';if(muted)btn.classList.add('muted');
            if(candidate.toDateString()===selected.toDateString())btn.classList.add('selected');
            const today=new Date();if(candidate.toDateString()===today.toDateString())btn.classList.add('today');
            btn.textContent=String(day);btn.addEventListener('click',()=>{selected=new Date(candidate);view=new Date(selected.getFullYear(),selected.getMonth(),1);render();});daysGrid.appendChild(btn);
          }
          if (hourSelect) hourSelect.value=String(selected.getHours()).padStart(2,'0');
          if (minuteSelect) minuteSelect.value=String(selected.getMinutes()).padStart(2,'0');
        };
        if (hourSelect && !hourSelect.options.length) for(let h=0;h<24;h++)hourSelect.add(new Option(String(h).padStart(2,'0'),String(h).padStart(2,'0')));
        if (minuteSelect && !minuteSelect.options.length) [0,5,10,15,20,25,30,35,40,45,50,55].forEach(m=>minuteSelect.add(new Option(String(m).padStart(2,'0'),String(m).padStart(2,'0'))));
        displayButton.addEventListener('click',()=>{const opening=!popover.classList.contains('open');closePickers(popover);popover.classList.toggle('open',opening);if(opening){selected=hiddenInput.value?new Date(hiddenInput.value):new Date();if(Number.isNaN(selected.valueOf()))selected=new Date();view=new Date(selected.getFullYear(),selected.getMonth(),1);render();}});
        $('.datetime-prev',popover)?.addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render();});
        $('.datetime-next',popover)?.addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render();});
        $('.datetime-today',popover)?.addEventListener('click',()=>{const now=new Date();selected=new Date(now.getFullYear(),now.getMonth(),now.getDate(),selected.getHours(),selected.getMinutes());view=new Date(now.getFullYear(),now.getMonth(),1);render();});
        $('.datetime-cancel',popover)?.addEventListener('click',()=>popover.classList.remove('open'));
        $('.datetime-apply',popover)?.addEventListener('click',()=>{
          selected.setHours(Number(hourSelect?.value||0),Number(minuteSelect?.value||0),0,0);
          hiddenInput.value=isoLocal(selected);hiddenInput.dispatchEvent(new Event('input',{bubbles:true}));hiddenInput.dispatchEvent(new Event('change',{bubbles:true}));syncDisplay();popover.classList.remove('open');
          delete displayButton.dataset.customInvalid;setFieldError(displayButton,'');
        });
        hiddenInput._syncDateDisplay = syncDisplay;
        syncDisplay();render();
      };

      setupDateTimePicker(startInput,startDisplay);
      setupDateTimePicker(endInput,endDisplay);
      form.addEventListener('reset',()=>setTimeout(()=>{startInput?._syncDateDisplay?.();endInput?._syncDateDisplay?.();updateMaintenanceDuration();},0));
      document.addEventListener('click',event=>{if(!event.target.closest('.datetime-field'))closePickers();});
      [startInput,endInput].forEach(control=>{control?.addEventListener('input',updateMaintenanceDuration);control?.addEventListener('change',updateMaintenanceDuration);});
      updateMaintenanceDuration();

      $('.affected-services-button', form)?.addEventListener('click', () => {
        const element = elementSelect?.value || '';
        const code = (element.match(/(?:EST|SEG)-\d+/i) || [element])[0];
        OceanLink.refresh();
        const services = OceanLink.servicesFor([code]).map(c=>[c,OceanLink.esc(OceanLink.data.services[c].client),OceanLink.esc(OceanLinkView.route(OceanLink.data.services[c]))]);
        const content = services.length
          ? `<p class="modal-intro">Estos servicios utilizan actualmente la infraestructura seleccionada.</p><div class="table-container"><table><thead><tr><th>Servicio</th><th>Cliente</th><th>Ruta</th></tr></thead><tbody>${services.map(item=>`<tr><td>${item[0]}</td><td>${item[1]}</td><td>${item[2]}</td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty-inline-state"><i class="fa-solid fa-circle-check"></i><div><strong>Sin servicios asociados</strong><span>No se identificaron servicios que utilicen actualmente esta infraestructura.</span></div></div>';
        showInfoModal(`Servicios potencialmente afectados · ${code || 'elemento'}`, content);
      });
    }
  }

  const userDirectory=Object.fromEntries(Object.entries(OceanLink.data.users).map(([code,u])=>[u.name,{...u,code,status:u.state}]));
  const profileStorageKey = code => `oceanlink.final.userProfile.${code}`;
  const readStoredProfile = code => {
    try { return JSON.parse(localStorage.getItem(profileStorageKey(code)) || '{}') || {}; } catch (_) { return {}; }
  };
  const saveStoredProfile = (code, values = {}) => {
    if (!code) return;
    try {
      const previous = readStoredProfile(code);
      localStorage.setItem(profileStorageKey(code), JSON.stringify({...previous, ...values, updatedAt:new Date().toISOString()}));
    } catch (_) {}
  };
  const currentProfileByName = name => {
    const base = userDirectory[name] || {code:'—',email:'—',phone:'—',hire:'—',last:'—',role:$('.session-data .role')?.textContent.trim()||'—',status:'Activo'};
    const stored = readStoredProfile(base.code);
    const alias = sanitizeEmailAlias(emailAliasFrom(stored.email||''));
    const phoneDigits = digitsOnlyPhone(stored.phone||'');
    return {
      ...base,
      ...(alias.length >= 3 ? {email: companyEmailFromAlias(alias)} : {}),
      ...(phoneDigits.length === 9 ? {phone: companyPhoneFromDigits(phoneDigits)} : {}),
      ...(stored.updatedAt ? {updatedAt: stored.updatedAt} : {})
    };
  };
  const profileInitials = name => (name || 'Usuario').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'U';
  const COMPANY_EMAIL_DOMAIN = '@oceanlink.pe';
  const emailAliasFrom = value => { const raw=(value||'').trim().toLowerCase(); return raw.endsWith(COMPANY_EMAIL_DOMAIN) ? raw.slice(0,-COMPANY_EMAIL_DOMAIN.length) : (raw.split('@')[0]||''); };
  const sanitizeEmailAlias = value => (value||'').toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9._-]/g,'').slice(0,30);
  const digitsOnlyPhone = value => ((value||'').match(/\d/g)||[]).join('').slice(-9);
  const formatPhoneLocal = value => { const d=digitsOnlyPhone(value); return [d.slice(0,3),d.slice(3,6),d.slice(6,9)].filter(Boolean).join(' '); };
  const companyEmailFromAlias = alias => `${sanitizeEmailAlias(alias)}${COMPANY_EMAIL_DOMAIN}`;
  const companyPhoneFromDigits = digits => { const cleaned=digitsOnlyPhone(digits); return cleaned ? `+51 ${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6,9)}`.trim() : '+51'; };

  const roleCapabilities = {
    'Administrador':['Gestionar usuarios','Asignar roles','Gestionar estaciones','Gestionar segmentos','Consultar panel general'],
    'Planificador de capacidad':['Consultar capacidad','Evaluar solicitudes','Reservar capacidad','Gestionar clientes','Gestionar servicios y rutas'],
    'Operador de red':['Consultar estado de red','Registrar incidencias','Actualizar incidencias','Consultar afectados','Consultar historial'],
    'Coordinador de mantenimiento':['Programar mantenimientos','Consultar servicios afectados','Registrar actividades','Finalizar mantenimientos','Consultar historial'],
    'Supervisor':['Consultar indicadores','Consultar red y capacidad','Consultar incidencias y afectados','Consultar mantenimientos','Generar reportes e históricos']
  };
  const syncUserToggleAction = (link, state, name = 'usuario') => {
    if (!link) return;
    const active = normalize(state) === 'activo';
    const verb = active ? 'Desactivar' : 'Activar';
    link.className = `icon-action ${active ? 'danger' : 'positive'} user-toggle`;
    link.title = `${verb} usuario`;
    link.setAttribute('aria-label', `${verb} a ${name}`);
    link.innerHTML = `<i class="fa-solid ${active ? 'fa-user-slash' : 'fa-user-check'}"></i><span>${verb}</span>`;
  };
  const populateUserProfile = row => {
    const modal=$('#modal-usuario-perfil'); if(!modal||!row)return;
    const cells=row.cells;
    const code=cells[0]?.textContent.trim()||'—';
    const name=cells[1]?.textContent.trim()||'Usuario';
    const role=cells[3]?.textContent.trim()||'—';
    const stored=readStoredProfile(code);
    const storedPhoneDigits=digitsOnlyPhone(stored.phone||'');
    const email=(stored.email&&String(stored.email).toLowerCase().endsWith(COMPANY_EMAIL_DOMAIN))?stored.email:(cells[2]?.textContent.trim()||'—');
    const phone=storedPhoneDigits.length===9?companyPhoneFromDigits(storedPhoneDigits):(row.dataset.userPhone||'—');
    const set=(selector,value)=>{const node=$(selector,modal);if(node)node.textContent=value||'—';};
    set('[data-profile-title]',`Detalle de ${name}`);
    set('[data-profile-name]',name);
    set('[data-profile-role]',role);
    set('[data-profile-initials]',profileInitials(name));
    set('[data-profile-email]',email);
    set('[data-profile-phone]',phone);
    set('[data-profile-hire]',row.dataset.userHire||'—');
    set('[data-profile-last]',row.dataset.userLastLogin||cells[4]?.textContent.trim()||'—');
    modal._profileRow=row;
    const status=$('[data-profile-status]',modal); if(status)status.innerHTML=cells[5]?.innerHTML||badge('Inactivo');
    const caps=$('[data-profile-capabilities]',modal); if(caps)caps.innerHTML=(roleCapabilities[role]||[]).map(item=>`<span><i class="fa-solid fa-check"></i>${item}</span>`).join('');
  };
  const populateUserEdit = row => {
    const form=$('.user-edit-form'); if(!form||!row)return;
    const setField=(label,value)=>{const field=$$('.form-field',form).find(f=>normalize($('label',f)?.textContent||'').includes(normalize(label))); const control=field&&$('input, select, textarea',field); if(!control)return; if(control.tagName==='SELECT'){const option=Array.from(control.options).find(o=>normalize(o.textContent)===normalize(value)); if(option)control.value=option.value; control.dispatchEvent(new Event('change',{bubbles:true}));} else control.value=value||'';};
    setField('nombre completo',row.cells[1]?.textContent.trim());
    setField('rol',row.cells[3]?.textContent.trim()); setField('estado',row.cells[5]?.textContent.trim()); setField('fecha de ingreso',row.dataset.userHire||'—');
    const emailAlias=$('[data-user-email-alias]',form); if(emailAlias)emailAlias.value=emailAliasFrom(row.cells[2]?.textContent.trim()||'');
    const phone=$('[data-user-phone]',form); if(phone)phone.value=formatPhoneLocal(row.dataset.userPhone||'');
    const title=$('[data-edit-user-title]'); if(title)title.textContent=`Editar usuario · ${row.cells[1]?.textContent.trim()||''}`;
  };
  document.addEventListener('input', event => {
    const field = event.target;
    if (!field) return;
    if (field.matches('[data-profile-phone-input], [data-my-phone], [data-user-phone]')) field.value = formatPhoneLocal(field.value);
    if (field.matches('[data-profile-email-alias], [data-my-email-alias], [data-user-email-alias]')) field.value = sanitizeEmailAlias(field.value);
  });
  if(page==='admin_users.html'){
    document.addEventListener('click',async event=>{
      const link=event.target.closest('.user-view, .user-edit, .user-toggle');
      if(!link)return;
      const row=link.closest('tr');
      if(!row)return;
      if(link.classList.contains('user-view')){
        event.preventDefault();
        populateUserProfile(row);
        openModal($('#modal-usuario-perfil'),link);
        return;
      }
      if(link.classList.contains('user-edit')){
        activeRow=row;
        populateUserEdit(row);
        return;
      }
      if(link.classList.contains('user-toggle')){
        event.preventDefault();
        const currentState=row.cells[5]?.textContent.trim()||'Inactivo';
        const normalizedState=normalize(currentState);
        const canActivate=normalizedState!=='activo';
        const isPending=normalizedState.includes('pendiente');
        const name=row.cells[1]?.textContent.trim()||'este usuario';
        const confirmed=await askConfirmation({
          title:`${canActivate?'Activar':'Desactivar'} usuario`,
          message:canActivate
            ? (isPending?`${name} obtendrá acceso al sistema por primera vez con las funciones correspondientes a su rol.`:`${name} recuperará el acceso correspondiente a su rol.`)
            : `${name} no podrá iniciar sesión hasta que un administrador active nuevamente su cuenta.`,
          confirmText:canActivate?'Sí, activar':'Sí, desactivar',
          tone:canActivate?'primary':'danger'
        });
        if(!confirmed)return;
        const next=canActivate?'Activo':'Inactivo';
        row.cells[5].innerHTML=badge(next);
        row.dataset.userUpdated=new Date().toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',','');
        if(canActivate)row.dataset.userEverActivated='true';
        syncUserToggleAction(link,next,name);
        notify(`${name} fue ${next==='Activo'?'activado':'desactivado'} correctamente.`);
      }
    });
  }

  
  if(page==='cp_clients.html'){
    const btn=$('[data-create-client]');
    btn?.addEventListener('click',()=>{
      const form=btn.closest('form'); if(!validateForm(form))return;
      const table=$('.panel table'); const code=nextCode(table,'CLI');
      const company=formValue(form,'razon social'); const mail=formValue(form,'correo de contacto'); const state=formValue(form,'estado')||'Activo';
      const fiscal=formValue(form,'identificador fiscal')||formValue(form,'ruc')||'—'; const contact=formValue(form,'persona de contacto')||formValue(form,'contacto')||'—';
      appendRow(table,[code,company,mail,'0',badge(state),`<a class="icon-action" href="cp_client_detail.html?codigo=${code}" title="Ver detalle"><i class="fa-regular fa-eye"></i></a>`]);
      upsertLocalList('oceanlink.final.createdClients',{code,name:company,fiscal,contact,email:mail,state,services:[]});
      closeModal(btn.closest('.modal')); form.reset(); notify(`Cliente ${code} registrado.`);
    });
  }


  if(page==='no_incident_detail.html'){
    const flow=['Detectada','En análisis','Reparación programada','En reparación','Servicio restaurado','Cerrada'];
    const isHistory=new URLSearchParams(location.search).get('historial')==='1';
    const refreshIncidentFlowUi = () => {
      const current = body.dataset.incidentState || 'Detectada';
      const idx = flow.indexOf(current);
      $$('.flow-step').forEach((step,i)=>{step.classList.remove('active','completed'); if(i<idx || current==='Cerrada')step.classList.add('completed'); else if(i===idx)step.classList.add('active');});
      const next = idx>=0 && idx<flow.length-1 ? flow[idx+1] : '';
      const guide=$('[data-incident-guidance]');
      if(guide){
        const title=$('[data-incident-guidance-title]',guide);
        if(current==='Cerrada'){
          guide.classList.add('completed'); if(title)title.textContent='Incidencia cerrada';
          const p=$('p',guide); if(p)p.textContent='El flujo terminó. Consulte la bitácora y el impacto registrado.';
        }else{
          guide.classList.remove('completed'); if(title)title.textContent=next || 'Sin siguiente etapa';
        }
      }
      const action=$('[data-incident-next-action]');
      if(action){
        if(current==='Cerrada' || isHistory){ action.closest('.detail-actions')?.remove(); }
        else action.innerHTML=`<i class="fa-solid fa-arrow-right"></i> Avanzar a ${next}`;
      }
      const modal=$('#modal-actualizar-incidencia-detalle');
      if(modal && next){
        const currentInput=$('[data-incident-current-field]',modal); if(currentInput)currentInput.value=current;
        const nextInput=$('[data-incident-next-field]',modal); if(nextInput)nextInput.value=next;
        const h=$('.modal-header h2',modal); if(h)h.textContent=`Avanzar incidencia a ${next}`;
      }
      body.dataset.incidentNext = next;
    };
    refreshIncidentFlowUi();
    if(isHistory){
      const heading=$('.page-heading p'); if(heading) heading.textContent='Consulte la trazabilidad completa de la incidencia cerrada, sus segmentos y el impacto registrado.';
    }
    $('[data-detail-incident-update]')?.addEventListener('click',async()=>{
      const form=$('.incident-detail-update-form'); if(!validateForm(form))return;
      const next=body.dataset.incidentNext || formValue(form,'siguiente estado');
      const obs=formValue(form,'observacion de atencion');
      if(!next)return;
      const code=new URLSearchParams(location.search).get('codigo') || 'INC-001';
      const ok=await askConfirmation({title:`Avanzar incidencia ${code}`,message:`La incidencia pasará a “${next}”. La observación quedará registrada en la bitácora.`,confirmText:`Sí, pasar a ${next}`});
      if(!ok)return;
      body.dataset.incidentState=next;
      try{localStorage.setItem(`oceanlink.final.incident.${code}.state`,next);const stored=JSON.parse(localStorage.getItem(`oceanlink.final.incident.${code}.observations`)||'[]');stored.push([next,OceanLink.now(),obs]);localStorage.setItem(`oceanlink.final.incident.${code}.observations`,JSON.stringify(stored.slice(-20)));if(next==='Cerrada'){localStorage.setItem(`oceanlink.final.incident.${code}.result`,obs);localStorage.setItem(`oceanlink.final.incident.${code}.closed`,new Date().toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',',''));}}catch(_){}
      closeModal($('#modal-actualizar-incidencia-detalle'));
      const timeline=$('.activity-timeline'); if(timeline){const pending=$('.timeline-item.pending',timeline);pending?.remove();const item=document.createElement('div');item.className='timeline-item';item.innerHTML=`<span class="timeline-dot"></span><div><strong>${next}</strong><small>Ahora · Operador de red</small><p>${obs}</p></div>`;timeline.appendChild(item);}
      refreshIncidentFlowUi();
      const nextAfter=body.dataset.incidentNext;
      if(nextAfter && timeline){const item=document.createElement('div');item.className='timeline-item pending';item.innerHTML=`<span class="timeline-dot"></span><div><strong>Siguiente etapa</strong><small>${nextAfter}</small><p>Registre una observación al avanzar el flujo.</p></div>`;timeline.appendChild(item);}
      form.reset();
      notify(next==='Cerrada'?'Incidencia cerrada y trazabilidad actualizada.':'Incidencia actualizada y observación registrada.');
    });
  }

  document.addEventListener('click', event => {
    const link=event.target.closest('[data-maintenance-finish-action]');
    if(!link || link.getAttribute('aria-disabled')!=='true') return;
    event.preventDefault(); event.stopImmediatePropagation();
    notify('Registre al menos una actividad de ejecución antes de finalizar.', 'warning');
  }, true);
  if(page==='mc_maintenance_detail.html'){
    $('[data-detail-maintenance-start]')?.addEventListener('click',()=>{
      const code=new URLSearchParams(location.search).get('codigo') || 'MNT-046';
      const stateItem=$$('.detail-item').find(item=>normalize($('strong',item)?.textContent||'')==='estado');
      const stateNode=stateItem&&$('span',stateItem);
      const currentState=stateNode?.textContent.trim()||body.dataset.maintenanceState||'Programado';
      if(normalize(currentState)!=='programado'){closeModal($('#modal-iniciar-mantenimiento'));return;}
      if(stateNode){stateNode.className='status warning';stateNode.textContent='En ejecución';}
      body.dataset.maintenanceState='En ejecución';
      body.dataset.maintenanceWorkActivities='0';
      body.dataset.maintenanceCanFinalize='0';
      try{localStorage.setItem(`oceanlink.final.maintenance.${code}.state`,'En ejecución');localStorage.setItem(`oceanlink.final.maintenance.${code}.workCount`,'0');const key=`oceanlink.final.maintenance.${code}.activities`;const stored=JSON.parse(localStorage.getItem(key)||'[]');stored.push(['Inicio de mantenimiento',OceanLink.now(),'Se inicia la ventana de trabajo programada.']);localStorage.setItem(key,JSON.stringify(stored.slice(-30)));}catch(_){}
      const steps=$$('.flow-step');steps.forEach((step,i)=>{step.classList.remove('active','completed');if(i===0)step.classList.add('completed');if(i===1)step.classList.add('active');});
      const action=$('[data-maintenance-activity-action]');if(action){action.hidden=false;action.href='#modal-actividad-detalle';action.innerHTML='<i class="fa-solid fa-plus"></i> Registrar actividad';}
      const finish=$('[data-maintenance-finish-action]');if(finish){finish.hidden=false;finish.classList.add('is-disabled');finish.setAttribute('aria-disabled','true');finish.title='Registre al menos una actividad antes de finalizar';}
      const guide=$('[data-maintenance-guidance]');if(guide){guide.classList.add('attention');guide.classList.remove('ready','completed');const title=$('[data-maintenance-guidance-title]',guide);const text=$('[data-maintenance-guidance-text]',guide);if(title)title.textContent='Registrar una actividad de ejecución';if(text)text.textContent='El mantenimiento ya está En ejecución. Registre al menos una actividad realizada antes de habilitar la finalización.';}
      const timeline=$('.activity-timeline');if(timeline){const placeholder=$('.timeline-placeholder',timeline);placeholder?.remove();const item=document.createElement('div');item.className='timeline-item';item.innerHTML='<span class="timeline-dot"></span><div><strong>Inicio de mantenimiento</strong><small>Ahora · Coordinador de mantenimiento</small><p>Se inicia la ventana de trabajo programada.</p></div>';timeline.appendChild(item);}
      closeModal($('#modal-iniciar-mantenimiento'));notify('Mantenimiento iniciado. Registre las actividades realizadas durante la ejecución.');
    });

    $('[data-detail-maintenance-activity]')?.addEventListener('click',async()=>{
      const form=$('.maintenance-detail-activity-form'); if(!validateForm(form))return;
      const code=new URLSearchParams(location.search).get('codigo') || 'MNT-046';
      const stateItem=$$('.detail-item').find(item=>normalize($('strong',item)?.textContent||'')==='estado');
      const stateNode=stateItem&&$('span',stateItem); const currentState=stateNode?.textContent.trim()||body.dataset.maintenanceState||'';
      if(normalize(currentState)!=='en ejecucion'){notify('Primero debe iniciar el mantenimiento antes de registrar actividades.','warning');closeModal($('#modal-actividad-detalle'));return;}
      const activity=formValue(form,'comentario de la actividad');
      const ok=await askConfirmation({title:'Registrar actividad',message:'La actividad realizada quedará añadida a la bitácora del mantenimiento.',confirmText:'Sí, guardar actividad'});if(!ok)return;
      let workCount=Number(body.dataset.maintenanceWorkActivities||0)+1;
      try{const key=`oceanlink.final.maintenance.${code}.activities`;const stored=JSON.parse(localStorage.getItem(key)||'[]');stored.push(['Actividad registrada',OceanLink.now(),activity]);localStorage.setItem(key,JSON.stringify(stored.slice(-30)));localStorage.setItem(`oceanlink.final.maintenance.${code}.workCount`,String(workCount));}catch(_){}
      body.dataset.maintenanceWorkActivities=String(workCount);body.dataset.maintenanceCanFinalize='1';
      const finish=$('[data-maintenance-finish-action]');if(finish){finish.hidden=false;finish.classList.remove('is-disabled');finish.setAttribute('aria-disabled','false');finish.title='Registrar resultado y finalizar mantenimiento';}
      const guide=$('[data-maintenance-guidance]');if(guide){guide.classList.remove('attention','completed');guide.classList.add('ready');const title=$('[data-maintenance-guidance-title]',guide);const text=$('[data-maintenance-guidance-text]',guide);if(title)title.textContent='Resultado y finalización disponibles';if(text)text.textContent='Ya existe actividad registrada. Puede documentar más avances o finalizar registrando el resultado obligatorio.';}
      const timeline=$('.activity-timeline');if(timeline){const item=document.createElement('div');item.className='timeline-item';item.innerHTML=`<span class="timeline-dot"></span><div><strong>Actividad registrada</strong><small>Ahora · Coordinador de mantenimiento</small><p>${activity}</p></div>`;timeline.appendChild(item);}
      closeModal($('#modal-actividad-detalle'));form.reset();notify('Actividad registrada en la bitácora.');
    });
  }

  
  const queryParams = new URLSearchParams(location.search);
  const queryCode = fallback => queryParams.get('codigo') || fallback;
  const detailItem = label => $$('.detail-item').find(item => normalize($('strong', item)?.textContent || '') === normalize(label));
  const setDetailText = (label, value) => { const item=detailItem(label); const node=item&&$('span',item); if(node) node.textContent=value; };
  const setDetailHTML = (label, htmlValue) => { const item=detailItem(label); const node=item&&$('span',item); if(node) node.innerHTML=htmlValue; };
  const setDetailStatus = (label, value) => {
    const item = detailItem(label);
    const node = item && $('span', item);
    if (!node) return;
    node.className = `status ${statusClass(value)}`;
    node.textContent = value;
  };
  const setHeading = (title, subtitle=null) => { const h=$('.page-heading h1'); if(h)h.textContent=title; if(subtitle){const p=$('.page-heading p');if(p)p.textContent=subtitle;} };
  const setPanelHeading = (title, subtitle=null, panel=document) => { const h=$('.panel-heading h2',panel); if(h)h.textContent=title; if(subtitle){const p=$('.panel-heading p',panel);if(p)p.textContent=subtitle;} };
  const replaceTableBody = (table, rows, emptyText='Sin registros para mostrar') => {
    if(!table?.tBodies?.[0]) return;
    table.tBodies[0].innerHTML = rows.length ? rows.join('') : `<tr><td colspan="${table.tHead?.rows?.[0]?.cells?.length||1}" class="cell-center table-empty-cell">${emptyText}</td></tr>`;
  };
  const setSelectOptions = (select, options, selectedValue) => {
    if(!select)return; select.innerHTML=options.map(o=>`<option value="${o.value}"${o.value===selectedValue?' selected':''}>${o.label}</option>`).join('');
    const old=customSelects.get(select); if(old){old._menu?.remove();old.remove();customSelects.delete(select);select.classList.remove('native-select-hidden');delete select.dataset.enhanced;} enhanceSelect(select); select.dispatchEvent(new Event('change',{bubbles:true}));
  };

  const stationsCatalog = OceanLink.data.stations;
  const segmentsCatalog = OceanLink.data.segments;
  const stationCodeByName=()=>Object.fromEntries(Object.entries(stationsCatalog).map(([code,d])=>[normalize(d.name),code]));
  const stationName = code => stationsCatalog[code]?.name || code;
  const routeText = seg => `${stationName(seg.origin)} - ${stationName(seg.destination)}`;
  const capacityLevel = value => value > 95 ? 'Crítica' : value >= 80 ? 'Alta' : value === 0 ? 'Sin tráfico' : 'Normal';

  const servicesCatalog = OceanLink.data.services;
const clientsCatalog = OceanLink.data.clients;

  const incidentsCatalog = OceanLink.data.incidents;

  const maintCatalog = OceanLink.data.maint;

  const appendIfMissing = (table, code, cells) => { if(!table?.tBodies?.[0])return; const exists=Array.from(table.tBodies[0].rows).some(r=>normalize(r.cells[0]?.textContent||'').startsWith(normalize(code))); if(!exists)appendRow(table,cells); };
  if(page==='admin_segments.html'){
    const table=$('.panel table');readLocalList('oceanlink.final.createdSegments').slice().reverse().forEach(item=>{const seg=segmentsCatalog[item.code];if(!seg)return;appendIfMissing(table,item.code,[item.code,stationName(seg.origin),stationName(seg.destination),capacityTableValue(seg.total),badge(seg.state),`<div class="icon-actions"><a class="icon-action" href="admin_segment_detail.html?codigo=${item.code}" title="Ver y editar segmento"><i class="fa-regular fa-eye"></i></a><a class="icon-action positive" href="admin_segment_stations.html?codigo=${item.code}" title="Gestionar estaciones"><i class="fa-solid fa-link"></i></a></div>`]);});
  }
  if(page==='admin_stations.html'){
    const table=$('.panel table');readLocalList('oceanlink.final.createdStations').slice().reverse().forEach(item=>appendIfMissing(table,item.code,[item.code,item.name,item.location,badge(item.state||'Operativa'),`<div class="icon-actions"><a class="icon-action" href="admin_station_detail.html?codigo=${item.code}" title="Ver y editar estación"><i class="fa-regular fa-eye"></i></a></div>`]));
  }
  if(page==='cp_capacity.html'){
    const table=$('.panel table');readLocalList('oceanlink.final.createdSegments').slice().reverse().forEach(item=>{const seg=segmentsCatalog[item.code];if(!seg)return;appendIfMissing(table,item.code,[`<div class="segment-cell"><strong>${item.code}</strong><small>${routeText(seg)}</small></div>`,capacityTableValue(seg.total),capacityTableValue(seg.used),capacityTableValue(seg.reserved),capacityTableValue(seg.available),window.OceanLinkView?.usageMeter?.(seg.utilization) || `${seg.utilization}% · ${capacityLevel(seg.utilization)}`,`<a class="icon-action" href="cp_capacity_detail.html?codigo=${item.code}" title="Ver detalle"><i class="fa-regular fa-eye"></i></a>`]);});
  }
  if(page==='no_network.html'){
    const table=$('.panel table');readLocalList('oceanlink.final.createdSegments').slice().reverse().forEach(item=>{const seg=segmentsCatalog[item.code];if(!seg)return;appendIfMissing(table,item.code,[item.code,routeText(seg),window.OceanLinkView?.usageMeter?.(seg.utilization) || `${seg.utilization}% · ${capacityLevel(seg.utilization)}`,badge(seg.state),`<a class="icon-action" href="no_segment_detail.html?codigo=${item.code}" title="Ver detalle"><i class="fa-regular fa-eye"></i></a>`]);});
  }
  if(page==='cp_clients.html'){
    const table=$('.panel table');readLocalList('oceanlink.final.createdClients').slice().reverse().forEach(item=>appendIfMissing(table,item.code,[item.code,item.name,item.email,String(item.services?.length||0),badge(item.state||'Activo'),`<a class="icon-action" href="cp_client_detail.html?codigo=${item.code}" title="Ver detalle"><i class="fa-regular fa-eye"></i></a>`]));
  }
  if(page==='cp_requests.html'){
    const table=$('.panel table');
    Array.from(table?.tBodies?.[0]?.rows||[]).forEach(row=>{const code=row.dataset.requestCode||row.cells[0]?.textContent.trim();if(!code)return;let state='';try{state=localStorage.getItem(`oceanlink.final.request.${code}.state`)||'';}catch(_){}if(state&&row.cells[4])row.cells[4].innerHTML=badge(state);});
    readLocalList('oceanlink.final.createdRequests').slice().reverse().forEach(item=>{let state=item.state||'Registrada';try{state=localStorage.getItem(`oceanlink.final.request.${item.code}.state`)||state;}catch(_){}appendIfMissing(table,item.code,[item.code,item.client,`${item.origin} - ${item.destination}`,item.capacity,badge(state),`<a class="icon-action" href="cp_request_detail.html?codigo=${item.code}" title="Ver solicitud"><i class="fa-regular fa-eye"></i></a>`]);});
  }
  if(page==='no_incidents.html'){
    const table=$('.panel table');
    Array.from(table?.tBodies?.[0]?.rows||[]).forEach(row=>{const code=row.cells[0]?.textContent.trim();if(!code)return;let state='';try{state=localStorage.getItem(`oceanlink.final.incident.${code}.state`)||'';}catch(_){}if(state==='Cerrada')row.remove();else if(state&&row.cells[4])row.cells[4].innerHTML=badge(state);});
    readLocalList('oceanlink.final.createdIncidents').slice().reverse().forEach(item=>{let state=item.state||'Detectada';try{state=localStorage.getItem(`oceanlink.final.incident.${item.code}.state`)||state;}catch(_){}if(state==='Cerrada')return;appendIfMissing(table,item.code,[item.code,(item.segments||[]).join(' · '),badge(item.severity||'Media'),String(item.date||'').split(' ')[0],badge(state),`<div class="icon-actions"><a class="icon-action" href="no_incident_detail.html?codigo=${item.code}" title="Ver y gestionar incidencia" aria-label="Ver y gestionar ${item.code}"><i class="fa-regular fa-eye"></i></a></div>`]);});
  }
  if(page==='mc_maintenance.html'){
    const table=$('.panel table');
    Array.from(table?.tBodies?.[0]?.rows||[]).forEach(row=>{const code=row.cells[0]?.textContent.trim();if(!code)return;let state='';try{state=localStorage.getItem(`oceanlink.final.maintenance.${code}.state`)||'';}catch(_){}if(state==='Finalizado')row.remove();else if(state&&row.cells[4])row.cells[4].innerHTML=badge(state);});
    readLocalList('oceanlink.final.createdMaintenances').slice().reverse().forEach(item=>{let state=item.state||'Programado';try{state=localStorage.getItem(`oceanlink.final.maintenance.${item.code}.state`)||state;}catch(_){}if(state==='Finalizado')return;const date=item.start?new Date(item.start).toLocaleDateString('es-PE'):'—';appendIfMissing(table,item.code,[item.code,item.type,item.element,date,badge(state),`<div class="icon-actions"><a class="icon-action" href="mc_maintenance_detail.html?codigo=${item.code}" title="Ver y gestionar mantenimiento" aria-label="Ver y gestionar ${item.code}"><i class="fa-regular fa-eye"></i></a></div>`]);});
  }

  if(page==='admin_segment_detail.html'){
    const code=queryCode('SEG-101'); const data=segmentsCatalog[code]||segmentsCatalog['SEG-101'];
    setHeading(`Detalle del segmento ${code}`); setDetailText('Código',code); setDetailStatus('Estado',data.state); setDetailText('Origen',`Estación ${stationName(data.origin)}`); setDetailText('Destino',`Estación ${stationName(data.destination)}`); setDetailText('Capacidad total',`${data.total} Tbps`);
    const last=detailItem('Longitud estimada'); if(last){$('strong',last).textContent='Utilización actual'; $('span',last).innerHTML=`${data.utilization}% · ${badge(capacityLevel(data.utilization))}`;}
    const manage=$('a[href^="admin_segment_stations.html"]'); if(manage)manage.href=`admin_segment_stations.html?codigo=${code}`;
    const modal=$('#modal-editar-segmento'); if(modal){const h=$('.modal-header h2',modal);if(h)h.textContent=`Editar segmento ${code}`;const selects=$$('select',modal);const stationOptions=Object.entries(stationsCatalog).map(([value,d])=>({value,label:`${value} · ${d.name}`}));setSelectOptions(selects[0],stationOptions,data.origin);setSelectOptions(selects[1],stationOptions,data.destination);const cap=$('input[type="number"]',modal);if(cap)cap.value=data.total;setSelectOptions(selects[2],[{value:'Operativo',label:'Operativo'},{value:'Degradado',label:'Degradado'},{value:'En mantenimiento',label:'En mantenimiento'},{value:'Fuera de servicio',label:'Fuera de servicio'}],data.state);}
  }
  if(page==='admin_segment_stations.html'){
    const code=queryCode('SEG-101'); const data=segmentsCatalog[code]||segmentsCatalog['SEG-101']; setHeading(`Estaciones del segmento ${code}`); const back=$('.back-row a');if(back)back.href=`admin_segment_detail.html?codigo=${code}`;const selects=$$('form select');const options=Object.entries(stationsCatalog).map(([value,d])=>({value,label:`${value} - ${d.name}, ${d.location}`}));setSelectOptions(selects[0],options,data.origin);setSelectOptions(selects[1],options,data.destination);
  }

  if(page==='admin_station_detail.html'){
    const code=queryCode('EST-001'); const data=stationsCatalog[code]||stationsCatalog['EST-001']; setHeading(`Detalle de la estación de aterrizaje ${code}`); setPanelHeading(`Estación ${data.name}`);setDetailText('Código',code);setDetailStatus('Estado',data.state);setDetailText('Nombre',`Estación ${data.name}`);setDetailText('Ubicación',data.location);setDetailText('Capacidad de energía',data.energy);setDetailText('Fecha de alta',data.date);
    const table=$$('table')[0]; const related=Object.entries(segmentsCatalog).filter(([,seg])=>seg.origin===code||seg.destination===code).map(([segCode,seg])=>{const other=seg.origin===code?seg.destination:seg.origin;return `<tr><td>${segCode}</td><td>Estación ${stationName(other)}</td><td class="cell-center">${capacityTableValue(seg.total)}</td><td class="cell-center">${badge(seg.state)}</td><td class="action-cell"><a aria-label="Ver segmento" class="icon-action" href="admin_segment_detail.html?codigo=${segCode}" title="Ver segmento"><i class="fa-solid fa-eye"></i></a></td></tr>`;});replaceTableBody(table,related,'Esta estación no tiene segmentos asociados.');
    const modal=$('#modal-editar-estacion');if(modal){const h=$('.modal-header h2',modal);if(h)h.textContent=`Editar estación ${code}`;const inputs=$$('input',modal);if(inputs[0])inputs[0].value=`Estación ${data.name}`;if(inputs[1])inputs[1].value=data.location;if(inputs[2])inputs[2].value=data.energy;const sel=$('select',modal);setSelectOptions(sel,[{value:'Operativa',label:'Operativa'},{value:'En mantenimiento',label:'En mantenimiento'},{value:'Inactiva',label:'Inactiva'}],data.state);}
  }

  if(page==='cp_capacity_detail.html'){
    const code=queryCode('SEG-101');const data=segmentsCatalog[code]||segmentsCatalog['SEG-101'];setHeading(`Detalle de capacidad del segmento ${code}`);const metrics=$$('.summary-card strong');[`${data.total} Tbps`,`${data.used} Tbps`,`${data.reserved} Tbps`,`${data.available} Tbps`].forEach((v,i)=>{if(metrics[i])metrics[i].textContent=v;});const history=$('a[href^="cp_capacity_history.html"]');if(history)history.href=`cp_capacity_history.html?codigo=${code}`;
    const table=$('table');const rows=Object.entries(servicesCatalog).filter(([,srv])=>srv.segments.includes(code)).map(([srvCode,srv])=>`<tr><td><a href="cp_service_detail.html?codigo=${srvCode}">${srvCode}</a></td><td>${srv.client}</td><td class="cell-center">${capacityTableValue(srv.capacity)}</td><td class="cell-center">${badge(srv.state)}</td></tr>`);replaceTableBody(table,rows,'No hay servicios asignados a este segmento.');
  }
  if(page==='cp_capacity_history.html'){
    const code=queryParams.get('codigo');const sel=$('.history-segment-select');if(code&&sel&&segmentsCatalog[code]){sel.value=code;sel.dispatchEvent(new Event('change',{bubbles:true}));const panel=$('.history-line-chart')?.closest('.panel');if(panel)renderHistoryChart(panel);}
  }

  if(page==='cp_client_detail.html'){
    const code=queryCode('CLI-001');const data=clientsCatalog[code]||clientsCatalog['CLI-001'];setHeading(`Detalle del cliente ${code}`);setPanelHeading(data.name);setDetailText('Código',code);setDetailStatus('Estado',data.state);setDetailText('Razón social',data.name);setDetailText('Identificador fiscal',data.fiscal);setDetailText('Contacto',data.contact);setDetailText('Correo',data.email);
    const table=$('table');const rows=data.services.map(srvCode=>{const srv=servicesCatalog[srvCode];if(!srv)return'';return `<tr><td>${srvCode}</td><td class="cell-center">${capacityTableValue(srv.capacity)}</td><td>${srv.segments.join(' · ')} · ${stationName(srv.origin)} - ${stationName(srv.destination)}</td><td class="cell-center">${srv.activation}</td><td class="cell-center">${badge(srv.state)}</td><td class="action-cell"><a aria-label="Ver servicio" class="icon-action" href="cp_service_detail.html?codigo=${srvCode}" title="Ver servicio"><i class="fa-solid fa-eye"></i></a></td></tr>`;});replaceTableBody(table,rows,'El cliente no tiene servicios asociados.');
  }

  if(page==='cp_service_detail.html'){
    const code=queryCode('SRV-901');const data=servicesCatalog[code]||servicesCatalog['SRV-901'];setHeading(`Detalle del servicio ${code}`);setPanelHeading(`Servicio ${code}`,`Servicio empresarial ${normalize(data.state)==='activo'?'activo':data.state.toLowerCase()}.`);setDetailText('Cliente',`${data.clientCode} · ${data.client}`);setDetailStatus('Estado',data.state);setDetailText('Capacidad contratada',data.capacity);setDetailText('Fecha de activación',data.activation);setDetailText('Origen',`Estación ${stationName(data.origin)}`);setDetailText('Destino',`Estación ${stationName(data.destination)}`);
    const route=$('.route-visual');if(route){const nodes=[data.origin,...data.segments.map(seg=>segmentsCatalog[seg]?.destination).filter(Boolean)];let html=`<div class="route-node"><div class="node-icon"><i class="fa-solid fa-anchor"></i></div>${stationName(data.origin)} (${data.origin})</div>`;data.segments.forEach((segCode,i)=>{const seg=segmentsCatalog[segCode];html+=`<div class="route-line"><span>${segCode}</span></div><div class="route-node"><div class="node-icon"><i class="fa-solid fa-anchor"></i></div>${stationName(seg?.destination)} (${seg?.destination||'—'})</div>`;});route.innerHTML=html;}
    const routeBad=data.segments.some(c=>normalize(segmentsCatalog[c]?.state).includes('fuera de servicio'));const summary=$('.route-validation-summary');if(summary){summary.className=`route-validation-summary ${routeBad?'danger':''}`;summary.innerHTML=routeBad?'<i class="fa-solid fa-circle-xmark"></i><span><strong>Ruta no disponible</strong><small>Existe al menos un segmento Fuera de servicio.</small></span>':'<i class="fa-solid fa-circle-check"></i><span><strong>Ruta habilitada</strong><small>Todos los segmentos de la ruta permiten mantener el servicio.</small></span>';}
    const table=$$('table')[0];const rows=data.segments.map(segCode=>{const seg=segmentsCatalog[segCode];return `<tr><td><a href="cp_capacity_detail.html?codigo=${segCode}">${segCode}</a></td><td class="cell-center">${capacityTableValue(data.capacity)}</td><td class="cell-center">${badge(seg?.state||'—')}</td></tr>`;});replaceTableBody(table,rows);
    const cancel=$$('.danger-button').find(b=>normalize(b.textContent).includes('cancelar servicio'));if(cancel&&normalize(data.state)!=='activo'){cancel.hidden=true;}
  }

  if(page==='no_segment_detail.html'){
    const code=queryCode('SEG-102');const data=segmentsCatalog[code]||segmentsCatalog['SEG-102'];setHeading(`Detalle operativo del segmento ${code}`);setPanelHeading(routeText(data),'Estado operativo actual.');setDetailText('Código',code);setDetailStatus('Estado actual',data.state);setDetailText('Utilización',`${data.utilization}% · ${capacityLevel(data.utilization)}`);setDetailText('Capacidad disponible',`${data.available} Tbps`);
    const activeIncidents=Object.entries(incidentsCatalog).filter(([,inc])=>inc.segments.includes(code)&&inc.state!=='Cerrada');setDetailHTML('Incidencias activas',activeIncidents.length?activeIncidents.map(([c])=>`<a href="no_incident_detail.html?codigo=${c}">${c}</a>`).join(' · '):'<span class="status neutral">Sin incidencias activas</span>');setDetailText('Última actualización','11/09/2026 09:15');
    const register=$('a[href*="#modal-incidencia"]');if(register)register.href=`no_incidents.html#modal-incidencia`;
  }

  if(page==='no_incident_detail.html'){
    const code=queryCode('INC-001');
    const data=incidentsCatalog[code]||incidentsCatalog['INC-001'];
    const flow=['Detectada','En análisis','Reparación programada','En reparación','Servicio restaurado','Cerrada'];
    let currentState=data.state;
    let storedObservations=[];
    try{currentState=localStorage.getItem(`oceanlink.final.incident.${code}.state`)||currentState;storedObservations=JSON.parse(localStorage.getItem(`oceanlink.final.incident.${code}.observations`)||'[]');if(!Array.isArray(storedObservations))storedObservations=[];}catch(_){}
    const observations=[...data.observations,...storedObservations];
    const isHistory=queryParams.get('historial')==='1'||currentState==='Cerrada';
    body.dataset.incidentState=currentState;
    setHeading(`Detalle de incidencia ${code}`,isHistory?'Consulte la trazabilidad completa de la incidencia cerrada, sus segmentos y el impacto registrado.':'Consulte el flujo de atención, los segmentos asociados y el impacto sobre servicios y clientes.');
    const idx=flow.indexOf(currentState);
    const next=idx>=0&&idx<flow.length-1?flow[idx+1]:'';
    body.dataset.incidentNext=next;
    $$('.flow-step').forEach((step,i)=>{step.classList.remove('active','completed');if(i<idx||isHistory)step.classList.add('completed');else if(i===idx)step.classList.add('active');});
    { const item=detailItem('Severidad'); const node=item&&$('span',item); if(node){ const sev=normalize(data.severity)==='critica'?'severity-critical':normalize(data.severity)==='alta'?'severity-high':normalize(data.severity)==='media'?'severity-medium':'severity-low'; node.className=`status ${sev}`; node.textContent=data.severity; } } setDetailText('Fecha',data.date);setDetailHTML('Segmentos afectados',data.segments.map(seg=>`<a href="no_segment_detail.html?codigo=${seg}">${seg}</a>`).join(' · '));setDetailText('Descripción',data.description);
    const impacts=$$('.impact-box');if(impacts[0])impacts[0].innerHTML=`<strong>${data.services.length}</strong>Servicios afectados`;if(impacts[1])impacts[1].innerHTML=`<strong>${data.clients.length}</strong>${data.clients.length===1?'Cliente afectado':'Clientes afectados'}`;if(impacts[2])impacts[2].innerHTML=`<strong>${data.severity}</strong>Severidad`;
    const table=$('table');const rows=data.services.map((srvCode,i)=>{const srv=servicesCatalog[srvCode];return `<tr><td>${srvCode}</td><td>${srv?.client||data.clients[Math.min(i,data.clients.length-1)]||'Cliente afectado'}</td><td>${data.segments.join(' · ')}</td><td class="cell-center">${srv?.capacity?capacityTableValue(srv.capacity):'—'}</td></tr>`;});replaceTableBody(table,rows,'No se identificaron servicios afectados.');
    const timeline=$('.activity-timeline');if(timeline)timeline.innerHTML=observations.map(([st,time,obs])=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${st}</strong><small>${time} · Operador de red</small><p>${obs}</p></div></div>`).join('')+(!isHistory&&next?`<div class="timeline-item pending"><span class="timeline-dot"></span><div><strong>Siguiente etapa</strong><small>${next}</small><p>Registre una observación al avanzar el flujo.</p></div></div>`:'');
    const guide=$('[data-incident-guidance]');if(guide){const title=$('[data-incident-guidance-title]',guide);if(title)title.textContent=isHistory?'Incidencia cerrada':next;const p=$('p',guide);if(isHistory&&p)p.textContent='El flujo terminó. Consulte la bitácora y el impacto registrado.';guide.classList.toggle('completed',isHistory);}
    const action=$('[data-incident-next-action]');if(action&&!isHistory)action.innerHTML=`<i class="fa-solid fa-arrow-right"></i> Avanzar a ${next}`;
    const modal=$('#modal-actualizar-incidencia-detalle');if(modal&&!isHistory){const h=$('.modal-header h2',modal);if(h)h.textContent=`Avanzar incidencia a ${next}`;const currentInput=$('[data-incident-current-field]',modal);if(currentInput)currentInput.value=currentState;const nextInput=$('[data-incident-next-field]',modal);if(nextInput)nextInput.value=next;}
    if(isHistory){action?.closest('.detail-actions')?.remove();}
  }

  if(page==='mc_maintenance_detail.html'){
    const code=queryCode('MNT-046');
    const data=maintCatalog[code]||maintCatalog['MNT-046'];
    let currentState=data.state, storedActivities=[], storedResult='';
    const baselineWorkActivities=(data.activities||[]).filter(item=>normalize(item[0]).includes('actividad registrada')).length;
    let workCount=baselineWorkActivities;
    try{
      currentState=localStorage.getItem(`oceanlink.final.maintenance.${code}.state`)||currentState;
      storedActivities=JSON.parse(localStorage.getItem(`oceanlink.final.maintenance.${code}.activities`)||'[]'); if(!Array.isArray(storedActivities))storedActivities=[];
      storedResult=localStorage.getItem(`oceanlink.final.maintenance.${code}.result`)||'';
      const savedCount=localStorage.getItem(`oceanlink.final.maintenance.${code}.workCount`); if(savedCount!==null)workCount=Number(savedCount)||0;
    }catch(_){}
    const activities=[...(data.activities||[]),...storedActivities];
    const result=storedResult||data.result||'';
    const isHistory=queryParams.get('historial')==='1'||currentState==='Finalizado';
    body.dataset.maintenanceState=currentState;
    body.dataset.maintenanceWorkActivities=String(workCount);
    body.dataset.maintenanceCanFinalize=currentState==='En ejecución'&&workCount>0?'1':'0';
    setHeading(`Detalle del mantenimiento ${code}`);
    const stages=['Programado','En ejecución','Finalizado'];const idx=stages.indexOf(currentState);
    $$('.flow-step').forEach((step,i)=>{step.classList.remove('active','completed');if(i<idx||isHistory)step.classList.add('completed');else if(i===idx)step.classList.add('active');});
    setDetailText('Tipo',data.type);setDetailStatus('Estado',currentState);setDetailText('Infraestructura',data.element);setDetailText('Fecha y hora de inicio',data.start);setDetailText('Fecha y hora de fin',data.end||'—');setDetailText('Duración estimada',data.duration);setDetailText('Descripción',data.description);
    const timeline=$('.activity-timeline');if(timeline)timeline.innerHTML=(activities.length?activities:[[currentState,data.start,'Mantenimiento programado.']]).map(([title,time,desc])=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${title}</strong><small>${time} · Coordinador de mantenimiento</small><p>${desc}</p></div></div>`).join('');
    const table=$('table');const rows=data.services.map(srvCode=>{const srv=servicesCatalog[srvCode];return `<tr><td><a href="cp_service_detail.html?codigo=${srvCode}">${srvCode}</a></td><td>${srv?.client||'—'}</td><td class="cell-center">${srv?.capacity?capacityTableValue(srv.capacity):'—'}</td><td class="cell-center">${badge(srv?.state||'—')}</td></tr>`;});replaceTableBody(table,rows,'No se identificaron servicios potencialmente afectados.');
    const guide=$('[data-maintenance-guidance]');const guideTitle=guide&&$('[data-maintenance-guidance-title]',guide);const guideText=guide&&$('[data-maintenance-guidance-text]',guide);
    const modal=$('#modal-resultado');if(modal){const h=$('.modal-header h2',modal);if(h)h.textContent=`Finalizar mantenimiento ${code}`;}
    const activityAction=$('[data-maintenance-activity-action]'); const finishAction=$('[data-maintenance-finish-action]');
    if(isHistory){
      [activityAction,finishAction].forEach(a=>a?.remove());
      if(result){const resultCard=document.createElement('div');resultCard.className='maintenance-result-card';resultCard.innerHTML=`<span>Resultado registrado</span><strong>${result}</strong>`;$('.detail-grid')?.insertAdjacentElement('afterend',resultCard);}
      if(guide){guide.classList.add('completed');if(guideTitle)guideTitle.textContent='Mantenimiento finalizado';if(guideText)guideText.textContent='El resultado fue registrado. Consulte la bitácora y los servicios asociados para revisar la trazabilidad.';}
    } else if(currentState==='Programado'){
      if(activityAction){activityAction.href='#modal-iniciar-mantenimiento';activityAction.innerHTML='<i class="fa-solid fa-play"></i> Iniciar mantenimiento';activityAction.hidden=false;}
      if(finishAction)finishAction.hidden=true;
      const startHeading=$('#modal-iniciar-mantenimiento .modal-header h2');if(startHeading)startHeading.textContent=`Iniciar mantenimiento ${code}`;
      if(guide){guide.classList.remove('attention','ready','completed');if(guideTitle)guideTitle.textContent='Iniciar mantenimiento';if(guideText)guideText.textContent='Registre el inicio de la ventana de trabajo para pasar a En ejecución.';}
    } else if(currentState==='En ejecución'){
      if(activityAction){activityAction.href='#modal-actividad-detalle';activityAction.hidden=false;activityAction.innerHTML='<i class="fa-solid fa-plus"></i> Registrar actividad';}
      if(finishAction){finishAction.hidden=false;finishAction.classList.toggle('is-disabled',workCount<1);finishAction.setAttribute('aria-disabled',workCount<1?'true':'false');finishAction.title=workCount<1?'Registre al menos una actividad antes de finalizar':'Registrar resultado y finalizar mantenimiento';}
      const intro=$('#modal-actividad-detalle .modal-intro');if(intro)intro.textContent='Registre una actividad técnica realizada durante la ejecución.';
      const mh=$('#modal-actividad-detalle .modal-header h2');if(mh)mh.textContent=`Registrar actividad · ${code}`;
      if(guide){
        if(workCount<1){guide.classList.add('attention');guide.classList.remove('ready');if(guideTitle)guideTitle.textContent='Registrar una actividad de ejecución';if(guideText)guideText.textContent='Antes de finalizar, registre al menos una actividad realizada durante el mantenimiento.';}
        else{guide.classList.add('ready');guide.classList.remove('attention');if(guideTitle)guideTitle.textContent='Resultado y finalización disponibles';if(guideText)guideText.textContent='Ya existe actividad registrada. Puede documentar más avances o finalizar registrando el resultado obligatorio.';}
      }
    }
  }

  if(page==='sup_history.html'){
    const tabs=$$('[data-history-tab]');
    const panels=$$('[data-history-panel]');
    const activateHistoryTab=key=>{
      tabs.forEach(tab=>{const active=tab.dataset.historyTab===key;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',active?'true':'false');});
      panels.forEach(panel=>panel.classList.toggle('active',panel.dataset.historyPanel===key));
      if(key==='utilizacion'){const panel=$('[data-history-panel="utilizacion"]');if(panel)renderHistoryChart(panel);}
    };
    tabs.forEach(tab=>tab.addEventListener('click',()=>activateHistoryTab(tab.dataset.historyTab)));
    const hash=normalize(location.hash.replace('#',''));
    activateHistoryTab(['incidencias','mantenimientos'].includes(hash)?hash:'utilizacion');
  }

  if(page==='no_incident_history.html'){
    const table=$('.panel table');
    Object.entries(incidentsCatalog).forEach(([code,data])=>{
      let state=data.state, closed=data.closed||'', result=data.result||'';
      try{state=localStorage.getItem(`oceanlink.final.incident.${code}.state`)||state;closed=localStorage.getItem(`oceanlink.final.incident.${code}.closed`)||closed;result=localStorage.getItem(`oceanlink.final.incident.${code}.result`)||result;}catch(_){}
      if(state!=='Cerrada')return;
      if(!result){const last=(data.observations||[]).slice(-1)[0];result=last?.[2]||'Incidencia cerrada.';}
      appendIfMissing(table,code,[code,(data.segments||[]).join(' · '),badge(data.severity||'Media'),closed||'—',result,`<a class="icon-action" href="no_incident_detail.html?codigo=${code}&historial=1" title="Ver trazabilidad" aria-label="Ver trazabilidad de ${code}"><i class="fa-regular fa-eye"></i></a>`]);
    });
  }

  if(page==='mc_history.html'){
    const table=$('.panel table');
    Object.entries(maintCatalog).forEach(([code,data])=>{
      let state=data.state, result=data.result||'';
      try{state=localStorage.getItem(`oceanlink.final.maintenance.${code}.state`)||state;result=localStorage.getItem(`oceanlink.final.maintenance.${code}.result`)||result;}catch(_){}
      if(state!=='Finalizado')return;
      const date=String(data.start||'—').split(' ')[0];
      appendIfMissing(table,code,[code,data.element,data.type,date,result||'Comentario registrado',`<a class="icon-action" href="mc_maintenance_detail.html?codigo=${code}&historial=1" title="Ver mantenimiento finalizado" aria-label="Ver ${code}"><i class="fa-regular fa-eye"></i></a>`]);
    });
    $$('tbody tr').forEach(row=>{const code=row.cells[0]?.textContent.trim();const a=$('a[href*="mc_maintenance_detail.html"]',row);if(code&&a)a.href=`mc_maintenance_detail.html?codigo=${code}&historial=1`;});
  }

  

  const formatReportDateEs = iso => {
    if (!iso) return '—';
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
  };

  const renderReportLineChart = (container, values, options = {}) => {
    if (!container) return;
    const defaultLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago'].slice(0, values.length);
    const labels = Array.isArray(options.labels) && options.labels.length === values.length ? options.labels : defaultLabels;
    const suffix = options.suffix ?? '%';
    const isPercent = suffix === '%';
    const width = 980, height = 300, left = 50, right = 28, top = 28, bottom = 42;
    const plotW = width-left-right, plotH = height-top-bottom;
    const rawMax = Math.max(...values, 1);
    const maxValue = isPercent ? 100 : Math.max(4, Math.ceil(rawMax / 4) * 4);
    const y = v => top + (maxValue-v)/maxValue*plotH;
    const x = i => left + (plotW/(values.length-1))*i;
    const line = values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    const ticks = isPercent ? [0,25,50,75,100] : [0,maxValue/4,maxValue/2,maxValue*3/4,maxValue];
    const grid = ticks.map(v=>`<line class="report-chart-grid" x1="${left}" y1="${y(v)}" x2="${width-right}" y2="${y(v)}"></line><text class="report-chart-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${Number.isInteger(v)?v:v.toFixed(1)}${suffix}</text>`).join('');
    const points = values.map((v,i)=>`<circle class="report-chart-point" cx="${x(i)}" cy="${y(v)}" r="5"></circle><text class="report-chart-value" x="${x(i)}" y="${y(v)-12}" text-anchor="middle">${v}${suffix}</text><text class="report-chart-label" x="${x(i)}" y="${height-15}" text-anchor="middle">${labels[i]}</text>`).join('');
    const thresholds = isPercent ? `<line class="report-chart-threshold-critical" x1="${left}" y1="${y(95)}" x2="${width-right}" y2="${y(95)}"></line><line class="report-chart-threshold-high" x1="${left}" y1="${y(80)}" x2="${width-right}" y2="${y(80)}"></line>` : '';
    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-label="Evolución del indicador">${thresholds}${grid}<polyline class="report-chart-line" points="${line}"></polyline>${points}</svg>`;
  };

  const setupCurrentUserProfile = () => {
    const session = $('.session-data');
    const legacyUser = session && $('.user', session);
    if (!session || !legacyUser) return;
    const name = legacyUser.childNodes[0]?.textContent?.trim() || legacyUser.getAttribute('title')?.split('·')[0]?.trim() || 'Usuario';
    const role = $('.role', session)?.textContent.trim() || userDirectory[name]?.role || 'Usuario';
    const initials = profileInitials(name);
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'user-profile-trigger';
    trigger.setAttribute('aria-label', `Abrir mi perfil: ${name}`);
    trigger.setAttribute('title', 'Mi perfil');
    trigger.innerHTML = `<span class="user-name">${name}</span><span class="user-mark" aria-hidden="true">${initials}</span>`;
    legacyUser.replaceWith(trigger);

    let modal = $('#modal-mi-perfil');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-mi-perfil';
      modal.className = 'modal';
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      modal.innerHTML = `<button aria-label="Cerrar ventana" class="modal-background" type="button"></button>
        <div class="modal-box my-profile-modal">
          <div class="modal-header"><div><span class="modal-eyebrow">Mi perfil</span><h2>Información general</h2></div><button aria-label="Cerrar" class="modal-close" title="Cerrar" type="button"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="modal-body">
            <div class="user-profile-hero"><div class="user-avatar" data-my-initials></div><div class="user-profile-heading"><h3 data-my-name></h3><p data-my-role></p><div class="user-profile-status" data-my-status></div></div></div>
            <p class="my-profile-note">Puedes actualizar tu número de contacto desde este perfil.</p>
            <div class="user-profile-grid">
              <div class="profile-data"><i class="fa-solid fa-id-badge"></i><span><small>Código</small><strong data-my-code>—</strong></span></div>
              <div class="profile-data"><i class="fa-regular fa-calendar"></i><span><small>Fecha de ingreso</small><strong data-my-hire>—</strong></span></div>
              <div class="profile-data"><i class="fa-regular fa-envelope"></i><span><small>Correo</small><strong data-my-email>—</strong></span></div>
              <div class="profile-data my-phone-data"><i class="fa-solid fa-phone"></i><span><small>Teléfono</small><strong data-my-phone-view>—</strong><label class="profile-inline-field phone-field my-phone-editor" data-my-phone-editor hidden aria-label="Mi teléfono"><span class="field-prefix">+51</span><input class="profile-contact-input" data-my-phone type="tel" inputmode="numeric" maxlength="11" placeholder="987 654 321" aria-label="Mi teléfono de 9 dígitos"></label></span></div>
            </div>
            <div class="profile-contact-actions my-profile-actions"><button class="danger-button" data-my-profile-cancel type="button" hidden>Cancelar</button><button class="secondary-button" data-my-profile-edit type="button"><i class="fa-regular fa-pen-to-square"></i> Editar datos</button><button class="primary-button" data-my-profile-save type="button" hidden><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button></div>
          </div>
        </div>`;
      body.appendChild(modal);
    }

    const phoneView=$('[data-my-phone-view]',modal), phoneEditor=$('[data-my-phone-editor]',modal), phoneInput=$('[data-my-phone]',modal);
    const editButton=$('[data-my-profile-edit]',modal), cancelButton=$('[data-my-profile-cancel]',modal), saveButton=$('[data-my-profile-save]',modal);
    const setEditMode = editing => {
      if(phoneView) phoneView.hidden=editing;
      if(phoneEditor) phoneEditor.hidden=!editing;
      if(editButton) editButton.hidden=editing;
      if(cancelButton) cancelButton.hidden=!editing;
      if(saveButton) saveButton.hidden=!editing;
      modal.classList.toggle('is-editing-profile',editing);
      if(editing) setTimeout(()=>phoneInput?.focus(),0);
    };
    const render = () => {
      const profile = currentProfileByName(name);
      $('[data-my-initials]',modal).textContent=initials;
      $('[data-my-name]',modal).textContent=name;
      $('[data-my-role]',modal).textContent=role;
      $('[data-my-code]',modal).textContent=profile.code||'—';
      $('[data-my-hire]',modal).textContent=profile.hire||'—';
      $('[data-my-email]',modal).textContent=profile.email||'—';
      if(phoneView) phoneView.textContent=profile.phone||'—';
      if(phoneInput) phoneInput.value=formatPhoneLocal(profile.phone||'');
      $('[data-my-status]',modal).innerHTML=badge(profile.status||'Activo');
      setEditMode(false);
    };
    trigger.addEventListener('click',()=>{render();openModal(modal,trigger);});
    editButton?.addEventListener('click',()=>setEditMode(true));
    cancelButton?.addEventListener('click',()=>{const profile=currentProfileByName(name);if(phoneInput)phoneInput.value=formatPhoneLocal(profile.phone||'');setEditMode(false);});
    saveButton?.addEventListener('click',async()=>{
      const profile=currentProfileByName(name);
      const phoneDigits=digitsOnlyPhone(phoneInput?.value||'');
      if(phoneDigits.length!==9){notify('El teléfono debe tener 9 dígitos.','error');phoneInput?.focus();return;}
      const phoneValue=companyPhoneFromDigits(phoneDigits);
      const confirmed=await askConfirmation({title:'Guardar teléfono',message:`Tu número quedará como ${phoneValue}.`,confirmText:'Sí, guardar'});
      if(!confirmed)return;
      saveStoredProfile(profile.code,{phone:phoneValue});
      if(page==='admin_users.html'){
        const row=Array.from(document.querySelectorAll('.users-panel tbody tr')).find(r=>normalize(r.cells[0]?.textContent)===normalize(profile.code));
        if(row)row.dataset.userPhone=phoneValue;
      }
      if(phoneView)phoneView.textContent=phoneValue;
      if(phoneInput)phoneInput.value=formatPhoneLocal(phoneDigits);
      setEditMode(false);
      notify('Teléfono actualizado correctamente.');
    });
  };
  setupCurrentUserProfile();


  if(page==='admin_users.html'){
    $$('.users-panel tbody tr').forEach(row=>{
      const code=row.cells[0]?.textContent.trim()||'';
      const stored=readStoredProfile(code);
      const email=String(stored.email||'').trim().toLowerCase();
      const phoneDigits=digitsOnlyPhone(stored.phone||'');
      if(email.endsWith(COMPANY_EMAIL_DOMAIN)&&sanitizeEmailAlias(emailAliasFrom(email)).length>=3&&row.cells[2])row.cells[2].textContent=email;
      if(phoneDigits.length===9)row.dataset.userPhone=companyPhoneFromDigits(phoneDigits);
    });
  }


  const enhanceResponsiveTable = table => {
    if(!table || table.classList.contains('responsive-table')) return;
    const headers=$$('thead th',table).map(th=>th.textContent.replace(/\s+/g,' ').trim());
    if(!headers.length) return;
    table.classList.add('responsive-table');
    table.closest('.table-container')?.classList.add('responsive-card-container');
    $$('tbody tr',table).forEach(row=>{
      Array.from(row.cells).forEach((cell,index)=>{
        if(cell.colSpan>1){cell.classList.add('responsive-card-full');return;}
        cell.dataset.label=headers[index]||'';
      });
    });
  };
  const enhanceResponsiveTables = scope => $$('.table-container table',scope||document).forEach(enhanceResponsiveTable);
  enhanceResponsiveTables();
  const tableObserver = new MutationObserver(mutations=>{
    mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>{
      if(!(node instanceof Element)) return;
      if(node.matches?.('.table-container table')) enhanceResponsiveTable(node);
      node.querySelectorAll?.('.table-container table').forEach(enhanceResponsiveTable);
      const parentTable=node.closest?.('table.responsive-table');
      if(parentTable){parentTable.classList.remove('responsive-table');enhanceResponsiveTable(parentTable);}
    }));
  });
  tableObserver.observe(document.body,{childList:true,subtree:true});

  window.OceanLinkUI = { $, $$, normalize, notify, askConfirmation, openModal, closeModal, validateForm, formValue, setSelectOptions, badge, setDetailText, setDetailStatus, replaceTableBody, enhanceResponsiveTables, renderHistoryChart };
});
