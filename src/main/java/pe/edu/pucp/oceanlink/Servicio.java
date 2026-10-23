package pe.edu.pucp.oceanlink;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/** Bean del servicio contratado y su ruta ordenada por segmentos. */
public class Servicio {
    private long id;
    private String codigo = "";
    private long solicitudId;
    private String codigoSolicitud = "";
    private String cliente = "";
    private String origen = "";
    private String destino = "";
    private BigDecimal capacidad = BigDecimal.ZERO;
    private String estado = "PENDIENTE";
    private Timestamp fechaActivacion;
    private Timestamp fechaCancelacion;
    private String rutaResumen = "Sin ruta asignada";
    private List<Long> segmentos = new ArrayList<>();

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public long getSolicitudId() { return solicitudId; }
    public void setSolicitudId(long solicitudId) { this.solicitudId = solicitudId; }
    public String getCodigoSolicitud() { return codigoSolicitud; }
    public void setCodigoSolicitud(String codigoSolicitud) { this.codigoSolicitud = codigoSolicitud; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public BigDecimal getCapacidad() { return capacidad; }
    public void setCapacidad(BigDecimal capacidad) { this.capacidad = capacidad; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Timestamp getFechaActivacion() { return fechaActivacion; }
    public void setFechaActivacion(Timestamp fechaActivacion) { this.fechaActivacion = fechaActivacion; }
    public Timestamp getFechaCancelacion() { return fechaCancelacion; }
    public void setFechaCancelacion(Timestamp fechaCancelacion) { this.fechaCancelacion = fechaCancelacion; }
    public String getRutaResumen() { return rutaResumen; }
    public void setRutaResumen(String rutaResumen) { this.rutaResumen = rutaResumen; }
    public List<Long> getSegmentos() { return segmentos; }
    public void setSegmentos(List<Long> segmentos) { this.segmentos = segmentos == null ? new ArrayList<>() : new ArrayList<>(segmentos); }
}
