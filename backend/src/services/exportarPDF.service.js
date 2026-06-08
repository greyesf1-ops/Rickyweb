function crearNombrePDF(tipoReporte) {
  return `rickysafe-${tipoReporte || 'reporte'}.pdf`;
}

module.exports = { crearNombrePDF };

