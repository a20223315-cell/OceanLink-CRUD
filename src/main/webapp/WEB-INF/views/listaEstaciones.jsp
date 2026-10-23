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
       Estaciones de aterrizaje
      </h1>
<p>
       Registre y consulte las Estaciones de aterrizaje administradas por OceanLink.
      </p>
</div>
<c:if test="${param.ok == '1'}"><p role="status">Operación realizada correctamente.</p></c:if>
<c:if test="${param.error == '1'}"><p role="alert">No se pudo eliminar la estación. Revisa si tiene segmentos asociados.</p></c:if>
<article class="panel">
<div class="panel-heading">
<div>
<h2>
         Estaciones de aterrizaje
        </h2>
<p>
         Consulte las estaciones registradas y su estado actual.
        </p>
</div>
<a class="primary-button" href="${pageContext.request.contextPath}/EstacionServlet?action=formCrear">
<i class="fa-solid fa-plus">
</i>
        Registrar estación
       </a>
</div>
<div class="filter-panel">
<div class="filter-grid" role="search">
<div class="filter-field">
<label for="ol-control-0">Filtrar por código</label>
<input placeholder="Ej. EST-001" type="search" id="filtroCodigo">
</div>
<div class="filter-field">
<label for="ol-control-1">Filtrar por estado</label>
<select id="filtroEstado">
<option selected="">
           Todos
          </option>
<option>
           Operativa
          </option>
<option>
           En mantenimiento
          </option>
<option>
           Fuera de servicio
          </option>
</select>
</div>
<div class="filter-actions">
<button class="primary-button filter-submit" type="button">
<i class="fa-solid fa-filter">
</i>
          Filtrar
         </button>
</div>
</div>
</div>
<div class="table-container">
<table >
<thead>
<tr>
<th class="cell-center">Código</th>
<th>
           Estación
          </th>
<th>
           Ubicación
          </th>
<th class="cell-center">
           Estado
          </th>
<th class="action-cell">
           Acciones
          </th>
</tr>
</thead>
<tbody>
<c:forEach var="e" items="${lista}">
<tr>
<td class="cell-center"><c:out value="${e.codigo}"/></td>
<td><c:out value="${e.nombre}"/></td>
<td><c:out value="${e.ubicacion}"/></td>
<td class="cell-center"><span class="status ${e.condicion == 'OPERATIVA' ? 'ok' : 'info'}"><c:choose><c:when test="${e.condicion == 'OPERATIVA'}">Operativa</c:when><c:when test="${e.condicion == 'EN_MANTENIMIENTO'}">En mantenimiento</c:when><c:otherwise>Fuera de servicio</c:otherwise></c:choose></span></td>
<td class="action-cell">
<a class="icon-action" title="Editar estación" aria-label="Editar estación" href="${pageContext.request.contextPath}/EstacionServlet?action=editar&amp;id=${e.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i></a>
<form method="post" action="${pageContext.request.contextPath}/EstacionServlet?action=borrar" style="display:inline" onsubmit="return confirm('¿Eliminar esta estación?')"><input type="hidden" name="id" value="${e.id}"><button type="submit" class="icon-action" title="Eliminar estación" aria-label="Eliminar estación"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></form>
</td></tr>
</c:forEach>
</tbody>
</table>
</div>
</article>
</section>
</main>
</div>








<script>
const filtrar = () => {
 const codigo = document.getElementById('filtroCodigo').value.trim().toLowerCase();
 const estado = document.getElementById('filtroEstado').value.toLowerCase();
 document.querySelectorAll('tbody tr').forEach(fila => {
  const c = fila.cells[0].textContent.toLowerCase();
  const e = fila.cells[3].textContent.trim().toLowerCase();
  fila.style.display = (!c.includes(codigo) || (estado !== 'todos' && e !== estado)) ? 'none' : '';
 });
};
document.querySelector('.filter-submit').addEventListener('click', filtrar);
document.getElementById('filtroCodigo').addEventListener('input', filtrar);
document.getElementById('filtroEstado').addEventListener('change', filtrar);
document.querySelector('.sidebar-collapse-toggle').addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script>
</body></html>