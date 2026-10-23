package pe.edu.pucp.oceanlink;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.Set;

@WebServlet("/SegmentoServlet")
public class SegmentoServlet extends HttpServlet {
    private final SegmentoDAO segmentoDao = new SegmentoDAO();
    private static final Set<String> CONDICIONES = Set.of("OPERATIVO", "DEGRADADO", "EN_MANTENIMIENTO", "FUERA_SERVICIO");

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action") == null ? "lista" : request.getParameter("action");
        try {
            switch (action) {
                case "lista":
                    request.setAttribute("lista", segmentoDao.listar());
                    request.getRequestDispatcher("/WEB-INF/views/listaSegmentos.jsp").forward(request, response);
                    break;
                case "formCrear":
                    request.setAttribute("estaciones", segmentoDao.estaciones());
                    request.getRequestDispatcher("/WEB-INF/views/nuevoSegmento.jsp").forward(request, response);
                    break;
                case "editar":
                    long id = Long.parseLong(request.getParameter("id"));
                    Segmento segmento = segmentoDao.buscar(id);
                    if (segmento == null) {
                        response.sendRedirect(request.getContextPath() + "/SegmentoServlet");
                        return;
                    }
                    request.setAttribute("segmento", segmento);
                    request.setAttribute("estaciones", segmentoDao.estaciones());
                    request.getRequestDispatcher("/WEB-INF/views/editarSegmento.jsp").forward(request, response);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/SegmentoServlet");
            }
        } catch (SQLException | NumberFormatException e) {
            throw new ServletException("No se pudo consultar la información de segmentos", e);
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
                    segmentoDao.guardar(leerFormulario(request));
                    break;
                case "actualizar":
                    Segmento segmento = leerFormulario(request);
                    segmento.setId(Long.parseLong(request.getParameter("id")));
                    if (segmento.getId() <= 0) throw new IllegalArgumentException("Identificador inválido.");
                    segmentoDao.actualizar(segmento);
                    break;
                case "borrar":
                    long id = Long.parseLong(request.getParameter("id"));
                    if (id <= 0) throw new IllegalArgumentException("Identificador inválido.");
                    segmentoDao.eliminar(id);
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST);
                    return;
            }
            response.sendRedirect(request.getContextPath() + "/SegmentoServlet?ok=1");
        } catch (SQLException | IllegalArgumentException e) {
            String mensaje = e instanceof SQLException
                    ? "No se pudo completar la operación. Revisa el código duplicado, las estaciones o si el segmento tiene registros relacionados."
                    : e.getMessage() == null ? "Revisa los datos ingresados." : e.getMessage();
            request.setAttribute("error", mensaje);
            try {
                if ("crear".equals(action)) {
                    request.setAttribute("estaciones", segmentoDao.estaciones());
                    request.getRequestDispatcher("/WEB-INF/views/nuevoSegmento.jsp").forward(request, response);
                } else if ("actualizar".equals(action)) {
                    Segmento segmento = segmentoDao.buscar(Long.parseLong(request.getParameter("id")));
                    if (segmento == null) {
                        response.sendRedirect(request.getContextPath() + "/SegmentoServlet");
                        return;
                    }
                    request.setAttribute("segmento", segmento);
                    request.setAttribute("estaciones", segmentoDao.estaciones());
                    request.getRequestDispatcher("/WEB-INF/views/editarSegmento.jsp").forward(request, response);
                } else {
                    response.sendRedirect(request.getContextPath() + "/SegmentoServlet?error=1");
                }
            } catch (SQLException ex) {
                throw new ServletException(ex);
            }
        }
    }

    private Segmento leerFormulario(HttpServletRequest request) {
        Segmento s = new Segmento();
        s.setCodigo(texto(request, "codigo"));
        s.setEstacionOrigenId(Long.parseLong(request.getParameter("origen")));
        s.setEstacionDestinoId(Long.parseLong(request.getParameter("destino")));
        s.setCapacidad(new BigDecimal(texto(request, "capacidad")));
        s.setEstado(Integer.parseInt(request.getParameter("estado")));
        s.setCondicion(texto(request, "condicion"));
        if (s.getCodigo().isBlank() || s.getCodigo().length() > 16
                || s.getEstacionOrigenId() <= 0 || s.getEstacionDestinoId() <= 0
                || s.getEstacionOrigenId() == s.getEstacionDestinoId()
                || s.getCapacidad().signum() <= 0 || s.getCapacidad().scale() > 4
                || s.getCapacidad().precision() - s.getCapacidad().scale() > 10
                || (s.getEstado() != 0 && s.getEstado() != 1)
                || !CONDICIONES.contains(s.getCondicion())) {
            throw new IllegalArgumentException("Revisa el código, estaciones, estado y capacidad (debe ser mayor que cero y tener hasta 4 decimales).");
        }
        return s;
    }

    private String texto(HttpServletRequest request, String nombre) {
        String valor = request.getParameter(nombre);
        return valor == null ? "" : valor.trim();
    }
}
