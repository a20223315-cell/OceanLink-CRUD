<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<script>
(function(){
  try {
    if (window.matchMedia('(min-width: 901px)').matches && localStorage.getItem('oceanlink.final.sidebarCollapsed') === '1') {
      document.documentElement.classList.add('sidebar-collapsed-init');
    }
  } catch (e) {}
})();
</script>
<title>
   OceanLink - Servicios y rutas
  </title>



<link href="${pageContext.request.contextPath}/css/fonts.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/base.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/theme.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/final.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/vendor/fontawesome.css" rel="stylesheet">
</head>
<body class="app-page"><noscript><p class="report-note">JavaScript está deshabilitado. Actívalo para usar formularios, filtros y reportes.</p></noscript>
<div class="layout">
<aside aria-label="Navegación principal" class="sidebar" id="sidebar">
<div class="brand">
<span class="brand-identity"><img class="brand-logo brand-logo-light" src="${pageContext.request.contextPath}/assets/oceanlink-logo-sidebar.svg" alt="OceanLink"></span>
<button aria-controls="sidebar" aria-expanded="true" aria-label="Contraer menú lateral" class="sidebar-collapse-toggle" title="Contraer menú lateral" type="button"><i aria-hidden="true" class="fa-solid fa-angles-left"></i></button>
</div>
<div class="menu-title">
     MENÚ PRINCIPAL
    </div>
<nav>
<a aria-label="Capacidad" href="${pageContext.request.contextPath}/cp_capacity.html" title="Capacidad"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-gauge-high"></i></span><span class="nav-label">Capacidad</span></a>
<a aria-label="Solicitudes" href="${pageContext.request.contextPath}/SolicitudCapacidadServlet?vista=planificador" title="Solicitudes"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-clipboard-list"></i></span><span class="nav-label">Solicitudes</span></a>
<a aria-label="Clientes" href="${pageContext.request.contextPath}/ClienteServlet" title="Clientes"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-building"></i></span><span class="nav-label">Clientes</span></a>
<a aria-label="Servicios" class="active" href="${pageContext.request.contextPath}/ServicioServlet" title="Servicios"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-network-wired"></i></span><span class="nav-label">Servicios</span></a>
</nav>
<div class="sidebar-footer"><a aria-label="Cerrar sesión" class="sidebar-logout" href="${pageContext.request.contextPath}/login.html" title="Cerrar sesión"><i aria-hidden="true" class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span></a></div></aside><button aria-label="Cerrar menú lateral" class="sidebar-overlay" tabindex="-1" type="button"></button>
<main class="main-content">
<header class="topbar"><div class="topbar-left"><button aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menú lateral" class="sidebar-mobile-toggle" title="Abrir menú lateral" type="button"><i aria-hidden="true" class="fa-solid fa-bars"></i></button><strong class="system-name">
      Sistema de Gestión de Red
     </strong></div>
<div class="session-data">
<span class="role">
       Planificador de capacidad
      </span>

