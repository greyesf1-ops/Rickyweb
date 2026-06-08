# Despliegue en VPS

## Objetivo

Publicar RickySafe Maintenance en una VPS para acceder desde PC y celular mediante una IP o dominio.

## Componentes recomendados

- Ubuntu Server LTS.
- Docker y Docker Compose.
- Nginx dentro del contenedor web.
- Node.js dentro del contenedor backend.
- PostgreSQL dentro de un contenedor propio del proyecto.
- Certificado SSL para HTTPS.

## Flujo de despliegue

```text
Usuario en celular o PC -> IP publica puerto 80 -> rickysafe-web -> rickysafe-backend -> rickysafe-db
```

Este despliegue no toca el proyecto anterior `helpdesk-ai`. Usa otra carpeta, otro nombre de proyecto Docker y otros contenedores:

```text
/opt/rickysafe
rickysafe-web
rickysafe-backend
rickysafe-db
```

La web queda en:

```text
http://IP_DE_LA_VPS
```

No necesitas escribir `:8080` ni exponer PostgreSQL al exterior.

## Pasos generales

1. Instalar Docker en la VPS.
2. Clonar el repositorio en `/opt/rickysafe`.
3. Crear `.env` con contraseña de PostgreSQL y `JWT_SECRET`.
4. Levantar servicios con Docker Compose.
5. Abrir el puerto 80 en el firewall/security group.
6. Configurar HTTPS cuando tengas dominio.

## Despliegue recomendado con Docker

### 1. Entrar a la VPS

```bash
ssh ubuntu@IP_DE_LA_VPS
```

### 2. Instalar Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3. Clonar RickySafe sin tocar el proyecto anterior

```bash
sudo mkdir -p /opt/rickysafe
sudo chown -R $USER:$USER /opt/rickysafe
git clone https://github.com/greyesf1-ops/Rickyweb.git /opt/rickysafe
cd /opt/rickysafe
```

### 4. Crear variables de produccion

```bash
cp .env.docker.example .env
nano .env
```

Cambia estos valores:

```text
POSTGRES_PASSWORD=una_contrasena_segura
JWT_SECRET=una_clave_larga_privada
```

### 5. Levantar todo

```bash
sudo docker compose -p rickysafe up -d --build
sudo docker compose -p rickysafe ps
```

### 6. Probar

```bash
curl http://127.0.0.1/api/salud
```

Desde navegador:

```text
http://IP_DE_LA_VPS
```

### 7. Actualizar despues de un cambio

```bash
cd /opt/rickysafe
git pull origin main
sudo docker compose -p rickysafe up -d --build
sudo docker compose -p rickysafe ps
```

### 8. Ver logs si algo falla

```bash
sudo docker compose -p rickysafe logs -f backend
sudo docker compose -p rickysafe logs -f web
sudo docker compose -p rickysafe logs -f db
```

## GitHub Actions para despliegue manual

El workflow `.github/workflows/deploy-vps.yml` queda manual para que no falle antes de configurar secrets.

Agrega estos secrets en GitHub:

```text
VPS_HOST=IP_DE_LA_VPS
VPS_USER=ubuntu
APP_DIR=/opt/rickysafe
VPS_SSH_KEY=llave_privada_ssh
POSTGRES_PASSWORD=contrasena_segura_db
JWT_SECRET=clave_larga_privada
```

Luego ejecuta:

```text
Actions -> Deploy VPS -> Run workflow
```

## Archivos de apoyo

```text
docker-compose.yml
.env.docker.example
.github/workflows/deploy-vps.yml
.github/workflows/validate.yml
```

## Acceso

Con IP:

```text
http://IP_DE_LA_VPS
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
