# Despliegue en VPS

## Objetivo

Publicar RickySafe Maintenance en una VPS para acceder desde PC y celular mediante una IP o dominio.

## Componentes recomendados

- Ubuntu Server LTS.
- Nginx como servidor web.
- Node.js para el backend.
- PostgreSQL para base de datos.
- PM2 para mantener la API activa.
- Certificado SSL para HTTPS.

## Flujo de despliegue

```text
Usuario en celular o PC -> Nginx -> Frontend React -> API Node.js -> PostgreSQL
```

## Pasos generales

1. Instalar Node.js, PostgreSQL, Nginx y PM2.
2. Crear la base de datos `rickysafe_db`.
3. Ejecutar `database/schema.sql` y `database/seed.sql`.
4. Configurar `.env` del backend.
5. Instalar dependencias del backend y frontend.
6. Construir el frontend con `npm run build`.
7. Publicar el frontend con Nginx.
8. Ejecutar el backend con PM2.
9. Configurar HTTPS.

## Despliegue paso a paso en Ubuntu

### 1. Instalar paquetes

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Clonar el repositorio

```bash
sudo mkdir -p /var/www/rickysafe
sudo chown -R $USER:$USER /var/www/rickysafe
git clone URL_DE_TU_REPOSITORIO /var/www/rickysafe
cd /var/www/rickysafe
```

### 3. Crear base de datos

```bash
sudo -u postgres psql
```

Dentro de PostgreSQL:

```sql
CREATE DATABASE rickysafe_db;
CREATE USER rickysafe_user WITH PASSWORD 'CAMBIA_ESTA_CONTRASENA';
GRANT ALL PRIVILEGES ON DATABASE rickysafe_db TO rickysafe_user;
\q
```

Ejecutar estructura y datos iniciales:

```bash
sudo -u postgres psql -d rickysafe_db -f database/schema.sql
sudo -u postgres psql -d rickysafe_db -f database/seed.sql
```

### 4. Configurar backend

```bash
cd /var/www/rickysafe/backend
cp .env.example .env
nano .env
```

Valores recomendados:

```text
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rickysafe_db
DB_USER=rickysafe_user
DB_PASSWORD=CAMBIA_ESTA_CONTRASENA
JWT_SECRET=USA_UNA_CLAVE_LARGA_Y_PRIVADA
UPLOAD_PATH=src/uploads/evidencias
NODE_ENV=production
```

Instalar dependencias y crear carpeta de evidencias:

```bash
npm install
mkdir -p src/uploads/evidencias
```

### 5. Configurar frontend

```bash
cd /var/www/rickysafe/frontend
cp .env.production.example .env.production
npm install
npm run build
```

Para servir todo bajo la misma IP o dominio, `VITE_API_URL` debe quedar asi:

```text
VITE_API_URL=/api
```

### 6. Levantar API con PM2

```bash
cd /var/www/rickysafe
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```

Comprobar API:

```bash
curl http://127.0.0.1:3001/api/salud
```

Debe responder algo como:

```json
{"estado":"ok","sistema":"RickySafe Maintenance"}
```

### 7. Configurar Nginx

```bash
sudo cp deploy/nginx-rickysafe.conf.example /etc/nginx/sites-available/rickysafe
sudo nano /etc/nginx/sites-available/rickysafe
sudo ln -s /etc/nginx/sites-available/rickysafe /etc/nginx/sites-enabled/rickysafe
sudo nginx -t
sudo systemctl reload nginx
```

En el archivo cambia:

```text
server_name TU_DOMINIO_O_IP;
```

por la IP de la VPS o tu dominio.

### 8. Probar desde navegador

```text
http://IP_DE_LA_VPS
```

Para probar la API publica:

```text
http://IP_DE_LA_VPS/api/salud
```

### 9. HTTPS cuando ya tengas dominio

Con dominio configurado al servidor:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

Con solo IP publica no se recomienda configurar certificado SSL tradicional; lo normal es usar dominio.

## Actualizar una version nueva

Cuando subas cambios al repositorio:

```bash
cd /var/www/rickysafe
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart rickysafe-api
sudo systemctl reload nginx
```

## GitHub Actions

El repositorio incluye `.github/workflows/validate.yml` para validar cada push o pull request. Esto no despliega automaticamente; solo confirma que el backend carga y que el frontend compila.

Para despliegue automatico por Actions harian falta secretos de GitHub:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
VPS_PATH=/var/www/rickysafe
```

## Archivos de apoyo

```text
deploy/nginx-rickysafe.conf.example
deploy/ecosystem.config.js
```

## Acceso

Con IP:

```text
http://IP-DE-LA-VPS
```

Con dominio:

```text
https://rickysafe.com
```

## Celular y PC

El sistema usa diseño responsivo y menú hamburguesa, por lo que puede utilizarse desde escritorio, tablet y celular.

## Escalabilidad

Para más de mil usuarios registrados, PostgreSQL y Node.js son adecuados si se configuran correctamente.

Recomendaciones:

- Usar paginación en tablas grandes.
- Agregar índices por fecha, estado, usuario, juego y mantenimiento.
- Guardar evidencias en almacenamiento organizado.
- Separar archivos pesados de la base de datos.
- Hacer respaldos automáticos.
- Monitorear CPU, RAM, disco y conexiones de base de datos.
- Usar HTTPS obligatorio.
- Mantener auditoría para trazabilidad.

## Inventario y evidencias

El sistema permite registrar repuestos cambiados por mantenimiento, por ejemplo un cojinete en un juego de caballos. Cada cambio queda vinculado a:

- Orden de mantenimiento.
- Juego.
- Técnico o usuario que registró el cambio.
- Repuesto usado.
- Cantidad.
- Evidencia.
- Observaciones.
- Fecha.
