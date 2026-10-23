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
   OceanLink - Segmentos submarinos
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
<a aria-label="Estaciones" href="${pageContext.request.contextPath}/EstacionServlet" title="Estaciones"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-tower-broadcast"></i></span><span class="nav-label">Estaciones</span></a>
<a aria-label="Segmentos" class="active" href="${pageContext.request.contextPath}/SegmentoServlet" title="Segmentos"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-diagram-project"></i></span><span class="nav-label">Segmentos</span></a>
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
<div class="page-heading"><h1>Segmentos submarinos</h1>
<p>Registre y consulte los segmentos que conectan las estaciones de aterrizaje de OceanLink.</p></div>
<c:if test="${param.ok == '1'}"><p role="status">Operación realizada correctamente.</p></c:if>
<c:if test="${param.error == '1'}"><p role="alert">No se pudo eliminar el segmento. Es posible que tenga solicitudes, incidencias, servicios o mantenimientos asociados.</p></c:if>
<article class="panel"><div class="panel-heading"><div><h2>Segmentos submarinos</h2><p>Consulte conexiones, capacidades y condición operativa.</p></div>
<a class="primary-button" href="${pageContext.request.contextPath}/SegmentoServlet?action=formCrear"><i class="fa-solid fa-plus"></i> Registrar segmento</a></div>
<div class="filter-panel"><div class="filter-grid" role="search">
<div class="filter-field"><label for="filtroCodigo">Filtrar por código</label><input id="filtroCodigo" placeholder="Ej. SEG-101" type="search"></div>
<div class="filter-field"><label for="filtroCondicion">Filtrar por condición</label><select id="filtroCondicion">
<option value="">Todas</option><option value="OPERATIVO">Operativo</option><option value="DEGRADADO">Degradado</option><option value="EN_MANTENIMIENTO">En mantenimiento</option><option value="FUERA_SERVICIO">Fuera de servicio</option>
</select></div>
<div class="filter-field"><label for="filtroEstado">Filtrar por estado</label><select id="filtroEstado"><option value="">Todos</option><option value="1">Activo</option><option value="0">Inactivo</option></select></div>
<div class="filter-actions"><button class="primary-button filter-submit" type="button"><i class="fa-solid fa-filter"></i> Filtrar</button></div></div></div>
<div class="table-container"><table><thead><tr>
<th class="cell-center">Código</th><th>Estación origen</th><th>Estación destino</th><th class="cell-center">Capacidad (Tbps)</th><th class="cell-center">Condición</th><th class="cell-center">Estado</th><th class="action-cell">Acciones</th>
</tr></thead><tbody>
<c:forEach var="s" items="${lista}"><tr data-condicion="${s.condicion}" data-estado="${s.estado}">
<td class="cell-center"><c:out value="${s.codigo}"/></td>
<td><c:out value="${s.estacionOrigen}"/></td><td><c:out value="${s.estacionDestino}"/></td>
<td class="cell-center"><c:out value="${s.capacidad}"/></td>
<td class="cell-center"><span class="status ${s.condicion == 'OPERATIVO' ? 'ok' : s.condicion == 'FUERA_SERVICIO' ? 'danger' : 'info'}"><c:choose><c:when test="${s.condicion == 'OPERATIVO'}">Operativo</c:when><c:when test="${s.condicion == 'DEGRADADO'}">Degradado</c:when><c:when test="${s.condicion == 'EN_MANTENIMIENTO'}">En mantenimiento</c:when><c:otherwise>Fuera de servicio</c:otherwise></c:choose></span></td>
<td class="cell-center"><span class="status ${s.estado == 1 ? 'ok' : 'info'}"><c:out value="${s.estadoTexto}"/></span></td>
<td class="action-cell">
<a class="icon-action" title="Editar segmento" aria-label="Editar segmento" href="${pageContext.request.contextPath}/SegmentoServlet?action=editar&amp;id=${s.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i></a>
<form method="post" action="${pageContext.request.contextPath}/SegmentoServlet?action=borrar" style="display:inline" onsubmit="return confirm('¿Eliminar este segmento? Si está asociado a otros registros, MySQL impedirá eliminarlo.')"><input type="hidden" name="id" value="${s.id}"><button type="submit" class="icon-action" title="Eliminar segmento" aria-label="Eliminar segmento"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></form>
</td></tr></c:forEach>
</tbody></table></div>
</article>
</section>
</main>
</div>
<script>
const toggle = document.querySelector('.sidebar-collapse-toggle');
if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
const filtrar = () => {
 const codigo = document.getElementById('filtroCodigo').value.trim().toLowerCase();
 const condicion = document.getElementById('filtroCondicion').value;
 const estado = document.getElementById('filtroEstado').value;
 document.querySelectorAll('tbody tr').forEach(fila => {
  const okCodigo = fila.cells[0].textContent.toLowerCase().includes(codigo);
  fila.style.display = (okCodigo && (!condicion || fila.dataset.condicion === condicion) && (!estado || fila.dataset.estado === estado)) ? '' : 'none';
 });
};
['filtroCodigo','filtroCondicion','filtroEstado'].forEach(id => {
 document.getElementById(id).addEventListener('input', filtrar);
 document.getElementById(id).addEventListener('change', filtrar);
});
document.querySelector('.filter-submit').addEventListener('click', filtrar);
</script>
</body></html>
