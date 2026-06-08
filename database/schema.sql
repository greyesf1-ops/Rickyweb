CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES roles(id_rol),
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    usuario VARCHAR(80) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    debe_cambiar_contrasena BOOLEAN DEFAULT FALSE,
    fecha_cambio_contrasena TIMESTAMP,
    departamento VARCHAR(100),
    turno VARCHAR(80),
    telefono VARCHAR(30),
    ultimo_acceso TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS turno VARCHAR(80);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_cambio_contrasena TIMESTAMP;

CREATE TABLE IF NOT EXISTS juegos (
    id_juego SERIAL PRIMARY KEY,
    codigo_juego VARCHAR(50) NOT NULL UNIQUE,
    nombre_juego VARCHAR(150) NOT NULL,
    tipo_juego VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150),
    descripcion TEXT,
    estado_operativo VARCHAR(50) DEFAULT 'Activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS protocolos (
    id_protocolo SERIAL PRIMARY KEY,
    nombre_protocolo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo_mantenimiento VARCHAR(80) NOT NULL,
    requiere_evidencia BOOLEAN DEFAULT TRUE,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pasos_protocolo (
    id_paso SERIAL PRIMARY KEY,
    id_protocolo INT NOT NULL REFERENCES protocolos(id_protocolo) ON DELETE CASCADE,
    descripcion_paso TEXT NOT NULL,
    obligatorio BOOLEAN DEFAULT TRUE,
    orden INT NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mantenimientos (
    id_mantenimiento SERIAL PRIMARY KEY,
    id_juego INT NOT NULL REFERENCES juegos(id_juego),
    id_tecnico INT NOT NULL REFERENCES usuarios(id_usuario),
    id_protocolo INT NOT NULL REFERENCES protocolos(id_protocolo),
    tipo_mantenimiento VARCHAR(80) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    epp_verificado BOOLEAN DEFAULT FALSE,
    epp_evidencia VARCHAR(255),
    epp_observaciones TEXT,
    epp_fecha TIMESTAMP,
    epp_notificado BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS epp_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS epp_evidencia VARCHAR(255);
ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS epp_observaciones TEXT;
ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS epp_fecha TIMESTAMP;
ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS epp_notificado BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS checklist_mantenimiento (
    id_checklist SERIAL PRIMARY KEY,
    id_mantenimiento INT NOT NULL REFERENCES mantenimientos(id_mantenimiento) ON DELETE CASCADE,
    id_paso INT NOT NULL REFERENCES pasos_protocolo(id_paso),
    cumplido BOOLEAN DEFAULT FALSE,
    observacion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_mantenimiento, id_paso)
);

CREATE TABLE IF NOT EXISTS evidencias (
    id_evidencia SERIAL PRIMARY KEY,
    id_mantenimiento INT NOT NULL REFERENCES mantenimientos(id_mantenimiento) ON DELETE CASCADE,
    id_usuario_subio INT REFERENCES usuarios(id_usuario),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tipo_archivo VARCHAR(50),
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE evidencias ADD COLUMN IF NOT EXISTS id_usuario_subio INT REFERENCES usuarios(id_usuario);

CREATE TABLE IF NOT EXISTS inventario_repuestos (
    id_repuesto SERIAL PRIMARY KEY,
    codigo_repuesto VARCHAR(50) NOT NULL UNIQUE,
    nombre_repuesto VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    unidad VARCHAR(40) DEFAULT 'Unidad',
    stock_actual NUMERIC(12,2) DEFAULT 0,
    stock_minimo NUMERIC(12,2) DEFAULT 0,
    ubicacion VARCHAR(150),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repuestos_mantenimiento (
    id_repuesto_mantenimiento SERIAL PRIMARY KEY,
    id_mantenimiento INT NOT NULL REFERENCES mantenimientos(id_mantenimiento) ON DELETE CASCADE,
    id_repuesto INT NOT NULL REFERENCES inventario_repuestos(id_repuesto),
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    evidencia VARCHAR(255),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alertas_seguridad (
    id_alerta SERIAL PRIMARY KEY,
    id_mantenimiento INT REFERENCES mantenimientos(id_mantenimiento) ON DELETE SET NULL,
    id_usuario INT REFERENCES usuarios(id_usuario),
    destinatario VARCHAR(150) NOT NULL,
    prioridad VARCHAR(30) DEFAULT 'Alta',
    estado VARCHAR(50) DEFAULT 'Pendiente',
    mensaje TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_atencion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validaciones (
    id_validacion SERIAL PRIMARY KEY,
    id_mantenimiento INT NOT NULL REFERENCES mantenimientos(id_mantenimiento) ON DELETE CASCADE,
    id_supervisor INT NOT NULL REFERENCES usuarios(id_usuario),
    resultado VARCHAR(50) NOT NULL,
    observaciones TEXT,
    fecha_validacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reportes_generados (
    id_reporte SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    generado_por INT NOT NULL REFERENCES usuarios(id_usuario),
    formato VARCHAR(20) NOT NULL,
    ruta_archivo TEXT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario),
    accion VARCHAR(150) NOT NULL,
    modulo VARCHAR(100),
    descripcion TEXT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mantenimientos_estado ON mantenimientos(estado);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha ON mantenimientos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_repuestos_mantenimiento_usuario ON repuestos_mantenimiento(id_usuario);
CREATE INDEX IF NOT EXISTS idx_repuestos_mantenimiento_mantenimiento ON repuestos_mantenimiento(id_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_alertas_seguridad_estado ON alertas_seguridad(estado);
