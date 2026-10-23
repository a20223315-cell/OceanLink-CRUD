package pe.edu.pucp.oceanlink;

import java.sql.*;
import java.util.*;

public class SolicitudCapacidadDAO {
    private SolicitudCapacidad leer(ResultSet rs) throws SQLException {
        SolicitudCapacidad s = new SolicitudCapacidad();
        s.setId(rs.getLong("id_solicitud"));
        s.setCodigo(rs.getString("codigo_solicitud"));
        s.setClienteId(rs.getLong("id_cliente"));
        s.setEstacionOrigenId(rs.getLong("id_estacion_origen"));
        s.setEstacionDestinoId(rs.getLong("id_estacion_destino"));
        s.setEstadoId(rs.getLong("id_estado_solicitud"));
        s.setCapacidad(rs.getBigDecimal("capacidad_solicitada_tbps"));
        Timestamp solicitud = rs.getTimestamp("fecha_solicitud");
        if (solicitud != null) s.setFechaSolicitud(solicitud.toLocalDateTime());
        Timestamp provision = rs.getTimestamp("fecha_provision");
        if (provision != null) s.setFechaProvision(provision.toLocalDateTime());
        s.setObservacion(rs.getString("observacion"));
        s.setCreadoPor(rs.getLong("creado_por"));
        return s;
    }

    public List<SolicitudCapacidad> listar() throws SQLException {
        List<SolicitudCapacidad> resultado = new ArrayList<>();
        String sql = "SELECT s.*, c.razon_social AS cliente, eo.nombre AS origen, ed.nombre AS destino, "
                   + "es.nombre AS estado, u.nombre_completo AS creador FROM solicitud_capacidad s "
                   + "JOIN cliente c ON s.id_cliente=c.id_cliente "
                   + "JOIN estacion eo ON s.id_estacion_origen=eo.id_estacion "
                   + "JOIN estacion ed ON s.id_estacion_destino=ed.id_estacion "
                   + "JOIN estado_solicitud_capacidad es ON s.id_estado_solicitud=es.id_estado_solicitud "
                   + "JOIN usuario u ON s.creado_por=u.id_usuario ORDER BY s.id_solicitud";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                SolicitudCapacidad s = leer(rs);
                s.setCliente(rs.getString("cliente"));
                s.setEstacionOrigen(rs.getString("origen"));
                s.setEstacionDestino(rs.getString("destino"));
                s.setEstado(rs.getString("estado"));
                s.setCreador(rs.getString("creador"));
                resultado.add(s);
            }
        }
        return resultado;
    }

    public SolicitudCapacidad buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT * FROM solicitud_capacidad WHERE id_solicitud=?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? leer(rs) : null;
            }
        }
    }

    public Map<Long, String> clientes() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_cliente,razon_social FROM cliente ORDER BY razon_social"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    public Map<Long, String> estaciones() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_estacion,nombre FROM estacion ORDER BY nombre"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    public Map<Long, String> estados() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_estado_solicitud,nombre FROM estado_solicitud_capacidad ORDER BY id_estado_solicitud"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    public Map<Long, String> usuarios() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_usuario,nombre_completo FROM usuario WHERE estado=1 ORDER BY nombre_completo"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    public void guardar(SolicitudCapacidad s) throws SQLException {
        String sql = "INSERT INTO solicitud_capacidad (codigo_solicitud,id_cliente,id_estacion_origen,id_estacion_destino,id_estado_solicitud,capacidad_solicitada_tbps,fecha_provision,observacion,creado_por) VALUES (?,?,?,?,?,?,?,?,?)";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, s);
            ps.executeUpdate();
        }
    }

    public void actualizar(SolicitudCapacidad s) throws SQLException {
        String sql = "UPDATE solicitud_capacidad SET codigo_solicitud=?,id_cliente=?,id_estacion_origen=?,id_estacion_destino=?,id_estado_solicitud=?,capacidad_solicitada_tbps=?,fecha_provision=?,observacion=?,creado_por=? WHERE id_solicitud=?";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, s);
            ps.setLong(10, s.getId());
            ps.executeUpdate();
        }
    }

    private void parametros(PreparedStatement ps, SolicitudCapacidad s) throws SQLException {
        ps.setString(1, s.getCodigo());
        ps.setLong(2, s.getClienteId());
        ps.setLong(3, s.getEstacionOrigenId());
        ps.setLong(4, s.getEstacionDestinoId());
        ps.setLong(5, s.getEstadoId());
        ps.setBigDecimal(6, s.getCapacidad());
        if (s.getFechaProvision() == null) ps.setNull(7, Types.TIMESTAMP);
        else ps.setTimestamp(7, Timestamp.valueOf(s.getFechaProvision()));
        if (s.getObservacion() == null || s.getObservacion().isBlank()) ps.setNull(8, Types.VARCHAR);
        else ps.setString(8, s.getObservacion());
        ps.setLong(9, s.getCreadoPor());
    }

    public boolean eliminar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("DELETE FROM solicitud_capacidad WHERE id_solicitud=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}
