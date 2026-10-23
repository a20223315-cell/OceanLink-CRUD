package pe.edu.pucp.oceanlink;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Segmento {
    private long id;
    private String codigo;
    private long estacionOrigenId;
    private String estacionOrigen;
    private long estacionDestinoId;
    private String estacionDestino;
    private BigDecimal capacidad;
    private int estado = 1;
    private String condicion = "OPERATIVO";
    private LocalDateTime fechaActualizacion;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public long getEstacionOrigenId() { return estacionOrigenId; }
    public void setEstacionOrigenId(long estacionOrigenId) { this.estacionOrigenId = estacionOrigenId; }
    public String getEstacionOrigen() { return estacionOrigen; }
    public void setEstacionOrigen(String estacionOrigen) { this.estacionOrigen = estacionOrigen; }
    public long getEstacionDestinoId() { return estacionDestinoId; }
    public void setEstacionDestinoId(long estacionDestinoId) { this.estacionDestinoId = estacionDestinoId; }
    public String getEstacionDestino() { return estacionDestino; }
    public void setEstacionDestino(String estacionDestino) { this.estacionDestino = estacionDestino; }
    public BigDecimal getCapacidad() { return capacidad; }
    public void setCapacidad(BigDecimal capacidad) { this.capacidad = capacidad; }
    public int getEstado() { return estado; }
    public void setEstado(int estado) { this.estado = estado; }
    public String getEstadoTexto() { return estado == 1 ? "Activo" : "Inactivo"; }
    public String getCondicion() { return condicion; }
    public void setCondicion(String condicion) { this.condicion = condicion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
    public String getFechaActualizacionTexto() {
        return fechaActualizacion == null ? "" : fechaActualizacion.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }
}
