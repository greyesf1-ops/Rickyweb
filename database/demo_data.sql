-- Datos de demostracion para presentacion y pruebas de RickySafe.
-- Es idempotente para no duplicar juegos, inventario ni solicitudes conocidas.
INSERT INTO juegos (codigo_juego, nombre_juego, tipo_juego, ubicacion, descripcion)
VALUES
 ('JUEGO-005','Torre Infantil','Mecanico','Zona Norte','Torre de descenso para mantenimiento preventivo.'),
 ('JUEGO-006','Barco Pirata','Mecanico','Zona Central','Estructura oscilante con inspeccion de anclajes.'),
 ('JUEGO-007','Mini Montaña Rusa','Mecanico','Zona Sur','Revision de rieles, frenos y sensores.'),
 ('JUEGO-008','Laberinto Movil','Recreativo','Zona Familiar','Equipo de movimiento y control electrico.')
ON CONFLICT (codigo_juego) DO NOTHING;

INSERT INTO inventario_repuestos (codigo_repuesto, nombre_repuesto, categoria, unidad, stock_actual, stock_minimo, ubicacion)
VALUES
 ('REP-005','Sensor inductivo M18','Electrico','Unidad',8,3,'Bodega A'),
 ('REP-006','Rodamiento 6205 ZZ','Mecanico','Unidad',14,5,'Bodega A'),
 ('REP-007','Freno electromagnetico','Seguridad','Unidad',3,2,'Bodega B'),
 ('REP-008','Cable de control 4 hilos','Electrico','Metro',65,20,'Bodega B'),
 ('REP-009','Arnes de seguridad','EPP','Unidad',6,3,'Bodega EPP'),
 ('REP-010','Lentes de seguridad','EPP','Unidad',18,8,'Bodega EPP'),
 ('REP-011','Guantes anticorte','EPP','Par',12,6,'Bodega EPP'),
 ('REP-012','Botas punta de acero','EPP','Par',7,4,'Bodega EPP')
ON CONFLICT (codigo_repuesto) DO NOTHING;

INSERT INTO mantenimientos (id_juego,id_tecnico,id_protocolo,tipo_mantenimiento,descripcion,fecha_inicio,estado,epp_verificado,epp_evidencia,epp_observaciones,epp_fecha,observaciones)
SELECT j.id_juego, 3, p.id_protocolo, v.tipo, v.observaciones, v.fecha_inicio::timestamp, v.estado, v.epp_verificado, v.epp_evidencia, v.epp_observaciones, NULLIF(v.epp_fecha,'')::timestamp, v.observaciones
FROM (VALUES
 ('JUEGO-001','Correctivo','2026-10-01','Finalizada',true,'epp-rueda-completo.jpg','Casco, chaleco, gafas, guantes y botas verificados.','2026-10-01','Cambio de sensor y prueba electrica.'),
 ('JUEGO-002','Preventivo','2026-10-03','Validado',true,'epp-carros-completo.jpg','Equipo completo validado por supervisor.','2026-10-03','Ajuste de frenos y lubricacion.'),
 ('JUEGO-003','Periodico','2026-10-05','En revision',true,'epp-carrusel-completo.jpg','EPP completo; pendiente revisar evidencia final.','2026-10-05','Revision de anclajes y plataforma.'),
 ('JUEGO-004','Preventivo','2026-10-07','Pendiente',false,'','Falta evidencia de casco y proteccion ocular.','','Inspeccion inicial pendiente.'),
 ('JUEGO-005','Correctivo','2026-10-09','En proceso',true,'epp-torre-completo.jpg','Equipo completo y area delimitada.','2026-10-09','Reparacion de boton de emergencia.'),
 ('JUEGO-006','Preventivo','2026-10-11','Pendiente',false,'','Tecnico debe completar EPP antes de iniciar.','','Revision de pernos de estructura.'),
 ('JUEGO-007','Correctivo','2026-10-13','En revision',true,'epp-montana-completo.jpg','Proteccion completa verificada.','2026-10-13','Prueba de sensores de freno.'),
 ('JUEGO-008','Periodico','2026-10-15','Rechazado',false,'','Evidencia muestra ausencia de guantes.','','No aprobado por riesgo de atrapamiento.')
) AS v(codigo,tipo,fecha_inicio,estado,epp_verificado,epp_evidencia,epp_observaciones,epp_fecha,observaciones)
JOIN juegos j ON j.codigo_juego = v.codigo
JOIN LATERAL (SELECT id_protocolo FROM protocolos WHERE tipo_mantenimiento = v.tipo ORDER BY id_protocolo LIMIT 1) p ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM mantenimientos m WHERE m.id_juego=j.id_juego AND m.fecha_inicio::date=v.fecha_inicio::date);

INSERT INTO alertas_seguridad (id_mantenimiento,id_usuario,destinatario,prioridad,estado,mensaje)
SELECT m.id_mantenimiento, 1, 'Supervisor de Seguridad', v.prioridad, v.estado, v.mensaje
FROM (VALUES
 ('JUEGO-004','Alta','Pendiente','Orden pendiente: falta casco y proteccion ocular.'),
 ('JUEGO-006','Alta','Pendiente','Orden pendiente: validar EPP antes de comenzar.'),
 ('JUEGO-008','Alta','Pendiente','Riesgo detectado: trabajador sin guantes en zona de atrapamiento.'),
 ('JUEGO-001','Media','Atendida','Verificar cierre documental de mantenimiento correctivo.'),
 ('JUEGO-007','Media','Pendiente','Confirmar prueba final de frenos y sensores.')
) AS v(codigo,prioridad,estado,mensaje)
JOIN juegos j ON j.codigo_juego=v.codigo
JOIN mantenimientos m ON m.id_juego=j.id_juego
WHERE NOT EXISTS (SELECT 1 FROM alertas_seguridad a WHERE a.id_mantenimiento=m.id_mantenimiento AND a.mensaje=v.mensaje);

INSERT INTO auditoria (id_usuario,accion,modulo,descripcion)
SELECT 1, v.accion, v.modulo, v.descripcion
FROM (VALUES
 ('Carga de datos de demostracion','Sistema','Se agregaron juegos, inventario, mantenimientos, alertas y evidencias de prueba.'),
 ('Prueba de trazabilidad','Auditoria','Datos preparados para validar reportes, EPP y estados del flujo operativo.')
) AS v(accion,modulo,descripcion)
WHERE NOT EXISTS (SELECT 1 FROM auditoria a WHERE a.descripcion=v.descripcion);
