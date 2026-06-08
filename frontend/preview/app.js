const usuariosIniciales = [
  { id: 1, nombre: 'Georgean Reyes', correo: 'admin@rickysafe.local', usuario: 'admin', rol: 'Administrador', departamento: 'Administracion', turno: 'Diurno', telefono: '5555-0101', ultimoAcceso: '2026-06-07 00:30', activo: true, temporal: false },
  { id: 2, nombre: 'Supervisor de Seguridad', correo: 'supervisor@rickysafe.local', usuario: 'supervisor', rol: 'Supervisor', departamento: 'Seguridad industrial', turno: 'Mixto', telefono: '5555-0202', ultimoAcceso: '2026-06-06 23:45', activo: true, temporal: false },
  { id: 3, nombre: 'Tecnico de Mantenimiento', correo: 'tecnico@rickysafe.local', usuario: 'tecnico', rol: 'Tecnico', departamento: 'Mantenimiento', turno: 'Matutino', telefono: '5555-0303', ultimoAcceso: '2026-06-06 22:15', activo: true, temporal: false },
  { id: 4, nombre: 'Auditor Interno', correo: 'auditor@rickysafe.local', usuario: 'auditor', rol: 'Auditor', departamento: 'Auditoria', turno: 'Diurno', telefono: '5555-0404', ultimoAcceso: '2026-06-07 00:25', activo: true, temporal: false }
];

const auditoriasIniciales = [
  { fecha: '2026-06-07 00:35', usuario: 'Auditor Interno', modulo: 'Auditoria', accion: 'Auditoria finalizada y verificada' },
  { fecha: '2026-06-07 00:32', usuario: 'Georgean Reyes', modulo: 'Usuarios', accion: 'Prueba de datos de usuarios existentes verificada' },
  { fecha: '2026-06-06 21:40', usuario: 'Georgean Reyes', modulo: 'Autenticacion', accion: 'Inicio de sesion' },
  { fecha: '2026-06-06 21:45', usuario: 'Tecnico de Mantenimiento', modulo: 'Mantenimientos', accion: 'Mantenimiento enviado a revision' },
  { fecha: '2026-06-05 17:20', usuario: 'Supervisor de Seguridad', modulo: 'Validaciones', accion: 'Mantenimiento validado' }
];

const repuestosIniciales = [
  { id: 1, codigo: 'REP-001', nombre: 'Cojinete 6204', categoria: 'Rodamientos', unidad: 'Unidad', stock: 18, minimo: 6, ubicacion: 'Bodega A', estado: 'Disponible' },
  { id: 2, codigo: 'REP-002', nombre: 'Correa industrial A-42', categoria: 'Transmision', unidad: 'Unidad', stock: 9, minimo: 4, ubicacion: 'Bodega A', estado: 'Disponible' },
  { id: 3, codigo: 'REP-003', nombre: 'Sensor de proximidad', categoria: 'Electrico', unidad: 'Unidad', stock: 5, minimo: 3, ubicacion: 'Bodega B', estado: 'Disponible' },
  { id: 4, codigo: 'REP-004', nombre: 'Tornillo grado 8', categoria: 'Fijacion', unidad: 'Caja', stock: 3, minimo: 5, ubicacion: 'Bodega C', estado: 'Bajo stock' }
];

const repuestosUsadosIniciales = [
  { id: 1, mantenimientoId: 2, repuestoId: 1, cantidad: 2, usuario: 'Tecnico de Mantenimiento', fecha: '2026-06-05', evidencia: 'cojinete-carrusel-despues.jpg', observaciones: 'Cambio preventivo de cojinetes en eje de traccion.' },
  { id: 2, mantenimientoId: 1, repuestoId: 3, cantidad: 1, usuario: 'Tecnico de Mantenimiento', fecha: '2026-06-06', evidencia: 'sensor-rueda-medicion.pdf', observaciones: 'Sensor reemplazado durante revision electrica.' }
];

const alertasIniciales = [
  { id: 1, fecha: '2026-06-06 22:00', destinatario: 'Ingeniero de turno', prioridad: 'Alta', estado: 'Atendida', mensaje: 'Intento de procedimiento sin verificacion completa de EPP en orden 3.' }
];

const estadoInicial = {
  usuario: null,
  modulo: 'dashboard',
  menuAbierto: false,
  mantenimientoSeleccionado: 1,
  usuarios: structuredClone(usuariosIniciales),
  inventario: structuredClone(repuestosIniciales),
  repuestosUsados: structuredClone(repuestosUsadosIniciales),
  alertas: structuredClone(alertasIniciales),
  juegos: [
    { id: 1, codigo: 'JUEGO-001', nombre: 'Rueda Mecanica', tipo: 'Mecanico', ubicacion: 'Zona principal', estado: 'Activo' },
    { id: 2, codigo: 'JUEGO-002', nombre: 'Carros Chocones', tipo: 'Electrico', ubicacion: 'Zona familiar', estado: 'Activo' },
    { id: 3, codigo: 'JUEGO-003', nombre: 'Carrusel', tipo: 'Mecanico', ubicacion: 'Zona infantil', estado: 'En mantenimiento' },
    { id: 4, codigo: 'JUEGO-004', nombre: 'Tren Infantil', tipo: 'Mecanico', ubicacion: 'Zona infantil', estado: 'Pendiente de revision' }
  ],
  protocolos: [
    {
      id: 1,
      nombre: 'Protocolo electrico',
      tipo: 'Correctivo',
      estado: 'Activo',
      pasos: [
        { id: 1, descripcion: 'Confirmar apagado total del juego', obligatorio: true },
        { id: 2, descripcion: 'Verificar desconexion de energia', obligatorio: true },
        { id: 3, descripcion: 'Utilizar equipo de proteccion personal', obligatorio: true },
        { id: 4, descripcion: 'Revisar conexiones electricas', obligatorio: true },
        { id: 5, descripcion: 'Validar ausencia de cables expuestos', obligatorio: true },
        { id: 6, descripcion: 'Adjuntar evidencia fotografica', obligatorio: true }
      ]
    },
    {
      id: 2,
      nombre: 'Protocolo preventivo',
      tipo: 'Preventivo',
      estado: 'Activo',
      pasos: [
        { id: 7, descripcion: 'Inspeccionar estado general de la atraccion', obligatorio: true },
        { id: 8, descripcion: 'Lubricar componentes moviles', obligatorio: true },
        { id: 9, descripcion: 'Registrar observaciones tecnicas', obligatorio: false }
      ]
    }
  ],
  mantenimientos: [
    {
      id: 1,
      juegoId: 1,
      protocoloId: 1,
      tipo: 'Correctivo',
      tecnico: 'Tecnico de Mantenimiento',
      estado: 'En revision',
      fecha: '2026-06-06',
      observaciones: 'Revision por vibracion inusual reportada en operacion.',
      evidencias: ['foto-antes-rueda.jpg', 'medicion-electrica.pdf'],
      epp: { verificado: true, evidencia: 'epp-tecnico-rueda.jpg', observaciones: 'Casco, guantes, lentes y arnes verificados.', fecha: '2026-06-06', notificado: false },
      checklist: [
        { pasoId: 1, cumplido: true, observacion: '' },
        { pasoId: 2, cumplido: true, observacion: '' },
        { pasoId: 3, cumplido: true, observacion: 'EPP completo' },
        { pasoId: 4, cumplido: true, observacion: '' },
        { pasoId: 5, cumplido: true, observacion: '' },
        { pasoId: 6, cumplido: true, observacion: 'Evidencia cargada' }
      ]
    },
    {
      id: 2,
      juegoId: 2,
      protocoloId: 2,
      tipo: 'Preventivo',
      tecnico: 'Tecnico de Mantenimiento',
      estado: 'Validado',
      fecha: '2026-06-05',
      observaciones: 'Mantenimiento preventivo completado.',
      supervisor: 'Supervisor de Seguridad',
      evidencias: ['checklist-firmado.pdf'],
      epp: { verificado: true, evidencia: 'epp-carros-chocones.jpg', observaciones: 'Equipo de proteccion completo.', fecha: '2026-06-05', notificado: false },
      checklist: [
        { pasoId: 7, cumplido: true, observacion: '' },
        { pasoId: 8, cumplido: true, observacion: '' },
        { pasoId: 9, cumplido: true, observacion: 'Sin novedades' }
      ]
    },
    {
      id: 3,
      juegoId: 3,
      protocoloId: 2,
      tipo: 'Periodico',
      tecnico: 'Tecnico de Mantenimiento',
      estado: 'Pendiente',
      fecha: '2026-06-06',
      observaciones: 'Pendiente completar checklist.',
      evidencias: [],
      epp: { verificado: false, evidencia: '', observaciones: 'Pendiente verificar equipo de proteccion personal.', fecha: '', notificado: false },
      checklist: [
        { pasoId: 7, cumplido: false, observacion: '' },
        { pasoId: 8, cumplido: false, observacion: '' },
        { pasoId: 9, cumplido: false, observacion: '' }
      ]
    }
  ],
  auditoria: structuredClone(auditoriasIniciales)
};

