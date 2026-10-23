package pe.edu.pucp.oceanlink;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

/** Controlador MVC del Operador de red. */
@WebServlet("/IncidenciaServlet")
public class IncidenciaServlet extends HttpServlet {
    private final IncidenciaDAO dao=new IncidenciaDAO();
    private static final Set<String> SEVERIDADES=Set.of("BAJA","MEDIA","ALTA","CRITICA");
    private static final Set<String> FASES=Set.of("DETECTADA","EN_ANALISIS","REPARACION_PROGRAMADA","EN_REPARACION","RESTAURADA","CERRADA");

    @Override
    protected void doGet(HttpServletRequest request,HttpServletResponse response) throws ServletException,IOException {
        String action=request.getParameter("action")==null?"lista":request.getParameter("action");
        try {
            switch(action) {
                case "lista":
                    boolean historial="1".equals(request.getParameter("soloCerradas"));
                    request.setAttribute("soloCerradas",historial);
                    request.setAttribute("lista",dao.listar(historial));
                    request.getRequestDispatcher("/WEB-INF/views/listaIncidencias.jsp").forward(request,response);
                    break;
                case "formCrear":
                    Incidencia nueva=new Incidencia();
                    nueva.setFechaDeteccion(Timestamp.valueOf(LocalDateTime.now().withSecond(0).withNano(0)));
                    mostrarFormulario(request,response,nueva,false);
                    break;
                case "editar":
                    Incidencia i=dao.buscar(id(request));
                    if(i==null) { response.sendRedirect(request.getContextPath()+"/IncidenciaServlet"); return; }
                    mostrarFormulario(request,response,i,true);
                    break;
                default: response.sendRedirect(request.getContextPath()+"/IncidenciaServlet");
            }
        } catch(SQLException | IllegalArgumentException ex) {
            throw new ServletException("No fue posible consultar las incidencias",ex);
        }
    }

    private void mostrarFormulario(HttpServletRequest request,HttpServletResponse response,Incidencia i,boolean edicion) throws SQLException,ServletException,IOException {
        request.setAttribute("incidencia",i);
        request.setAttribute("segmentos",dao.segmentosDisponibles());
        request.setAttribute("seleccionados",new HashSet<>(i.getSegmentos()));
        request.setAttribute("operadores",dao.operadores());
        if(edicion) request.setAttribute("observaciones",dao.observaciones(i.getId()));
        request.getRequestDispatcher(edicion?"/WEB-INF/views/editarIncidencia.jsp":"/WEB-INF/views/nuevaIncidencia.jsp").forward(request,response);
    }

    @Override
    protected void doPost(HttpServletRequest request,HttpServletResponse response) throws ServletException,IOException {
        request.setCharacterEncoding("UTF-8");
        String action=request.getParameter("action");
        if(action==null) { response.sendError(HttpServletResponse.SC_BAD_REQUEST); return; }
        try {
            switch(action) {
                case "crear": {
                    Incidencia i=leerFormulario(request,false);
                    dao.guardar(i,texto(request,"observacion"));
                    response.sendRedirect(request.getContextPath()+"/IncidenciaServlet?ok=1");
                    return;
                }
                case "actualizar": {
                    Incidencia i=leerFormulario(request,true);
                    long operador=numero(request,"operador");
                    if(!dao.actualizar(i,operador,texto(request,"observacion")))
                        throw new IllegalArgumentException("La incidencia ya no existe.");
                    response.sendRedirect(request.getContextPath()+"/IncidenciaServlet?ok=1");
                    return;
                }
                case "borrar": {
                    if(!dao.eliminar(id(request))) throw new IllegalArgumentException("La incidencia ya no existe.");
                    response.sendRedirect(request.getContextPath()+"/IncidenciaServlet?ok=1");
                    return;
                }
                default: response.sendError(HttpServletResponse.SC_BAD_REQUEST); return;
            }
        } catch(SQLException | IllegalArgumentException ex) {
            String error=(ex instanceof SQLException)?"No se pudo guardar. Verifica que el código sea único y que los registros relacionados existan.":ex.getMessage();
            if("borrar".equals(action)) {
                response.sendRedirect(request.getContextPath()+"/IncidenciaServlet?errorBorrar=1");
                return;
            }
            boolean edicion="actualizar".equals(action);
            Incidencia i=valores(request,edicion);
            request.setAttribute("error",error==null?"Comprueba los datos del formulario.":error);
            try { mostrarFormulario(request,response,i,edicion); }
            catch(SQLException e) { throw new ServletException("No se pudo cargar el formulario de incidencias",e); }
        }
    }

