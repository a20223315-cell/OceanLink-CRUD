package pe.edu.pucp.oceanlink;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.regex.Pattern;

@WebServlet("/UsuarioServlet")
public class UsuarioServlet extends HttpServlet {
    private final UsuarioDAO usuarioDao = new UsuarioDAO();
    private static final Pattern CORREO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action") == null ? "lista" : request.getParameter("action");
        try {
            switch (action) {
                case "lista":
                    request.setAttribute("lista", usuarioDao.listar());
                    request.setAttribute("roles", usuarioDao.roles());
                    request.getRequestDispatcher("/WEB-INF/views/listaUsuarios.jsp").forward(request, response);
                    break;
                case "formCrear":
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/nuevoUsuario.jsp").forward(request, response);
                    break;
                case "editar":
                    long id = Long.parseLong(request.getParameter("id"));
                    Usuario usuario = usuarioDao.buscar(id);
                    if (usuario == null) {
                        response.sendRedirect(request.getContextPath() + "/UsuarioServlet");
                        return;
                    }
                    request.setAttribute("usuario", usuario);
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/editarUsuario.jsp").forward(request, response);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/UsuarioServlet");
            }
        } catch (SQLException | NumberFormatException e) {
            throw new ServletException("No se pudo consultar la información de usuarios", e);
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
                    usuarioDao.guardar(leerFormulario(request, true));
                    break;
                case "actualizar":
                    Usuario usuario = leerFormulario(request, false);
                    usuario.setId(Long.parseLong(request.getParameter("id")));
                    usuarioDao.actualizar(usuario);
                    break;
                case "borrar":
                    long id = Long.parseLong(request.getParameter("id"));
                    if (id <= 0) throw new IllegalArgumentException("Identificador inválido");
                    try {
                        usuarioDao.eliminar(id);
                    } catch (SQLIntegrityConstraintViolationException relacionada) {
                        if (usuarioDao.desactivar(id)) resultado = "desactivado=1";
                        else throw relacionada;
                    }
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST);
                    return;
            }
            response.sendRedirect(request.getContextPath() + "/UsuarioServlet?" + resultado);
        } catch (SQLException | IllegalArgumentException e) {
            String mensaje = e instanceof SQLException
                    ? "No se pudo completar la operación. Revisa si el código o correo está repetido o si el usuario tiene registros asociados."
                    : e.getMessage() == null ? "Revisa los datos ingresados." : e.getMessage();
            request.setAttribute("error", mensaje);
            try {
                if ("crear".equals(action)) {
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/nuevoUsuario.jsp").forward(request, response);
                } else if ("actualizar".equals(action)) {
                    Usuario usuario = usuarioDao.buscar(Long.parseLong(request.getParameter("id")));
                    if (usuario == null) {
                        response.sendRedirect(request.getContextPath() + "/UsuarioServlet");
                        return;
                    }
                    request.setAttribute("usuario", usuario);
                    cargarCatalogos(request);
                    request.getRequestDispatcher("/WEB-INF/views/editarUsuario.jsp").forward(request, response);
                } else {
                    response.sendRedirect(request.getContextPath() + "/UsuarioServlet?error=1");
                }
            } catch (SQLException ex) {
                throw new ServletException(ex);
            }
        }
    }

    private void cargarCatalogos(HttpServletRequest request) throws SQLException {
        request.setAttribute("roles", usuarioDao.roles());
        request.setAttribute("paises", usuarioDao.paises());
    }

    private Usuario leerFormulario(HttpServletRequest request, boolean esNuevo) {
        Usuario usuario = new Usuario();
        usuario.setCodigo(texto(request, "codigo"));
        usuario.setNombre(texto(request, "nombre"));
        usuario.setCorreo(texto(request, "correo"));
        usuario.setTelefono(texto(request, "telefono"));
        usuario.setRolId(Long.parseLong(request.getParameter("rol")));
        usuario.setPaisId(Long.parseLong(request.getParameter("pais")));
        usuario.setEstado(Integer.parseInt(request.getParameter("estado")));
        String contrasena = request.getParameter("contrasena");
        usuario.setContrasena(contrasena);
        if (usuario.getCodigo().isBlank() || usuario.getCodigo().length() > 16
                || usuario.getNombre().isBlank() || usuario.getNombre().length() > 160
                || usuario.getCorreo().isBlank() || usuario.getCorreo().length() > 254
                || !CORREO.matcher(usuario.getCorreo()).matches()
                || usuario.getTelefono().length() > 30
                || usuario.getRolId() <= 0 || usuario.getPaisId() <= 0
                || (usuario.getEstado() != 0 && usuario.getEstado() != 1)) {
            throw new IllegalArgumentException("Revisa los datos ingresados.");
        }
        if (esNuevo && (contrasena == null || contrasena.length() < 12)) {
            throw new IllegalArgumentException("Ingresa una contraseña de al menos 12 caracteres.");
        }
        if (!esNuevo && contrasena != null && !contrasena.isEmpty() && contrasena.length() < 12) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 12 caracteres.");
        }
        if (contrasena != null && contrasena.length() > 1024) {
            throw new IllegalArgumentException("La contraseña es demasiado larga.");
        }
        return usuario;
    }

    private String texto(HttpServletRequest request, String nombre) {
        String valor = request.getParameter(nombre);
        return valor == null ? "" : valor.trim();
    }
}
