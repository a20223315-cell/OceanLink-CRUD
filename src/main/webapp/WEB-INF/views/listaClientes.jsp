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
   OceanLink - Clientes empresariales
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
<a aria-label="Clientes" class="active" href="${pageContext.request.contextPath}/ClienteServlet" title="Clientes"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-building"></i></span><span class="nav-label">Clientes</span></a>
<a aria-label="Servicios" href="${pageContext.request.contextPath}/ServicioServlet" title="Servicios"><span aria-hidden="true" class="nav-icon"><i class="fa-solid fa-network-wired"></i></span><span class="nav-label">Servicios</span></a>
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
<div class="page-heading"><h1>Clientes empresariales</h1><p>Consulte y gestione los clientes registrados en la red OceanLink.</p></div>
<c:if test="${param.ok == '1'}"><p role="status">Operación realizada correctamente.</p></c:if>
<c:if test="${param.desactivado == '1'}"><p role="status">El cliente tiene solicitudes relacionadas; se desactivó en lugar de eliminarlo.</p></c:if>
<c:if test="${param.error == '1'}"><p role="alert">No se pudo eliminar el cliente. Comprueba sus relaciones con otros registros.</p></c:if>
<article class="panel"><div class="panel-heading"><div><h2>Clientes empresariales</h2><p>Datos de contacto, estado y servicios asociados almacenados en MySQL.</p></div>
<a class="primary-button" href="${pageContext.request.contextPath}/ClienteServlet?action=formCrear"><i class="fa-solid fa-plus"></i> Registrar cliente</a></div>
<div class="filter-panel"><div class="filter-grid" role="search">
<div class="filter-field"><label for="filtroCodigo">Filtrar por código</label><input id="filtroCodigo" placeholder="Ej. CLI-001" type="search"></div>
<div class="filter-field"><label for="filtroNombre">Filtrar por razón social o contacto</label><input id="filtroNombre" placeholder="Buscar cliente" type="search"></div>
<div class="filter-field"><label for="filtroEstado">Filtrar por estado</label><select id="filtroEstado"><option value="">Todos</option><option value="1">Activo</option><option value="0">Inactivo</option></select></div>
<div class="filter-actions"><button class="primary-button filter-submit" type="button"><i class="fa-solid fa-filter"></i> Filtrar</button></div>
</div></div>
<div class="table-container"><table><thead><tr>
<th class="cell-center">Código</th><th>Razón social</th><th>Identificación fiscal</th><th>Contacto</th><th>Correo</th><th class="cell-center">Servicios</th><th class="cell-center">Estado</th><th class="action-cell">Acciones</th>
</tr></thead><tbody>
<c:forEach var="c" items="${lista}"><tr data-estado="${c.estado}">
<td class="cell-center"><c:out value="${c.codigo}"/></td>
<td><c:out value="${c.razonSocial}"/></td>
<td><c:out value="${c.tipoIdentificacion}"/>: <c:out value="${c.identificacionFiscal}"/></td>
<td><c:out value="${c.nombreContacto}"/></td>
<td><c:out value="${c.correoContacto}"/></td>
<td class="cell-center"><c:out value="${c.servicios}"/></td>
<td class="cell-center"><span class="status ${c.estado == 1 ? 'ok' : 'info'}"><c:out value="${c.estadoTexto}"/></span></td>
<td class="action-cell">
<a class="icon-action" title="Editar cliente" aria-label="Editar cliente" href="${pageContext.request.contextPath}/ClienteServlet?action=editar&amp;id=${c.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i></a>
<form method="post" action="${pageContext.request.contextPath}/ClienteServlet?action=borrar" style="display:inline" onsubmit="return confirm('¿Eliminar este cliente? Si tiene solicitudes asociadas se desactivará en su lugar.')"><input type="hidden" name="id" value="${c.id}"><button class="icon-action" type="submit" title="Eliminar cliente" aria-label="Eliminar cliente"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></form>
</td></tr></c:forEach>
</tbody></table></div></article>
</section>
</main>
</div>
<script>
const toggle = document.querySelector('.sidebar-collapse-toggle');
if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script>
<script>
const filtrar = () => {
 const codigo=document.getElementById('filtroCodigo').value.trim().toLowerCase();
 const nombre=document.getElementById('filtroNombre').value.trim().toLowerCase();
 const estado=document.getElementById('filtroEstado').value;
 document.querySelectorAll('tbody tr').forEach(fila=>{
  const okCodigo=fila.cells[0].textContent.toLowerCase().includes(codigo);
  const okNombre=(fila.cells[1].textContent+' '+fila.cells[3].textContent+' '+fila.cells[4].textContent).toLowerCase().includes(nombre);
  fila.style.display=(okCodigo&&okNombre&&(!estado||fila.dataset.estado===estado))?'':'none';
 });
};
['filtroCodigo','filtroNombre','filtroEstado'].forEach(id=>{
 document.getElementById(id).addEventListener('input',filtrar);
 document.getElementById(id).addEventListener('change',filtrar);
});
document.querySelector('.filter-submit').addEventListener('click',filtrar);
</script>
</body></html>