    private Incidencia leerFormulario(HttpServletRequest request,boolean edicion) {
        Incidencia i=valores(request,edicion);
        if(i.getCodigo().isBlank() || i.getCodigo().length()>16)
            throw new IllegalArgumentException("El código de incidencia es obligatorio (máximo 16 caracteres).");
        if(!SEVERIDADES.contains(i.getSeveridad()) || !FASES.contains(i.getFase()))
            throw new IllegalArgumentException("Selecciona una severidad y una fase válidas.");
        if(i.getDescripcion().isBlank() || i.getDescripcion().length()>2000)
            throw new IllegalArgumentException("La descripción es obligatoria y admite hasta 2000 caracteres.");
        if(i.getFechaDeteccion()==null || i.getFechaDeteccion().after(new Timestamp(System.currentTimeMillis())))
            throw new IllegalArgumentException("La fecha de detección debe ser válida y no puede ser futura.");
        if(i.getResultado().length()>2000 || texto(request,"observacion").length()>2000)
            throw new IllegalArgumentException("Las observaciones y resultados admiten un máximo de 2000 caracteres.");
        if(i.getSegmentos().isEmpty())
            throw new IllegalArgumentException("Selecciona al menos un segmento afectado.");
        if(edicion && i.getId()<=0) throw new IllegalArgumentException("Identificador de incidencia inválido.");
        if(!edicion && i.getCreadoPor()<=0) throw new IllegalArgumentException("Selecciona el operador responsable.");
        if(edicion && numero(request,"operador")<=0) throw new IllegalArgumentException("Selecciona el operador que registra el cambio.");
        return i;
    }

    private Incidencia valores(HttpServletRequest request,boolean edicion) {
        Incidencia i=new Incidencia();
        i.setCodigo(texto(request,"codigo"));
        i.setSeveridad(texto(request,"severidad"));
        i.setFase(texto(request,"fase"));
        i.setDescripcion(texto(request,"descripcion"));
        i.setResultado(texto(request,"resultado"));
        if(edicion) {
            try { i.setId(Long.parseLong(texto(request,"id"))); }catch(NumberFormatException ignored){}
        } else {
            try { i.setCreadoPor(Long.parseLong(texto(request,"creadoPor"))); }catch(NumberFormatException ignored){}
        }
        try { i.setFechaDeteccion(Timestamp.valueOf(LocalDateTime.parse(texto(request,"fechaDeteccion")))); }
        catch(DateTimeParseException | IllegalArgumentException ignored) { }
        List<Long> segments=new ArrayList<>();
        String[] values=request.getParameterValues("segmentos");
        if(values!=null) {
            for(String s:values) {
                try {
                    long v=Long.parseLong(s);
                    if(v>0 && !segments.contains(v)) segments.add(v);
                } catch(NumberFormatException ignored) { }
            }
        }
        i.setSegmentos(segments);
        return i;
    }

    private long numero(HttpServletRequest request,String key) {
        try { return Long.parseLong(texto(request,key)); } catch(NumberFormatException e){ return -1; }
    }
    private long id(HttpServletRequest request) {
        long id=numero(request,"id");
        if(id<=0) throw new IllegalArgumentException("Identificador inválido.");
        return id;
    }
    private String texto(HttpServletRequest request,String campo) {
        String v=request.getParameter(campo);return v==null?"":v.trim();
    }
}
