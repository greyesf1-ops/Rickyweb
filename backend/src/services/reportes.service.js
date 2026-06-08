function resumirMantenimientos(mantenimientos) {
  return mantenimientos.reduce((resumen, mantenimiento) => {
    resumen.total += 1;
    resumen.por_estado[mantenimiento.estado] = (resumen.por_estado[mantenimiento.estado] || 0) + 1;
    resumen.por_tipo[mantenimiento.tipo_mantenimiento] = (resumen.por_tipo[mantenimiento.tipo_mantenimiento] || 0) + 1;
    return resumen;
  }, { total: 0, por_estado: {}, por_tipo: {} });
}

module.exports = { resumirMantenimientos };

