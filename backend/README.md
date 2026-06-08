# Backend

API REST preparada para Node.js, Express, JWT y PostgreSQL.

Este README es especifico del backend. La guia principal del proyecto esta en `../README.md`.

## Configuracion

1. Copiar `.env.example` como `.env`.
2. Crear la base `rickysafe_db`.
3. Ejecutar `database/schema.sql`.
4. Ejecutar `database/seed.sql`.
5. Instalar dependencias con `npm install`.
6. Ejecutar `npm run dev`.

## Variables de entorno

```text
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rickysafe_db
DB_USER=postgres
DB_PASSWORD=tu_contrasena
JWT_SECRET=clave_larga_y_segura
UPLOAD_PATH=src/uploads/evidencias
```

En produccion cambia `JWT_SECRET` y la contraseña de PostgreSQL antes de iniciar PM2.

## Endpoints base

- `POST /api/auth/login`
- `POST /api/auth/cambiar-contrasena`
- `GET /api/auth/perfil`
- `GET /api/usuarios`
- `PUT /api/usuarios/:id/estado`
- `GET /api/juegos`
- `GET /api/protocolos`
- `GET /api/inventario`
- `POST /api/inventario`
- `GET /api/inventario/movimientos`
- `GET /api/mantenimientos`
- `POST /api/mantenimientos`
- `PUT /api/mantenimientos/:id/epp`
- `POST /api/mantenimientos/:id/repuestos`
- `GET /api/mantenimientos/:id/repuestos`
- `POST /api/mantenimientos/:id/enviar-revision`
- `GET /api/alertas-seguridad`
- `PUT /api/alertas-seguridad/:id/atender`
- `POST /api/mantenimientos/:id/validar`
- `POST /api/mantenimientos/:id/rechazar`
- `GET /api/reportes/personalizado`
- `GET /api/auditoria`
- `GET /api/reportes/exportar/csv`
- `GET /api/reportes/exportar/excel`
- `GET /api/reportes/exportar/pdf`

## Seguridad de contraseñas

Los usuarios nuevos se crean con contraseña temporal y deben cambiarla al ingresar. Las contraseñas nuevas se guardan con Argon2id, que es un algoritmo libre y no es de pago. Los hashes bcrypt existentes se siguen aceptando para compatibilidad.
