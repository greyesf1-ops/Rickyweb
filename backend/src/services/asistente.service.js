const respuestasLocales = {
  reporte: 'Reporte sugerido: revisar mantenimientos por estado, horas ejecutadas, evidencias EPP y pendientes de validación. Exporta el PDF desde el módulo Reportes para conservar la trazabilidad.',
  recomendaciones: 'Recomendaciones: priorizar órdenes con estado Pendiente o En revisión, verificar EPP antes de intervenir y programar una inspección preventiva para equipos con horas acumuladas.',
  alertas: 'Resumen de alertas: atender primero las alertas de prioridad Alta, documentar observaciones y cerrar cada alerta únicamente después de validar la evidencia.',
  riesgos: 'Riesgos detectables: ausencia de casco, chaleco, gafas, guantes o botas; trabajo cerca de partes energizadas; falta de bloqueo y etiquetado; evidencia borrosa o sin fecha. Confirmar siempre con un responsable de seguridad.'
};

async function generarRespuesta({ tipo, contexto = '' }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { modo: 'local', contenido: respuestasLocales[tipo] || respuestasLocales.reporte };
  }

  const instrucciones = {
    reporte: 'Genera un reporte ejecutivo breve de mantenimiento con hallazgos, estado, riesgos y acciones.',
    recomendaciones: 'Entrega recomendaciones concretas y priorizadas para mantenimiento preventivo y seguridad industrial.',
    alertas: 'Resume las alertas por prioridad, riesgo y acción inmediata.',
    riesgos: 'Analiza la evidencia descrita y enumera riesgos de EPP, entorno y procedimiento. No reemplaces una inspección profesional.'
  };

  const respuesta = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: `${instrucciones[tipo] || instrucciones.reporte}\nContexto de RickySafe:\n${contexto}`,
      max_output_tokens: 500
    })
  });
  if (!respuesta.ok) {
    console.warn(`OpenAI respondió ${respuesta.status}; se usará respaldo local.`);
    return { modo: 'local', contenido: respuestasLocales[tipo] || respuestasLocales.reporte };
  }
  const datos = await respuesta.json();
  return { modo: 'openai', contenido: datos.output_text || 'No se obtuvo una respuesta.' };
}

module.exports = { generarRespuesta };
