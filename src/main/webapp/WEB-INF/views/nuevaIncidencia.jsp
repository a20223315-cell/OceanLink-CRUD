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
<div class="page-heading"><h1>Registrar incidencia</h1><p>Registre el evento y los segmentos submarinos afectados.</p></div>
<article class="panel"><div class="panel-heading"><div><h2>Datos de la incidencia</h2><p>Información operativa del evento.</p></div></div><div class="modal-body">
<c:if test="${not empty error}"><p role="alert" style="color:#bb2828"><c:out value="${error}"/></p></c:if>
<form method="post" action="${pageContext.request.contextPath}/IncidenciaServlet?action=crear">

<div class="form-row">
<div class="form-field"><label for="codigo">Código de incidencia</label><input id="codigo" name="codigo" maxlength="16" required placeholder="INC-010" value="<c:out value='${incidencia.codigo}'/>"></div>
<div class="form-field"><label for="severidad">Severidad</label><select id="severidad" name="severidad" required>
<c:forEach var="s" items="${['BAJA','MEDIA','ALTA','CRITICA']}"><option value="${s}" ${incidencia.severidad == s ? 'selected' : ''}>${s}</option></c:forEach></select></div>
</div>
<div class="form-row">
<div class="form-field"><label for="fase">Fase</label><input type="hidden" name="fase" value="DETECTADA"><input id="fase" value="DETECTADA" readonly></div>
<div class="form-field"><label for="fechaDeteccion">Fecha de detección</label><input type="datetime-local" id="fechaDeteccion" name="fechaDeteccion" value="${incidencia.fechaDeteccionInput}" required ></div>
</div>
<div class="form-row"><div class="form-field"><label for="descripcion">Descripción de la incidencia</label><textarea id="descripcion" name="descripcion" rows="3" maxlength="2000" required><c:out value="${incidencia.descripcion}"/></textarea></div>
<div class="form-field"><label for="resultado">Resultado (al cerrar)</label><textarea id="resultado" name="resultado" rows="3" maxlength="2000" placeholder="Solo obligatorio al cerrar la incidencia"><c:out value="${incidencia.resultado}"/></textarea></div></div>
<div class="form-row"><div class="form-field"><label for="operador">Operador responsable</label><select id="operador" name="creadoPor" required>
<option value="">Seleccionar operador</option><c:forEach var="entrada" items="${operadores}"><option value="${entrada.key}" ${incidencia.creadoPor == entrada.key ? 'selected' : ''}><c:out value="${entrada.value}"/></option></c:forEach>
</select></div>
<div class="form-field"><label for="observacion">Nueva observación para la bitácora</label><textarea id="observacion" name="observacion" rows="3" maxlength="2000" placeholder="Detalles, diagnóstico o medidas realizadas"></textarea></div></div>
<h2 style="margin:22px 0 10px">Segmentos afectados</h2><p>Selecciona uno o varios segmentos relacionados con la incidencia.</p>
<div class="form-row" style="flex-wrap:wrap; gap:12px; margin-top:10px">
<c:forEach var="s" items="${segmentos}"><label style="display:inline-flex;align-items:center;gap:8px;border:1px solid #d6e5e8;border-radius:8px;padding:10px 14px;min-width:270px;flex:1;cursor:pointer">
<input type="checkbox" name="segmentos" value="${s.id}" ${seleccionados.contains(s.id) ? 'checked' : ''}>
<span><strong><c:out value="${s.codigo}"/></strong> · <c:out value="${s.estacionOrigen}"/> ↔ <c:out value="${s.estacionDestino}"/></span></label></c:forEach>
</div>

<div class="form-actions"><a class="danger-button" href="${pageContext.request.contextPath}/IncidenciaServlet">Cancelar</a><button class="primary-button" type="submit">Guardar incidencia</button></div>
</form></div></article>
</section></main></div>
<script>
const toggle = document.querySelector('.sidebar-collapse-toggle');
if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script></body></html>
