function crearNombreExcel(tipoReporte) {
  return `rickysafe-${tipoReporte || 'reporte'}.xlsx`;
}

module.exports = { crearNombreExcel };

