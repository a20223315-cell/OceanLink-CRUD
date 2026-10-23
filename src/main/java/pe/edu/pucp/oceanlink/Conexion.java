package pe.edu.pucp.oceanlink;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    public static Connection abrir() throws SQLException {
        String url = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/oceanlink_nuevo?useUnicode=true&characterEncoding=UTF-8");
        String usuario = System.getenv().getOrDefault("DB_USER", "root");
        String clave = System.getenv().getOrDefault("DB_PASSWORD", "");
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException ex) {
            throw new SQLException("No se encontró el controlador MySQL", ex);
        }
        return DriverManager.getConnection(url, usuario, clave);
    }
}
