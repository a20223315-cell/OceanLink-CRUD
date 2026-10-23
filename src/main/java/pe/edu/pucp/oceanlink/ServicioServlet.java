package pe.edu.pucp.oceanlink;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.*;

/** Mismo flujo MVC del resto de CRUD: lista, formCrear, editar, crear, actualizar y borrar. */
@WebServlet("/ServicioServlet")
public class ServicioServlet extends HttpServlet {
    private final ServicioDAO servicioDao = new ServicioDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action") == null ? "lista" : request.getParameter("action");
        try {
            switch (action) {
                case "lista":
                    request.setAttribute("lista", servicioDao.listar());
                    request.getRequestDispatcher("/WEB-INF/views/listaServicios.jsp").forward(request,response);
                    break;
                case "formCrear":
                    request.setAttribute("servicio", new Servicio());
                    cargarOpciones(request,0);
                    request.getRequestDispatcher("/WEB-INF/views/nuevoServicio.jsp").forward(request,response);
                    break;
                case "editar":
                    long id = Long.parseLong(request.getParameter("id"));
                    Servicio servicio = servicioDao.buscar(id);
                    if (servicio == null) { response.sendRedirect(request.getContextPath()+"/ServicioServlet"); return; }
                    request.setAttribute("servicio",servicio);
                    cargarOpciones(request,id);
                    request.getRequestDispatcher("/WEB-INF/views/editarServicio.jsp").forward(request,response);
                    break;
                default:
                    response.sendRedirect(request.getContextPath()+"/ServicioServlet");
            }
        } catch (SQLException | NumberFormatException ex) {
            throw new ServletException("No se pudo consultar la información de servicios y rutas", ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");
        if (action == null) { response.sendError(HttpServletResponse.SC_BAD_REQUEST); return; }
        try {
            switch (action) {
                case "crear": servicioDao.guardar(leerFormulario(request)); break;
                case "actualizar":
                    Servicio s = leerFormulario(request);
                    s.setId(Long.parseLong(request.getParameter("id")));
                    if (s.getId() <= 0 || !servicioDao.actualizar(s))
                        throw new IllegalArgumentException("El servicio solicitado no existe.");
                    break;
                case "borrar":
                    long id = Long.parseLong(request.getParameter("id"));
                    if (id <= 0 || !servicioDao.eliminar(id))
                        throw new IllegalArgumentException("No se encontró el servicio.");
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST); return;
            }
            response.sendRedirect(request.getContextPath()+"/ServicioServlet?ok=1");
        } catch (SQLException | IllegalArgumentException e) {
            if ("borrar".equals(action)) {
                response.sendRedirect(request.getContextPath()+"/ServicioServlet?error=1");
                return;
            }
            String mensaje = e instanceof SQLException
                ? "No se pudo guardar. Verifica que el código sea único y que la solicitud no tenga otro servicio."
                : e.getMessage() == null ? "Revisa los datos del formulario." : e.getMessage();
            request.setAttribute("error",mensaje);
            Servicio s = valoresFormulario(request);
            request.setAttribute("servicio",s);
            try {
                cargarOpciones(request,"actualizar".equals(action) ? s.getId() : 0);
            } catch (SQLException ex) {
                throw new ServletException("No se pudieron cargar las solicitudes y segmentos",ex);
            }
            String vista = "actualizar".equals(action) ? "editarServicio.jsp" : "nuevoServicio.jsp";
            request.getRequestDispatcher("/WEB-INF/views/"+vista).forward(request,response);
        }
    }

    private void cargarOpciones(HttpServletRequest request, long servicioId) throws SQLException {
        request.setAttribute("solicitudes",servicioDao.solicitudesDisponibles(servicioId));
        request.setAttribute("segmentos",servicioDao.segmentosDisponibles());
    }

    private Servicio leerFormulario(HttpServletRequest request) {
        Servicio s = valoresFormulario(request);
        if (s.getCodigo().isEmpty() || s.getCodigo().length() > 16
                || s.getSolicitudId() <= 0 || s.getCapacidad() == null
                || s.getCapacidad().compareTo(BigDecimal.ZERO) <= 0
                || s.getCapacidad().scale() > 4 || s.getCapacidad().precision() - s.getCapacidad().scale() > 10
                || !List.of("PENDIENTE","ACTIVO","CANCELADO").contains(s.getEstado()))
            throw new IllegalArgumentException("Revisa el código, la solicitud, la capacidad (Tbps) y el estado.");
        List<Long> ruta = s.getSegmentos();
        String[] pasos = request.getParameterValues("segmentoId");
        boolean vacioAnterior = false;
        if (pasos != null) {
            for (String paso : pasos) {
                if (paso == null || paso.isBlank()) vacioAnterior = true;
                else if (vacioAnterior) throw new IllegalArgumentException("Completa la ruta en orden, sin dejar pasos vacíos.");
            }
        }
        if (ruta.size() != new HashSet<>(ruta).size())
            throw new IllegalArgumentException("No repitas segmentos en una misma ruta.");
        return s;
    }

    /** Retiene datos del formulario cuando hay una validación fallida. */
    private Servicio valoresFormulario(HttpServletRequest request) {
        Servicio s = new Servicio();
        s.setCodigo(texto(request,"codigo"));
        try { s.setSolicitudId(Long.parseLong(texto(request,"solicitudId"))); }
        catch (NumberFormatException ignored) { }
        try { s.setId(Long.parseLong(texto(request,"id"))); }
        catch (NumberFormatException ignored) { }
        try { s.setCapacidad(new BigDecimal(texto(request,"capacidad"))); }
        catch (NumberFormatException ignored) { s.setCapacidad(null); }
        s.setEstado(texto(request,"estado"));
        List<Long> ruta = new ArrayList<>();
        String[] pasos = request.getParameterValues("segmentoId");
        if (pasos != null) {
            for (String paso : pasos) {
                if (paso == null || paso.isBlank()) continue;
                long id;
                try { id = Long.parseLong(paso); }
                catch (NumberFormatException ex) { throw new IllegalArgumentException("Uno de los segmentos es inválido."); }
                if (id <= 0) throw new IllegalArgumentException("Uno de los segmentos es inválido.");
                ruta.add(id);
            }
        }
        if (ruta.size() > 6) throw new IllegalArgumentException("La ruta admite hasta seis segmentos.");
        s.setSegmentos(ruta);
        return s;
    }

    private String texto(HttpServletRequest request, String campo) {
        String valor = request.getParameter(campo);
        return valor == null ? "" : valor.trim();
    }
}
