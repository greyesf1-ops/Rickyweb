import { useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import CardResumen from './components/CardResumen.jsx';
import BadgeEstado from './components/BadgeEstado.jsx';
import { consultarAsistente } from './services/asistente.service.js';
import { login as loginApi } from './services/auth.service.js';

const mantenimientosIniciales = [
  {
    id: 1,
    juego: 'Rueda Mecanica',
    tipo: 'Correctivo',
    tecnico: 'Tecnico de Mantenimiento',
    prioridad: 'Alta',
    estado: 'En revision',
    fecha: '2026-06-06',
    fechaInicio: '2026-06-06',
    fechaFin: '',
    maxHoras: 15,
    registrosHoras: [
      { id: 1, fecha: '2026-06-06', horas: 3, descripcion: 'Revision electrica y medicion inicial.', usuario: 'Tecnico de Mantenimiento' },
      { id: 2, fecha: '2026-06-07', horas: 2, descripcion: 'Ajuste de sensor y prueba de vibracion.', usuario: 'Tecnico de Mantenimiento' }
    ],
    evidencias: ['foto-antes-rueda.jpg', 'medicion-electrica.pdf', 'epp-tecnico-rueda.jpg'],
    epp: {
      verificado: true,
      evidencia: 'epp-tecnico-rueda.jpg',
      observaciones: 'Casco, guantes, lentes y arnes verificados.',
      fecha: '2026-06-06'
    }
  },
  {
    id: 2,
    juego: 'Carros Chocones',
    tipo: 'Preventivo',
    tecnico: 'Tecnico de Mantenimiento',
    prioridad: 'Media',
    estado: 'Validado',
    fecha: '2026-06-05',
    fechaInicio: '2026-06-05',
    fechaFin: '2026-06-05',
    maxHoras: 15,
    registrosHoras: [
      { id: 1, fecha: '2026-06-05', horas: 4, descripcion: 'Mantenimiento preventivo completado.', usuario: 'Tecnico de Mantenimiento' }
    ],
    evidencias: ['checklist-firmado.pdf', 'epp-carros-chocones.jpg'],
    epp: {
      verificado: true,
      evidencia: 'epp-carros-chocones.jpg',
      observaciones: 'Equipo de proteccion completo.',
      fecha: '2026-06-05'
    }
  },
  {
    id: 3,
    juego: 'Carrusel',
    tipo: 'Periodico',
    tecnico: 'Tecnico de Mantenimiento',
    prioridad: 'Baja',
    estado: 'Pendiente',
    fecha: '2026-06-06',
    fechaInicio: '',
    fechaFin: '',
    maxHoras: 15,
    registrosHoras: [],
    evidencias: [],
    epp: {
      verificado: false,
      evidencia: '',
      observaciones: 'Pendiente verificar equipo de proteccion personal.',
      fecha: ''
    }
  }
];

const usuariosIniciales = [
  { id: 1, nombre: 'Georgean Reyes', correo: 'admin@rickysafe.local', usuario: 'admin', contrasena: 'admin123', rol: 'Administrador', departamento: 'Administracion', turno: 'Diurno', telefono: '5555-0101', ultimoAcceso: '2026-06-07 00:30', activo: true, temporal: false },
  { id: 2, nombre: 'Supervisor de Seguridad', correo: 'supervisor@rickysafe.local', usuario: 'supervisor', contrasena: 'admin123', rol: 'Supervisor', departamento: 'Seguridad industrial', turno: 'Mixto', telefono: '5555-0202', ultimoAcceso: '2026-06-06 23:45', activo: true, temporal: false },
  { id: 3, nombre: 'Tecnico de Mantenimiento', correo: 'tecnico@rickysafe.local', usuario: 'tecnico', contrasena: 'admin123', rol: 'Tecnico', departamento: 'Mantenimiento', turno: 'Matutino', telefono: '5555-0303', ultimoAcceso: '2026-06-06 22:15', activo: true, temporal: false },
  { id: 4, nombre: 'Auditor Interno', correo: 'auditor@rickysafe.local', usuario: 'auditor', contrasena: 'admin123', rol: 'Auditor', departamento: 'Auditoria', turno: 'Diurno', telefono: '5555-0404', ultimoAcceso: '2026-06-07 00:25', activo: true, temporal: false }
];

const alertasIniciales = [
  {
    id: 1,
    fecha: '2026-06-06 22:00',
    destinatario: 'Ingeniero de turno / Encargado de area',
    prioridad: 'Alta',
    estado: 'Atendida',
    mensaje: 'Orden 3: intento de procedimiento sin verificacion completa de EPP.'
  }
];

const inventarioInicial = [
  { id: 1, codigo: 'REP-001', nombre: 'Cojinete 6204', categoria: 'Rodamientos', stock: 18, minimo: 6, ubicacion: 'Bodega A' },
  { id: 2, codigo: 'REP-002', nombre: 'Correa industrial A-42', categoria: 'Transmision', stock: 9, minimo: 4, ubicacion: 'Bodega A' },
  { id: 3, codigo: 'REP-003', nombre: 'Sensor de proximidad', categoria: 'Electrico', stock: 5, minimo: 3, ubicacion: 'Bodega B' },
  { id: 4, codigo: 'REP-004', nombre: 'Tornillo grado 8', categoria: 'Fijacion', stock: 3, minimo: 5, ubicacion: 'Bodega C' }
];

function generarContrasenaTemporal() {
  const numero = Math.floor(100000 + Math.random() * 900000);
  return `Ricky#${numero}Tmp`;
}

function normalizarUsuarios(usuarios) {
  return usuarios.map((usuario) => ({
    ...usuario,
    contrasena: usuario.contrasena || usuario.contrasenaTemporal || 'admin123',
    temporal: usuario.temporal === true,
    activo: usuario.activo !== false
  }));
}

function cargarUsuarios() {
  try {
    const guardados = JSON.parse(localStorage.getItem('rickysafe_usuarios') || 'null');
    if (Array.isArray(guardados) && guardados.length) {
      return normalizarUsuarios(guardados);
    }
  } catch {
    // Si localStorage esta corrupto, se regresa a los usuarios base.
  }
  return normalizarUsuarios(usuariosIniciales);
}

function guardarUsuarios(usuarios) {
  localStorage.setItem('rickysafe_usuarios', JSON.stringify(usuarios));
}

function totalHoras(mantenimiento) {
  return (mantenimiento.registrosHoras || []).reduce((total, item) => total + Number(item.horas || 0), 0);
}

function horasRestantes(mantenimiento) {
  return Math.max(Number(mantenimiento.maxHoras || 15) - totalHoras(mantenimiento), 0);
}

function porcentajeAvance(mantenimiento) {
  return Math.min(Math.round((totalHoras(mantenimiento) / Number(mantenimiento.maxHoras || 15)) * 100), 100);
}

function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function escaparCsv(valor) {
  return `"${String(valor ?? '').replaceAll('"', '""')}"`;
}

function escaparPdf(valor) {
  return String(valor ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function crearPdfSimple(lineas) {
  const contenido = [
    'BT',
    '/F1 12 Tf',
    '50 790 Td',
    ...lineas.slice(0, 34).flatMap((linea, index) => [
      index === 0 ? '' : '0 -20 Td',
      `(${escaparPdf(linea)}) Tj`
    ]).filter(Boolean),
    'ET'
  ].join('\n');
  const objetos = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream\nendobj\n`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objetos.forEach((objeto) => {
    offsets.push(pdf.length);
    pdf += objeto;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function Login() {
  const { iniciarSesion } = useAuth();
  const [mensaje, setMensaje] = useState('');

  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const identificador = String(data.identificador || '').trim().toLowerCase();
    const contrasena = String(data.contrasena || '');
    try {
      const respuesta = await loginApi({ correo: identificador, contrasena });
      iniciarSesion(respuesta.data);
      return;
    } catch (error) {
      // El modo local permite seguir usando la demostración si el backend no está disponible.
    }

    const usuarios = cargarUsuarios();
    const encontrado = usuarios.find((item) => (
      item.correo.toLowerCase() === identificador || item.usuario.toLowerCase() === identificador
    ));

    if (!encontrado) {
      setMensaje('Usuario no encontrado.');
      return;
    }

    if (!encontrado.activo) {
      setMensaje('Usuario inactivo. Solicita reactivacion al administrador.');
      return;
    }

    if (encontrado.contrasena !== contrasena && encontrado.contrasenaTemporal !== contrasena) {
      setMensaje('Contraseña incorrecta.');
      return;
    }

    iniciarSesion({
      token: 'local-preview-token',
      usuario: {
        id_usuario: encontrado.id,
        nombre_completo: encontrado.nombre,
        correo: encontrado.correo,
        usuario: encontrado.usuario,
        rol: encontrado.rol,
        debe_cambiar_contrasena: encontrado.temporal,
        must_change_password: encontrado.temporal,
        temporary_password: encontrado.temporal
      }
    });
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-teal/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-coral/20 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-brand-teal/20 bg-brand-cream/90 shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden bg-gradient-to-br from-brand-navy via-[#35617a] to-brand-teal p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-coral text-3xl font-black shadow-lg">R</div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-teal-100">RickySafe Maintenance</p>
            <h2 className="mt-5 text-4xl font-black leading-tight">Control seguro para cada mantenimiento.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-100">Gestiona EPP, horas trabajadas, evidencias y mantenimientos programados desde un solo lugar.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
            <div className="rounded-2xl bg-white/10 p-4">EPP<br /><span className="text-teal-100">verificado</span></div>
            <div className="rounded-2xl bg-white/10 p-4">Ordenes<br /><span className="text-teal-100">trazables</span></div>
            <div className="rounded-2xl bg-white/10 p-4">Alertas<br /><span className="text-teal-100">a tiempo</span></div>
          </div>
        </section>
        <form onSubmit={submit} className="p-7 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-coral text-xl font-black text-white">R</div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-teal">RickySafe Maintenance</p>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-teal">Acceso al sistema</p>
          <h1 className="mt-2 text-3xl font-black text-brand-navy">Bienvenido de nuevo</h1>
          <p className="mt-2 text-sm text-slate-600">Ingresa tus credenciales para continuar con la gestión operativa.</p>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Correo o usuario
          <input name="identificador" className="mt-2 w-full rounded border border-slate-300 px-3 py-2" defaultValue="admin@rickysafe.local" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Contrasena
          <input name="contrasena" className="mt-2 w-full rounded border border-slate-300 px-3 py-2" type="password" defaultValue="admin123" />
        </label>
        {mensaje ? <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{mensaje}</p> : null}
        <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-4 py-3 font-bold text-white shadow-lg shadow-brand-teal/20 transition hover:-translate-y-0.5 hover:shadow-xl" type="submit">
          Entrar al sistema
        </button>
        </form>
      </div>
    </main>
  );
}

function CambioContrasenaObligatorio() {
  const { usuario, actualizarUsuario, cerrarSesion } = useAuth();
  const [mensaje, setMensaje] = useState('');

  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(data.nueva || '')) {
      setMensaje('La nueva contrasena debe tener mayuscula, minuscula, numero, simbolo y minimo 10 caracteres.');
      return;
    }

    if (data.nueva !== data.confirmacion) {
      setMensaje('La confirmacion no coincide con la nueva contrasena.');
      return;
    }

    const usuarios = cargarUsuarios();
    const encontrado = usuarios.find((item) => item.correo === usuario?.correo);
    if (!encontrado) {
      setMensaje('Usuario no encontrado.');
      return;
    }

    if (encontrado.contrasena !== data.actual && encontrado.contrasenaTemporal !== data.actual) {
      setMensaje('La contrasena temporal actual no coincide.');
      return;
    }

    const actualizados = usuarios.map((item) => (
      item.correo === usuario.correo
        ? {
            ...item,
            contrasena: data.nueva,
            contrasenaTemporal: '',
            temporal: false,
            ultimoAcceso: new Date().toLocaleString('es-GT')
          }
        : item
    ));
    guardarUsuarios(actualizados);

    actualizarUsuario({
      debe_cambiar_contrasena: false,
      must_change_password: false,
      temporary_password: false
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-teal">RickySafe Maintenance</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Crear contrasena personal</h1>
        <p className="mt-3 text-sm text-slate-600">
          {usuario?.nombre_completo || 'Usuario'}, debes cambiar la contrasena temporal antes de entrar al sistema.
        </p>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Contrasena temporal actual
          <input name="actual" type="password" required className="mt-2 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Nueva contrasena
          <input name="nueva" type="password" required className="mt-2 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Confirmar nueva contrasena
          <input name="confirmacion" type="password" required className="mt-2 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        {mensaje ? <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{mensaje}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white" type="submit">
            Guardar y continuar
          </button>
          <button className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-800" type="button" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </form>
    </main>
  );
}

function Dashboard({ mantenimientos }) {
  const resumen = useMemo(() => ({
    total: mantenimientos.length,
    revision: mantenimientos.filter((item) => item.estado === 'En revision').length,
    validados: mantenimientos.filter((item) => item.estado === 'Validado').length,
    pendientes: mantenimientos.filter((item) => item.estado === 'Pendiente').length
  }), [mantenimientos]);

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumen titulo="Mantenimientos" valor={resumen.total} detalle="Ordenes registradas" />
        <CardResumen titulo="En revision" valor={resumen.revision} detalle="Pendientes de supervisor" />
        <CardResumen titulo="Validados" valor={resumen.validados} detalle="Cumplen protocolo" />
        <CardResumen titulo="Pendientes" valor={resumen.pendientes} detalle="Aun sin enviar" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Ultimas ordenes</h3>
        <TablaMantenimientos mantenimientos={mantenimientos} />
      </div>

      <EstadoSemanal />
    </section>
  );
}

function EstadoSemanal() {
  const datos = [
    ['Pend.', 32],
    ['Proc.', 58],
    ['Rev.', 78],
    ['Val.', 92],
    ['Rech.', 20]
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Estado semanal</h3>
      <div className="grid min-h-72 grid-cols-5 items-end gap-4 px-2 pb-2">
        {datos.map(([label, value]) => (
          <div key={label} className="grid gap-2 text-center">
            <strong className="text-sm font-black text-slate-900">{value}%</strong>
            <span className="flex h-48 items-end overflow-hidden rounded-lg bg-slate-200">
              <i className="block w-full rounded-t-lg bg-brand-sky" style={{ height: `${value}%` }} />
            </span>
            <span className="text-xs font-bold text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TablaMantenimientos({ mantenimientos, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">Juego</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Tecnico</th>
            <th className="px-3 py-2">Prioridad</th>
            <th className="px-3 py-2">Horas</th>
            <th className="px-3 py-2">EPP</th>
            <th className="px-3 py-2">Estado</th>
            {onSelect ? <th className="px-3 py-2">Accion</th> : null}
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-3 py-3 font-semibold">{item.id}</td>
              <td className="px-3 py-3">{item.juego}</td>
              <td className="px-3 py-3">{item.tipo}</td>
              <td className="px-3 py-3">{item.tecnico}</td>
              <td className="px-3 py-3"><BadgeEstado estado={item.prioridad || 'Media'} /></td>
              <td className="px-3 py-3 font-semibold">{totalHoras(item)}/{item.maxHoras || 15}</td>
              <td className="px-3 py-3"><BadgeEstado estado={item.epp?.verificado ? 'Validado' : 'Pendiente'} /></td>
              <td className="px-3 py-3"><BadgeEstado estado={item.estado} /></td>
              {onSelect ? (
                <td className="px-3 py-3">
                  <button type="button" onClick={() => onSelect(item.id)} className="rounded-lg bg-brand-navy px-3 py-2 text-sm font-semibold text-white">
                    Abrir
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Placeholder({ titulo, descripcion }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">{titulo}</h3>
      <p className="mt-2 max-w-3xl text-slate-600">{descripcion}</p>
    </section>
  );
}

function UsuariosView({ usuarios, usuarioActual, onToggle, onCreate }) {
  const [temporal, setTemporal] = useState(generarContrasenaTemporal);
  const [mensaje, setMensaje] = useState('');

  function crearUsuario(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const creado = onCreate({
      nombre: data.nombre.trim(),
      usuario: data.usuario.trim(),
      correo: data.correo.trim().toLowerCase(),
      rol: data.rol,
      departamento: data.departamento || 'Sin asignar',
      turno: data.turno || 'Sin asignar',
      telefono: data.telefono || 'Sin telefono',
      contrasenaTemporal: data.contrasenaTemporal
    });

    if (!creado) {
      setMensaje('Ya existe un usuario con ese correo o nombre de usuario.');
      return;
    }

    event.currentTarget.reset();
    setTemporal(generarContrasenaTemporal());
    setMensaje('Usuario creado con contraseña temporal. Debe cambiarla al ingresar.');
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-xl font-bold text-slate-900">Usuarios y roles</h3>
      </div>
      <div className="p-4 text-sm text-slate-600">
        <strong className="text-slate-900">Regla:</strong> los usuarios no se eliminan. Si una persona deja la empresa, se desactiva su acceso y se conserva su historial.
      </div>
      <form onSubmit={crearUsuario} className="grid gap-3 border-y border-slate-100 p-4 md:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">
          Nombre completo
          <input name="nombre" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Usuario
          <input name="usuario" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Correo
          <input name="correo" type="email" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Rol
          <select name="rol" className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
            <option>Tecnico</option>
            <option>Supervisor</option>
            <option>Auditor</option>
            <option>Administrador</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Departamento
          <input name="departamento" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Turno
          <input name="turno" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Telefono
          <input name="telefono" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Contrasena temporal
          <input name="contrasenaTemporal" value={temporal} onChange={(event) => setTemporal(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <div className="md:col-span-4">
          <button type="submit" className="rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white">
            Crear usuario temporal
          </button>
        </div>
      </form>
      {mensaje ? <p className="mx-4 mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{mensaje}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Departamento</th>
              <th className="px-3 py-2">Turno</th>
              <th className="px-3 py-2">Telefono</th>
              <th className="px-3 py-2">Ultimo acceso</th>
              <th className="px-3 py-2">Acceso</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Historial</th>
              <th className="px-3 py-2">Accion</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-3">{item.nombre}</td>
                <td className="px-3 py-3">{item.usuario}</td>
                <td className="px-3 py-3">{item.correo}</td>
                <td className="px-3 py-3">{item.rol}</td>
                <td className="px-3 py-3">{item.departamento}</td>
                <td className="px-3 py-3">{item.turno}</td>
                <td className="px-3 py-3">{item.telefono}</td>
                <td className="px-3 py-3">{item.ultimoAcceso}</td>
                <td className="px-3 py-3"><BadgeEstado estado={item.temporal ? 'Temporal' : 'Definitivo'} /></td>
                <td className="px-3 py-3"><BadgeEstado estado={item.activo ? 'Activo' : 'Inactivo'} /></td>
                <td className="px-3 py-3">Conservado</td>
                <td className="px-3 py-3">
                  {item.correo === usuarioActual?.correo ? (
                    <span className="font-semibold text-slate-500">Sesion actual</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggle(item.id)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${item.activo ? 'bg-rose-700' : 'bg-emerald-700'}`}
                    >
                      {item.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MantenimientosView({ mantenimientos, onVerificarEpp, onEnviarRevision, onRegistrarHoras, onFinalizarOrden, onSelect, seleccionadoId }) {
  const [mensaje, setMensaje] = useState('');
  const seleccionado = mantenimientos.find((item) => item.id === seleccionadoId) || mantenimientos[0];

  function guardarEpp(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const archivo = event.currentTarget.elements.evidencia.files[0];
    const verificado = data.verificado === 'true';
    const evidencia = archivo?.name || seleccionado.epp?.evidencia || '';

    if (verificado && !evidencia) {
      setMensaje('Para validar EPP debes adjuntar una imagen o archivo de evidencia.');
      return;
    }

    onVerificarEpp(seleccionado.id, {
      verificado,
      evidencia: verificado ? evidencia : '',
      observaciones: data.observaciones || '',
      fecha: new Date().toISOString().slice(0, 10)
    });

    setMensaje(verificado ? 'EPP verificado y evidencia vinculada.' : 'Alerta enviada al ingeniero de turno. Procedimiento bloqueado.');
    event.currentTarget.reset();
  }

  function enviarRevision() {
    const resultado = onEnviarRevision(seleccionado.id);
    setMensaje(resultado);
  }

  function registrarHoras(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const resultado = onRegistrarHoras(seleccionado.id, {
      fecha: data.fecha,
      horas: Number(data.horas),
      descripcion: data.descripcion,
      evidencia: event.currentTarget.elements.evidenciaHoras.files[0]?.name || ''
    });
    setMensaje(resultado);
    if (resultado.startsWith('Horas registradas')) {
      event.currentTarget.reset();
    }
  }

  function finalizarOrden() {
    setMensaje(onFinalizarOrden(seleccionado.id));
  }

  const horasTrabajadas = totalHoras(seleccionado);
  const restantes = horasRestantes(seleccionado);
  const avance = porcentajeAvance(seleccionado);
  const estaFinalizada = seleccionado.estado === 'Finalizada' || seleccionado.estado === 'Cancelada' || seleccionado.estado === 'Validado';

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Ordenes de mantenimiento</h3>
        <TablaMantenimientos mantenimientos={mantenimientos} onSelect={onSelect} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Orden {seleccionado.id} - {seleccionado.juego}</h3>
              <p className="text-sm text-slate-500">{seleccionado.tipo} / {seleccionado.tecnico} / Prioridad {seleccionado.prioridad}</p>
            </div>
            <BadgeEstado estado={seleccionado.estado} />
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CardResumen titulo="Horas trabajadas" valor={`${horasTrabajadas}/${seleccionado.maxHoras || 15}`} detalle="Maximo por orden" />
            <CardResumen titulo="Restantes" valor={restantes} detalle="Horas disponibles" />
            <CardResumen titulo="Avance" valor={`${avance}%`} detalle="Segun horas registradas" />
            <CardResumen titulo="Responsable" valor={seleccionado.tecnico.split(' ')[0]} detalle={seleccionado.tecnico} />
          </div>

          <div className="mb-4 h-3 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-brand-teal" style={{ width: `${avance}%` }} />
          </div>

          <form onSubmit={registrarHoras} className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
            <label className="text-sm font-semibold text-slate-700">
              Fecha
              <input name="fecha" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Horas
              <input name="horas" type="number" min="0.25" max="15" step="0.25" required disabled={estaFinalizada || restantes <= 0} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Evidencia opcional
              <input name="evidenciaHoras" type="file" disabled={estaFinalizada || restantes <= 0} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-4">
              Descripcion del trabajo realizado
              <textarea name="descripcion" required disabled={estaFinalizada || restantes <= 0} className="mt-1 min-h-20 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-4">
              <button type="submit" disabled={estaFinalizada || restantes <= 0} className="rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
                Guardar horas
              </button>
              <button type="button" onClick={finalizarOrden} disabled={estaFinalizada} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
                Finalizar orden
              </button>
            </div>
          </form>

          <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Horas</th>
                  <th className="px-3 py-2">Tecnico</th>
                  <th className="px-3 py-2">Trabajo realizado</th>
                </tr>
              </thead>
              <tbody>
                {(seleccionado.registrosHoras || []).length ? seleccionado.registrosHoras.map((registro) => (
                  <tr key={registro.id} className="border-t border-slate-100">
                    <td className="px-3 py-3">{registro.fecha}</td>
                    <td className="px-3 py-3 font-semibold">{registro.horas}</td>
                    <td className="px-3 py-3">{registro.usuario}</td>
                    <td className="px-3 py-3">{registro.descripcion}</td>
                  </tr>
                )) : (
                  <tr><td className="px-3 py-3 text-slate-500" colSpan="4">Sin horas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <form key={seleccionado.id} onSubmit={guardarEpp} className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Equipo de proteccion
              <select name="verificado" defaultValue={seleccionado.epp?.verificado ? 'true' : 'false'} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
                <option value="true">Si, equipo completo</option>
                <option value="false">No, falta equipo</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Evidencia EPP
              <input name="evidencia" type="file" className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Observaciones
              <textarea name="observaciones" defaultValue={seleccionado.epp?.observaciones} className="mt-1 min-h-24 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" className="rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white">
                Guardar verificacion EPP
              </button>
              <button type="button" onClick={enviarRevision} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">
                Enviar a revision
              </button>
            </div>
          </form>
          {mensaje ? <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{mensaje}</p> : null}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Evidencias</h3>
          <p className="mt-3 text-sm text-slate-600"><strong>EPP:</strong> {seleccionado.epp?.evidencia || 'Pendiente'}</p>
          <p className="mt-2 text-sm text-slate-600"><strong>Fecha:</strong> {seleccionado.epp?.fecha || 'Pendiente'}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {seleccionado.evidencias.length ? seleccionado.evidencias.map((item) => (
              <li key={item} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">{item}</li>
            )) : <li className="rounded border border-slate-100 bg-slate-50 px-3 py-2">Sin evidencias cargadas</li>}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function AlertasView({ alertas, onAtender }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-xl font-bold text-slate-900">Alertas de seguridad EPP</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Destinatario</th>
              <th className="px-3 py-2">Prioridad</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Mensaje</th>
              <th className="px-3 py-2">Accion</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((alerta) => (
              <tr key={alerta.id} className="border-t border-slate-100">
                <td className="px-3 py-3">{alerta.fecha}</td>
                <td className="px-3 py-3">{alerta.destinatario}</td>
                <td className="px-3 py-3"><BadgeEstado estado={alerta.prioridad} /></td>
                <td className="px-3 py-3"><BadgeEstado estado={alerta.estado} /></td>
                <td className="px-3 py-3">{alerta.mensaje}</td>
                <td className="px-3 py-3">
                  {alerta.estado === 'Pendiente' ? (
                    <button type="button" onClick={() => onAtender(alerta.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
                      Marcar atendida
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-500">Verificada</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportesView({ mantenimientos }) {
  const [mensaje, setMensaje] = useState('');
  const porTipo = mantenimientos.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  }, {});

  function exportar(formato) {
    if (!mantenimientos.length) {
      setMensaje('No hay información para exportar.');
      return;
    }

    const encabezados = ['ID', 'Juego', 'Tipo', 'Tecnico', 'Prioridad', 'Estado', 'Horas', 'Fecha inicio', 'Fecha fin'];
    const filas = mantenimientos.map((item) => [
      item.id,
      item.juego,
      item.tipo,
      item.tecnico,
      item.prioridad,
      item.estado,
      `${totalHoras(item)}/${item.maxHoras || 15}`,
      item.fechaInicio || item.fecha,
      item.fechaFin || 'Pendiente'
    ]);

    if (formato === 'CSV') {
      const csv = '\uFEFFsep=;\n' + [encabezados, ...filas]
        .map((fila) => fila.map(escaparCsv).join(';'))
        .join('\n');
      descargarArchivo('rickysafe-reporte.csv', csv, 'text/csv;charset=utf-8');
    } else if (formato === 'Excel') {
      const tabla = [encabezados, ...filas]
        .map((fila) => `<tr>${fila.map((valor) => `<td>${String(valor ?? '')}</td>`).join('')}</tr>`)
        .join('');
      const excel = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tabla}</table></body></html>`;
      descargarArchivo('rickysafe-reporte.xls', excel, 'application/vnd.ms-excel;charset=utf-8');
    } else {
      const lineas = [
        'RickySafe Maintenance',
        'Reporte de ordenes de mantenimiento',
        `Generado: ${new Date().toLocaleString('es-GT')}`,
        '',
        ...filas.map((fila) => `Orden ${fila[0]} - ${fila[1]} - ${fila[5]} - Horas ${fila[6]}`)
      ];
      descargarArchivo('rickysafe-reporte.pdf', crearPdfSimple(lineas), 'application/pdf');
    }

    setMensaje(`Reporte descargado en formato ${formato}.`);
  }

  return (
    <section className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <h3 className="text-xl font-bold text-slate-900">Reporte personalizado</h3>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg bg-brand-navy px-4 py-2 text-sm font-bold text-white">
              Exportar reporte
            </summary>
            <div className="absolute right-0 z-10 mt-2 grid min-w-40 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <button type="button" onClick={() => exportar('Excel')} className="rounded px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-slate-100">Excel</button>
              <button type="button" onClick={() => exportar('PDF')} className="rounded px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-slate-100">PDF</button>
              <button type="button" onClick={() => exportar('CSV')} className="rounded px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-slate-100">CSV</button>
            </div>
          </details>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Fecha inicial
            <input type="date" defaultValue="2026-06-01" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Fecha final
            <input type="date" defaultValue="2026-06-30" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Estado
            <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2"><option>Todos</option><option>Validado</option><option>En revision</option><option>Rechazado</option></select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Tipo
            <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2"><option>Todos</option><option>Preventivo</option><option>Correctivo</option><option>Periodico</option></select>
          </label>
        </div>
        {mensaje ? <p className="mx-4 mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{mensaje}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumen titulo="Total" valor={mantenimientos.length} detalle="Mantenimientos" />
        <CardResumen titulo="Preventivo" valor={porTipo.Preventivo || 0} detalle="Por tipo" />
        <CardResumen titulo="Correctivo" valor={porTipo.Correctivo || 0} detalle="Por tipo" />
        <CardResumen titulo="Periodico" valor={porTipo.Periodico || 0} detalle="Por tipo" />
      </div>
    </section>
  );
}

function InventarioView() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-xl font-bold text-slate-900">Inventario de repuestos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Codigo</th>
              <th className="px-3 py-2">Repuesto</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Minimo</th>
              <th className="px-3 py-2">Ubicacion</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {inventarioInicial.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-3 font-semibold">{item.codigo}</td>
                <td className="px-3 py-3">{item.nombre}</td>
                <td className="px-3 py-3">{item.categoria}</td>
                <td className="px-3 py-3">{item.stock}</td>
                <td className="px-3 py-3">{item.minimo}</td>
                <td className="px-3 py-3">{item.ubicacion}</td>
                <td className="px-3 py-3"><BadgeEstado estado={item.stock <= item.minimo ? 'En revision' : 'Activo'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AppShell() {
  const { usuario, cerrarSesion } = useAuth();
  const [activo, setActivo] = useState('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuarios, setUsuarios] = useState(cargarUsuarios);
  const [mantenimientos, setMantenimientos] = useState(mantenimientosIniciales);
  const [alertas, setAlertas] = useState(alertasIniciales);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(1);

  function toggleUsuario(id) {
    setUsuarios((actuales) => {
      const actualizados = actuales.map((item) => (
        item.id === id ? { ...item, activo: !item.activo } : item
      ));
      guardarUsuarios(actualizados);
      return actualizados;
    });
  }

  function crearUsuario(data) {
    const duplicado = usuarios.some((item) => item.correo === data.correo || item.usuario === data.usuario);
    if (duplicado) return false;

    setUsuarios((actuales) => {
      const actualizados = [
        ...actuales,
        {
        id: Math.max(0, ...actuales.map((item) => item.id)) + 1,
        ...data,
        contrasena: data.contrasenaTemporal,
        ultimoAcceso: 'Pendiente',
        activo: true,
        temporal: true
        }
      ];
      guardarUsuarios(actualizados);
      return actualizados;
    });
    return true;
  }

  function verificarEpp(id, epp) {
    setMantenimientos((actuales) => actuales.map((item) => {
      if (item.id !== id) return item;
      const evidencias = epp.evidencia && !item.evidencias.includes(epp.evidencia)
        ? [...item.evidencias, epp.evidencia]
        : item.evidencias;
      return { ...item, epp, evidencias };
    }));

    if (!epp.verificado) {
      const mantenimiento = mantenimientos.find((item) => item.id === id);
      setAlertas((actuales) => {
        const alertaPendiente = actuales.some((item) => (
          item.estado === 'Pendiente' && item.mensaje.startsWith(`Orden ${id}:`)
        ));
        if (alertaPendiente) return actuales;

        return [
          {
            id: Math.max(0, ...actuales.map((item) => item.id)) + 1,
            fecha: new Date().toLocaleString('es-GT'),
            destinatario: 'Ingeniero de turno / Encargado de area',
            prioridad: 'Alta',
            estado: 'Pendiente',
            mensaje: `Orden ${id}: ${mantenimiento?.tecnico || 'Tecnico'} intenta realizar procedimiento sin EPP completo.`
          },
          ...actuales
        ];
      });
    }
  }

  function enviarRevision(id) {
    const mantenimiento = mantenimientos.find((item) => item.id === id);
    if (!mantenimiento?.epp?.verificado || !mantenimiento.epp.evidencia) {
      return 'No se puede enviar: la verificacion EPP con evidencia es obligatoria.';
    }

    if (!mantenimiento.evidencias.length) {
      return 'Agrega al menos una evidencia antes de enviar.';
    }

    setMantenimientos((actuales) => actuales.map((item) => (
      item.id === id ? { ...item, estado: 'En revision' } : item
    )));
    return 'Mantenimiento enviado a revision.';
  }

  function registrarHoras(id, data) {
    const mantenimiento = mantenimientos.find((item) => item.id === id);
    if (!mantenimiento) return 'Orden no encontrada.';
    if (['Finalizada', 'Cancelada', 'Validado'].includes(mantenimiento.estado)) {
      return 'La orden ya no acepta nuevos registros de horas.';
    }

    const horas = Number(data.horas || 0);
    if (horas <= 0) return 'Las horas trabajadas deben ser mayores a 0.';

    const totalActual = totalHoras(mantenimiento);
    const maximo = Number(mantenimiento.maxHoras || 15);
    if (totalActual + horas > maximo) {
      return `No se puede guardar: la orden va en ${totalActual}/${maximo} horas y no puede pasar de ${maximo}.`;
    }

    setMantenimientos((actuales) => actuales.map((item) => {
      if (item.id !== id) return item;
      const registrosHoras = [
        ...(item.registrosHoras || []),
        {
          id: Math.max(0, ...(item.registrosHoras || []).map((registro) => registro.id)) + 1,
          fecha: data.fecha || new Date().toISOString().slice(0, 10),
          horas,
          descripcion: data.descripcion,
          evidencia: data.evidencia || '',
          usuario: item.tecnico
        }
      ];
      const evidencias = data.evidencia && !item.evidencias.includes(data.evidencia)
        ? [...item.evidencias, data.evidencia]
        : item.evidencias;
      return {
        ...item,
        registrosHoras,
        evidencias,
        estado: item.estado === 'Pendiente' ? 'En proceso' : item.estado,
        fechaInicio: item.fechaInicio || new Date().toISOString().slice(0, 10)
      };
    }));

    return `Horas registradas. Avance actualizado a ${totalActual + horas}/${maximo}.`;
  }

  function finalizarOrden(id) {
    const mantenimiento = mantenimientos.find((item) => item.id === id);
    if (!mantenimiento) return 'Orden no encontrada.';
    if (['Finalizada', 'Cancelada', 'Validado'].includes(mantenimiento.estado)) {
      return 'La orden ya estaba cerrada.';
    }

    setMantenimientos((actuales) => actuales.map((item) => (
      item.id === id
        ? { ...item, estado: 'Finalizada', fechaFin: new Date().toISOString().slice(0, 10) }
        : item
    )));

    return 'Orden finalizada correctamente.';
  }

  function atenderAlerta(id) {
    setAlertas((actuales) => actuales.map((item) => (
      item.id === id ? { ...item, estado: 'Atendida' } : item
    )));
  }

  const vistas = {
    dashboard: <Dashboard mantenimientos={mantenimientos} />,
    usuarios: <UsuariosView usuarios={usuarios} usuarioActual={usuario} onToggle={toggleUsuario} onCreate={crearUsuario} />,
    inventario: <InventarioView />,
    mantenimientos: (
      <MantenimientosView
        mantenimientos={mantenimientos}
        seleccionadoId={mantenimientoSeleccionado}
        onSelect={setMantenimientoSeleccionado}
        onVerificarEpp={verificarEpp}
        onEnviarRevision={enviarRevision}
        onRegistrarHoras={registrarHoras}
        onFinalizarOrden={finalizarOrden}
      />
    ),
    alertas: <AlertasView alertas={alertas} onAtender={atenderAlerta} />,
    validaciones: <Placeholder titulo="Validaciones" descripcion="Revision por supervisor, aprobacion, rechazo y observaciones obligatorias." />,
    reportes: <ReportesView mantenimientos={mantenimientos} />,
    asistente: <AsistenteView mantenimientos={mantenimientos} alertas={alertas} />,
    auditoria: <Placeholder titulo="Auditoria" descripcion="Registro de acciones importantes realizadas dentro del sistema." />
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        abierto={menuAbierto}
        activo={activo}
        onChange={setActivo}
        onClose={() => setMenuAbierto(false)}
      />
      <div className="min-w-0 flex-1">
        <Navbar
          usuario={usuario}
          onLogout={cerrarSesion}
          onMenuClick={() => setMenuAbierto(true)}
          onHome={() => setActivo('dashboard')}
        />
        <main className="p-6">{vistas[activo]}</main>
      </div>
    </div>
  );
}

function AsistenteView({ mantenimientos, alertas }) {
  const [tipo, setTipo] = useState('reporte');
  const [resultado, setResultado] = useState('Selecciona una función para generar una orientación.');
  const [cargando, setCargando] = useState(false);
  async function ejecutar() {
    setCargando(true);
    try {
      const respuesta = await consultarAsistente({ tipo, contexto: JSON.stringify({ mantenimientos, alertas }) });
      setResultado(`${respuesta.data.modo === 'openai' ? 'Respuesta con OpenAI' : 'Respuesta local de respaldo'}\n\n${respuesta.data.contenido}`);
    } catch (error) {
      setResultado(`No fue posible consultar el asistente: ${error.response?.data?.mensaje || error.message}`);
    } finally { setCargando(false); }
  }
  return <section className="space-y-5">
    <div><p className="text-sm font-bold uppercase tracking-widest text-brand-teal">RickySafe Intelligence</p><h2 className="mt-1 text-3xl font-black text-brand-navy">Asistente inteligente</h2><p className="mt-2 text-slate-600">Genera orientación operativa sin reemplazar la revisión del responsable de seguridad.</p></div>
    <div className="grid gap-4 rounded-2xl border border-brand-teal/20 bg-brand-cream p-5 shadow-sm md:grid-cols-[1fr_auto]">
      <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-3 font-semibold"><option value="reporte">Generar reporte</option><option value="recomendaciones">Recomendaciones de mantenimiento</option><option value="alertas">Resumen de alertas</option><option value="riesgos">Detectar riesgos en evidencias</option></select>
      <button type="button" onClick={ejecutar} disabled={cargando} className="rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-5 py-3 font-bold text-white disabled:opacity-60">{cargando ? 'Analizando...' : 'Generar orientación'}</button>
    </div>
    <pre className="whitespace-pre-wrap rounded-2xl border border-brand-teal/20 bg-[#e9f5f1] p-5 text-sm leading-7 text-slate-700 shadow-sm">{resultado}</pre>
  </section>;
}

function Root() {
  const { usuario } = useAuth();
  if (!usuario) return <Login />;
  if (usuario.debe_cambiar_contrasena || usuario.must_change_password) {
    return <CambioContrasenaObligatorio />;
  }
  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
