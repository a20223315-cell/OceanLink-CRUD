package pe.edu.pucp.oceanlink;

import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/** Bean que representa una incidencia y sus segmentos afectados. */
public class Incidencia {
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter FORMULARIO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
    private long id;
    private String codigo = "";
    private String severidad = "MEDIA";
    private String fase = "DETECTADA";
    private Timestamp fechaDeteccion;
    private String descripcion = "";
    private Timestamp fechaRestauracion;
    private Timestamp fechaCierre;
    private String resultado = "";
    private long creadoPor;
    private String nombreCreador = "";
    private Timestamp fechaActualizacion;
    private List<Long> segmentos = new ArrayList<>();
    private String segmentosTexto = "Sin segmentos asociados";

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getSeveridad() { return severidad; }
    public void setSeveridad(String severidad) { this.severidad = severidad; }
    public String getFase() { return fase; }
    public void setFase(String fase) { this.fase = fase; }
    public Timestamp getFechaDeteccion() { return fechaDeteccion; }
    public void setFechaDeteccion(Timestamp fechaDeteccion) { this.fechaDeteccion = fechaDeteccion; }
    public String getFechaDeteccionTexto() { return formato(fechaDeteccion); }
    public String getFechaDeteccionInput() { return fechaDeteccion == null ? "" : fechaDeteccion.toLocalDateTime().format(FORMULARIO); }
    public String getFechaRestauracionTexto() { return formato(fechaRestauracion); }
    public Timestamp getFechaRestauracion() { return fechaRestauracion; }
    public void setFechaRestauracion(Timestamp valor) { fechaRestauracion = valor; }
    public Timestamp getFechaCierre() { return fechaCierre; }
    public void setFechaCierre(Timestamp valor) { fechaCierre = valor; }
    public String getFechaCierreTexto() { return formato(fechaCierre); }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public long getCreadoPor() { return creadoPor; }
    public void setCreadoPor(long creadoPor) { this.creadoPor = creadoPor; }
    public String getNombreCreador() { return nombreCreador; }
    public void setNombreCreador(String valor) { nombreCreador = valor; }
    public Timestamp getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(Timestamp valor) { fechaActualizacion = valor; }
    public String getFechaActualizacionTexto() { return formato(fechaActualizacion); }
    public List<Long> getSegmentos() { return segmentos; }
    public void setSegmentos(List<Long> valores) { segmentos = valores; }
    public String getSegmentosTexto() { return segmentosTexto; }
    public void setSegmentosTexto(String valor) { segmentosTexto = valor; }
    private String formato(Timestamp valor) {
        return valor == null ? "—" : valor.toLocalDateTime().format(FECHA);
    }

    public static class Observacion {
        private String fase;
        private String descripcion;
        private String autor;
        private Timestamp fecha;
        public Observacion(String fase, String descripcion, String autor, Timestamp fecha) {
            this.fase = fase; this.descripcion = descripcion; this.autor = autor; this.fecha = fecha;
        }
        public String getFase() { return fase; }
        public String getDescripcion() { return descripcion; }
        public String getAutor() { return autor; }
        public String getFechaTexto() { return fecha == null ? "" : fecha.toLocalDateTime().format(FECHA); }
    }
}
