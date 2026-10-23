package pe.edu.pucp.oceanlink;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class SolicitudCapacidad {
    private long id;
    private String codigo;
    private long clienteId;
    private String cliente;
    private long estacionOrigenId;
    private String estacionOrigen;
    private long estacionDestinoId;
    private String estacionDestino;
    private long estadoId;
    private String estado;
    private BigDecimal capacidad;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaProvision;
    private String observacion;
    private long creadoPor;
    private String creador;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public long getClienteId() { return clienteId; }
    public void setClienteId(long clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public long getEstacionOrigenId() { return estacionOrigenId; }
    public void setEstacionOrigenId(long estacionOrigenId) { this.estacionOrigenId = estacionOrigenId; }
    public String getEstacionOrigen() { return estacionOrigen; }
    public void setEstacionOrigen(String estacionOrigen) { this.estacionOrigen = estacionOrigen; }
    public long getEstacionDestinoId() { return estacionDestinoId; }
    public void setEstacionDestinoId(long estacionDestinoId) { this.estacionDestinoId = estacionDestinoId; }
    public String getEstacionDestino() { return estacionDestino; }
    public void setEstacionDestino(String estacionDestino) { this.estacionDestino = estacionDestino; }
    public long getEstadoId() { return estadoId; }
    public void setEstadoId(long estadoId) { this.estadoId = estadoId; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public BigDecimal getCapacidad() { return capacidad; }
    public void setCapacidad(BigDecimal capacidad) { this.capacidad = capacidad; }
    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
    public LocalDateTime getFechaProvision() { return fechaProvision; }
    public void setFechaProvision(LocalDateTime fechaProvision) { this.fechaProvision = fechaProvision; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public long getCreadoPor() { return creadoPor; }
    public void setCreadoPor(long creadoPor) { this.creadoPor = creadoPor; }
    public String getCreador() { return creador; }
    public void setCreador(String creador) { this.creador = creador; }
    public String getFechaSolicitudTexto() {
        return fechaSolicitud == null ? "" : fechaSolicitud.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }
    public String getFechaProvisionInput() {
        return fechaProvision == null ? "" : fechaProvision.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
    }
}
