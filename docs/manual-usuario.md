# Manual de usuario

## Inicio de sesion

Ingresa correo y contrasena. El sistema mostrara las opciones disponibles segun el rol asignado.

## Dashboard

Muestra resumen de mantenimientos, estados, juegos atendidos, evidencias y validaciones recientes.

## Usuarios

Permite consultar usuarios y cambiar su estado entre activo e inactivo. Un usuario inactivo no debe iniciar sesion, pero sus mantenimientos, validaciones y acciones de auditoria permanecen en el historial.

El administrador puede crear usuarios con contraseña temporal. En el primer ingreso, el trabajador debe cambiarla por una contraseña propia con mayuscula, minuscula, numero, simbolo y minimo 10 caracteres.

## Juegos

Permite registrar atracciones, ubicarlas y cambiar su estado operativo.

## Inventario

Permite consultar repuestos disponibles, detectar bajo stock y revisar productos cambiados por usuario. Cuando un tecnico registra un repuesto usado en una orden, el sistema descuenta la cantidad del inventario y vincula evidencia del cambio.

## Protocolos

Permite crear protocolos de seguridad y definir pasos obligatorios.

## Mantenimientos

Permite crear ordenes, seleccionar juego, tecnico y protocolo, completar checklist, adjuntar evidencias y enviar a revision.

Antes de enviar a revision, el tecnico debe verificar su equipo de proteccion personal y adjuntar evidencia. Si marca que no tiene EPP completo, el procedimiento queda bloqueado y se genera una alerta para el ingeniero de turno o encargado de area.

## Alertas

Permite revisar intentos de mantenimiento sin EPP completo. El ingeniero de turno o encargado de area puede atender la alerta y dejar trazabilidad.

## Validaciones

El supervisor revisa la informacion, aprueba o rechaza. Todo rechazo debe incluir observaciones.

## Reportes

Permite filtrar informacion por fechas, juego, estado, tecnico, supervisor, tipo de mantenimiento y protocolo.

Los reportes se pueden exportar como CSV, Excel o PDF. El PDF sirve para revisar, imprimir o guardar una version formal del reporte sin depender de una hoja de calculo.