const state = cargarEstado();

const navItems = [
  { id: 'dashboard', label: 'Inicio' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'juegos', label: 'Juegos' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'protocolos', label: 'Protocolos' },
  { id: 'mantenimientos', label: 'Mantenimientos' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'validaciones', label: 'Validaciones' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'auditoria', label: 'Auditoria' }
];

function cargarEstado() {
  const guardado = localStorage.getItem('rickysafe_preview_state');
  if (!guardado) return structuredClone(estadoInicial);

  try {
    const estado = JSON.parse(guardado);
    estado.menuAbierto = false;
    estado.modulo = 'dashboard';
    estado.usuarios = (estado.usuarios || usuariosIniciales).map((usuario, index) => ({
      ...(usuariosIniciales.find((item) => item.correo === usuario.correo) || {}),
      ...usuario,
      id: usuario.id || index + 1,
      activo: usuario.activo !== false,
      temporal: usuario.temporal === true
    }));
    estado.inventario = (estado.inventario || repuestosIniciales).map((repuesto, index) => ({
      ...(repuestosIniciales.find((item) => item.codigo === repuesto.codigo) || {}),
      ...repuesto,
      id: repuesto.id || index + 1
    }));
    estado.repuestosUsados = estado.repuestosUsados || structuredClone(repuestosUsadosIniciales);
    estado.alertas = estado.alertas || structuredClone(alertasIniciales);
    estado.mantenimientos = (estado.mantenimientos || estadoInicial.mantenimientos).map((mantenimiento) => ({
      ...mantenimiento,
      epp: mantenimiento.epp || { verificado: false, evidencia: '', observaciones: 'Pendiente verificar equipo de proteccion personal.', fecha: '', notificado: false }
    }));
    estado.auditoria = estado.auditoria || [];
    auditoriasIniciales.forEach((registro) => {
      if (!estado.auditoria.some((item) => item.accion === registro.accion)) {
        estado.auditoria.unshift(registro);
      }
    });
    estado.auditoria = [
      ...auditoriasIniciales,
      ...estado.auditoria.filter((item) => !auditoriasIniciales.some((registro) => registro.accion === item.accion))
    ];
    return estado;
  } catch {
    return structuredClone(estadoInicial);
  }
}

function guardarEstado() {
  localStorage.setItem('rickysafe_preview_state', JSON.stringify(state));
}

function juegoPorId(id) {
  return state.juegos.find((juego) => juego.id === Number(id));
}

function protocoloPorId(id) {
  return state.protocolos.find((protocolo) => protocolo.id === Number(id));
}

function mantenimientoPorId(id) {
  return state.mantenimientos.find((mantenimiento) => mantenimiento.id === Number(id));
}

function repuestoPorId(id) {
  return state.inventario.find((repuesto) => repuesto.id === Number(id));
}

function estadoClase(estado) {
  const normalizado = estado.toLowerCase();
  if (normalizado.includes('validado') || normalizado === 'activo') return 'validado';
  if (normalizado.includes('inactivo')) return 'inactivo';
  if (normalizado.includes('bajo')) return 'revision';
  if (normalizado.includes('revision')) return 'revision';
  if (normalizado.includes('proceso') || normalizado.includes('mantenimiento')) return 'proceso';
  if (normalizado.includes('rechazado')) return 'rechazado';
  return 'pendiente';
}

function badge(estado) {
  return `<span class="badge ${estadoClase(estado)}">${estado}</span>`;
}

function toast(mensaje) {
  const el = document.querySelector('#toast');
  el.textContent = mensaje;
  el.classList.remove('hidden');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.add('hidden'), 3200);
}

function registrarAuditoria(modulo, accion) {
  state.auditoria.unshift({
    fecha: new Date().toLocaleString('es-GT'),
    usuario: state.usuario?.nombre || 'Sistema',
    modulo,
    accion
  });
  guardarEstado();
}

function generarContrasenaTemporal() {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `Ricky#${numero}Tmp`;
}

function passwordSegura(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password);
}

function renderNav() {
  const nav = document.querySelector('#mainNav');
  nav.innerHTML = navItems.map((item) => `
    <button class="nav-button ${state.modulo === item.id ? 'active' : ''}" type="button" data-module="${item.id}">
      ${item.label}
    </button>
  `).join('');

  nav.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.modulo = button.dataset.module;
      state.menuAbierto = false;
      guardarEstado();
      render();
    });
  });
}

