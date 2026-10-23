<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="rutaVista" value="${param.vista eq 'planificador' ? 'planificador' : 'admin'}" />
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
   OceanLink - Solicitudes de capacidad
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
<c:choose>
<c:when test="${rutaVista eq 'planificador'}">
<a aria-label="Capacidad" href="${pageContext.request.contextPath}/cp_capacity.html" title="Capacidad"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-gauge-high"></i></span><span class="nav-label">Capacidad</span></a>
<a aria-label="Solicitudes" class="active" href="${pageContext.request.contextPath}/SolicitudCapacidadServlet?vista=planificador" title="Solicitudes"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-clipboard-list"></i></span><span class="nav-label">Solicitudes</span></a>
<a aria-label="Clientes" href="${pageContext.request.contextPath}/ClienteServlet" title="Clientes"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-building"></i></span><span class="nav-label">Clientes</span></a>
<a aria-label="Servicios" href="${pageContext.request.contextPath}/ServicioServlet" title="Servicios"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-network-wired"></i></span><span class="nav-label">Servicios</span></a>
</c:when>
<c:otherwise>
<a aria-label="Panel general" href="${pageContext.request.contextPath}/dashboard.html" title="Panel general"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-chart-pie"></i></span><span class="nav-label">Panel general</span></a>
<a aria-label="Usuarios" href="${pageContext.request.contextPath}/UsuarioServlet" title="Usuarios"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-users"></i></span><span class="nav-label">Usuarios</span></a>
<a aria-label="Estaciones" href="${pageContext.request.contextPath}/EstacionServlet" title="Estaciones"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-tower-broadcast"></i></span><span class="nav-label">Estaciones</span></a>
<a aria-label="Segmentos" href="${pageContext.request.contextPath}/SegmentoServlet" title="Segmentos"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-diagram-project"></i></span><span class="nav-label">Segmentos</span></a>
<a aria-label="Solicitudes de capacidad" class="active" href="${pageContext.request.contextPath}/SolicitudCapacidadServlet?vista=admin" title="Solicitudes de capacidad"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-file-circle-plus"></i></span><span class="nav-label">Solicitudes de capacidad</span></a>
</c:otherwise>
</c:choose>
</nav>
<div class="sidebar-footer"><a aria-label="Cerrar sesión" class="sidebar-logout" href="${pageContext.request.contextPath}/login.html" title="Cerrar sesión"><i aria-hidden="true" class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span></a></div></aside><button aria-label="Cerrar menú lateral" class="sidebar-overlay" tabindex="-1" type="button"></button>
<main class="main-content">
<header class="topbar"><div class="topbar-left"><button aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menú lateral" class="sidebar-mobile-toggle" title="Abrir menú lateral" type="button"><i aria-hidden="true" class="fa-solid fa-bars"></i></button><strong class="system-name">
      Sistema de Gestión de Red
     </strong></div>
<div class="session-data">
<span class="role"><c:choose><c:when test="${rutaVista eq 'planificador'}">Planificador de capacidad</c:when><c:otherwise>Administrador</c:otherwise></c:choose></span>

</div>
</header>
<section class="content">
<div class="page-heading"><h1>Editar solicitud</h1>
<p>Complete la información de la solicitud de capacidad.</p></div>
<article class="panel"><div class="panel-heading"><div><h2>Datos de Solicitud de capacidad</h2><p>Complete la información principal de la solicitud.</p></div></div><div class="modal-body">
<c:if test="${not empty error}"><p role="alert"><c:out value="${error}"/></p></c:if>
<form method="post" action="${pageContext.request.contextPath}/SolicitudCapacidadServlet?action=actualizar&amp;vista=${rutaVista}">
<input type="hidden" name="id" value="${solicitud.id}">
<div class="form-row">
<div class="form-field"><label for="codigo">Código de solicitud</label><input id="codigo" name="codigo" maxlength="16" required value="<c:out value='${solicitud.codigo}'/>"></div>
<div class="form-field"><label for="cliente">Cliente</label><select id="cliente" name="cliente" required><c:forEach var="p" items="${clientes}"><option value="${p.key}" ${solicitud.clienteId == p.key ? 'selected' : ''}><c:out value="${p.value}"/></option></c:forEach></select></div></div>
<div class="form-row">
<div class="form-field"><label for="origen">Estación de origen</label><select id="origen" name="origen" required><c:forEach var="p" items="${estaciones}"><option value="${p.key}" ${solicitud.estacionOrigenId == p.key ? 'selected' : ''}><c:out value="${p.value}"/></option></c:forEach></select></div>
<div class="form-field"><label for="destino">Estación de destino</label><select id="destino" name="destino" required><c:forEach var="p" items="${estaciones}"><option value="${p.key}" ${solicitud.estacionDestinoId == p.key ? 'selected' : ''}><c:out value="${p.value}"/></option></c:forEach></select></div></div>
<div class="form-row">
<div class="form-field"><label for="capacidad">Capacidad solicitada (Tbps)</label><input id="capacidad" name="capacidad" type="number" step="0.0001" min="0.0001" max="9999999999.9999" required value="${solicitud.capacidad}"></div>
<div class="form-field"><label for="estado">Estado</label><select id="estado" name="estado" required><c:forEach var="p" items="${estados}"><option value="${p.key}" ${solicitud.estadoId == p.key ? 'selected' : ''}><c:out value="${p.value}"/></option></c:forEach></select></div></div>
<div class="form-row">
<div class="form-field"><label for="creadoPor">Registrada por</label><select id="creadoPor" name="creadoPor" required><c:forEach var="p" items="${usuarios}"><option value="${p.key}" ${solicitud.creadoPor == p.key ? 'selected' : ''}><c:out value="${p.value}"/></option></c:forEach></select></div>
<div class="form-field"><label for="fechaProvision">Fecha de provisión (opcional)</label><input id="fechaProvision" name="fechaProvision" type="datetime-local" value="<c:out value='${solicitud.fechaProvisionInput}'/>"></div></div>
<div class="form-row"><div class="form-field"><label for="observacion">Observación (opcional)</label><textarea id="observacion" name="observacion" maxlength="2000" rows="4"><c:out value="${solicitud.observacion}"/></textarea></div></div>
<div class="form-actions"><a class="danger-button" href="${pageContext.request.contextPath}/SolicitudCapacidadServlet?vista=${rutaVista}">Cancelar</a><button type="submit" class="primary-button">Guardar cambios</button></div>
</form></div></article>
</section>
</main>
</div>








<script>document.querySelector('.sidebar-collapse-toggle').addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));</script>
</body></html>