# Asistente inteligente de RickySafe

El módulo está disponible en el menú **Asistente inteligente** y ofrece cuatro funciones:

- Generar reportes ejecutivos.
- Recomendar acciones de mantenimiento.
- Resumir alertas por prioridad.
- Identificar riesgos posibles en evidencias y descripciones.

## Activar OpenAI

1. Copia `backend/.env.example` como `.env`.
2. Define `OPENAI_API_KEY=tu_clave` y, opcionalmente, `OPENAI_MODEL=gpt-4o-mini`.
3. Ejecuta `docker compose up -d --build`.

La clave se usa únicamente en el backend. Nunca debe colocarse en `frontend/.env` ni en el código del navegador. Si no existe la clave, el sistema usa respuestas locales de respaldo para que la demostración siga funcionando sin conexión externa.

## Endpoint

`POST /api/asistente` requiere autenticación y roles Administrador, Supervisor o Auditor. Recibe `{ tipo, contexto }`, donde `tipo` puede ser `reporte`, `recomendaciones`, `alertas` o `riesgos`.

La salida es una orientación y no sustituye la inspección de seguridad ni la decisión del supervisor.