function renderLayout() {
  document.querySelector('#loginView').classList.toggle('hidden', Boolean(state.usuario));
  document.querySelector('#appView').classList.toggle('hidden', !state.usuario);
  document.querySelector('#appView').classList.toggle('menu-open', Boolean(state.menuAbierto));

  if (!state.usuario) {
    state.menuAbierto = false;
    return;
  }

  document.querySelector('#userRole').textContent = state.usuario.rol;
  document.querySelector('#moduleLabel').textContent = navItems.find((item) => item.id === state.modulo)?.label || 'Inicio';
  renderNav();
}

function renderDashboard() {
  const total = state.mantenimientos.length;
  const revision = state.mantenimientos.filter((item) => item.estado === 'En revision').length;
  const validado = state.mantenimientos.filter((item) => item.estado === 'Validado').length;
  const rechazado = state.mantenimientos.filter((item) => item.estado === 'Rechazado').length;

  return `
    <div class="grid cards">
      ${card('Mantenimientos', total, 'Ordenes registradas')}
      ${card('En revision', revision, 'Pendientes de supervisor')}
      ${card('Validados', validado, 'Protocolos aprobados')}
      ${card('Rechazados', rechazado, 'Requieren correccion')}
    </div>
    <section class="panel">
      <div class="panel-header">
        <h3>Ordenes recientes</h3>
        <button class="secondary" type="button" data-go="mantenimientos">Ver mantenimientos</button>
      </div>
      <div class="table-wrap dashboard-table">${tablaMantenimientos(state.mantenimientos.slice(0, 5))}</div>
    </section>
    <section class="panel">
      <div class="panel-header"><h3>Estado semanal</h3></div>
      <div class="panel-body">
        <div class="chart">
          ${barra('Pend.', 32)}
          ${barra('Proc.', 58)}
          ${barra('Rev.', 78)}
          ${barra('Val.', 92)}
          ${barra('Rech.', 20)}
        </div>
      </div>
    </section>
  `;
}

function card(titulo, valor, detalle) {
  return `<article class="card"><span>${titulo}</span><strong>${valor}</strong><small>${detalle}</small></article>`;
}

function barra(label, alto) {
  return `
    <div class="bar">
      <strong>${alto}%</strong>
      <span><i style="height:${alto}%"></i></span>
      <label>${label}</label>
    </div>
  `;
}

