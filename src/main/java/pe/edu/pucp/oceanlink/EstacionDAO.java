package pe.edu.pucp.oceanlink;

import java.sql.*;
import java.util.*;

public class EstacionDAO {
    private Estacion leer(ResultSet rs) throws SQLException {
        Estacion e = new Estacion();
        e.setId(rs.getLong("id_estacion"));
        e.setCodigo(rs.getString("codigo_estacion"));
        e.setNombre(rs.getString("nombre"));
        e.setUbicacion(rs.getString("ubicacion"));
        e.setPaisId(rs.getLong("id_pais"));
        e.setCapacidad(rs.getBigDecimal("capacidad_energia_kw"));
        e.setCondicion(rs.getString("condicion_operativa"));
        return e;
    }

    public List<Estacion> listar() throws SQLException {
        List<Estacion> resultado = new ArrayList<>();
        String sql = "SELECT e.*, p.nombre AS pais FROM estacion e JOIN pais p ON e.id_pais=p.id_pais ORDER BY e.id_estacion";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Estacion e = leer(rs);
                e.setPais(rs.getString("pais"));
                resultado.add(e);
            }
        }
        return resultado;
    }

    public Estacion buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT * FROM estacion WHERE id_estacion=?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? leer(rs) : null;
            }
        }
    }

    public Map<Long, String> paises() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_pais,nombre FROM pais ORDER BY nombre"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    // El prefijo proviene de la tabla pais; no se recibe desde el formulario.
    private String codigoPais(Connection conexion, long paisId) throws SQLException {
        String sql = "SELECT codigo_pais FROM pais WHERE id_pais=?";
        try (PreparedStatement ps = conexion.prepareStatement(sql)) {
            ps.setLong(1, paisId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new SQLException("El país seleccionado no existe.");
                }
                String codigo = rs.getString("codigo_pais");
                if (codigo == null || !codigo.trim().matches("[A-Za-z]{2}")) {
                    throw new SQLException("El país no tiene un código de dos letras válido.");
                }
                return codigo.trim().toUpperCase(Locale.ROOT);
            }
        }
    }

    // El consecutivo corresponde a id_estacion (AUTO_INCREMENT global).
    static String codigoAutomatico(String prefijo, long id) {
        if (prefijo == null || !prefijo.matches("[A-Z]{2}") || id <= 0) {
            throw new IllegalArgumentException("No se puede generar el código de estación.");
        }
        return prefijo + "-" + String.format(Locale.ROOT, "%03d", id);
    }

    public void guardar(Estacion e) throws SQLException {
        // codigo_estacion es NOT NULL y UNIQUE. Se utiliza un valor temporal
        // dentro de la transacción y se sustituye por PAIS-ID antes del COMMIT.
        String sqlInsert = "INSERT INTO estacion " +
                "(codigo_estacion,nombre,ubicacion,id_pais,capacidad_energia_kw,condicion_operativa) " +
                "VALUES (?,?,?,?,?,?)";
        String sqlCodigo = "UPDATE estacion SET codigo_estacion=? WHERE id_estacion=?";

        try (Connection c = Conexion.abrir()) {
            c.setAutoCommit(false);
            try {
                String prefijo = codigoPais(c, e.getPaisId());
                String temporal = "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 15);
                long id;
                try (PreparedStatement ps = c.prepareStatement(sqlInsert, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, temporal);
                    ps.setString(2, e.getNombre());
                    ps.setString(3, e.getUbicacion());
                    ps.setLong(4, e.getPaisId());
                    ps.setBigDecimal(5, e.getCapacidad());
                    ps.setString(6, e.getCondicion());
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (!rs.next()) {
                            throw new SQLException("No se pudo obtener el ID autoincremental de la estación.");
                        }
                        id = rs.getLong(1);
                    }
                }
                String codigo = codigoAutomatico(prefijo, id);
                try (PreparedStatement ps = c.prepareStatement(sqlCodigo)) {
                    ps.setString(1, codigo);
                    ps.setLong(2, id);
                    if (ps.executeUpdate() != 1) {
                        throw new SQLException("No se pudo asignar el código automático de la estación.");
                    }
                }
                c.commit();
                e.setId(id);
                e.setCodigo(codigo);
            } catch (SQLException | RuntimeException ex) {
                try { c.rollback(); } catch (SQLException rollbackEx) { ex.addSuppressed(rollbackEx); }
                throw ex;
            }
        }
    }

    public void actualizar(Estacion e) throws SQLException {
        // Mantiene el mismo ID; si cambia el país, actualiza solo el prefijo.
        String sql = "UPDATE estacion SET codigo_estacion=?,nombre=?,ubicacion=?,id_pais=?,capacidad_energia_kw=?,condicion_operativa=? WHERE id_estacion=?";
        try (Connection c = Conexion.abrir()) {
            String codigo = codigoAutomatico(codigoPais(c, e.getPaisId()), e.getId());
            try (PreparedStatement ps = c.prepareStatement(sql)) {
                ps.setString(1, codigo);
                ps.setString(2, e.getNombre());
                ps.setString(3, e.getUbicacion());
                ps.setLong(4, e.getPaisId());
                ps.setBigDecimal(5, e.getCapacidad());
                ps.setString(6, e.getCondicion());
                ps.setLong(7, e.getId());
                if (ps.executeUpdate() != 1) {
                    throw new SQLException("No se encontró la estación que se desea editar.");
                }
            }
            e.setCodigo(codigo);
        }
    }

    public boolean eliminar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("DELETE FROM estacion WHERE id_estacion=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}
