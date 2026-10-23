<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>OceanLink - Incidencias</title>
<link href="${pageContext.request.contextPath}/css/fonts.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/base.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/theme.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/final.css" rel="stylesheet">
<link href="${pageContext.request.contextPath}/css/vendor/fontawesome.css" rel="stylesheet">
</head><body class="app-page">
<div class="layout"><aside aria-label="Navegación principal" class="sidebar" id="sidebar">
<div class="brand"><span class="brand-identity"><img class="brand-logo brand-logo-light" src="${pageContext.request.contextPath}/assets/oceanlink-logo-sidebar.svg" alt="OceanLink"></span>
<button aria-label="Contraer menú lateral" class="sidebar-collapse-toggle" type="button"><i class="fa-solid fa-angles-left" aria-hidden="true"></i></button></div>
<div class="menu-title">MENÚ PRINCIPAL</div><nav>
<a href="${pageContext.request.contextPath}/IncidenciaServlet" title="Incidencias" class="${soloCerradas ? '' : 'active'}"><span class="nav-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><span class="nav-label">Incidencias</span></a>
<a href="${pageContext.request.contextPath}/IncidenciaServlet?soloCerradas=1" title="Historial" class="${soloCerradas ? 'active' : ''}"><span class="nav-icon"><i class="fa-solid fa-clock-rotate-left"></i></span><span class="nav-label">Historial</span></a>
</nav><div class="sidebar-footer"><a class="sidebar-logout" href="${pageContext.request.contextPath}/login.html"><i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span></a></div>
</aside><button class="sidebar-overlay" type="button" aria-label="Cerrar menú"></button>
<main class="main-content"><header class="topbar"><div class="topbar-left"><button class="sidebar-mobile-toggle" type="button" aria-label="Abrir menú"><i class="fa-solid fa-bars"></i></button><strong class="system-name">Sistema de Gestión de Red</strong></div>
<div class="session-data"><span class="role">Operador de red</span></div></header><section class="content">
<div class="page-heading"><h1>${soloCerradas ? 'Historial de incidencias' : 'Gestión de incidencias'}</h1><p>Registre y consulte las incidencias de la red submarina OceanLink.</p></div>
<c:if test="${param.ok == '1'}"><p role="status">Operación realizada correctamente.</p></c:if>
<c:if test="${param.errorBorrar == '1'}"><p role="alert">No se pudo eliminar la incidencia. Las incidencias cerradas deben conservarse en el historial.</p></c:if>
<article class="panel"><div class="panel-heading"><div><h2>${soloCerradas ? 'Incidencias cerradas' : 'Incidencias registradas'}</h2><p>Datos almacenados en MySQL y vinculados con sus segmentos afectados.</p></div>
<c:if test="${not soloCerradas}"><a class="primary-button" href="${pageContext.request.contextPath}/IncidenciaServlet?action=formCrear"><i class="fa-solid fa-plus"></i> Registrar incidencia</a></c:if></div>
<div class="filter-panel"><div class="filter-grid" role="search">
<div class="filter-field"><label for="filtroCodigo">Filtrar por código</label><input id="filtroCodigo" type="search" placeholder="Ej. INC-001"></div>
<div class="filter-field"><label for="filtroDescripcion">Buscar descripción o segmento</label><input id="filtroDescripcion" type="search" placeholder="Buscar incidencia"></div>
<div class="filter-field"><label for="filtroFase">Filtrar por fase</label><select id="filtroFase">
<option value="">Todas</option><option value="DETECTADA">Detectada</option><option value="EN_ANALISIS">En análisis</option><option value="REPARACION_PROGRAMADA">Reparación programada</option><option value="EN_REPARACION">En reparación</option><option value="RESTAURADA">Restaurada</option><option value="CERRADA">Cerrada</option></select></div>
<div class="filter-actions"><button class="primary-button filter-submit" type="button"><i class="fa-solid fa-filter"></i> Filtrar</button></div></div></div>
<div class="table-container"><table><thead><tr><th>Código</th><th>Severidad</th><th>Fase</th><th>Detección</th><th>Segmentos afectados</th><th>Descripción</th><th>Responsable</th><th class="action-cell">Acciones</th></tr></thead><tbody>
<c:forEach var="i" items="${lista}"><tr data-fase="${i.fase}">
<td><c:out value="${i.codigo}"/></td><td><span class="status ${i.severidad == 'CRITICA' || i.severidad == 'ALTA' ? 'danger' : 'info'}"><c:out value="${i.severidad}"/></span></td>
<td><c:out value="${i.fase}"/></td><td><c:out value="${i.fechaDeteccionTexto}"/></td>
<td><c:out value="${i.segmentosTexto}"/></td><td><c:out value="${i.descripcion}"/></td><td><c:out value="${i.nombreCreador}"/></td>
<td class="action-cell"><a class="icon-action" title="Ver y editar incidencia" aria-label="Editar incidencia" href="${pageContext.request.contextPath}/IncidenciaServlet?action=editar&amp;id=${i.id}"><i class="fa-solid fa-pen"></i></a>
<c:if test="${i.fase != 'CERRADA'}"><form method="post" action="${pageContext.request.contextPath}/IncidenciaServlet?action=borrar" style="display:inline" onsubmit="return confirm('¿Eliminar esta incidencia y sus observaciones? Esta acción no se puede deshacer.')"><input type="hidden" name="id" value="${i.id}"><button class="icon-action" type="submit" title="Eliminar incidencia" aria-label="Eliminar incidencia"><i class="fa-regular fa-trash-can"></i></button></form></c:if>
</td></tr></c:forEach>
<c:if test="${empty lista}"><tr><td colspan="8">No hay incidencias registradas con este criterio.</td></tr></c:if>
</tbody></table></div></article>
<script>
const filtrar=()=>{
 const codigo=document.getElementById('filtroCodigo').value.trim().toLowerCase();
 const texto=document.getElementById('filtroDescripcion').value.trim().toLowerCase();
 const fase=document.getElementById('filtroFase').value;
 document.querySelectorAll('tbody tr[data-fase]').forEach(fila=>{
  const c=fila.cells[0].textContent.toLowerCase();
  const t=(fila.cells[4].textContent+' '+fila.cells[5].textContent).toLowerCase();
  fila.style.display=(c.includes(codigo)&&t.includes(texto)&&(!fase||fila.dataset.fase===fase))?'':'none';
 });
};
['filtroCodigo','filtroDescripcion','filtroFase'].forEach(id=>document.getElementById(id).addEventListener('input',filtrar));
document.querySelector('.filter-submit').addEventListener('click',filtrar);
</script>
</section></main></div>
<script>
const toggle = document.querySelector('.sidebar-collapse-toggle');
if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script></body></html>
