# Backend

API REST preparada para Node.js, Express, JWT y PostgreSQL.

Este README es especifico del backend. La guia principal del proyecto esta en `../README.md`.

## Configuracion

1. Copiar `.env.example` como `.env` y sustituir `JWT_SECRET` por una clave aleatoria de al menos 32 caracteres (`openssl rand -hex 32`).
2. Crear la base `rickysafe_db`.
3. Ejecutar `database/schema.sql`.
4. Ejecutar `database/seed.sql`.
5. Instalar dependencias con `npm install`.
6. Ejecutar `npm run dev`.

## Variables de entorno

```text
PORT=3001
TRUST_PROXY=0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rickysafe_db
DB_USER=postgres
DB_PASSWORD=tu_contrasena
JWT_SECRET=REEMPLAZA_POR_UNA_CLAVE_ALEATORIA_DE_32_CARACTERES_O_MAS
UPLOAD_PATH=src/uploads/evidencias
```

En producción configura un `JWT_SECRET` aleatorio de al menos 32 caracteres, distinto de los marcadores de ejemplo, y una contraseña de PostgreSQL robusta antes de iniciar PM2. El servidor aborta si se usa un secreto JWT débil o de ejemplo.

El endpoint de login está limitado a 10 solicitudes por IP en 15 minutos por instancia. Activa `TRUST_PROXY=1` si el backend está detrás de un único proxy confiable. En despliegues con varias réplicas, añade un limitador compartido. Las evidencias se descargan con autenticación desde `/api/evidencias/:id/archivo`; ya no se sirven como archivos públicos.

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
