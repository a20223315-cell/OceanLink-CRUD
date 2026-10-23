package pe.edu.pucp.oceanlink;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDateTime;

@WebServlet("/SolicitudCapacidadServlet")
public class SolicitudCapacidadServlet extends HttpServlet {
    private final SolicitudCapacidadDAO solicitudDao = new SolicitudCapacidadDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action") == null ? "lista" : request.getParameter("action");
        try {
            switch (action) {
                case "lista":
                    request.setAttribute("lista", solicitudDao.listar());
                    request.setAttribute("estados", solicitudDao.estados());
                    request.getRequestDispatcher("/WEB-INF/views/listaSolicitudes.jsp").forward(request, response);
                    break;
                case "formCrear":
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/nuevaSolicitud.jsp").forward(request, response);
                    break;
                case "editar":
                    long id = Long.parseLong(request.getParameter("id"));
                    SolicitudCapacidad solicitud = solicitudDao.buscar(id);
                    if (solicitud == null) {
                        response.sendRedirect(rutaSolicitudes(request, ""));
                        return;
                    }
                    request.setAttribute("solicitud", solicitud);
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/editarSolicitud.jsp").forward(request, response);
                    break;
                default:
                    response.sendRedirect(rutaSolicitudes(request, ""));
            }
        } catch (SQLException | NumberFormatException e) {
            throw new ServletException("No se pudo consultar la información de solicitudes de capacidad", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");
        if (action == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }
        try {
            switch (action) {
                case "crear":
                    solicitudDao.guardar(leerFormulario(request));
                    break;
                case "actualizar":
                    SolicitudCapacidad solicitud = leerFormulario(request);
                    solicitud.setId(Long.parseLong(request.getParameter("id")));
                    solicitudDao.actualizar(solicitud);
                    break;
                case "borrar":
                    solicitudDao.eliminar(Long.parseLong(request.getParameter("id")));
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST);
                    return;
            }
            response.sendRedirect(rutaSolicitudes(request, "ok=1"));
        } catch (SQLException | IllegalArgumentException e) {
            String mensaje = e instanceof SQLException
                    ? "No se pudo realizar la operación. Revisa el código o si la solicitud está relacionada con segmentos o servicios."
                    : "Revisa los datos ingresados.";
            request.setAttribute("error", mensaje);
            try {
                if ("crear".equals(action)) {
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/nuevaSolicitud.jsp").forward(request, response);
                } else if ("actualizar".equals(action)) {
                    SolicitudCapacidad solicitud = solicitudDao.buscar(Long.parseLong(request.getParameter("id")));
                    if (solicitud == null) {
                        response.sendRedirect(rutaSolicitudes(request, ""));
                        return;
                    }
                    request.setAttribute("solicitud", solicitud);
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/editarSolicitud.jsp").forward(request, response);
                } else {
                    response.sendRedirect(rutaSolicitudes(request, "error=1"));
                }
            } catch (SQLException ex) {
                throw new ServletException(ex);
            }
        }
    }

    // La vista solo determina qué menú se presenta. No representa autenticación ni permisos.
    private String rutaSolicitudes(HttpServletRequest request, String parametros) {
        boolean planificador = "planificador".equals(request.getParameter("vista"));
        String query = parametros == null ? "" : parametros;
        if (planificador) {
            query += (query.isEmpty() ? "" : "&") + "vista=planificador";
        }
        return request.getContextPath() + "/SolicitudCapacidadServlet"
                + (query.isEmpty() ? "" : "?" + query);
    }

    private void cargarCatalogos(HttpServletRequest request) throws SQLException {
        request.setAttribute("clientes", solicitudDao.clientes());
        request.setAttribute("estaciones", solicitudDao.estaciones());
        request.setAttribute("estados", solicitudDao.estados());
        request.setAttribute("usuarios", solicitudDao.usuarios());
    }

    private SolicitudCapacidad leerFormulario(HttpServletRequest request) {
        SolicitudCapacidad solicitud = new SolicitudCapacidad();
        solicitud.setCodigo(request.getParameter("codigo").trim());
        solicitud.setClienteId(Long.parseLong(request.getParameter("cliente")));
        solicitud.setEstacionOrigenId(Long.parseLong(request.getParameter("origen")));
        solicitud.setEstacionDestinoId(Long.parseLong(request.getParameter("destino")));
        solicitud.setEstadoId(Long.parseLong(request.getParameter("estado")));
        solicitud.setCapacidad(new BigDecimal(request.getParameter("capacidad")));
        solicitud.setCreadoPor(Long.parseLong(request.getParameter("creadoPor")));
        solicitud.setObservacion(request.getParameter("observacion").trim());
        String fechaProvision = request.getParameter("fechaProvision");
        if (fechaProvision != null && !fechaProvision.isBlank())
            solicitud.setFechaProvision(LocalDateTime.parse(fechaProvision));
        if (solicitud.getCodigo().isBlank() || solicitud.getCodigo().length() > 16
                || solicitud.getClienteId() <= 0 || solicitud.getEstacionOrigenId() <= 0
                || solicitud.getEstacionDestinoId() <= 0 || solicitud.getEstadoId() <= 0
                || solicitud.getCreadoPor() <= 0
                || solicitud.getEstacionOrigenId() == solicitud.getEstacionDestinoId()
                || solicitud.getCapacidad().signum() <= 0
                || solicitud.getCapacidad().scale() > 4
                || solicitud.getCapacidad().precision() - solicitud.getCapacidad().scale() > 10
                || solicitud.getObservacion().length() > 2000) {
            throw new IllegalArgumentException("Datos inválidos");
        }
        return solicitud;
    }
}
