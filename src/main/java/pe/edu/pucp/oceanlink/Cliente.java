package pe.edu.pucp.oceanlink;

public class Cliente {
    private long id;
    private String codigo;
    private String razonSocial;
    private String tipoIdentificacion;
    private String identificacionFiscal;
    private String nombreContacto;
    private String correoContacto;
    private String telefonoContacto;
    private int estado = 1;
    private int servicios;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getTipoIdentificacion() { return tipoIdentificacion; }
    public void setTipoIdentificacion(String tipoIdentificacion) { this.tipoIdentificacion = tipoIdentificacion; }
    public String getIdentificacionFiscal() { return identificacionFiscal; }
    public void setIdentificacionFiscal(String identificacionFiscal) { this.identificacionFiscal = identificacionFiscal; }
    public String getNombreContacto() { return nombreContacto; }
    public void setNombreContacto(String nombreContacto) { this.nombreContacto = nombreContacto; }
    public String getCorreoContacto() { return correoContacto; }
    public void setCorreoContacto(String correoContacto) { this.correoContacto = correoContacto; }
    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }
    public int getEstado() { return estado; }
    public void setEstado(int estado) { this.estado = estado; }
    public String getEstadoTexto() { return estado == 1 ? "Activo" : "Inactivo"; }
    public int getServicios() { return servicios; }
    public void setServicios(int servicios) { this.servicios = servicios; }
}
