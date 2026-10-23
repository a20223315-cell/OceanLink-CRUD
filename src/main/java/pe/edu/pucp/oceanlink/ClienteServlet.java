package pe.edu.pucp.oceanlink;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.util.regex.Pattern;

@WebServlet("/ClienteServlet")
public class ClienteServlet extends HttpServlet {
    private final ClienteDAO clienteDao = new ClienteDAO();
    private static final Pattern CORREO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action") == null ? "lista" : request.getParameter("action");
        try {
            switch (action) {
                case "lista":
                    request.setAttribute("lista", clienteDao.listar());
                    request.getRequestDispatcher("/WEB-INF/views/listaClientes.jsp").forward(request, response);
                    break;
                case "formCrear":
                    request.getRequestDispatcher("/WEB-INF/views/nuevoCliente.jsp").forward(request, response);
                    break;
                case "editar":
                    long id = Long.parseLong(request.getParameter("id"));
                    Cliente cliente = clienteDao.buscar(id);
                    if (cliente == null) {
                        response.sendRedirect(request.getContextPath() + "/ClienteServlet");
                        return;
                    }
                    request.setAttribute("cliente", cliente);
                    request.getRequestDispatcher("/WEB-INF/views/editarCliente.jsp").forward(request, response);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/ClienteServlet");
            }
        } catch (SQLException | NumberFormatException e) {
            throw new ServletException("No se pudo consultar la información de clientes empresariales", e);
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
            String resultado = "ok=1";
            switch (action) {
                case "crear":
                    clienteDao.guardar(leerFormulario(request));
                    break;
                case "actualizar":
                    Cliente cliente = leerFormulario(request);
                    cliente.setId(Long.parseLong(request.getParameter("id")));
                    if (cliente.getId() <= 0 || !clienteDao.actualizar(cliente))
                        throw new IllegalArgumentException("El cliente solicitado no existe.");
                    break;
                case "borrar":
                    long id = Long.parseLong(request.getParameter("id"));
                    if (id <= 0) throw new IllegalArgumentException("Identificador inválido.");
                    try {
                        clienteDao.eliminar(id);
                    } catch (SQLException ex) {
                        // Mantener el historial de solicitudes/servicios existente.
                        if (!"23000".equals(ex.getSQLState()) || !clienteDao.desactivar(id)) throw ex;
                        resultado = "desactivado=1";
                    }
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST);
                    return;
            }
            response.sendRedirect(request.getContextPath() + "/ClienteServlet?" + resultado);
        } catch (SQLException | IllegalArgumentException e) {
            String mensaje = e instanceof SQLException
                    ? "No se pudo completar la operación. Comprueba que el código o la identificación fiscal no estén repetidos."
                    : e.getMessage() == null ? "Revisa los datos ingresados." : e.getMessage();
            if ("borrar".equals(action)) {
                response.sendRedirect(request.getContextPath() + "/ClienteServlet?error=1");
                return;
            }
            request.setAttribute("error", mensaje);
            request.setAttribute("cliente", valoresFormulario(request));
            if ("crear".equals(action)) {
                request.getRequestDispatcher("/WEB-INF/views/nuevoCliente.jsp").forward(request, response);
            } else if ("actualizar".equals(action)) {
                request.getRequestDispatcher("/WEB-INF/views/editarCliente.jsp").forward(request, response);
            } else {
                response.sendRedirect(request.getContextPath() + "/ClienteServlet");
            }
        }
    }

    private Cliente leerFormulario(HttpServletRequest request) {
        Cliente c = valoresFormulario(request);
        if (c.getCodigo().isBlank() || c.getCodigo().length() > 16
                || c.getRazonSocial().isBlank() || c.getRazonSocial().length() > 180
                || c.getTipoIdentificacion().isBlank() || c.getTipoIdentificacion().length() > 20
                || c.getIdentificacionFiscal().isBlank() || c.getIdentificacionFiscal().length() > 40
                || c.getNombreContacto().isBlank() || c.getNombreContacto().length() > 160
                || c.getCorreoContacto().isBlank() || c.getCorreoContacto().length() > 254
                || !CORREO.matcher(c.getCorreoContacto()).matches()
                || c.getTelefonoContacto().length() > 30
                || (c.getEstado() != 0 && c.getEstado() != 1)) {
            throw new IllegalArgumentException("Verifica código, razón social, identificación, contacto, correo y estado.");
        }
        return c;
    }

    // Conserva los datos escritos cuando el formulario tiene un error.
    private Cliente valoresFormulario(HttpServletRequest request) {
        Cliente c = new Cliente();
        c.setCodigo(texto(request,"codigo"));
        c.setRazonSocial(texto(request,"razonSocial"));
        c.setTipoIdentificacion(texto(request,"tipoIdentificacion"));
        c.setIdentificacionFiscal(texto(request,"identificacionFiscal"));
        c.setNombreContacto(texto(request,"nombreContacto"));
        c.setCorreoContacto(texto(request,"correoContacto"));
        c.setTelefonoContacto(texto(request,"telefonoContacto"));
        c.setEstado("0".equals(request.getParameter("estado")) ? 0 :
                "1".equals(request.getParameter("estado")) ? 1 : -1);
        try { c.setId(Long.parseLong(request.getParameter("id"))); }
        catch (NumberFormatException ignored) { }
        return c;
    }

    private String texto(HttpServletRequest request, String campo) {
        String value = request.getParameter(campo);
        return value == null ? "" : value.trim();
    }
}
