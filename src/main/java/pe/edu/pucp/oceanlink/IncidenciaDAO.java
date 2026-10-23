package pe.edu.pucp.oceanlink;

import java.sql.*;
import java.util.*;

/** DAO JDBC: incidencia, segmentos afectados e historial en transacciones. */
public class IncidenciaDAO {
    private static final String COLUMNAS =
        "SELECT i.*,u.nombre_completo AS nombre_creador," +
        "COALESCE((SELECT GROUP_CONCAT(s.codigo_segmento ORDER BY s.codigo_segmento SEPARATOR ', ') " +
        "FROM incidencia_segmento ix JOIN segmento s ON s.id_segmento=ix.id_segmento " +
        "WHERE ix.id_incidencia=i.id_incidencia),'Sin segmentos asociados') AS segmentos_texto " +
        "FROM incidencia i JOIN usuario u ON u.id_usuario=i.creado_por ";

    private Incidencia leer(ResultSet rs) throws SQLException {
        Incidencia i = new Incidencia();
        i.setId(rs.getLong("id_incidencia"));
        i.setCodigo(rs.getString("codigo_incidencia"));
        i.setSeveridad(rs.getString("severidad"));
        i.setFase(rs.getString("fase"));
        i.setFechaDeteccion(rs.getTimestamp("fecha_deteccion"));
        i.setDescripcion(rs.getString("descripcion"));
        i.setFechaRestauracion(rs.getTimestamp("fecha_restauracion"));
        i.setFechaCierre(rs.getTimestamp("fecha_cierre"));
        i.setResultado(rs.getString("resultado") == null ? "" : rs.getString("resultado"));
        i.setCreadoPor(rs.getLong("creado_por"));
        i.setNombreCreador(rs.getString("nombre_creador"));
        i.setSegmentosTexto(rs.getString("segmentos_texto"));
        i.setFechaActualizacion(rs.getTimestamp("fecha_actualizacion"));
        return i;
    }

