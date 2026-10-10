# Operación de RickySafe

## Instalación

Requisitos: Git, Docker Engine con Docker Compose y un servidor Linux actualizado. Clona el repositorio, crea la configuración privada y arranca los servicios:

```bash
git clone https://github.com/greyesf1-ops/Rickyweb.git /opt/rickysafe
cd /opt/rickysafe
cp .env.docker.example .env
nano .env
sudo docker compose -p rickysafe up -d --build
sudo docker compose -p rickysafe ps
```

Configura `POSTGRES_PASSWORD` y `JWT_SECRET` en `.env`; usa valores aleatorios privados, conserva ese archivo fuera de Git y no compartas la clave JWT. La base se inicializa con `database/schema.sql` y `database/seed.sql`. Para desarrollo local, sigue la sección de desarrollo del README y ejecuta `npm ci` en `backend` y `frontend`.

## Actualización

Antes de actualizar, respalda tanto PostgreSQL como los archivos de evidencias. Después:

```bash
cd /opt/rickysafe
git pull --ff-only origin main
sudo docker compose -p rickysafe up -d --build
sudo docker compose -p rickysafe ps
curl --fail http://127.0.0.1/api/salud
```

El backend aplica el esquema SQL al iniciar. El esquema está escrito para ser repetible; de todos modos, verifica la salida del servicio y no continúes si la migración reporta error.

## Respaldo

Ejecuta los comandos en `/opt/rickysafe`. El archivo SQL se crea con permisos solo para el usuario actual. Mantén las copias en almacenamiento protegido y fuera del repositorio:

```bash
umask 077
mkdir -p /opt/rickysafe-backups
sudo docker compose -p rickysafe exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "/opt/rickysafe-backups/db-$(date +%F-%H%M%S).dump"
sudo docker run --rm -v rickysafe_evidencias:/data -v /opt/rickysafe-backups:/backup alpine:3.20 tar -czf /backup/evidencias-$(date +%F-%H%M%S).tar.gz -C /data .
```

Automatiza estos comandos con la política de retención de tu organización y copia las salidas a otro dispositivo cifrado. Comprueba periódicamente que los archivos se puedan leer y restaurar.

## Recuperación

La restauración reemplaza los datos actuales de la base o las evidencias. Aísla el servicio, confirma que elegiste los respaldos correctos y guarda una copia del estado actual antes de seguir. Para restaurar la base desde un dump personalizado:

```bash
cd /opt/rickysafe
sudo docker compose -p rickysafe stop backend
cat /opt/rickysafe-backups/db-FECHA-HORA.dump | sudo docker compose -p rickysafe exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner'
```

Para reponer evidencias en el volumen:

```bash
sudo docker compose -p rickysafe stop backend
sudo docker run --rm -v rickysafe_evidencias:/data -v /opt/rickysafe-backups:/backup alpine:3.20 sh -c 'tar -xzf /backup/evidencias-FECHA-HORA.tar.gz -C /data'
sudo docker compose -p rickysafe up -d backend web
sudo docker compose -p rickysafe logs --tail=100 backend
curl --fail http://127.0.0.1/api/salud
```

Sustituye `FECHA-HORA` por el nombre real del respaldo. Restaura la base y las evidencias del mismo punto de respaldo para conservar los vínculos entre archivos y órdenes. Revisa el acceso con una cuenta de prueba y los registros antes de abrir el servicio a los usuarios.

## Costos y trazabilidad

- La mano de obra se calcula como horas registradas por la tarifa del usuario guardada en ese registro. Cambiar una tarifa solo afecta horas nuevas.
- Cada repuesto consumido conserva su costo al momento de la salida; las entradas de inventario actualizan el costo mediante promedio ponderado.
- Los cambios de estado, asignaciones, EPP y checklist quedan en el historial de la orden. Los registros de actores usan referencias que admiten desactivar o eliminar una cuenta sin borrar el evento.
- Las programaciones crean como máximo una orden por fecha prevista; el botón **Generar vencidas** permite procesar fechas desde la pantalla de órdenes.
