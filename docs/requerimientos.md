# Requerimientos de RickySafe Maintenance

## Objetivo

Desarrollar un sistema web para automatizar y validar protocolos de seguridad industrial en el mantenimiento de juegos de Rickylandia.

## Roles

- Administrador: gestiona usuarios, juegos, protocolos, reportes y auditoria.
- Supervisor: revisa checklist, evidencias y aprueba o rechaza mantenimientos.
- Tecnico: crea ordenes de mantenimiento, completa checklist y adjunta evidencias.
- Auditor: consulta historial, reportes y evidencias sin modificar registros principales.

## Modulos principales

- Autenticacion.
- Usuarios.
- Juegos.
- Protocolos.
- Mantenimientos.
- Checklist.
- Evidencias.
- Inventario de repuestos.
- Validaciones.
- Historial.
- Reportes.
- Auditoria.

## Reglas principales

- Todo usuario debe iniciar sesion.
- Los permisos dependen del rol.
- Todo mantenimiento debe tener juego, tecnico y protocolo.
- No se puede enviar a revision si faltan pasos obligatorios.
- Todo rechazo debe incluir observaciones.
- Las acciones importantes deben guardarse en auditoria.
- El historial de mantenimiento no debe eliminarse fisicamente.
- Los usuarios no deben eliminarse fisicamente; si salen de la empresa, se desactivan para conservar trazabilidad e historial.
- Los repuestos cambiados deben quedar asociados al mantenimiento, usuario responsable, evidencia y stock de inventario.
- La verificacion de equipo de proteccion personal es obligatoria antes de enviar un mantenimiento a revision.
- Si un tecnico intenta continuar sin EPP completo, el sistema debe generar alerta para el ingeniero de turno o encargado de area.
- Los usuarios nuevos deben recibir contraseña temporal y cambiarla por una contraseña segura en su primer acceso.
