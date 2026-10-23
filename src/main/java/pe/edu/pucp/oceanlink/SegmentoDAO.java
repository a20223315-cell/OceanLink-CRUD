package pe.edu.pucp.oceanlink;

import java.sql.*;
import java.util.*;

public class SegmentoDAO {
    private Segmento leer(ResultSet rs) throws SQLException {
        Segmento s = new Segmento();
        s.setId(rs.getLong("id_segmento"));
        s.setCodigo(rs.getString("codigo_segmento"));
        s.setEstacionOrigenId(rs.getLong("id_estacion_origen"));
        s.setEstacionDestinoId(rs.getLong("id_estacion_destino"));
        s.setCapacidad(rs.getBigDecimal("capacidad_total_tbps"));
        s.setEstado(rs.getInt("estado"));
        s.setCondicion(rs.getString("condicion_operativa"));
        Timestamp fecha = rs.getTimestamp("fecha_actualizacion");
        if (fecha != null) s.setFechaActualizacion(fecha.toLocalDateTime());
        return s;
    }

    public List<Segmento> listar() throws SQLException {
        List<Segmento> resultado = new ArrayList<>();
        String sql = "SELECT s.*, eo.nombre AS origen, ed.nombre AS destino "
                   + "FROM segmento s JOIN estacion eo ON s.id_estacion_origen=eo.id_estacion "
                   + "JOIN estacion ed ON s.id_estacion_destino=ed.id_estacion "
                   + "ORDER BY s.id_segmento";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Segmento s = leer(rs);
                s.setEstacionOrigen(rs.getString("origen"));
                s.setEstacionDestino(rs.getString("destino"));
                resultado.add(s);
            }
        }
        return resultado;
    }

    public Segmento buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT * FROM segmento WHERE id_segmento=?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? leer(rs) : null;
            }
        }
    }

    public Map<Long, String> estaciones() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_estacion,codigo_estacion,nombre FROM estacion ORDER BY nombre"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong("id_estacion"), rs.getString("codigo_estacion") + " - " + rs.getString("nombre"));
        }
        return datos;
    }

    public void guardar(Segmento s) throws SQLException {
        String sql = "INSERT INTO segmento (codigo_segmento,id_estacion_origen,id_estacion_destino,capacidad_total_tbps,estado,condicion_operativa) VALUES (?,?,?,?,?,?)";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, s);
            ps.executeUpdate();
        }
    }

    public void actualizar(Segmento s) throws SQLException {
        String sql = "UPDATE segmento SET codigo_segmento=?,id_estacion_origen=?,id_estacion_destino=?,capacidad_total_tbps=?,estado=?,condicion_operativa=? WHERE id_segmento=?";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, s);
            ps.setLong(7, s.getId());
            ps.executeUpdate();
        }
    }

    private void parametros(PreparedStatement ps, Segmento s) throws SQLException {
        ps.setString(1, s.getCodigo());
        ps.setLong(2, s.getEstacionOrigenId());
        ps.setLong(3, s.getEstacionDestinoId());
        ps.setBigDecimal(4, s.getCapacidad());
        ps.setInt(5, s.getEstado());
        ps.setString(6, s.getCondicion());
    }

    public boolean eliminar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("DELETE FROM segmento WHERE id_segmento=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}