    public List<Incidencia> listar(boolean historial) throws SQLException {
        List<Incidencia> lista = new ArrayList<>();
        String sql = COLUMNAS + (historial ? "WHERE i.fase='CERRADA' " : "") + "ORDER BY i.fecha_deteccion DESC,i.id_incidencia DESC";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) lista.add(leer(rs));
        }
        return lista;
    }

    public Incidencia buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(COLUMNAS + "WHERE i.id_incidencia=?")) {
            ps.setLong(1,id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Incidencia i = leer(rs);
                i.setSegmentos(segmentos(c,id));
                return i;
            }
        }
    }

    private List<Long> segmentos(Connection c, long id) throws SQLException {
        List<Long> lista = new ArrayList<>();
        try (PreparedStatement ps = c.prepareStatement("SELECT id_segmento FROM incidencia_segmento WHERE id_incidencia=? ORDER BY id_incidencia_segmento")) {
            ps.setLong(1,id);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) lista.add(rs.getLong(1)); }
        }
        return lista;
    }

    public List<Incidencia.Observacion> observaciones(long id) throws SQLException {
        List<Incidencia.Observacion> lista = new ArrayList<>();
        String sql = "SELECT o.fase,o.observacion,o.fecha,u.nombre_completo FROM observacion_incidencia o " +
            "JOIN usuario u ON u.id_usuario=o.registrado_por WHERE o.id_incidencia=? ORDER BY o.fecha,o.id_observacion";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1,id);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(new Incidencia.Observacion(rs.getString(1),rs.getString(2),rs.getString(4),rs.getTimestamp(3)));
            }
        }
        return lista;
    }

    public List<Segmento> segmentosDisponibles() throws SQLException { return new SegmentoDAO().listar(); }

    public Map<Long,String> operadores() throws SQLException {
        Map<Long,String> resultado = new LinkedHashMap<>();
        String sql = "SELECT u.id_usuario,u.nombre_completo FROM usuario u JOIN rol r ON r.id_rol=u.id_rol " +
                     "WHERE u.estado=1 AND r.codigo_rol='NETWORK' ORDER BY u.nombre_completo";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs=ps.executeQuery()) {
            while (rs.next()) resultado.put(rs.getLong(1),rs.getString(2));
        }
        return resultado;
    }

    private void validarReferencias(Connection c, Incidencia i, long autor) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=? AND u.estado=1 AND r.codigo_rol='NETWORK'")) {
            ps.setLong(1,autor);
            try (ResultSet rs=ps.executeQuery()) { rs.next(); if(rs.getInt(1)!=1) throw new IllegalArgumentException("Selecciona un operador de red activo."); }
        }
        // Validar relaciones para no asociar IDs inexistentes/inactivos desde un POST manipulado.
        for (long id : i.getSegmentos()) {
            try (PreparedStatement ps = c.prepareStatement("SELECT estado FROM segmento WHERE id_segmento=?")) {
                ps.setLong(1,id);
                try(ResultSet rs=ps.executeQuery()) {
                    if(!rs.next()) throw new IllegalArgumentException("Uno de los segmentos seleccionados ya no existe.");
                }
            }
        }
    }

    private void guardarSegmentos(Connection c, long id, List<Long> segmentos) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("INSERT INTO incidencia_segmento (id_incidencia,id_segmento) VALUES (?,?)")) {
            for (Long seg : segmentos) {
                ps.setLong(1,id); ps.setLong(2,seg); ps.addBatch();
            }
            if (!segmentos.isEmpty()) ps.executeBatch();
        }
    }

    private void agregarObservacion(Connection c,long id,String fase,String texto,long autor) throws SQLException {
        try (PreparedStatement ps=c.prepareStatement("INSERT INTO observacion_incidencia (id_incidencia,fase,observacion,registrado_por) VALUES (?,?,?,?)")) {
            ps.setLong(1,id); ps.setString(2,fase); ps.setString(3,texto); ps.setLong(4,autor);
            ps.executeUpdate();
        }
    }

    public void guardar(Incidencia i,String observacion) throws SQLException {
        try (Connection c=Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                validarReferencias(c,i,i.getCreadoPor());
                if(!"DETECTADA".equals(i.getFase())) throw new IllegalArgumentException("Una incidencia nueva inicia en la fase DETECTADA.");
                long id;
                String sql="INSERT INTO incidencia (codigo_incidencia,severidad,fase,fecha_deteccion,descripcion,creado_por) VALUES (?,?,?,?,?,?)";
                try(PreparedStatement ps=c.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1,i.getCodigo()); ps.setString(2,i.getSeveridad()); ps.setString(3,i.getFase());
                    ps.setTimestamp(4,i.getFechaDeteccion()); ps.setString(5,i.getDescripcion()); ps.setLong(6,i.getCreadoPor());
                    ps.executeUpdate();
                    try(ResultSet keys=ps.getGeneratedKeys()) {
                        if(!keys.next()) throw new SQLException("No se obtuvo el ID de la incidencia.");
                        id=keys.getLong(1);
                    }
                }
                guardarSegmentos(c,id,i.getSegmentos());
                agregarObservacion(c,id,i.getFase(),observacion.isBlank() ? "Incidencia registrada." : observacion,i.getCreadoPor());
                c.commit();
            } catch(SQLException | RuntimeException ex) { c.rollback(); throw ex; }
        }
    }

    public boolean actualizar(Incidencia i,long operador,String nuevaObservacion) throws SQLException {
        try(Connection c=Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                String faseAnterior; Timestamp restauracion; Timestamp cierre; Timestamp deteccion;
                try(PreparedStatement ps=c.prepareStatement("SELECT fase,fecha_restauracion,fecha_cierre,fecha_deteccion FROM incidencia WHERE id_incidencia=? FOR UPDATE")) {
                    ps.setLong(1,i.getId());
                    try(ResultSet rs=ps.executeQuery()) {
                        if(!rs.next()) { c.rollback(); return false; }
                        faseAnterior=rs.getString(1); restauracion=rs.getTimestamp(2);
                        cierre=rs.getTimestamp(3); deteccion=rs.getTimestamp(4);
                    }
                }
                if("CERRADA".equals(faseAnterior) && !"CERRADA".equals(i.getFase()))
                    throw new IllegalArgumentException("Una incidencia cerrada no puede reabrirse desde este formulario.");
                validarReferencias(c,i,operador);
                Timestamp ahora=new Timestamp(System.currentTimeMillis());
                if (("RESTAURADA".equals(i.getFase()) || "CERRADA".equals(i.getFase())) && restauracion==null) {
                    if(!"RESTAURADA".equals(i.getFase())) throw new IllegalArgumentException("Primero cambia la fase a RESTAURADA; después podrás cerrarla.");
                    restauracion=ahora;
                }
                if("CERRADA".equals(i.getFase())) {
                    if(i.getResultado().isBlank()) throw new IllegalArgumentException("Para cerrar la incidencia debes indicar el resultado.");
                    if(cierre==null) cierre=ahora;
                } else cierre=null;
                if(restauracion!=null && restauracion.before(deteccion))
                    throw new IllegalArgumentException("La fecha de restauración no puede ser anterior a la detección.");
                if(cierre!=null && cierre.before(restauracion))
                    throw new IllegalArgumentException("La fecha de cierre no puede ser anterior a la restauración.");
                String sql="UPDATE incidencia SET codigo_incidencia=?,severidad=?,fase=?,descripcion=?,fecha_restauracion=?,fecha_cierre=?,resultado=? WHERE id_incidencia=?";
                try(PreparedStatement ps=c.prepareStatement(sql)) {
                    ps.setString(1,i.getCodigo()); ps.setString(2,i.getSeveridad()); ps.setString(3,i.getFase());
                    ps.setString(4,i.getDescripcion());
                    if(restauracion==null) ps.setNull(5,Types.TIMESTAMP); else ps.setTimestamp(5,restauracion);
                    if(cierre==null) ps.setNull(6,Types.TIMESTAMP); else ps.setTimestamp(6,cierre);
                    if(i.getResultado().isBlank()) ps.setNull(7,Types.VARCHAR); else ps.setString(7,i.getResultado());
                    ps.setLong(8,i.getId()); ps.executeUpdate();
                }
                try(PreparedStatement ps=c.prepareStatement("DELETE FROM incidencia_segmento WHERE id_incidencia=?")) {
                    ps.setLong(1,i.getId()); ps.executeUpdate();
                }
                guardarSegmentos(c,i.getId(),i.getSegmentos());
                if(!nuevaObservacion.isBlank() || !faseAnterior.equals(i.getFase())) {
                    String obs=nuevaObservacion.isBlank()?"Cambio de fase: "+faseAnterior+" → "+i.getFase():nuevaObservacion;
                    agregarObservacion(c,i.getId(),i.getFase(),obs,operador);
                }
                c.commit(); return true;
            } catch(SQLException | RuntimeException ex) { c.rollback(); throw ex; }
        }
    }

    /** Elimina incidentes abiertos y sus dependencias; conserva incidencias cerradas como historial. */
    public boolean eliminar(long id) throws SQLException {
        try(Connection c=Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                String fase;
                try(PreparedStatement ps=c.prepareStatement("SELECT fase FROM incidencia WHERE id_incidencia=? FOR UPDATE")) {
                    ps.setLong(1,id);
                    try(ResultSet rs=ps.executeQuery()) { if(!rs.next()){c.rollback();return false;} fase=rs.getString(1); }
                }
                if("CERRADA".equals(fase))
                    throw new IllegalArgumentException("No se puede eliminar una incidencia cerrada: se conserva su historial.");
                for(String tabla : List.of("observacion_incidencia","incidencia_segmento")) {
                    try(PreparedStatement ps=c.prepareStatement("DELETE FROM "+tabla+" WHERE id_incidencia=?")) {
                        ps.setLong(1,id);ps.executeUpdate();
                    }
                }
                try(PreparedStatement ps=c.prepareStatement("DELETE FROM incidencia WHERE id_incidencia=?")) {
                    ps.setLong(1,id); ps.executeUpdate();
                }
                c.commit();return true;
            } catch(SQLException | RuntimeException ex) { c.rollback();throw ex; }
        }
    }
}
