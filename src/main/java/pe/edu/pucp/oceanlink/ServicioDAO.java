package pe.edu.pucp.oceanlink;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

/** Acceso JDBC a servicio y servicio_segmento, con guardado transaccional de la ruta. */
public class ServicioDAO {
    public static class SolicitudOpcion {
        private final long id;
        private final String codigo, cliente, origen, destino;
        private final BigDecimal capacidad;
        public SolicitudOpcion(long id, String codigo, String cliente, String origen, String destino, BigDecimal capacidad) {
            this.id=id; this.codigo=codigo; this.cliente=cliente; this.origen=origen; this.destino=destino; this.capacidad=capacidad;
        }
        public long getId() { return id; }
        public String getCodigo() { return codigo; }
        public String getCliente() { return cliente; }
        public String getOrigen() { return origen; }
        public String getDestino() { return destino; }
        public BigDecimal getCapacidad() { return capacidad; }
    }

    private Servicio leer(ResultSet rs) throws SQLException {
        Servicio s = new Servicio();
        s.setId(rs.getLong("id_servicio"));
        s.setCodigo(rs.getString("codigo_servicio"));
        s.setSolicitudId(rs.getLong("id_solicitud"));
        s.setCapacidad(rs.getBigDecimal("capacidad_contratada_tbps"));
        s.setEstado(rs.getString("estado"));
        s.setFechaActivacion(rs.getTimestamp("fecha_activacion"));
        s.setFechaCancelacion(rs.getTimestamp("fecha_cancelacion"));
        s.setCodigoSolicitud(rs.getString("codigo_solicitud"));
        s.setCliente(rs.getString("razon_social"));
        s.setOrigen(rs.getString("origen"));
        s.setDestino(rs.getString("destino"));
        String ruta = rs.getString("ruta");
        if (ruta != null && !ruta.isBlank()) s.setRutaResumen(ruta);
        return s;
    }

    private static final String CONSULTA =
        "SELECT sv.*, sc.codigo_solicitud, cl.razon_social, eo.nombre AS origen, ed.nombre AS destino, " +
        "(SELECT GROUP_CONCAT(sg.codigo_segmento ORDER BY ss.orden SEPARATOR ' → ') " +
        " FROM servicio_segmento ss JOIN segmento sg ON sg.id_segmento=ss.id_segmento " +
        " WHERE ss.id_servicio=sv.id_servicio) AS ruta " +
        "FROM servicio sv JOIN solicitud_capacidad sc ON sc.id_solicitud=sv.id_solicitud " +
        "JOIN cliente cl ON cl.id_cliente=sc.id_cliente " +
        "JOIN estacion eo ON eo.id_estacion=sc.id_estacion_origen " +
        "JOIN estacion ed ON ed.id_estacion=sc.id_estacion_destino ";

