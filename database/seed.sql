INSERT INTO roles (nombre_rol, descripcion) VALUES
('Administrador', 'Usuario con acceso total al sistema'),
('Supervisor', 'Usuario encargado de validar mantenimientos'),
('Tecnico', 'Usuario encargado de registrar mantenimientos'),
('Auditor', 'Usuario encargado de consultar historial y reportes')
ON CONFLICT (nombre_rol) DO NOTHING;

INSERT INTO usuarios (id_rol, nombre_completo, correo, usuario, contrasena) VALUES
((SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador'), 'Georgean Reyes', 'admin@rickysafe.local', 'admin', crypt('admin123', gen_salt('bf'))),
((SELECT id_rol FROM roles WHERE nombre_rol = 'Supervisor'), 'Supervisor de Seguridad', 'supervisor@rickysafe.local', 'supervisor', crypt('admin123', gen_salt('bf'))),
((SELECT id_rol FROM roles WHERE nombre_rol = 'Tecnico'), 'Tecnico de Mantenimiento', 'tecnico@rickysafe.local', 'tecnico', crypt('admin123', gen_salt('bf'))),
((SELECT id_rol FROM roles WHERE nombre_rol = 'Auditor'), 'Auditor Interno', 'auditor@rickysafe.local', 'auditor', crypt('admin123', gen_salt('bf')))
ON CONFLICT (correo) DO NOTHING;

UPDATE usuarios
SET
    debe_cambiar_contrasena = FALSE,
    departamento = CASE correo
        WHEN 'admin@rickysafe.local' THEN 'Administracion'
        WHEN 'supervisor@rickysafe.local' THEN 'Seguridad industrial'
        WHEN 'tecnico@rickysafe.local' THEN 'Mantenimiento'
        WHEN 'auditor@rickysafe.local' THEN 'Auditoria'
        ELSE departamento
    END,
    turno = CASE correo
        WHEN 'admin@rickysafe.local' THEN 'Diurno'
        WHEN 'supervisor@rickysafe.local' THEN 'Mixto'
        WHEN 'tecnico@rickysafe.local' THEN 'Matutino'
        WHEN 'auditor@rickysafe.local' THEN 'Diurno'
        ELSE turno
    END,
    telefono = CASE correo
        WHEN 'admin@rickysafe.local' THEN '5555-0101'
        WHEN 'supervisor@rickysafe.local' THEN '5555-0202'
        WHEN 'tecnico@rickysafe.local' THEN '5555-0303'
        WHEN 'auditor@rickysafe.local' THEN '5555-0404'
        ELSE telefono
    END,
    ultimo_acceso = CASE correo
        WHEN 'admin@rickysafe.local' THEN '2026-06-07 00:30'::timestamp
        WHEN 'supervisor@rickysafe.local' THEN '2026-06-06 23:45'::timestamp
        WHEN 'tecnico@rickysafe.local' THEN '2026-06-06 22:15'::timestamp
        WHEN 'auditor@rickysafe.local' THEN '2026-06-07 00:25'::timestamp
        ELSE ultimo_acceso
    END
WHERE correo IN (
    'admin@rickysafe.local',
    'supervisor@rickysafe.local',
    'tecnico@rickysafe.local',
    'auditor@rickysafe.local'
);

INSERT INTO alertas_seguridad (id_mantenimiento, id_usuario, destinatario, prioridad, estado, mensaje, fecha_creacion, fecha_atencion)
SELECT NULL, u.id_usuario, 'Ingeniero de turno', 'Alta', 'Atendida', 'Intento de procedimiento sin verificacion completa de EPP en orden 3.', '2026-06-06 22:00'::timestamp, '2026-06-06 22:15'::timestamp
FROM usuarios u
WHERE u.correo = 'tecnico@rickysafe.local'
  AND NOT EXISTS (
      SELECT 1 FROM alertas_seguridad a WHERE a.mensaje = 'Intento de procedimiento sin verificacion completa de EPP en orden 3.'
  );

INSERT INTO juegos (codigo_juego, nombre_juego, tipo_juego, ubicacion, descripcion, estado_operativo) VALUES
('JUEGO-001', 'Rueda Mecanica', 'Mecanico', 'Zona principal', 'Juego mecanico de rotacion para visitantes', 'Activo'),
('JUEGO-002', 'Carros Chocones', 'Electrico', 'Zona familiar', 'Atraccion electrica con vehiculos individuales', 'Activo'),
('JUEGO-003', 'Carrusel', 'Mecanico', 'Zona infantil', 'Atraccion giratoria infantil', 'Activo'),
('JUEGO-004', 'Tren Infantil', 'Mecanico', 'Zona infantil', 'Recorrido sobre rieles para ninos', 'Activo')
ON CONFLICT (codigo_juego) DO NOTHING;

INSERT INTO inventario_repuestos (codigo_repuesto, nombre_repuesto, categoria, unidad, stock_actual, stock_minimo, ubicacion) VALUES
('REP-001', 'Cojinete 6204', 'Rodamientos', 'Unidad', 18, 6, 'Bodega A'),
('REP-002', 'Correa industrial A-42', 'Transmision', 'Unidad', 9, 4, 'Bodega A'),
('REP-003', 'Sensor de proximidad', 'Electrico', 'Unidad', 5, 3, 'Bodega B'),
('REP-004', 'Tornillo grado 8', 'Fijacion', 'Caja', 3, 5, 'Bodega C')
ON CONFLICT (codigo_repuesto) DO NOTHING;

INSERT INTO protocolos (nombre_protocolo, descripcion, tipo_mantenimiento, requiere_evidencia, estado) VALUES
('Protocolo de seguridad para mantenimiento electrico', 'Validacion de seguridad antes de intervenir sistemas electricos', 'Correctivo', TRUE, TRUE),
('Protocolo de seguridad para mantenimiento preventivo', 'Verificacion general antes, durante y despues del mantenimiento preventivo', 'Preventivo', TRUE, TRUE),
('Protocolo de seguridad para mantenimiento mecanico', 'Validacion de piezas, estructura, movimiento y seguridad mecanica', 'Periodico', TRUE, TRUE);

INSERT INTO pasos_protocolo (id_protocolo, descripcion_paso, obligatorio, orden)
SELECT p.id_protocolo, paso.descripcion, paso.obligatorio, paso.orden
FROM protocolos p
JOIN (
    VALUES
    ('Protocolo de seguridad para mantenimiento electrico', 'Confirmar apagado total del juego', TRUE, 1),
    ('Protocolo de seguridad para mantenimiento electrico', 'Verificar desconexion de energia', TRUE, 2),
    ('Protocolo de seguridad para mantenimiento electrico', 'Utilizar equipo de proteccion personal', TRUE, 3),
    ('Protocolo de seguridad para mantenimiento electrico', 'Revisar conexiones electricas', TRUE, 4),
    ('Protocolo de seguridad para mantenimiento electrico', 'Validar ausencia de cables expuestos', TRUE, 5),
    ('Protocolo de seguridad para mantenimiento electrico', 'Adjuntar evidencia fotografica', TRUE, 6),
    ('Protocolo de seguridad para mantenimiento preventivo', 'Inspeccionar estado general de la atraccion', TRUE, 1),
    ('Protocolo de seguridad para mantenimiento preventivo', 'Lubricar componentes moviles', TRUE, 2),
    ('Protocolo de seguridad para mantenimiento preventivo', 'Registrar observaciones tecnicas', FALSE, 3),
    ('Protocolo de seguridad para mantenimiento mecanico', 'Revisar anclajes y estructura', TRUE, 1),
    ('Protocolo de seguridad para mantenimiento mecanico', 'Verificar piezas moviles', TRUE, 2),
    ('Protocolo de seguridad para mantenimiento mecanico', 'Realizar prueba de funcionamiento', TRUE, 3)
) AS paso(nombre_protocolo, descripcion, obligatorio, orden)
ON p.nombre_protocolo = paso.nombre_protocolo
WHERE NOT EXISTS (
    SELECT 1
    FROM pasos_protocolo pp
    WHERE pp.id_protocolo = p.id_protocolo
      AND pp.orden = paso.orden
);

INSERT INTO auditoria (id_usuario, accion, modulo, descripcion, fecha_hora)
SELECT u.id_usuario, 'Auditoria finalizada y verificada', 'Auditoria', 'Revision final de datos de prueba y trazabilidad verificada', '2026-06-07 00:35'::timestamp
FROM usuarios u
WHERE u.correo = 'auditor@rickysafe.local'
  AND NOT EXISTS (
      SELECT 1 FROM auditoria a WHERE a.accion = 'Auditoria finalizada y verificada'
  );

INSERT INTO auditoria (id_usuario, accion, modulo, descripcion, fecha_hora)
SELECT u.id_usuario, 'Prueba de datos de usuarios existentes verificada', 'Usuarios', 'Usuarios existentes cargados con departamento, turno, telefono y ultimo acceso', '2026-06-07 00:32'::timestamp
FROM usuarios u
WHERE u.correo = 'admin@rickysafe.local'
  AND NOT EXISTS (
      SELECT 1 FROM auditoria a WHERE a.accion = 'Prueba de datos de usuarios existentes verificada'
  );
