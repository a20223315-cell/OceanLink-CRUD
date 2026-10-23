package pe.edu.pucp.oceanlink;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.sql.*;
import java.util.*;

public class UsuarioDAO {
    private Usuario leer(ResultSet rs) throws SQLException {
        Usuario u = new Usuario();
        u.setId(rs.getLong("id_usuario"));
        u.setCodigo(rs.getString("codigo_usuario"));
        u.setNombre(rs.getString("nombre_completo"));
        u.setCorreo(rs.getString("correo"));
        u.setTelefono(rs.getString("telefono"));
        u.setRolId(rs.getLong("id_rol"));
        u.setPaisId(rs.getLong("id_pais"));
        u.setEstado(rs.getInt("estado"));
        Timestamp ingreso = rs.getTimestamp("fecha_ingreso");
        if (ingreso != null) u.setFechaIngreso(ingreso.toLocalDateTime());
        Timestamp primera = rs.getTimestamp("fecha_primera_activacion");
        if (primera != null) u.setFechaPrimeraActivacion(primera.toLocalDateTime());
        Timestamp ultimo = rs.getTimestamp("ultimo_acceso");
        if (ultimo != null) u.setUltimoAcceso(ultimo.toLocalDateTime());
        // Nunca se recupera el hash ni se transmite a las vistas JSP.
        return u;
    }

    public List<Usuario> listar() throws SQLException {
        List<Usuario> resultado = new ArrayList<>();
        String sql = "SELECT u.*, r.nombre AS rol, p.nombre AS pais FROM usuario u "
                + "JOIN rol r ON u.id_rol=r.id_rol JOIN pais p ON u.id_pais=p.id_pais ORDER BY u.id_usuario";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Usuario u = leer(rs);
                u.setRol(rs.getString("rol"));
                u.setPais(rs.getString("pais"));
                resultado.add(u);
            }
        }
        return resultado;
    }

    public Usuario buscar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT * FROM usuario WHERE id_usuario=?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? leer(rs) : null; }
        }
    }

    public Map<Long, String> roles() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_rol,nombre FROM rol ORDER BY nombre"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    public Map<Long, String> paises() throws SQLException {
        Map<Long, String> datos = new LinkedHashMap<>();
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("SELECT id_pais,nombre FROM pais ORDER BY nombre"); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) datos.put(rs.getLong(1), rs.getString(2));
        }
        return datos;
    }

    public void guardar(Usuario u) throws SQLException {
        String sql = "INSERT INTO usuario (codigo_usuario,nombre_completo,correo,hash_contrasena,telefono,id_rol,id_pais,estado,fecha_ingreso,fecha_primera_activacion) "
                + "VALUES (?,?,?,?,?,?,?,?,NOW(),IF(?=1,NOW(),NULL))";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            parametros(ps, u);
            ps.setString(4, hashContrasena(u.getContrasena()));
            ps.setInt(9, u.getEstado());
            ps.executeUpdate();
        }
    }

    public void actualizar(Usuario u) throws SQLException {
        boolean cambiarContrasena = u.getContrasena() != null && !u.getContrasena().isEmpty();
        String sql = "UPDATE usuario SET codigo_usuario=?,nombre_completo=?,correo=?,telefono=?,id_rol=?,id_pais=?,estado=?, "
                + "fecha_primera_activacion=CASE WHEN ?=1 THEN COALESCE(fecha_primera_activacion,NOW()) ELSE fecha_primera_activacion END"
                + (cambiarContrasena ? ",hash_contrasena=?" : "") + " WHERE id_usuario=?";
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, u.getCodigo());
            ps.setString(2, u.getNombre());
            ps.setString(3, u.getCorreo());
            if (u.getTelefono() == null || u.getTelefono().isBlank()) ps.setNull(4, Types.VARCHAR);
            else ps.setString(4, u.getTelefono());
            ps.setLong(5, u.getRolId());
            ps.setLong(6, u.getPaisId());
            ps.setInt(7, u.getEstado());
            ps.setInt(8, u.getEstado());
            int i = 9;
            if (cambiarContrasena) ps.setString(i++, hashContrasena(u.getContrasena()));
            ps.setLong(i, u.getId());
            ps.executeUpdate();
        }
    }

    private void parametros(PreparedStatement ps, Usuario u) throws SQLException {
        ps.setString(1, u.getCodigo());
        ps.setString(2, u.getNombre());
        ps.setString(3, u.getCorreo());
        if (u.getTelefono() == null || u.getTelefono().isBlank()) ps.setNull(5, Types.VARCHAR);
        else ps.setString(5, u.getTelefono());
        ps.setLong(6, u.getRolId());
        ps.setLong(7, u.getPaisId());
        ps.setInt(8, u.getEstado());
    }

    // Esquema de contraseña PBKDF2-HMAC-SHA256 (salt aleatorio; sin almacenar texto plano).
    // La versión de demostración no tiene un sistema real de autenticación.
    private String hashContrasena(String contrasena) throws SQLException {
        final int iteraciones = 600_000;
        byte[] sal = new byte[16];
        new SecureRandom().nextBytes(sal);
        char[] chars = contrasena.toCharArray();
        PBEKeySpec spec = new PBEKeySpec(chars, sal, iteraciones, 256);
        try {
            byte[] hash = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
            String resultado = "pbkdf2_sha256$" + iteraciones + "$" + Base64.getEncoder().encodeToString(sal) + "$" + Base64.getEncoder().encodeToString(hash);
            Arrays.fill(hash, (byte) 0);
            return resultado;
        } catch (GeneralSecurityException e) {
            throw new SQLException("No fue posible proteger la contraseña", e);
        } finally {
            spec.clearPassword();
            Arrays.fill(chars, '\0');
        }
    }

    public boolean eliminar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("DELETE FROM usuario WHERE id_usuario=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean desactivar(long id) throws SQLException {
        try (Connection c = Conexion.abrir(); PreparedStatement ps = c.prepareStatement("UPDATE usuario SET estado=0 WHERE id_usuario=?")) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }
}