    public List<Servicio> listar() throws SQLException {
        List<Servicio> lista = new ArrayList<>();
        try (Connection c = Conexion.abrir();
             PreparedStatement ps = c.prepareStatement(CONSULTA + "ORDER BY sv.id_servicio DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) lista.add(leer(rs));
        }
        return lista;
    }

    public Servicio buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir();
             PreparedStatement ps = c.prepareStatement(CONSULTA + "WHERE sv.id_servicio=?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Servicio s = leer(rs);
                s.setSegmentos(leerRuta(c, id));
                return s;
            }
        }
    }

    private List<Long> leerRuta(Connection c, long idServicio) throws SQLException {
        List<Long> ids = new ArrayList<>();
        try (PreparedStatement ps = c.prepareStatement(
                 "SELECT id_segmento FROM servicio_segmento WHERE id_servicio=? ORDER BY orden")) {
            ps.setLong(1, idServicio);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) ids.add(rs.getLong(1));
            }
        }
        return ids;
    }

    public List<SolicitudOpcion> solicitudesDisponibles(long servicioActual) throws SQLException {
        List<SolicitudOpcion> resultado = new ArrayList<>();
        String sql = "SELECT sc.id_solicitud,sc.codigo_solicitud,cl.razon_social,eo.nombre AS origen," +
            "ed.nombre AS destino,sc.capacidad_solicitada_tbps " +
            "FROM solicitud_capacidad sc JOIN cliente cl ON cl.id_cliente=sc.id_cliente " +
            "JOIN estacion eo ON eo.id_estacion=sc.id_estacion_origen " +
            "JOIN estacion ed ON ed.id_estacion=sc.id_estacion_destino " +
            "LEFT JOIN servicio sv ON sv.id_solicitud=sc.id_solicitud " +
            "WHERE sv.id_servicio IS NULL OR sv.id_servicio=? ORDER BY sc.id_solicitud DESC";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, servicioActual);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) resultado.add(new SolicitudOpcion(rs.getLong(1),rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getBigDecimal(6)));
            }
        }
        return resultado;
    }

    /** Reutiliza el mismo DAO de segmentos del CRUD de Administrador. */
    public List<Segmento> segmentosDisponibles() throws SQLException {
        return new SegmentoDAO().listar();
    }

    /** Inserta contrato y ruta juntos: si algo falla, no queda un servicio incompleto. */
    public void guardar(Servicio s) throws SQLException {
        try (Connection c = Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                validarSolicitudYRuta(c, s, 0);
                String sql = "INSERT INTO servicio (codigo_servicio,id_solicitud,capacidad_contratada_tbps," +
                    "estado,fecha_activacion,fecha_cancelacion) VALUES (?,?,?,?,?,?)";
                long id;
                try (PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1,s.getCodigo()); ps.setLong(2,s.getSolicitudId());
                    ps.setBigDecimal(3,s.getCapacidad()); ps.setString(4,s.getEstado());
                    asignarFechas(ps, s.getEstado(), null, null);
                    ps.executeUpdate();
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) throw new SQLException("No se pudo obtener el ID del servicio.");
                        id=keys.getLong(1);
                    }
                }
                guardarRuta(c,id,s.getSegmentos());
                c.commit();
            } catch (SQLException | RuntimeException e) {
                c.rollback(); throw e;
            }
        }
    }

    public boolean actualizar(Servicio s) throws SQLException {
        try (Connection c = Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                Timestamp activacion, cancelacion;
                try (PreparedStatement ps = c.prepareStatement(
                        "SELECT fecha_activacion,fecha_cancelacion FROM servicio WHERE id_servicio=? FOR UPDATE")) {
                    ps.setLong(1,s.getId());
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) { c.rollback(); return false; }
                        activacion=rs.getTimestamp(1); cancelacion=rs.getTimestamp(2);
                    }
                }
                validarSolicitudYRuta(c,s,s.getId());
                String sql = "UPDATE servicio SET codigo_servicio=?,id_solicitud=?," +
                    "capacidad_contratada_tbps=?,estado=?,fecha_activacion=?,fecha_cancelacion=? WHERE id_servicio=?";
                try (PreparedStatement ps = c.prepareStatement(sql)) {
                    ps.setString(1,s.getCodigo()); ps.setLong(2,s.getSolicitudId());
                    ps.setBigDecimal(3,s.getCapacidad()); ps.setString(4,s.getEstado());
                    asignarFechas(ps,s.getEstado(),activacion,cancelacion);
                    ps.setLong(7,s.getId());
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM servicio_segmento WHERE id_servicio=?")) {
                    ps.setLong(1,s.getId()); ps.executeUpdate();
                }
                guardarRuta(c,s.getId(),s.getSegmentos());
                c.commit(); return true;
            } catch (SQLException | RuntimeException e) {
                c.rollback(); throw e;
            }
        }
    }

    private void asignarFechas(PreparedStatement ps, String estado, Timestamp anteriorActivacion, Timestamp anteriorCancelacion) throws SQLException {
        Timestamp ahora = new Timestamp(System.currentTimeMillis());
        Timestamp activacion = "ACTIVO".equals(estado) ? (anteriorActivacion == null ? ahora : anteriorActivacion) : anteriorActivacion;
        Timestamp cancelacion = "CANCELADO".equals(estado) ? (anteriorCancelacion == null ? ahora : anteriorCancelacion) : null;
        if (activacion == null) ps.setNull(5,Types.TIMESTAMP); else ps.setTimestamp(5,activacion);
        if (cancelacion == null) ps.setNull(6,Types.TIMESTAMP); else ps.setTimestamp(6,cancelacion);
    }

    /**
     * Verifica que la ruta sea continua desde el origen hasta el destino solicitados.
     * Para evitar sobreasignación, controla capacidad de servicios ACTIVOS en cada segmento.
     */
    private void validarSolicitudYRuta(Connection c, Servicio s, long servicioActual) throws SQLException {
        long inicio, fin;
        BigDecimal solicitada;
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT id_estacion_origen,id_estacion_destino,capacidad_solicitada_tbps " +
                "FROM solicitud_capacidad WHERE id_solicitud=? FOR UPDATE")) {
            ps.setLong(1,s.getSolicitudId());
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) throw new IllegalArgumentException("La solicitud seleccionada no existe.");
                inicio=rs.getLong(1); fin=rs.getLong(2); solicitada=rs.getBigDecimal(3);
            }
        }
        if (s.getCapacidad().compareTo(solicitada) > 0)
            throw new IllegalArgumentException("La capacidad contratada supera la solicitada (" + solicitada + " Tbps).");
        if (s.getSegmentos().isEmpty()) {
            if ("ACTIVO".equals(s.getEstado()))
                throw new IllegalArgumentException("Para activar un servicio debe registrar su ruta.");
            return;
        }
        // Bloquea todos los tramos en orden consistente antes de comprobar disponibilidad.
        Map<Long, Tramo> tramos = new HashMap<>();
        List<Long> ids = new ArrayList<>(s.getSegmentos());
        Collections.sort(ids);
        for (long id : ids) {
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT id_estacion_origen,id_estacion_destino,capacidad_total_tbps,estado,condicion_operativa " +
                    "FROM segmento WHERE id_segmento=? FOR UPDATE")) {
                ps.setLong(1,id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) throw new IllegalArgumentException("El segmento " + id + " ya no existe.");
                    tramos.put(id,new Tramo(rs.getLong(1),rs.getLong(2),rs.getBigDecimal(3),rs.getInt(4),rs.getString(5)));
                }
            }
        }
        long actual = inicio;
        for (long id : s.getSegmentos()) {
            Tramo t = tramos.get(id);
            if (t.origen == actual) actual = t.destino;
            else if (t.destino == actual) actual = t.origen;
            else throw new IllegalArgumentException("Los segmentos deben conectarse entre sí, en el orden indicado, desde la estación de origen.");
            if ("ACTIVO".equals(s.getEstado())) {
                if (t.estado != 1 || "FUERA_SERVICIO".equals(t.condicion))
                    throw new IllegalArgumentException("La ruta activa no puede usar segmentos inactivos o fuera de servicio.");
                BigDecimal utilizada;
                try (PreparedStatement ps = c.prepareStatement(
                        "SELECT COALESCE(SUM(sv.capacidad_contratada_tbps),0) " +
                        "FROM servicio_segmento ss JOIN servicio sv ON sv.id_servicio=ss.id_servicio " +
                        "WHERE ss.id_segmento=? AND sv.estado='ACTIVO' AND sv.id_servicio<>?")) {
                    ps.setLong(1,id); ps.setLong(2,servicioActual);
                    try (ResultSet rs = ps.executeQuery()) { rs.next(); utilizada=rs.getBigDecimal(1); }
                }
                if (utilizada.add(s.getCapacidad()).compareTo(t.capacidad) > 0)
                    throw new IllegalArgumentException("Capacidad insuficiente en el segmento " + id + ". Disponible: " + t.capacidad.subtract(utilizada) + " Tbps.");
            }
        }
        if (actual != fin) throw new IllegalArgumentException("La ruta no llega a la estación de destino de la solicitud.");
    }

    private static class Tramo {
        final long origen, destino;
        final BigDecimal capacidad;
        final int estado;
        final String condicion;
        Tramo(long origen,long destino,BigDecimal capacidad,int estado,String condicion) {
            this.origen=origen; this.destino=destino; this.capacidad=capacidad; this.estado=estado; this.condicion=condicion;
        }
    }

    private void guardarRuta(Connection c,long servicioId,List<Long> segmentos) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO servicio_segmento (id_servicio,id_segmento,orden) VALUES (?,?,?)")) {
            for (int i=0;i<segmentos.size();i++) {
                ps.setLong(1,servicioId); ps.setLong(2,segmentos.get(i)); ps.setInt(3,i+1);
                ps.addBatch();
            }
            if (!segmentos.isEmpty()) ps.executeBatch();
        }
    }

    public boolean eliminar(long id) throws SQLException {
        try (Connection c = Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                // Primero se elimina la relación hijo para respetar las claves foráneas.
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM servicio_segmento WHERE id_servicio=?")) {
                    ps.setLong(1,id); ps.executeUpdate();
                }
                int borrados;
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM servicio WHERE id_servicio=?")) {
                    ps.setLong(1,id); borrados=ps.executeUpdate();
                }
                c.commit(); return borrados > 0;
            } catch (SQLException | RuntimeException e) { c.rollback(); throw e; }
        }
    }
}
