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
   OceanLink - Gestión de usuarios
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
<a aria-label="Usuarios" class="active" href="${pageContext.request.contextPath}/UsuarioServlet" title="Usuarios"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-users"></i></span><span class="nav-label">Usuarios</span></a>
<a aria-label="Estaciones" href="${pageContext.request.contextPath}/EstacionServlet" title="Estaciones"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-tower-broadcast"></i></span><span class="nav-label">Estaciones</span></a>
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
<section class="content users-page">
<div class="page-heading"><h1>Gestión de usuarios</h1><p>Administre usuarios, roles y estados registrados en MySQL.</p></div>
<c:if test="${param.ok == '1'}"><p role="status">Operación realizada correctamente.</p></c:if>
<c:if test="${param.desactivado == '1'}"><p role="status">Este usuario tiene registros relacionados: se desactivó su cuenta en lugar de eliminarlo.</p></c:if>
<c:if test="${param.error == '1'}"><p role="alert">No se pudo eliminar el usuario. Verifique sus relaciones y permisos.</p></c:if>
<article class="panel users-panel">
<div class="panel-heading"><div><h2>Usuarios registrados</h2><p>Consulte el personal y su acceso actual.</p></div>
<a class="primary-button" href="${pageContext.request.contextPath}/UsuarioServlet?action=formCrear"><i class="fa-solid fa-user-plus"></i> Registrar usuario</a></div>
<div class="filter-panel"><div class="filter-grid" role="search">
<div class="filter-field"><label for="filtroCodigo">Filtrar por código</label><input id="filtroCodigo" type="search" placeholder="Ej. USR-001"></div>
<div class="filter-field"><label for="filtroNombre">Filtrar por usuario</label><input id="filtroNombre" type="search" placeholder="Nombre o correo"></div>
<div class="filter-field"><label for="filtroRol">Filtrar por rol</label><select id="filtroRol"><option value="">Todos</option><c:forEach var="r" items="${roles}"><option value="${r.key}"><c:out value="${r.value}"/></option></c:forEach></select></div>
<div class="filter-field"><label for="filtroEstado">Filtrar por estado</label><select id="filtroEstado"><option value="">Todos</option><option>Activo</option><option>Inactivo</option><option>Pendiente de activación</option></select></div>
<div class="filter-actions"><button class="primary-button filter-submit" type="button"><i class="fa-solid fa-filter"></i> Filtrar</button></div>
</div></div>
<div class="table-container"><table><thead><tr>
<th class="cell-center">Código</th><th>Usuario</th><th>Correo</th><th class="cell-center">Rol</th><th class="cell-center">País</th><th class="cell-center">Último acceso</th><th class="cell-center">Estado</th><th class="action-cell">Acciones</th>
</tr></thead><tbody>
<c:forEach var="u" items="${lista}"><tr data-rol="${u.rolId}" data-estado="${u.estadoTexto}">
<td class="cell-center"><c:out value="${u.codigo}"/></td>
<td><c:out value="${u.nombre}"/></td>
<td><c:out value="${u.correo}"/></td>
<td class="cell-center"><c:out value="${u.rol}"/></td>
<td class="cell-center"><c:out value="${u.pais}"/></td>
<td class="cell-center"><c:out value="${u.ultimoAccesoTexto}"/></td>
<td class="cell-center"><span class="status ${u.estado == 1 ? 'ok' : 'info'}"><c:out value="${u.estadoTexto}"/></span></td>
<td class="action-cell">
<a class="icon-action" title="Editar usuario" aria-label="Editar usuario" href="${pageContext.request.contextPath}/UsuarioServlet?action=editar&amp;id=${u.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i></a>
<form method="post" action="${pageContext.request.contextPath}/UsuarioServlet?action=borrar" style="display:inline" onsubmit="return confirm('¿Eliminar este usuario? Si tiene registros asociados, se desactivará en su lugar.')"><input type="hidden" name="id" value="${u.id}"><button class="icon-action" type="submit" title="Eliminar usuario o desactivar si está relacionado" aria-label="Eliminar usuario"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></form>
</td></tr></c:forEach>
</tbody></table></div></article>
</section>
</main>
</div>
<script>
document.querySelector('.sidebar-collapse-toggle').addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script>

<script>
const filtrar = () => {
 const codigo=document.getElementById('filtroCodigo').value.trim().toLowerCase();
 const nombre=document.getElementById('filtroNombre').value.trim().toLowerCase();
 const rol=document.getElementById('filtroRol').value;
 const estado=document.getElementById('filtroEstado').value;
 document.querySelectorAll('tbody tr').forEach(fila=>{
  const okCodigo=fila.cells[0].textContent.toLowerCase().includes(codigo);
  const okNombre=(fila.cells[1].textContent+' '+fila.cells[2].textContent).toLowerCase().includes(nombre);
  fila.style.display=(okCodigo&&okNombre&&(!rol||fila.dataset.rol===rol)&&(!estado||fila.dataset.estado===estado))?'':'none';
 });
};
['filtroCodigo','filtroNombre','filtroRol','filtroEstado'].forEach(id=>{
 document.getElementById(id).addEventListener('input',filtrar);
 document.getElementById(id).addEventListener('change',filtrar);
});
document.querySelector('.filter-submit').addEventListener('click',filtrar);
</script>
</body></html>