function tablaMantenimientos(mantenimientos) {
  if (!mantenimientos.length) return '<p class="empty">No hay mantenimientos registrados.</p>';

  return `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Juego</th>
          <th>Tipo</th>
          <th>Tecnico</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${mantenimientos.map((item) => `
          <tr>
            <td><strong>${item.id}</strong></td>
            <td>${juegoPorId(item.juegoId)?.nombre || 'Sin juego'}</td>
            <td>${item.tipo}</td>
            <td>${item.tecnico}</td>
            <td>${badge(item.estado)}</td>
            <td>${item.fecha}</td>
            <td>
              <button class="secondary" type="button" data-select-maintenance="${item.id}">Abrir</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderUsuarios() {
  return `
    <section class="panel">
      <div class="panel-header"><h3>Usuarios y roles</h3></div>
      <div class="panel-body">
        <p><strong>Regla:</strong> los usuarios no se eliminan. Si una persona deja la empresa, se desactiva su acceso para conservar el historial de mantenimientos, validaciones y auditoria.</p>
        <form id="userForm" class="form-grid part-change-form">
          <label>Nombre completo<input name="nombre" placeholder="Nombre del trabajador" required /></label>
          <label>Usuario<input name="usuario" placeholder="usuario.apellido" required /></label>
          <label>Correo<input name="correo" type="email" placeholder="correo@empresa.com" required /></label>
          <label>
            Rol
            <select name="rol">
              <option>Tecnico</option>
              <option>Supervisor</option>
              <option>Auditor</option>
              <option>Administrador</option>
            </select>
          </label>
          <label>Departamento<input name="departamento" placeholder="Mantenimiento" /></label>
          <label>Turno<input name="turno" placeholder="Diurno" /></label>
          <label>Telefono<input name="telefono" placeholder="5555-0000" /></label>
          <label>Contraseña temporal<input name="contrasenaTemporal" value="${generarContrasenaTemporal()}" /></label>
          <div class="actions full"><button class="primary" type="submit">Crear usuario temporal</button></div>
        </form>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Departamento</th><th>Turno</th><th>Telefono</th><th>Ultimo acceso</th><th>Acceso</th><th>Estado</th><th>Historial</th><th>Accion</th></tr></thead>
          <tbody>
            ${state.usuarios.map((usuario) => `
              <tr>
                <td>${usuario.nombre}</td>
                <td>${usuario.usuario}</td>
                <td>${usuario.correo}</td>
                <td>${usuario.rol}</td>
                <td>${usuario.departamento}</td>
                <td>${usuario.turno}</td>
                <td>${usuario.telefono}</td>
                <td>${usuario.ultimoAcceso}</td>
                <td>${usuario.temporal ? 'Temporal' : 'Definitivo'}</td>
                <td>${badge(usuario.activo ? 'Activo' : 'Inactivo')}</td>
                <td>Conservado</td>
                <td>
                  ${usuario.correo === state.usuario?.correo
                    ? '<span class="muted-action">Sesion actual</span>'
                    : `<button class="${usuario.activo ? 'danger' : 'success'}" type="button" data-toggle-user="${usuario.id}">${usuario.activo ? 'Desactivar' : 'Reactivar'}</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderJuegos() {
  return `
    <section class="panel">
      <div class="panel-header">
        <h3>Juegos registrados</h3>
        <button class="secondary" type="button" data-action="game">Registrar atraccion</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Codigo</th><th>Nombre</th><th>Tipo</th><th>Ubicacion</th><th>Estado</th></tr></thead>
          <tbody>
            ${state.juegos.map((juego) => `
              <tr>
                <td><strong>${juego.codigo}</strong></td>
                <td>${juego.nombre}</td>
                <td>${juego.tipo}</td>
                <td>${juego.ubicacion}</td>
                <td>${badge(juego.estado)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderInventario() {
  const movimientos = state.repuestosUsados;
  const bajoStock = state.inventario.filter((item) => item.stock <= item.minimo).length;
  const totalStock = state.inventario.reduce((total, item) => total + Number(item.stock || 0), 0);

  return `
    <div class="grid cards">
      ${card('Repuestos', state.inventario.length, 'Productos registrados')}
      ${card('Stock total', totalStock, 'Unidades disponibles')}
      ${card('Bajo stock', bajoStock, 'Requieren compra')}
      ${card('Cambios', movimientos.length, 'Repuestos usados')}
    </div>
    <section class="panel">
      <div class="panel-header"><h3>Inventario de repuestos</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Codigo</th><th>Repuesto</th><th>Categoria</th><th>Unidad</th><th>Stock</th><th>Minimo</th><th>Ubicacion</th><th>Estado</th></tr></thead>
          <tbody>
            ${state.inventario.map((item) => `
              <tr>
                <td><strong>${item.codigo}</strong></td>
                <td>${item.nombre}</td>
                <td>${item.categoria}</td>
                <td>${item.unidad}</td>
                <td>${item.stock}</td>
                <td>${item.minimo}</td>
                <td>${item.ubicacion}</td>
                <td>${badge(item.stock <= item.minimo ? 'Bajo stock' : item.estado)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h3>Productos cambiados por usuario</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Orden</th><th>Juego</th><th>Repuesto</th><th>Cantidad</th><th>Usuario</th><th>Evidencia</th><th>Observaciones</th></tr></thead>
          <tbody>
            ${movimientos.map((movimiento) => {
              const mantenimiento = mantenimientoPorId(movimiento.mantenimientoId);
              const repuesto = repuestoPorId(movimiento.repuestoId);
              return `
                <tr>
                  <td>${movimiento.fecha}</td>
                  <td>${movimiento.mantenimientoId}</td>
                  <td>${juegoPorId(mantenimiento?.juegoId)?.nombre || 'Sin juego'}</td>
                  <td>${repuesto?.nombre || 'Sin repuesto'}</td>
                  <td>${movimiento.cantidad}</td>
                  <td>${movimiento.usuario}</td>
                  <td>${movimiento.evidencia}</td>
                  <td>${movimiento.observaciones}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderProtocolos() {
  return `
    <div class="grid two">
      ${state.protocolos.map((protocolo) => `
        <section class="panel">
          <div class="panel-header">
            <h3>${protocolo.nombre}</h3>
            ${badge(protocolo.estado)}
          </div>
          <div class="panel-body">
            <p><strong>Tipo:</strong> ${protocolo.tipo}</p>
            <div class="checklist">
              ${protocolo.pasos.map((paso, index) => `
                <div class="check-item">
                  <input type="checkbox" ${paso.obligatorio ? 'checked' : ''} disabled />
                  <div>
                    <strong>${index + 1}. ${paso.descripcion}</strong>
                    <small>${paso.obligatorio ? 'Obligatorio' : 'Opcional'}</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `).join('')}
    </div>
  `;
}

function renderMantenimientos() {
  const seleccionado = mantenimientoPorId(state.mantenimientoSeleccionado) || state.mantenimientos[0];
  const protocolo = seleccionado ? protocoloPorId(seleccionado.protocoloId) : null;
  const movimientosSeleccionados = seleccionado
    ? state.repuestosUsados.filter((item) => item.mantenimientoId === seleccionado.id)
    : [];

  return `
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><h3>Nueva orden</h3></div>
        <div class="panel-body">
          <form id="maintenanceForm" class="form-grid">
            <label>
              Juego
              <select name="juegoId" required>
                ${state.juegos.map((juego) => `<option value="${juego.id}">${juego.nombre}</option>`).join('')}
              </select>
            </label>
            <label>
              Protocolo
              <select name="protocoloId" required>
                ${state.protocolos.map((protocolo) => `<option value="${protocolo.id}">${protocolo.nombre}</option>`).join('')}
              </select>
            </label>
            <label>
              Tipo
              <select name="tipo">
                <option>Preventivo</option>
                <option>Correctivo</option>
                <option>Predictivo</option>
                <option>Periodico</option>
                <option>Emergencia</option>
              </select>
            </label>
            <label>
              Tecnico
              <input name="tecnico" value="Tecnico de Mantenimiento" />
            </label>
            <label class="full">
              Observaciones
              <textarea name="observaciones" placeholder="Detalle del trabajo a realizar"></textarea>
            </label>
            <div class="actions full">
              <button class="primary" type="submit">Crear orden</button>
            </div>
          </form>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h3>Checklist y evidencias</h3>
          ${seleccionado ? badge(seleccionado.estado) : ''}
        </div>
        <div class="panel-body">
          ${seleccionado ? `
            <p><strong>Orden:</strong> ${seleccionado.id} - ${juegoPorId(seleccionado.juegoId)?.nombre}</p>
            <section class="safety-box">
              <h4>Verificación obligatoria de EPP</h4>
              <p><strong>Estado:</strong> ${seleccionado.epp?.verificado ? badge('Validado') : badge('Pendiente')}</p>
              <form id="eppForm" class="form-grid">
                <label>
                  ¿Tiene equipo de protección personal completo?
                  <select name="verificado">
                    <option value="true" ${seleccionado.epp?.verificado ? 'selected' : ''}>Sí, equipo completo</option>
                    <option value="false" ${!seleccionado.epp?.verificado ? 'selected' : ''}>No, falta equipo</option>
                  </select>
                </label>
                <label>
                  Evidencia EPP
                  <input id="eppEvidenceInput" type="file" />
                </label>
                <label class="full">
                  Observaciones EPP
                  <textarea name="observaciones" placeholder="Casco, guantes, lentes, arnes, botas...">${seleccionado.epp?.observaciones || ''}</textarea>
                </label>
                <div class="actions full">
                  <button class="primary" type="submit">Guardar verificación EPP</button>
                </div>
              </form>
              <p><strong>Evidencia EPP:</strong> ${seleccionado.epp?.evidencia || 'Pendiente'}</p>
            </section>
            <div class="checklist">
              ${protocolo.pasos.map((paso) => {
                const check = seleccionado.checklist.find((item) => item.pasoId === paso.id);
                return `
                  <label class="check-item">
                    <input type="checkbox" data-check="${paso.id}" ${check?.cumplido ? 'checked' : ''} />
                    <div>
                      <strong>${paso.descripcion}</strong>
                      <small>${paso.obligatorio ? 'Obligatorio' : 'Opcional'}</small>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
            <label>
              Evidencia
              <input id="evidenceInput" type="file" />
            </label>
            <div class="actions">
              <button class="secondary" type="button" data-add-evidence>Agregar evidencia</button>
              <button class="primary" type="button" data-send-review>Enviar a revision</button>
            </div>
            <p><strong>Evidencias:</strong> ${seleccionado.evidencias.length ? seleccionado.evidencias.join(', ') : 'Sin evidencias'}</p>
            <form id="partChangeForm" class="form-grid part-change-form">
              <label>
                Repuesto cambiado
                <select name="repuestoId" required>
                  ${state.inventario.map((repuesto) => `<option value="${repuesto.id}">${repuesto.codigo} - ${repuesto.nombre} (${repuesto.stock} disp.)</option>`).join('')}
                </select>
              </label>
              <label>
                Cantidad
                <input name="cantidad" type="number" min="1" value="1" required />
              </label>
              <label class="full">
                Evidencia del cambio
                <input id="partEvidenceInput" type="file" />
              </label>
              <label class="full">
                Observaciones del repuesto
                <textarea name="observaciones" placeholder="Ejemplo: se cambio cojinete en juego de caballos"></textarea>
              </label>
              <div class="actions full">
                <button class="success" type="submit">Registrar repuesto usado</button>
              </div>
            </form>
            <div class="table-wrap compact-table">
              <table>
                <thead><tr><th>Repuesto</th><th>Cantidad</th><th>Usuario</th><th>Evidencia</th></tr></thead>
                <tbody>
                  ${movimientosSeleccionados.length ? movimientosSeleccionados.map((movimiento) => `
                    <tr>
                      <td>${repuestoPorId(movimiento.repuestoId)?.nombre || 'Sin repuesto'}</td>
                      <td>${movimiento.cantidad}</td>
                      <td>${movimiento.usuario}</td>
                      <td>${movimiento.evidencia}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="4">Sin repuestos registrados en esta orden.</td></tr>'}
                </tbody>
              </table>
            </div>
          ` : '<p class="empty">Selecciona una orden.</p>'}
        </div>
      </section>
    </div>
    <section class="panel">
      <div class="panel-header"><h3>Ordenes registradas</h3></div>
      <div class="table-wrap">${tablaMantenimientos(state.mantenimientos)}</div>
    </section>
  `;
}

function renderValidaciones() {
  const pendientes = state.mantenimientos.filter((item) => item.estado === 'En revision');

  return `
    <section class="panel">
      <div class="panel-header"><h3>Mantenimientos pendientes de validacion</h3></div>
      <div class="table-wrap">${tablaMantenimientos(pendientes)}</div>
    </section>
    <section class="panel">
      <div class="panel-header"><h3>Decision del supervisor</h3></div>
      <div class="panel-body">
        <form id="validationForm" class="form-grid">
          <label>
            Orden
            <select name="id" required>
              ${pendientes.map((item) => `<option value="${item.id}">Orden ${item.id} - ${juegoPorId(item.juegoId)?.nombre}</option>`).join('')}
            </select>
          </label>
          <label>
            Resultado
            <select name="resultado">
              <option value="Validado">Aprobar</option>
              <option value="Rechazado">Rechazar</option>
            </select>
          </label>
          <label class="full">
            Observaciones
            <textarea name="observaciones" placeholder="Obligatorio si se rechaza"></textarea>
          </label>
          <div class="actions full">
            <button class="success" type="submit">Guardar validacion</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderReportes() {
  const total = state.mantenimientos.length;
  const porTipo = state.mantenimientos.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  }, {});

  return `
    <section class="panel">
      <div class="panel-header">
        <h3>Reporte personalizado</h3>
        <details class="export-menu">
          <summary>Exportar reporte</summary>
          <div class="export-menu-list">
            <button type="button" data-export-excel>Excel</button>
            <button type="button" data-export-pdf>PDF</button>
            <button type="button" data-export-csv>CSV</button>
          </div>
        </details>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <label>Fecha inicial<input type="date" value="2026-06-01" /></label>
          <label>Fecha final<input type="date" value="2026-06-30" /></label>
          <label>Estado<select><option>Todos</option><option>Validado</option><option>En revision</option><option>Rechazado</option></select></label>
          <label>Tipo<select><option>Todos</option><option>Preventivo</option><option>Correctivo</option><option>Periodico</option></select></label>
        </div>
      </div>
    </section>
    <div class="grid cards">
      ${card('Total', total, 'Mantenimientos')}
      ${card('Preventivo', porTipo.Preventivo || 0, 'Por tipo')}
      ${card('Correctivo', porTipo.Correctivo || 0, 'Por tipo')}
      ${card('Periodico', porTipo.Periodico || 0, 'Por tipo')}
    </div>
    <section class="panel">
      <div class="panel-header"><h3>Resultados</h3></div>
      <div class="table-wrap">${tablaMantenimientos(state.mantenimientos)}</div>
    </section>
  `;
}

function renderAlertas() {
  return `
    <section class="panel">
      <div class="panel-header"><h3>Alertas de seguridad EPP</h3></div>
      <div class="panel-body">
        <p>Cuando un técnico intenta continuar sin equipo de protección personal, el sistema genera una alerta para el ingeniero de turno o encargado de área.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Destinatario</th><th>Prioridad</th><th>Estado</th><th>Mensaje</th><th>Accion</th></tr></thead>
          <tbody>
            ${state.alertas.map((alerta) => `
              <tr>
                <td>${alerta.fecha}</td>
                <td>${alerta.destinatario}</td>
                <td>${alerta.prioridad}</td>
                <td>${badge(alerta.estado)}</td>
                <td>${alerta.mensaje}</td>
                <td>
                  ${alerta.estado === 'Pendiente'
                    ? `<button class="success" type="button" data-attend-alert="${alerta.id}">Marcar atendida</button>`
                    : '<span class="muted-action">Verificada</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAuditoria() {
  return `
    <section class="panel">
      <div class="panel-header"><h3>Auditoria del sistema</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Modulo</th><th>Accion</th></tr></thead>
          <tbody>
            ${state.auditoria.map((item) => `
              <tr>
                <td>${item.fecha}</td>
                <td>${item.usuario}</td>
                <td>${item.modulo}</td>
                <td>${item.accion}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCambioClave() {
  return `
    <section class="panel">
      <div class="panel-header"><h3>Cambio obligatorio de contraseña</h3></div>
      <div class="panel-body">
        <p>Este usuario ingresó con contraseña temporal. Debe registrar una contraseña propia antes de continuar.</p>
        <form id="passwordChangeForm" class="form-grid">
          <label>Nueva contraseña<input name="password" type="password" placeholder="Minimo 10 caracteres" required /></label>
          <label>Confirmar contraseña<input name="confirmar" type="password" required /></label>
          <p class="full"><strong>Debe incluir:</strong> mayúscula, minúscula, número, símbolo y mínimo 10 caracteres.</p>
          <div class="actions full"><button class="primary" type="submit">Guardar contraseña</button></div>
        </form>
      </div>
    </section>
  `;
}

function renderContent() {
  const views = {
    dashboard: renderDashboard,
    cambiarClave: renderCambioClave,
    usuarios: renderUsuarios,
    juegos: renderJuegos,
    inventario: renderInventario,
    protocolos: renderProtocolos,
    mantenimientos: renderMantenimientos,
    alertas: renderAlertas,
    validaciones: renderValidaciones,
    reportes: renderReportes,
    auditoria: renderAuditoria
  };

  document.querySelector('#content').innerHTML = (views[state.modulo] || renderDashboard)();
  bindActions();
}

function bindActions() {
  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => {
      state.modulo = button.dataset.go;
      state.menuAbierto = false;
      guardarEstado();
      render();
    });
  });

  document.querySelectorAll('[data-select-maintenance]').forEach((button) => {
    button.addEventListener('click', () => {
      state.mantenimientoSeleccionado = Number(button.dataset.selectMaintenance);
      state.modulo = 'mantenimientos';
      state.menuAbierto = false;
      guardarEstado();
      render();
    });
  });

  document.querySelector('#maintenanceForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const protocolo = protocoloPorId(data.protocoloId);
    const nuevo = {
      id: Math.max(...state.mantenimientos.map((item) => item.id)) + 1,
      juegoId: Number(data.juegoId),
      protocoloId: Number(data.protocoloId),
      tipo: data.tipo,
      tecnico: data.tecnico,
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: data.observaciones,
      evidencias: [],
      checklist: protocolo.pasos.map((paso) => ({ pasoId: paso.id, cumplido: false, observacion: '' }))
    };
    state.mantenimientos.unshift(nuevo);
    state.mantenimientoSeleccionado = nuevo.id;
    registrarAuditoria('Mantenimientos', `Mantenimiento creado: orden ${nuevo.id}`);
    guardarEstado();
    toast('Orden de mantenimiento creada.');
    render();
  });

  document.querySelectorAll('[data-check]').forEach((input) => {
    input.addEventListener('change', () => {
      const mantenimiento = mantenimientoPorId(state.mantenimientoSeleccionado);
      const check = mantenimiento.checklist.find((item) => item.pasoId === Number(input.dataset.check));
      check.cumplido = input.checked;
      guardarEstado();
    });
  });

  document.querySelector('#eppForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const mantenimiento = mantenimientoPorId(state.mantenimientoSeleccionado);
    const evidencia = document.querySelector('#eppEvidenceInput')?.files[0];
    const verificado = data.verificado === 'true';
    const nombreEvidencia = evidencia?.name || mantenimiento.epp?.evidencia || '';

    if (verificado && !nombreEvidencia) {
      toast('Para validar EPP debes adjuntar evidencia.');
      return;
    }

    mantenimiento.epp = {
      verificado,
      evidencia: verificado ? nombreEvidencia : '',
      observaciones: data.observaciones || '',
      fecha: new Date().toISOString().slice(0, 10),
      notificado: !verificado
    };

    if (verificado) {
      if (!mantenimiento.evidencias.includes(nombreEvidencia)) {
        mantenimiento.evidencias.push(nombreEvidencia);
      }
      registrarAuditoria('Seguridad EPP', `EPP verificado en orden ${mantenimiento.id}`);
      toast('EPP verificado y evidencia vinculada.');
    } else {
      const alertaPendiente = state.alertas.some((item) => (
        item.estado === 'Pendiente' && item.mensaje.includes(`Orden ${mantenimiento.id}:`)
      ));
      if (!alertaPendiente) {
        const alerta = {
          id: Math.max(0, ...state.alertas.map((item) => item.id)) + 1,
          fecha: new Date().toLocaleString('es-GT'),
          destinatario: 'Ingeniero de turno / Encargado de area',
          prioridad: 'Alta',
          estado: 'Pendiente',
          mensaje: `Orden ${mantenimiento.id}: ${mantenimiento.tecnico} intenta realizar procedimiento sin EPP completo.`
        };
        state.alertas.unshift(alerta);
      }
      registrarAuditoria('Seguridad EPP', `Alerta generada por falta de EPP en orden ${mantenimiento.id}`);
      toast('Alerta enviada al ingeniero de turno. Procedimiento bloqueado.');
    }

    guardarEstado();
    render();
  });

  document.querySelector('[data-add-evidence]')?.addEventListener('click', () => {
    const file = document.querySelector('#evidenceInput')?.files[0];
    const mantenimiento = mantenimientoPorId(state.mantenimientoSeleccionado);
    if (!file) {
      toast('Selecciona un archivo de evidencia.');
      return;
    }
    mantenimiento.evidencias.push(file.name);
    registrarAuditoria('Evidencias', `Evidencia subida: ${file.name}`);
    guardarEstado();
    toast('Evidencia agregada.');
    render();
  });

  document.querySelector('#partChangeForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const mantenimiento = mantenimientoPorId(state.mantenimientoSeleccionado);
    const repuesto = repuestoPorId(data.repuestoId);
    const cantidad = Number(data.cantidad || 0);
    const evidencia = document.querySelector('#partEvidenceInput')?.files[0];

    if (!mantenimiento || !repuesto || cantidad < 1) {
      toast('Completa los datos del repuesto cambiado.');
      return;
    }

    if (cantidad > repuesto.stock) {
      toast('No hay stock suficiente para ese repuesto.');
      return;
    }

    const nombreEvidencia = evidencia?.name || `evidencia-repuesto-orden-${mantenimiento.id}.pdf`;
    repuesto.stock -= cantidad;
    repuesto.estado = repuesto.stock <= repuesto.minimo ? 'Bajo stock' : 'Disponible';
    mantenimiento.evidencias.push(nombreEvidencia);
    state.repuestosUsados.unshift({
      id: Math.max(0, ...state.repuestosUsados.map((item) => item.id)) + 1,
      mantenimientoId: mantenimiento.id,
      repuestoId: repuesto.id,
      cantidad,
      usuario: state.usuario?.nombre || mantenimiento.tecnico,
      fecha: new Date().toISOString().slice(0, 10),
      evidencia: nombreEvidencia,
      observaciones: data.observaciones || 'Cambio de repuesto registrado'
    });

    registrarAuditoria('Inventario', `Repuesto usado: ${repuesto.nombre} x${cantidad} en orden ${mantenimiento.id}`);
    guardarEstado();
    toast('Repuesto registrado, stock actualizado y evidencia vinculada.');
    render();
  });

  document.querySelector('[data-send-review]')?.addEventListener('click', () => {
    const mantenimiento = mantenimientoPorId(state.mantenimientoSeleccionado);
    const protocolo = protocoloPorId(mantenimiento.protocoloId);
    const faltantes = protocolo.pasos.filter((paso) => {
      const check = mantenimiento.checklist.find((item) => item.pasoId === paso.id);
      return paso.obligatorio && !check?.cumplido;
    });

    if (faltantes.length) {
      toast('No se puede enviar: faltan pasos obligatorios.');
      return;
    }

    if (!mantenimiento.epp?.verificado || !mantenimiento.epp?.evidencia) {
      toast('No se puede enviar: la verificación EPP con evidencia es obligatoria.');
      return;
    }

    if (!mantenimiento.evidencias.length) {
      toast('Agrega al menos una evidencia antes de enviar.');
      return;
    }

    mantenimiento.estado = 'En revision';
    registrarAuditoria('Mantenimientos', `Mantenimiento enviado a revision: orden ${mantenimiento.id}`);
    guardarEstado();
    toast('Mantenimiento enviado a revision.');
    render();
  });

  document.querySelector('#validationForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const mantenimiento = mantenimientoPorId(data.id);
    if (!mantenimiento) {
      toast('No hay mantenimientos pendientes.');
      return;
    }
    if (data.resultado === 'Rechazado' && !data.observaciones.trim()) {
      toast('Todo rechazo debe incluir observaciones.');
      return;
    }
    mantenimiento.estado = data.resultado;
    mantenimiento.supervisor = state.usuario.nombre;
    mantenimiento.observaciones = data.observaciones || mantenimiento.observaciones;
    registrarAuditoria('Validaciones', `Mantenimiento ${data.resultado.toLowerCase()}: orden ${mantenimiento.id}`);
    guardarEstado();
    toast('Validacion guardada.');
    render();
  });

  document.querySelector('[data-export-csv]')?.addEventListener('click', exportarCsv);
  document.querySelector('[data-export-excel]')?.addEventListener('click', exportarExcel);
  document.querySelector('[data-export-pdf]')?.addEventListener('click', exportarPdf);

  document.querySelector('[data-action="game"]')?.addEventListener('click', () => {
    const id = state.juegos.length + 1;
    state.juegos.push({
      id,
      codigo: `JUEGO-${String(id).padStart(3, '0')}`,
      nombre: `Atraccion ${id}`,
      tipo: 'Mecanico',
      ubicacion: 'Zona nueva',
      estado: 'Activo'
    });
    registrarAuditoria('Juegos', `Juego registrado: Atraccion ${id}`);
    guardarEstado();
    toast('Juego registrado.');
    render();
  });

  document.querySelectorAll('[data-toggle-user]').forEach((button) => {
    button.addEventListener('click', () => {
      const usuario = state.usuarios.find((item) => item.id === Number(button.dataset.toggleUser));
      if (!usuario) return;

      usuario.activo = !usuario.activo;
      registrarAuditoria(
        'Usuarios',
        `${usuario.activo ? 'Usuario reactivado' : 'Usuario desactivado'}: ${usuario.correo}`
      );
      guardarEstado();
      toast(usuario.activo ? 'Usuario reactivado.' : 'Usuario desactivado. El historial se conserva.');
      render();
    });
  });

  document.querySelectorAll('[data-attend-alert]').forEach((button) => {
    button.addEventListener('click', () => {
      const alerta = state.alertas.find((item) => item.id === Number(button.dataset.attendAlert));
      if (!alerta) return;

      alerta.estado = 'Atendida';
      registrarAuditoria('Alertas', `Alerta EPP atendida: ${alerta.mensaje}`);
      guardarEstado();
      toast('Alerta marcada como atendida.');
      render();
    });
  });

  document.querySelector('#userForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const correo = data.correo.trim().toLowerCase();

    if (state.usuarios.some((usuario) => usuario.correo === correo || usuario.usuario === data.usuario.trim())) {
      toast('Ya existe un usuario con ese correo o nombre de usuario.');
      return;
    }

    state.usuarios.push({
      id: Math.max(0, ...state.usuarios.map((usuario) => usuario.id)) + 1,
      nombre: data.nombre.trim(),
      correo,
      usuario: data.usuario.trim(),
      rol: data.rol,
      departamento: data.departamento || 'Sin asignar',
      turno: data.turno || 'Sin asignar',
      telefono: data.telefono || 'Sin telefono',
      ultimoAcceso: 'Pendiente',
      activo: true,
      temporal: true,
      contrasenaTemporal: data.contrasenaTemporal
    });

    registrarAuditoria('Usuarios', `Usuario temporal creado: ${correo}`);
    guardarEstado();
    toast('Usuario creado con contraseña temporal. Debe cambiarla al ingresar.');
    render();
  });

  document.querySelector('#passwordChangeForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));

    if (data.password !== data.confirmar) {
      toast('Las contraseñas no coinciden.');
      return;
    }

    if (!passwordSegura(data.password)) {
      toast('La contraseña debe tener mayúscula, minúscula, número, símbolo y mínimo 10 caracteres.');
      return;
    }

    const usuario = state.usuarios.find((item) => item.correo === state.usuario?.correo);
    if (usuario) {
      usuario.temporal = false;
      usuario.contrasenaTemporal = 'personalizada';
      state.usuario = usuario;
    }

    registrarAuditoria('Usuarios', `Contraseña temporal cambiada: ${state.usuario?.correo}`);
    guardarEstado();
    toast('Contraseña actualizada correctamente.');
    state.modulo = 'dashboard';
    render();
  });
}

function obtenerFilasReporte() {
  return state.mantenimientos.map((item) => ({
    id: item.id,
    juego: juegoPorId(item.juegoId)?.nombre || 'Sin juego',
    tipo: item.tipo,
    tecnico: item.tecnico,
    estado: item.estado,
    fecha: item.fecha,
    supervisor: item.supervisor || 'Pendiente',
    evidencias: item.evidencias.length,
    observaciones: item.observaciones || ''
  }));
}

function valorCsv(valor) {
  return `"${String(valor ?? '').replaceAll('"', '""')}"`;
}

function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

function exportarCsv() {
  const header = ['ID', 'Juego', 'Tipo', 'Tecnico', 'Estado', 'Fecha'];
  const rows = obtenerFilasReporte().map((item) => [
    item.id,
    item.juego,
    item.tipo,
    item.tecnico,
    item.estado,
    item.fecha
  ]);
  const metadata = [
    ['Sistema', 'RickySafe Maintenance'],
    ['Tipo de reporte', 'Personalizado'],
    ['Fecha de generacion', new Date().toLocaleString('es-GT')],
    ['Usuario', state.usuario?.nombre || 'Usuario de prueba'],
    []
  ];
  const csv = '\uFEFFsep=;\n' + [...metadata, header, ...rows]
    .map((row) => row.map(valorCsv).join(';'))
    .join('\n');
  descargarArchivo('rickysafe-reporte.csv', csv, 'text/csv;charset=utf-8');
  registrarAuditoria('Reportes', 'Reporte exportado en CSV');
  toast('Reporte CSV generado con columnas separadas.');
}

function celdaXml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function filaExcel(celdas, estilo = '') {
  return `<Row>${celdas.map((celda) => {
    const tipo = typeof celda === 'number' ? 'Number' : 'String';
    const style = estilo ? ` ss:StyleID="${estilo}"` : '';
    return `<Cell${style}><Data ss:Type="${tipo}">${celdaXml(celda)}</Data></Cell>`;
  }).join('')}</Row>`;
}

function exportarExcel() {
  const filas = obtenerFilasReporte();
  const total = filas.length;
  const validados = filas.filter((item) => item.estado === 'Validado').length;
  const revision = filas.filter((item) => item.estado === 'En revision').length;
  const pendientes = filas.filter((item) => item.estado === 'Pendiente').length;

  const excel = `<?xml version="1.0" encoding="UTF-8"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook
      xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Styles>
        <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#162238" /></Style>
        <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF" /><Interior ss:Color="#162238" ss:Pattern="Solid" /></Style>
        <Style ss:ID="Summary"><Font ss:Bold="1" /><Interior ss:Color="#E8F5F4" ss:Pattern="Solid" /></Style>
      </Styles>
      <Worksheet ss:Name="Reporte">
        <Table>
          <Column ss:Width="55" />
          <Column ss:Width="150" />
          <Column ss:Width="105" />
          <Column ss:Width="170" />
          <Column ss:Width="100" />
          <Column ss:Width="95" />
          <Column ss:Width="150" />
          <Column ss:Width="85" />
          <Column ss:Width="280" />
          ${filaExcel(['RickySafe Maintenance'], 'Title')}
          ${filaExcel(['Reporte personalizado de mantenimientos'])}
          ${filaExcel(['Fecha de generacion', new Date().toLocaleString('es-GT')])}
          ${filaExcel(['Usuario', state.usuario?.nombre || 'Usuario de prueba'])}
          ${filaExcel([])}
          ${filaExcel(['Total', total, 'Validados', validados, 'En revision', revision, 'Pendientes', pendientes], 'Summary')}
          ${filaExcel([])}
          ${filaExcel(['ID', 'Juego', 'Tipo', 'Tecnico', 'Estado', 'Fecha', 'Supervisor', 'Evidencias', 'Observaciones'], 'Header')}
          ${filas.map((item) => filaExcel([
            item.id,
            item.juego,
            item.tipo,
            item.tecnico,
            item.estado,
            item.fecha,
            item.supervisor,
            item.evidencias,
            item.observaciones
          ])).join('')}
        </Table>
      </Worksheet>
    </Workbook>
  `;

  descargarArchivo('rickysafe-reporte.xls', excel, 'application/vnd.ms-excel;charset=utf-8');
  registrarAuditoria('Reportes', 'Reporte exportado en Excel');
  toast('Reporte Excel generado.');
}

function exportarPdf() {
  const filas = obtenerFilasReporte();
  const total = filas.length;
  const validados = filas.filter((item) => item.estado === 'Validado').length;
  const revision = filas.filter((item) => item.estado === 'En revision').length;
  const pendientes = filas.filter((item) => item.estado === 'Pendiente').length;
  const ventana = window.open('', '_blank');

  if (!ventana) {
    toast('No se pudo abrir la vista PDF. Permite ventanas emergentes.');
    return;
  }

  ventana.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>RickySafe Reporte PDF</title>
        <style>
          @page { margin: 18mm; size: landscape; }
          body { color: #172033; font-family: Arial, sans-serif; margin: 0; }
          header { border-bottom: 3px solid #162238; margin-bottom: 18px; padding-bottom: 12px; }
          h1 { color: #162238; font-size: 24px; margin: 0 0 4px; }
          h2 { font-size: 15px; margin: 0; color: #475569; }
          .meta, .summary { display: grid; gap: 8px; grid-template-columns: repeat(4, 1fr); margin-bottom: 18px; }
          .box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
          .box strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
          table { border-collapse: collapse; width: 100%; }
          th { background: #162238; color: #fff; font-size: 12px; text-align: left; }
          td { font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 7px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .toolbar { display: flex; justify-content: flex-end; margin-bottom: 14px; }
          button { background: #162238; border: 0; border-radius: 6px; color: #fff; cursor: pointer; font: inherit; font-weight: bold; padding: 10px 14px; }
          @media print { .toolbar { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button type="button" onclick="window.print()">Imprimir o guardar PDF</button>
        </div>
        <header>
          <h1>RickySafe Maintenance</h1>
          <h2>Reporte personalizado de mantenimientos</h2>
        </header>
        <section class="meta">
          <div class="box"><strong>Fecha</strong>${celdaXml(new Date().toLocaleString('es-GT'))}</div>
          <div class="box"><strong>Usuario</strong>${celdaXml(state.usuario?.nombre || 'Usuario de prueba')}</div>
          <div class="box"><strong>Formato</strong>PDF / impresion</div>
          <div class="box"><strong>Sistema</strong>Seguridad industrial</div>
        </section>
        <section class="summary">
          <div class="box"><strong>Total</strong>${total}</div>
          <div class="box"><strong>Validados</strong>${validados}</div>
          <div class="box"><strong>En revision</strong>${revision}</div>
          <div class="box"><strong>Pendientes</strong>${pendientes}</div>
        </section>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Juego</th>
              <th>Tipo</th>
              <th>Tecnico</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Supervisor</th>
              <th>Evidencias</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${filas.map((item) => `
              <tr>
                <td>${celdaXml(item.id)}</td>
                <td>${celdaXml(item.juego)}</td>
                <td>${celdaXml(item.tipo)}</td>
                <td>${celdaXml(item.tecnico)}</td>
                <td>${celdaXml(item.estado)}</td>
                <td>${celdaXml(item.fecha)}</td>
                <td>${celdaXml(item.supervisor)}</td>
                <td>${celdaXml(item.evidencias)}</td>
                <td>${celdaXml(item.observaciones)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.addEventListener('load', () => setTimeout(() => window.print(), 300));
        </script>
      </body>
    </html>
  `);
  ventana.document.close();
  registrarAuditoria('Reportes', 'Reporte PDF preparado');
  toast('Reporte PDF abierto para imprimir o guardar.');
}

function render() {
  renderLayout();
  if (state.usuario) renderContent();
}

document.querySelector('#loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const correo = document.querySelector('#emailInput').value.trim().toLowerCase();
  const contrasena = document.querySelector('#passwordInput').value;
  const usuario = state.usuarios.find((item) => item.correo === correo);
  const contrasenaEsperada = usuario?.temporal ? usuario.contrasenaTemporal : 'admin123';

  if (!usuario || contrasena !== contrasenaEsperada) {
    toast('Credenciales invalidas.');
    return;
  }

  if (!usuario.activo) {
    toast('Usuario desactivado. Contacta al administrador.');
    return;
  }

  usuario.ultimoAcceso = new Date().toLocaleString('es-GT');
  state.usuario = usuario;
  state.modulo = usuario.temporal ? 'cambiarClave' : 'dashboard';
  state.menuAbierto = false;
  registrarAuditoria('Autenticacion', 'Inicio de sesion');
  guardarEstado();
  render();
});

document.querySelector('#resetDataButton')?.addEventListener('click', () => {
  localStorage.removeItem('rickysafe_preview_state');
  window.location.reload();
});

document.querySelector('#logoutButton').addEventListener('click', () => {
  registrarAuditoria('Autenticacion', 'Cierre de sesion');
  state.usuario = null;
  state.menuAbierto = false;
  guardarEstado();
  render();
});

document.querySelector('#menuButton').addEventListener('click', () => {
  state.menuAbierto = !state.menuAbierto;
  guardarEstado();
  render();
});

document.querySelector('#homeButton').addEventListener('click', () => {
  state.modulo = 'dashboard';
  state.menuAbierto = false;
  guardarEstado();
  render();
});

document.querySelector('#menuOverlay').addEventListener('click', () => {
  state.menuAbierto = false;
  guardarEstado();
  render();
});

render();
