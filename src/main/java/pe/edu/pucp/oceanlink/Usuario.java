package pe.edu.pucp.oceanlink;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Usuario {
    private long id;
    private String codigo;
    private String nombre;
    private String correo;
    private String telefono;
    private long rolId;
    private String rol;
    private long paisId;
    private String pais;
    private int estado;
    private LocalDateTime fechaIngreso;
    private LocalDateTime fechaPrimeraActivacion;
    private LocalDateTime ultimoAcceso;
    private String contrasena;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public long getRolId() { return rolId; }
    public void setRolId(long rolId) { this.rolId = rolId; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public long getPaisId() { return paisId; }
    public void setPaisId(long paisId) { this.paisId = paisId; }
    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }
    public int getEstado() { return estado; }
    public void setEstado(int estado) { this.estado = estado; }
    public LocalDateTime getFechaIngreso() { return fechaIngreso; }
    public void setFechaIngreso(LocalDateTime fechaIngreso) { this.fechaIngreso = fechaIngreso; }
    public LocalDateTime getFechaPrimeraActivacion() { return fechaPrimeraActivacion; }
    public void setFechaPrimeraActivacion(LocalDateTime fechaPrimeraActivacion) { this.fechaPrimeraActivacion = fechaPrimeraActivacion; }
    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }
    public String getUltimoAccesoTexto() {
        return ultimoAcceso == null ? "—" : ultimoAcceso.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }
    public String getEstadoTexto() {
        if (estado == 1) return "Activo";
        return fechaPrimeraActivacion == null ? "Pendiente de activación" : "Inactivo";
    }
}
