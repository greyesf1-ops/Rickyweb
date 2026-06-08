# RickySafe Maintenance

Sistema web para automatizar y validar protocolos de seguridad industrial durante el mantenimiento de juegos de Rickylandia.

## Estado actual

Primera base del proyecto creada con:

- Estructura de frontend, backend, base de datos y documentación.
- Esquema inicial de PostgreSQL.
- Datos iniciales para roles, usuarios, juegos, protocolos y pasos.
- Backend preparado para Express, JWT, PostgreSQL, auditoría, evidencias y reportes.
- Seguridad con usuarios desactivables, contraseña temporal obligatoria y hash Argon2id para contraseñas nuevas.
- Verificación obligatoria de EPP antes de enviar mantenimientos a revisión.
- Alertas al ingeniero de turno o encargado de área cuando un técnico intenta continuar sin EPP completo.
- Vista previa navegable sin dependencias en `frontend/preview/index.html`.
- Guia de VPS con Nginx, PM2, PostgreSQL y build de React.
- Validacion de GitHub Actions para revisar backend y construir frontend.

## Guia rapida

Este README es el documento principal del repositorio. Los README dentro de `frontend` y `backend` quedan como referencia especifica de cada parte.

## Vista previa local

Para revisar la interfaz sin instalar dependencias, abre este archivo con doble clic:

```text
frontend/preview/index.html
```

Credenciales sugeridas:

```text
Correo: admin@rickysafe.local
Contraseña: admin123
```

Si quieres probarlo con una URL local como `http://127.0.0.1:4173/`, abre Terminal en la carpeta `frontend/preview` y ejecuta:

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
npm install
npm run dev
```

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

## Base de datos

Crear la base:

```sql
CREATE DATABASE rickysafe_db;
```

Ejecutar:

```text
database/schema.sql
database/seed.sql
```

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

Resumen recomendado para entrega:

1. Subir este proyecto a GitHub.
2. Crear la VPS con Ubuntu LTS.
3. Clonar el repositorio en `/var/www/rickysafe`.
4. Configurar `backend/.env` y `frontend/.env.production`.
5. Ejecutar migracion/seed de PostgreSQL.
6. Construir frontend con `npm run build`.
7. Servir `frontend/dist` con Nginx y correr la API con PM2.

## GitHub Actions

El flujo en `.github/workflows/validate.yml` valida:

- Instalacion del backend.
- Revision de sintaxis del backend con `npm run check`.
- Instalacion del frontend.
- Build de produccion del frontend.

Para despliegue automatico a VPS se pueden agregar acciones despues, pero hacen falta secretos como `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` y la ruta final del proyecto.
