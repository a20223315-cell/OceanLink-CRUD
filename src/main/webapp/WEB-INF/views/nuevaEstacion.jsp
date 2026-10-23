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
   OceanLink - Estaciones de aterrizaje
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
<a aria-label="Panel general" href="${pageContext.request.contextPath}/dashboard.html" title="Panel general"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-chart-pie"></i></span><span class="nav-label">Panel general</span></a>
<a aria-label="Usuarios" href="${pageContext.request.contextPath}/UsuarioServlet" title="Usuarios"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-users"></i></span><span class="nav-label">Usuarios</span></a>
<a aria-label="Estaciones" class="active" href="${pageContext.request.contextPath}/EstacionServlet" title="Estaciones"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-tower-broadcast"></i></span><span class="nav-label">Estaciones</span></a>
<a aria-label="Segmentos" href="${pageContext.request.contextPath}/SegmentoServlet" title="Segmentos"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-diagram-project"></i></span><span class="nav-label">Segmentos</span></a>
<a aria-label="Solicitudes de capacidad" href="${pageContext.request.contextPath}/SolicitudCapacidadServlet" title="Solicitudes de capacidad"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-file-circle-plus"></i></span><span class="nav-label">Solicitudes de capacidad</span></a>
</nav>
<div class="sidebar-footer"><a aria-label="Cerrar sesión" class="sidebar-logout" href="${pageContext.request.contextPath}/login.html" title="Cerrar sesión"><i aria-hidden="true" class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span></a></div></aside><button aria-label="Cerrar menú lateral" class="sidebar-overlay" tabindex="-1" type="button"></button>
<main class="main-content">
<header class="topbar"><div class="topbar-left"><button aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menú lateral" class="sidebar-mobile-toggle" title="Abrir menú lateral" type="button"><i aria-hidden="true" class="fa-solid fa-bars"></i></button><strong class="system-name">
      Sistema de Gestión de Red
     </strong></div>
<div class="session-data">
<span class="role">
       Administrador
      </span>

</div>
</header>
<section class="content">
<div class="page-heading">
<h1>
       Registrar estación
      </h1>
<p>
       Complete la información de la estación de aterrizaje.
      </p>
</div>
<c:if test="${param.ok == '1'}"><p role="status">Operación realizada correctamente.</p></c:if>
<c:if test="${param.error == '1'}"><p role="alert">No se pudo eliminar la estación. Revisa si tiene segmentos asociados.</p></c:if>
<article class="panel"><div class="panel-heading"><div><h2>Datos de Estación de aterrizaje</h2><p>Complete la información principal de la estación.</p></div></div><div class="modal-body">
<c:if test="${not empty error}"><p role="alert"><c:out value="${error}"/></p></c:if>
<form method="post" action="${pageContext.request.contextPath}/EstacionServlet?action=crear">

<div class="form-row">
<div class="form-field"><label for="codigo">Código</label><input id="codigo" value="Automático según país e ID" readonly aria-label="Código asignado automáticamente al guardar"></div>
<div class="form-field"><label for="nombre">Nombre de estación</label><input id="nombre" name="nombre" maxlength="150" required value="<c:out value='${estacion.nombre}'/>"></div></div>
<div class="form-row"><div class="form-field"><label for="ubicacion">Ubicación</label><input id="ubicacion" name="ubicacion" maxlength="160" required value="<c:out value='${estacion.ubicacion}'/>"></div>
<div class="form-field"><label for="pais">País</label><select id="pais" name="pais" required><c:forEach var="p" items="${paises}"><option value="${p.key}" ${estacion.paisId == p.key ? 'selected' : ''}><c:out value="${p.value}"/></option></c:forEach></select></div></div>
<div class="form-row"><div class="form-field"><label for="capacidad">Capacidad de energía (kW)</label><input id="capacidad" name="capacidad" type="number" step="0.001" min="0.001" required value="${estacion.capacidad}"></div>
<div class="form-field"><label for="condicion">Estado</label><select id="condicion" name="condicion"><option value="OPERATIVA" ${estacion.condicion == 'OPERATIVA' ? 'selected' : ''}>Operativa</option><option value="EN_MANTENIMIENTO" ${estacion.condicion == 'EN_MANTENIMIENTO' ? 'selected' : ''}>En mantenimiento</option><option value="FUERA_SERVICIO" ${estacion.condicion == 'FUERA_SERVICIO' ? 'selected' : ''}>Fuera de servicio</option></select></div></div>
<div class="form-actions"><a class="danger-button" href="${pageContext.request.contextPath}/EstacionServlet">Cancelar</a><button type="submit" class="primary-button">Guardar estación</button></div>
</form></div></article>
</section>
</main>
</div>








<script>document.querySelector('.sidebar-collapse-toggle').addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));</script>
</body></html>