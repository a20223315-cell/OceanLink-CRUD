package pe.edu.pucp.oceanlink;

import java.sql.*;
import java.util.*;

public class ClienteDAO {
    private Cliente leer(ResultSet rs) throws SQLException {
        Cliente cliente = new Cliente();
        cliente.setId(rs.getLong("id_cliente"));
        cliente.setCodigo(rs.getString("codigo_cliente"));
        cliente.setRazonSocial(rs.getString("razon_social"));
        cliente.setTipoIdentificacion(rs.getString("tipo_identificacion"));
        cliente.setIdentificacionFiscal(rs.getString("identificacion_fiscal"));
        cliente.setNombreContacto(rs.getString("nombre_contacto"));
        cliente.setCorreoContacto(rs.getString("correo_contacto"));
        cliente.setTelefonoContacto(rs.getString("telefono_contacto"));
        cliente.setEstado(rs.getInt("estado"));
        return cliente;
    }

    public List<Cliente> listar() throws SQLException {
        List<Cliente> clientes = new ArrayList<>();
        String sql = "SELECT c.*, COUNT(DISTINCT sv.id_servicio) AS total_servicios "
                   + "FROM cliente c "
                   + "LEFT JOIN solicitud_capacidad sc ON sc.id_cliente=c.id_cliente "
                   + "LEFT JOIN servicio sv ON sv.id_solicitud=sc.id_solicitud "
                   + "GROUP BY c.id_cliente, c.codigo_cliente, c.razon_social, c.tipo_identificacion, "
                   + "c.identificacion_fiscal, c.nombre_contacto, c.correo_contacto, "
                   + "c.telefono_contacto, c.estado ORDER BY c.id_cliente";
        try (Connection c = Conexion.abrir();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Cliente cliente = leer(rs);
                cliente.setServicios(rs.getInt("total_servicios"));
                clientes.add(cliente);
            }
        }
        return clientes;
    }

    public Cliente buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir();
             PreparedStatement ps = c.prepareStatement("SELECT * FROM cliente WHERE id_cliente=?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? leer(rs) : null;
            }
        }
    }

    public void guardar(Cliente cliente) throws SQLException {
        String sql = "INSERT INTO cliente (codigo_cliente,razon_social,tipo_identificacion,identificacion_fiscal,"
                   + "nombre_contacto,correo_contacto,telefono_contacto,estado) VALUES (?,?,?,?,?,?,?,?)";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, cliente);
            ps.executeUpdate();
        }
    }

    public boolean actualizar(Cliente cliente) throws SQLException {
        String sql = "UPDATE cliente SET codigo_cliente=?,razon_social=?,tipo_identificacion=?,"
                   + "identificacion_fiscal=?,nombre_contacto=?,correo_contacto=?,telefono_contacto=?,estado=? "
                   + "WHERE id_cliente=?";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, cliente);
            ps.setLong(9, cliente.getId());
            return ps.executeUpdate() > 0;
        }
    }

    private void parametros(PreparedStatement ps, Cliente cliente) throws SQLException {
        ps.setString(1, cliente.getCodigo());
        ps.setString(2, cliente.getRazonSocial());
        ps.setString(3, cliente.getTipoIdentificacion());
        ps.setString(4, cliente.getIdentificacionFiscal());
        ps.setString(5, cliente.getNombreContacto());
        ps.setString(6, cliente.getCorreoContacto());
        if (cliente.getTelefonoContacto().isBlank()) ps.setNull(7, Types.VARCHAR);
        else ps.setString(7, cliente.getTelefonoContacto());
        ps.setInt(8, cliente.getEstado());
    }

    public boolean eliminar(long id) throws SQLException {
        try (Connection c = Conexion.abrir();
             PreparedStatement ps = c.prepareStatement("DELETE FROM cliente WHERE id_cliente=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean desactivar(long id) throws SQLException {
        try (Connection c = Conexion.abrir();
             PreparedStatement ps = c.prepareStatement("UPDATE cliente SET estado=0 WHERE id_cliente=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}
