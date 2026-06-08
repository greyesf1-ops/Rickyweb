# Frontend

Interfaz preparada para React, Vite y Tailwind CSS.

Este README es especifico del frontend. La guia principal del proyecto esta en `../README.md`.

## Vista previa sin dependencias

Para pruebas normales sin instalar nada, abre este archivo con doble clic:

```text
frontend/preview/index.html
```

Credenciales:

```text
Correo: admin@rickysafe.local
Contraseña: admin123
```

## Desarrollo React

Cuando tengas `npm`, abre Terminal en la carpeta `frontend` y ejecuta:

```bash
npm install
npm run dev
```

La URL local sera:

```text
http://localhost:5173
```

Crear un archivo `.env` cuando quieras apuntar a otra API:

```text
VITE_API_URL=http://localhost:3001/api
```

Para produccion en la VPS normalmente se usa:

```text
VITE_API_URL=/api
```

## Prueba con servidor simple

Puedes abrir con doble clic este archivo desde la carpeta principal:

```text
iniciar-preview-8080.command
```

Luego entra a:

```text
http://127.0.0.1:8080/
```

Si el navegador no deja abrir bien el archivo directo, abre Terminal en la carpeta `frontend/preview` y ejecuta:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Luego entra a:

```text
http://127.0.0.1:4173/
```
