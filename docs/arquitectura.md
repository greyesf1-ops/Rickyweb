# Arquitectura

```text
Frontend React/Vite -> Backend Node/Express -> PostgreSQL
```

## Frontend

Interfaz de panel administrativo para gestionar usuarios, juegos, inventario, protocolos, mantenimientos, checklist, evidencias, validaciones y reportes.

## Backend

API REST responsable de autenticacion, control de roles, reglas de negocio, carga de archivos, reportes y auditoria.

## Base de datos

PostgreSQL guarda usuarios, roles, juegos, inventario de repuestos, productos cambiados, protocolos, pasos, mantenimientos, checklist, evidencias, validaciones, reportes generados y auditoria.

## Flujo principal

1. El tecnico crea una orden de mantenimiento.
2. El sistema carga el checklist del protocolo.
3. El tecnico verifica EPP y adjunta evidencia obligatoria.
4. Si no tiene EPP completo, el sistema bloquea el procedimiento y genera alerta.
5. El tecnico marca pasos y adjunta evidencias.
6. El tecnico registra repuestos cambiados si aplica.
7. El sistema descuenta stock y vincula evidencia.
8. El sistema valida EPP, evidencia y pasos obligatorios.
9. El tecnico envia a revision.
10. El supervisor aprueba o rechaza.
11. El sistema actualiza estado, historial y auditoria.
