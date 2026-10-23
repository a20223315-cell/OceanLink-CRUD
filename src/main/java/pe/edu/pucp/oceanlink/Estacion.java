package pe.edu.pucp.oceanlink;

import java.math.BigDecimal;

public class Estacion {
    private long id;
    private String codigo;
    private String nombre;
    private String ubicacion;
    private long paisId;
    private String pais;
    private BigDecimal capacidad;
    private String condicion;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
    public long getPaisId() { return paisId; }
    public void setPaisId(long paisId) { this.paisId = paisId; }
    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }
    public BigDecimal getCapacidad() { return capacidad; }
    public void setCapacidad(BigDecimal capacidad) { this.capacidad = capacidad; }
    public String getCondicion() { return condicion; }
    public void setCondicion(String condicion) { this.condicion = condicion; }
}
