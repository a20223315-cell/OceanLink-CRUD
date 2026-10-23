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
<div class="page-heading"><h1>Registrar cliente empresarial</h1><p>Complete la información del cliente empresarial.</p></div>
<article class="panel"><div class="panel-heading"><div><h2>Datos del cliente</h2><p>Información comercial y de contacto.</p></div></div><div class="modal-body">
<c:if test="${not empty error}"><p role="alert"><c:out value="${error}"/></p></c:if>
<form method="post" action="${pageContext.request.contextPath}/ClienteServlet?action=crear">

<div class="form-row">
<div class="form-field"><label for="codigo">Código de cliente</label><input id="codigo" name="codigo" maxlength="16" required placeholder="CLI-101" value="<c:out value='${cliente.codigo}'/>"></div>
<div class="form-field"><label for="razonSocial">Razón social</label><input id="razonSocial" name="razonSocial" maxlength="180" required placeholder="Ej. Conectividad Pacífico S.A.C." value="<c:out value='${cliente.razonSocial}'/>"></div>
</div>
<div class="form-row">
<div class="form-field"><label for="tipoIdentificacion">Tipo de identificación</label><input id="tipoIdentificacion" name="tipoIdentificacion" maxlength="20" required list="tiposDoc" placeholder="RUC" value="<c:out value='${cliente.tipoIdentificacion}'/>"><datalist id="tiposDoc"><option value="RUC"><option value="NIT"><option value="RFC"><option value="CIF"><option value="OTRO"></datalist></div>
<div class="form-field"><label for="identificacionFiscal">Identificación fiscal</label><input id="identificacionFiscal" name="identificacionFiscal" maxlength="40" required placeholder="Número fiscal" value="<c:out value='${cliente.identificacionFiscal}'/>"></div>
</div>
<div class="form-row">
<div class="form-field"><label for="nombreContacto">Contacto principal</label><input id="nombreContacto" name="nombreContacto" maxlength="160" required placeholder="Nombre y apellido" value="<c:out value='${cliente.nombreContacto}'/>"></div>
<div class="form-field"><label for="correoContacto">Correo de contacto</label><input id="correoContacto" name="correoContacto" type="email" maxlength="254" required placeholder="contacto@empresa.com" value="<c:out value='${cliente.correoContacto}'/>"></div>
</div>
<div class="form-row">
<div class="form-field"><label for="telefonoContacto">Teléfono (opcional)</label><input id="telefonoContacto" name="telefonoContacto" maxlength="30" placeholder="Número de contacto" value="<c:out value='${cliente.telefonoContacto}'/>"></div>
<div class="form-field"><label for="estado">Estado</label><select id="estado" name="estado" required><option value="1" ${cliente.estado != 0 ? 'selected' : ''}>Activo</option><option value="0" ${cliente.estado == 0 ? 'selected' : ''}>Inactivo</option></select></div>
</div>
<div class="form-actions"><a class="danger-button" href="${pageContext.request.contextPath}/ClienteServlet">Cancelar</a><button type="submit" class="primary-button">Guardar cliente</button></div>
</form></div></article>
</section>
</main>
</div>
<script>
const toggle = document.querySelector('.sidebar-collapse-toggle');
if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
</script>
</body></html>
