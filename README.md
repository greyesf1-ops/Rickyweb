# RickySafe Maintenance

Sistema web para automatizar y validar protocolos de seguridad industrial durante el mantenimiento de juegos de Rickylandia.

## Estado actual

Base actual del proyecto:

- Estructura de frontend, backend, base de datos y documentación.
- Esquema inicial de PostgreSQL.
- Datos iniciales para roles, usuarios, juegos, protocolos y pasos.
- Backend preparado para Express, JWT, PostgreSQL, auditoría, evidencias y reportes.
- Seguridad con usuarios desactivables, contraseña temporal obligatoria y hash Argon2id para contraseñas nuevas.
- Verificación obligatoria de EPP antes de enviar mantenimientos a revisión.
- Alertas al ingeniero de turno o encargado de área cuando un técnico intenta continuar sin EPP completo.
- Vista previa navegable sin dependencias en `frontend/preview/index.html`.
- Endurecimiento de autenticación, protección de evidencias, límites de carga y validaciones iniciales automatizadas.
- Guia de VPS con Nginx, PM2, PostgreSQL y build de React.
- Validacion de GitHub Actions para revisar backend y construir frontend.

## Integración actual

La aplicación React usa la API Express y PostgreSQL para iniciar sesión y consultar o modificar mantenimientos, equipos, inventario, usuarios, alertas, reportes y auditoría. La carpeta `frontend/preview` sigue siendo una demostración independiente con datos ficticios; no guarda cambios en la base de datos.

Las órdenes registran cambios de estado, responsable, fecha y motivo; incluyen checklist y evidencias autenticadas. La mano de obra se calcula con la tarifa por hora que tenía el usuario cuando registró el tiempo. Los repuestos usan costo promedio ponderado en entradas y guardan el costo unitario al momento de su consumo. Los ciclos recurrentes evitan duplicados por fecha prevista.

## Guia rapida

Este README es el documento principal del repositorio. Los README dentro de `frontend` y `backend` quedan como referencia especifica de cada parte.

## Vista previa local

Para revisar la interfaz sin instalar dependencias, abre este archivo con doble clic:

```text
frontend/preview/index.html
```

La vista previa usa datos ficticios locales y no inicia sesión en la API. Las credenciales solo sirven dentro de esa simulación:

```text
Correo: admin@rickysafe.local
Contraseña: admin123
```

No uses estas credenciales en la aplicación desplegada. Para probar la aplicación con API, configura usuarios en PostgreSQL y usa una contraseña propia. Si quieres probar la vista previa en `http://127.0.0.1:4173/`, abre Terminal en `frontend/preview` y ejecuta:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

También puedes usar el archivo de arranque incluido:

```text
iniciar-preview-8080.command
```

Ese archivo abre la vista previa en:

```text
http://127.0.0.1:8080/
```

## Desarrollo local completo

Cuando tengas `npm` disponible:

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

Configura en `backend/.env` los datos de PostgreSQL y una clave JWT aleatoria (por ejemplo, genera una con `openssl rand -hex 32`). El backend ya no acepta `admin123` como acceso de respaldo ni puede emitir tokens sin `JWT_SECRET`.

```bash
cd frontend
npm install
npm run dev
```

Frontend esperado:

```text
http://localhost:5173
```

Backend esperado:

```text
http://localhost:3001
```

El frontend toma la URL de la API desde `VITE_API_URL`. En local puedes usar:

```text
VITE_API_URL=http://localhost:3001/api
```

Si frontend y API tienen orígenes distintos, añade el origen exacto del frontend a `CORS_ORIGINS`, separado por comas. La API permite por defecto los orígenes locales de Vite.

## Base de datos

Crear la base:

```sql
CREATE DATABASE rickysafe_db;
```

Ejecutar en este orden:

```text
database/schema.sql
database/seed.sql
```

Las cuentas de ejemplo creadas por `seed.sql` comparten inicialmente la clave `admin123` y quedan marcadas para cambiarla en el primer ingreso. El script no restablece contraseñas ni datos personales en ejecuciones posteriores. Cambia la clave inicial antes de usar esas cuentas.

El comando Docker aplica el esquema y los datos iniciales antes de iniciar la API; un error de migración detiene el servicio para evitar que quede parcialmente operativo. El esquema incluido está pensado para conservar datos existentes y usa sentencias repetibles, pero se recomienda respaldo antes de actualizaciones.

## Seguridad y verificaciones

- El login limita a 10 solicitudes por IP cada 15 minutos en cada instancia. En despliegues con varias réplicas, usa además un limitador compartido en el proxy.
- Los archivos de evidencia ya no se publican como contenido estático. Se cargan y descargan desde las rutas autenticadas de evidencias de la orden.
- Las cargas admiten JPEG, PNG, PDF, DOCX, XLSX y CSV hasta 10 MB. La validación MIME usa el tipo reportado por el navegador y no sustituye un análisis antimalware.
- Ejecuta `cd backend && npm test` para las pruebas unitarias disponibles y `npm run check` para sintaxis.
- Ejecuta `cd frontend && npm ci && npm run build` para comprobar el build del frontend.

## Módulos

- Autenticación.
- Usuarios y roles.
- Juegos o atracciones.
- Inventario de repuestos.
- Alertas de seguridad EPP.
- Protocolos y pasos obligatorios.
- Órdenes de mantenimiento.
- Checklist de seguridad.
- Evidencias.
- Validación por supervisor.
- Reportes.
- Auditoría.

## Despliegue

La guía para publicar en VPS está en:

```text
docs/despliegue-vps.md
```

Resumen recomendado para entrega con Docker:

1. Subir este proyecto a GitHub.
2. Crear la VPS con Ubuntu LTS.
3. Clonar el repositorio en `/opt/rickysafe`.
4. Crear `.env` desde `.env.docker.example`.
5. Levantar todo con `sudo docker compose -p rickysafe up -d --build`.
6. Abrir `http://IP_DE_LA_VPS` sin puerto adicional.

## GitHub Actions

El flujo en `.github/workflows/validate.yml` valida:

- Instalacion del backend.
- Revision de sintaxis del backend con `npm run check`.
- Instalacion del frontend.
- Build de produccion del frontend.

El workflow `.github/workflows/validate.yml` valida cada rama y pull request con PostgreSQL temporal, migración, pruebas de API, sintaxis y build del frontend. El workflow `.github/workflows/deploy-vps.yml` despliega automáticamente solo al recibir cambios en `main`; publicar una rama de trabajo no despliega el sistema.

Consulta [docs/operacion.md](docs/operacion.md) para instalar, actualizar, respaldar y recuperar el sistema.
