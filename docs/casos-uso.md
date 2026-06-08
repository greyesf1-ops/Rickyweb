# Casos de uso

## CU-01 Iniciar sesion

Actor: usuario registrado.

Resultado: el sistema valida credenciales y abre el panel segun el rol.

## CU-02 Registrar mantenimiento

Actor: tecnico.

Resultado: se crea una orden asociada a juego, tecnico, tipo de mantenimiento y protocolo.

## CU-03 Completar checklist

Actor: tecnico.

Resultado: el sistema guarda pasos cumplidos, no cumplidos y observaciones.

## CU-04 Enviar a revision

Actor: tecnico.

Resultado: la orden cambia a estado En revision si todos los pasos obligatorios estan cumplidos.

## CU-05 Validar mantenimiento

Actor: supervisor.

Resultado: el supervisor aprueba o rechaza la orden. Si rechaza, debe registrar observaciones.

## CU-06 Generar reporte

Actor: administrador, supervisor o auditor autorizado.

Resultado: el sistema muestra y exporta informacion filtrada por fecha, juego, tecnico, supervisor, estado, tipo o protocolo.

## CU-07 Registrar repuesto cambiado

Actor: tecnico.

Resultado: el sistema registra el repuesto usado en una orden de mantenimiento, descuenta inventario, vincula evidencia y conserva trazabilidad por usuario.

## CU-08 Verificar EPP obligatorio

Actor: tecnico.

Resultado: el sistema valida evidencia de equipo de proteccion personal antes de permitir enviar la orden a revision.

## CU-09 Alertar falta de EPP

Actor: tecnico.

Resultado: si el tecnico indica que no tiene EPP completo, el sistema bloquea el procedimiento y notifica al ingeniero de turno o encargado de area.

## CU-10 Cambiar contraseña temporal

Actor: usuario nuevo.

Resultado: el sistema obliga a cambiar la contraseña temporal por una contraseña segura antes de continuar.
