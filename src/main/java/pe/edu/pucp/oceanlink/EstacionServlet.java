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

@WebServlet("/EstacionServlet")
public class EstacionServlet extends HttpServlet {
    private final EstacionDAO estacionDao = new EstacionDAO();
    private final Set<String> estados = Set.of("OPERATIVA", "EN_MANTENIMIENTO", "FUERA_SERVICIO");

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action") == null ? "lista" : request.getParameter("action");
        try {
            switch (action) {
                case "lista":
                    request.setAttribute("lista", estacionDao.listar());
                    request.getRequestDispatcher("/WEB-INF/views/listaEstaciones.jsp").forward(request, response);
                    break;
                case "formCrear":
                    request.setAttribute("paises", estacionDao.paises());
                    request.getRequestDispatcher("/WEB-INF/views/nuevaEstacion.jsp").forward(request, response);
                    break;
                case "editar":
                    long id = Long.parseLong(request.getParameter("id"));
                    Estacion estacion = estacionDao.buscar(id);
                    if (estacion == null) {
                        response.sendRedirect(request.getContextPath() + "/EstacionServlet");
                        return;
                    }
                    request.setAttribute("estacion", estacion);
                    request.setAttribute("paises", estacionDao.paises());
                    request.getRequestDispatcher("/WEB-INF/views/editarEstacion.jsp").forward(request, response);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/EstacionServlet");
            }
        } catch (SQLException | NumberFormatException e) {
            throw new ServletException("No se pudo consultar la información de estaciones", e);
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
                    estacionDao.guardar(leerFormulario(request));
                    break;
                case "actualizar":
                    Estacion estacion = leerFormulario(request);
                    estacion.setId(Long.parseLong(request.getParameter("id")));
                    estacionDao.actualizar(estacion);
                    break;
                case "borrar":
                    estacionDao.eliminar(Long.parseLong(request.getParameter("id")));
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST);
                    return;
            }
            response.sendRedirect(request.getContextPath() + "/EstacionServlet?ok=1");
        } catch (SQLException | IllegalArgumentException e) {
            String mensaje = e instanceof SQLException
                    ? "No se pudo realizar la operación. Verifica los datos o si la estación está relacionada con algún segmento."
                    : "Revisa los datos ingresados.";
            request.setAttribute("error", mensaje);
            try {
                if ("crear".equals(action)) {
                    request.setAttribute("paises", estacionDao.paises());
                    request.getRequestDispatcher("/WEB-INF/views/nuevaEstacion.jsp").forward(request, response);
                } else if ("actualizar".equals(action)) {
                    Estacion estacion = estacionDao.buscar(Long.parseLong(request.getParameter("id")));
                    if (estacion == null) {
                        response.sendRedirect(request.getContextPath() + "/EstacionServlet");
                        return;
                    }
                    request.setAttribute("estacion", estacion);
                    request.setAttribute("paises", estacionDao.paises());
                    request.getRequestDispatcher("/WEB-INF/views/editarEstacion.jsp").forward(request, response);
                } else {
                    response.sendRedirect(request.getContextPath() + "/EstacionServlet?error=1");
                }
            } catch (SQLException ex) {
                throw new ServletException(ex);
            }
        }
    }

    private Estacion leerFormulario(HttpServletRequest request) {
        Estacion estacion = new Estacion();
        estacion.setNombre(request.getParameter("nombre").trim());
        estacion.setUbicacion(request.getParameter("ubicacion").trim());
        estacion.setPaisId(Long.parseLong(request.getParameter("pais")));
        estacion.setCapacidad(new BigDecimal(request.getParameter("capacidad")));
        estacion.setCondicion(request.getParameter("condicion"));
        if (estacion.getNombre().isBlank()
                || estacion.getUbicacion().isBlank() || estacion.getCapacidad().signum() <= 0
                || !estados.contains(estacion.getCondicion())) {
            throw new IllegalArgumentException("Datos inválidos");
        }
        return estacion;
    }
}
