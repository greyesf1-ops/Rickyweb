# Pruebas rápidas de entrega

## Arranque

```bash
docker compose up -d --build
docker compose ps
```

Debe verse PostgreSQL saludable y backend/web activos.

## Recorrido funcional

1. Abrir `http://localhost`.
2. Entrar con `admin@rickysafe.local` y `admin123`.
3. Revisar mantenimientos y abrir una orden.
4. Verificar EPP con evidencia.
5. Intentar enviar sin EPP para comprobar el bloqueo.
6. Consultar la alerta de seguridad.
7. Revisar checklist, evidencias, validación y reporte.

## Evidencias para la presentación

Capturar tres pantallas sencillas: dashboard después del login, formulario/resultado de EPP y alerta generada por falta de EPP. Guardarlas en `docs/evidencias/` con nombres `01-dashboard.png`, `02-epp.png` y `03-alerta.png`.

## Automatizado

```bash
cd backend && npm ci && npm run check && npm run test:api
cd ../frontend && npm ci && npm run build
```