</div>
</header>
<section class="content">
<div class="page-heading"><h1>Editar servicio y ruta</h1><p>Gestione la información del servicio y su ruta submarina.</p></div>
<article class="panel"><div class="panel-heading"><div><h2>Datos del servicio</h2><p>Información comercial y relación con la solicitud de capacidad.</p></div></div><div class="modal-body">
<c:if test="${not empty error}"><p role="alert" style="color:#a72d32"><c:out value="${error}"/></p></c:if>
<form method="post" action="${pageContext.request.contextPath}/ServicioServlet?action=actualizar">
<input type="hidden" name="id" value="${servicio.id}"/>
<div class="form-row">
<div class="form-field"><label for="codigo">Código de servicio</label><input id="codigo" name="codigo" maxlength="16" required placeholder="SRV-950" value="<c:out value='${servicio.codigo}'/>"/></div>
<div class="form-field"><label for="solicitudId">Solicitud de capacidad</label><select id="solicitudId" name="solicitudId" required><option value="">Seleccionar solicitud</option>
<c:forEach var="sc" items="${solicitudes}"><option value="${sc.id}" ${servicio.solicitudId == sc.id ? 'selected' : ''}><c:out value="${sc.codigo}"/> · <c:out value="${sc.cliente}"/> · <c:out value="${sc.origen}"/> - <c:out value="${sc.destino}"/> · <c:out value="${sc.capacidad}"/> Tbps</option></c:forEach>
</select></div>
</div>
<div class="form-row">
<div class="form-field"><label for="capacidad">Capacidad contratada (Tbps)</label><input id="capacidad" name="capacidad" type="number" step="0.0001" min="0.0001" max="9999999999.9999" required placeholder="0.5000" value="<c:out value='${servicio.capacidad}'/>"/></div>
<div class="form-field"><label for="estado">Estado del servicio</label><select id="estado" name="estado" required>
<option value="PENDIENTE" ${servicio.estado == 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
<option value="ACTIVO" ${servicio.estado == 'ACTIVO' ? 'selected' : ''}>Activo</option>
<option value="CANCELADO" ${servicio.estado == 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
</select></div>
</div>
<div class="panel-heading"><div><h2>Ruta del servicio</h2><p>Seleccione segmentos consecutivos del origen al destino de la solicitud. El orden de los pasos determina el orden de la ruta.</p></div></div>
<div class="form-row">
<div class="form-field"><label for="segmento1">Paso 1 · segmento</label>
<select id="segmento1" name="segmentoId"><option value="">Sin asignar</option>
<c:forEach var="sg" items="${segmentos}"><option value="${sg.id}" ${servicio.segmentos[0] == sg.id ? 'selected' : ''}><c:out value="${sg.codigo}"/> · <c:out value="${sg.estacionOrigen}"/> ↔ <c:out value="${sg.estacionDestino}"/> · <c:out value="${sg.capacidad}"/> Tbps · <c:out value="${sg.condicion}"/></option></c:forEach>
</select></div>
<div class="form-field"><label for="segmento2">Paso 2 · segmento</label>
<select id="segmento2" name="segmentoId"><option value="">No utilizar este paso</option>
<c:forEach var="sg" items="${segmentos}"><option value="${sg.id}" ${servicio.segmentos[1] == sg.id ? 'selected' : ''}><c:out value="${sg.codigo}"/> · <c:out value="${sg.estacionOrigen}"/> ↔ <c:out value="${sg.estacionDestino}"/> · <c:out value="${sg.capacidad}"/> Tbps · <c:out value="${sg.condicion}"/></option></c:forEach>
</select></div>
</div>
<div class="form-row">
<div class="form-field"><label for="segmento3">Paso 3 · segmento</label>
<select id="segmento3" name="segmentoId"><option value="">No utilizar este paso</option>
<c:forEach var="sg" items="${segmentos}"><option value="${sg.id}" ${servicio.segmentos[2] == sg.id ? 'selected' : ''}><c:out value="${sg.codigo}"/> · <c:out value="${sg.estacionOrigen}"/> ↔ <c:out value="${sg.estacionDestino}"/> · <c:out value="${sg.capacidad}"/> Tbps · <c:out value="${sg.condicion}"/></option></c:forEach>
</select></div>
<div class="form-field"><label for="segmento4">Paso 4 · segmento</label>
<select id="segmento4" name="segmentoId"><option value="">No utilizar este paso</option>
<c:forEach var="sg" items="${segmentos}"><option value="${sg.id}" ${servicio.segmentos[3] == sg.id ? 'selected' : ''}><c:out value="${sg.codigo}"/> · <c:out value="${sg.estacionOrigen}"/> ↔ <c:out value="${sg.estacionDestino}"/> · <c:out value="${sg.capacidad}"/> Tbps · <c:out value="${sg.condicion}"/></option></c:forEach>
</select></div>
</div>
<div class="form-row">
<div class="form-field"><label for="segmento5">Paso 5 · segmento</label>
<select id="segmento5" name="segmentoId"><option value="">No utilizar este paso</option>
<c:forEach var="sg" items="${segmentos}"><option value="${sg.id}" ${servicio.segmentos[4] == sg.id ? 'selected' : ''}><c:out value="${sg.codigo}"/> · <c:out value="${sg.estacionOrigen}"/> ↔ <c:out value="${sg.estacionDestino}"/> · <c:out value="${sg.capacidad}"/> Tbps · <c:out value="${sg.condicion}"/></option></c:forEach>
</select></div>
<div class="form-field"><label for="segmento6">Paso 6 · segmento</label>
<select id="segmento6" name="segmentoId"><option value="">No utilizar este paso</option>
<c:forEach var="sg" items="${segmentos}"><option value="${sg.id}" ${servicio.segmentos[5] == sg.id ? 'selected' : ''}><c:out value="${sg.codigo}"/> · <c:out value="${sg.estacionOrigen}"/> ↔ <c:out value="${sg.estacionDestino}"/> · <c:out value="${sg.capacidad}"/> Tbps · <c:out value="${sg.condicion}"/></option></c:forEach>
</select></div>
</div>
<div class="form-actions"><a class="danger-button" href="${pageContext.request.contextPath}/ServicioServlet">Cancelar</a><button type="submit" class="primary-button">Guardar cambios</button></div>
</form></div></article>
</section>
</main>
</div>
<script>
const toggle = document.querySelector('.sidebar-collapse-toggle');
if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script>
</body></html>
