import { useEffect, useMemo, useState } from 'react';
import api from './services/api';
import { login, cambiarContrasena } from './services/auth.service';
import {
  asignarOrden, cancelarOrden, cambiarEstadoProgramacion, completarChecklist, crearOrden,
  crearProgramacion, finalizarOrden, iniciarOrden, listarChecklistOrden, listarEvidenciasOrden,
  listarHistorialOrden, listarHorasOrden, listarOrdenes, listarProgramaciones, listarRepuestosOrden,
  procesarProgramaciones, registrarHorasOrden, registrarRepuestoOrden, subirEvidenciaOrden, verificarEppOrden
} from './services/ordenes.service';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';

const API_ERROR = 'No se pudo completar la operación. Revisa la conexión e inténtalo de nuevo.';
const TERMINAL = ['Finalizada', 'Cancelada'];

function mensajeError(error) {
  return error?.response?.data?.mensaje || API_ERROR;
}

function Panel({ title, detail, action, children }) {
  return <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div><h2 className="text-lg font-bold text-slate-900">{title}</h2>{detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}</div>
      {action}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>;
}

function Notice({ error, success }) {
  if (!error && !success) return null;
  return <div role="status" aria-live="polite" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
    {error || success}
  </div>;
}

function Button({ children, className = '', ...props }) {
  return <button {...props} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
    {children}
  </button>;
}

function Field({ label, children, className = '' }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
    <span className="mb-1 block">{label}</span>{children}
  </label>;
}

const inputClass = 'min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-700/20';
const primaryButton = 'bg-brand-navy text-white hover:bg-slate-800';
const secondaryButton = 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

function Login() {
  const { iniciarSesion } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data } = await login({ correo: values.identificador, contrasena: values.contrasena });
      iniciarSesion(data);
    } catch (reason) {
      setError(mensajeError(reason));
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-800">Rickylandia · Seguridad industrial</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">RickySafe</h1>
      <p className="mt-2 text-sm text-slate-600">Ingresa con tu cuenta del sistema.</p>
      <Notice error={error} />
      <Field label="Correo o usuario" className="mt-6"><input className={inputClass} name="identificador" autoComplete="username" required /></Field>
      <Field label="Contraseña" className="mt-4"><input className={inputClass} name="contrasena" type="password" autoComplete="current-password" required /></Field>
      <Button disabled={busy} className={`${primaryButton} mt-6 w-full`}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</Button>
    </form>
  </main>;
}

function ChangePassword() {
  const { usuario, actualizarUsuario, cerrarSesion } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError(''); setSuccess(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.nueva_contrasena !== values.confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña.'); setBusy(false); return;
    }
    try {
      const { data } = await cambiarContrasena({ contrasena_actual: values.contrasena_actual, nueva_contrasena: values.nueva_contrasena });
      actualizarUsuario({ debe_cambiar_contrasena: false, must_change_password: false, temporary_password: false });
      setSuccess(data.mensaje || 'Contraseña actualizada.');
    } catch (reason) { setError(mensajeError(reason)); }
    finally { setBusy(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
    <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Crea tu contraseña personal</h1>
      <p className="mt-2 text-sm text-slate-600">{usuario?.nombre || usuario?.nombre_completo || 'Usuario'}, debes cambiar la contraseña temporal antes de continuar.</p>
      <Notice error={error} success={success} />
      <Field label="Contraseña temporal actual" className="mt-5"><input className={inputClass} type="password" name="contrasena_actual" autoComplete="current-password" required /></Field>
      <Field label="Nueva contraseña" className="mt-4"><input className={inputClass} type="password" name="nueva_contrasena" autoComplete="new-password" minLength={10} required /><span className="mt-1 block text-xs font-normal text-slate-500">10 caracteres o más, mayúscula, minúscula, número y símbolo.</span></Field>
      <Field label="Confirma la nueva contraseña" className="mt-4"><input className={inputClass} type="password" name="confirmacion" autoComplete="new-password" minLength={10} required /></Field>
      <div className="mt-6 flex flex-wrap gap-2"><Button disabled={busy} className={primaryButton}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</Button><Button type="button" onClick={cerrarSesion} className={secondaryButton}>Salir</Button></div>
    </form>
  </main>;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/dashboard').then(({ data: result }) => setData(result)).catch((reason) => setError(mensajeError(reason))); }, []);
  const cards = [
    ['Órdenes activas', Number(data?.ordenes?.por_estado?.Pendiente || 0) + Number(data?.ordenes?.por_estado?.['En proceso'] || 0)],
    ['Finalizadas', data?.ordenes?.por_estado?.Finalizada || 0],
    ['Repuestos bajo mínimo', data?.repuestos_bajo_minimo || 0],
    ['Programaciones próximas', data?.programaciones_vencen_7_dias || 0],
    ['Costo histórico registrado', `Q ${Number(data?.costo_historico || 0).toFixed(2)}`]
  ];
  return <div className="space-y-5"><Notice error={error} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value ?? '—'}</p></article>)}</div>
    <Panel title="Órdenes recientes" detail="Datos actuales de la base de datos">
      {!data?.recientes?.length ? <p className="text-sm text-slate-500">Todavía no hay órdenes.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Código</th><th>Equipo</th><th>Responsable</th><th>Estado</th><th>Prioridad</th></tr></thead><tbody>{data.recientes.map((order) => <tr key={order.id} className="border-t border-slate-100"><td className="py-3 font-semibold">{order.order_code}</td><td>{order.nombre_juego || 'Sin equipo'}</td><td>{order.responsable || 'Sin asignar'}</td><td>{order.status}</td><td>{order.priority}</td></tr>)}</tbody></table></div>}
    </Panel>
  </div>;
}

function OrdersPage({ usuario }) {
  const [result, setResult] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [parts, setParts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ checklist: [], history: [], evidence: [], hours: [], parts: [] });
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('fecha');
  const [direction, setDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const canManage = ['Administrador', 'Supervisor'].includes(usuario.rol);
  const isTechnician = usuario.rol === 'Tecnico';

  async function loadOrders() {
    const { data } = await listarOrdenes({ page, pageSize: 10, q: appliedQ, estado: status, sort, direction });
    setResult(data);
    if (selected && !data.items.some((item) => item.id === selected.id)) setSelected(null);
  }
  async function loadDetail(id) {
    const [checklist, history, evidence, hours, usedParts] = await Promise.all([
      listarChecklistOrden(id), listarHistorialOrden(id), listarEvidenciasOrden(id), listarHorasOrden(id), listarRepuestosOrden(id)
    ]);
    setDetail({ checklist: checklist.data, history: history.data, evidence: evidence.data, hours: hours.data, parts: usedParts.data });
  }
  async function loadSupport() {
    const [games, inventory, scheduleResult, usersResult] = await Promise.allSettled([
      api.get('/juegos'), api.get('/inventario'), listarProgramaciones(), canManage ? api.get('/usuarios') : Promise.resolve({ data: [] })
    ]);
    if (games.status === 'fulfilled') setEquipment(games.value.data);
    if (inventory.status === 'fulfilled') setParts(inventory.value.data);
    if (scheduleResult.status === 'fulfilled') setSchedules(scheduleResult.value.data);
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value.data.filter((item) => item.estado));
  }
  useEffect(() => { loadOrders().catch((reason) => setError(mensajeError(reason))); }, [page, appliedQ, status, sort, direction]);
  useEffect(() => { loadSupport().catch((reason) => setError(mensajeError(reason))); }, []);
  useEffect(() => { if (selected) loadDetail(selected.id).catch((reason) => setError(mensajeError(reason))); }, [selected?.id]);

  async function perform(action, message, refresh = true) {
    setError(''); setSuccess(''); setBusy(true);
    try {
      const result = await action(); setSuccess(typeof message === 'function' ? message(result) : message);
      if (refresh) { await loadOrders(); if (selected) await loadDetail(selected.id); await loadSupport(); }
    } catch (reason) { setError(mensajeError(reason)); }
    finally { setBusy(false); }
  }
  async function createOrder(event) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    await perform(async () => { await crearOrden({ id_juego: Number(values.id_juego), assigned_to: values.assigned_to ? Number(values.assigned_to) : undefined, priority: values.priority, description: values.description }); form.reset(); }, 'Orden creada con checklist obligatorio.');
  }
  async function createSchedule(event) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    await perform(async () => { await crearProgramacion({ id_juego: Number(values.id_juego), assigned_to: values.assigned_to ? Number(values.assigned_to) : null, title: values.title, description: values.description, priority: values.priority, interval_days: Number(values.interval_days), next_due: values.next_due }); form.reset(); }, 'Programación recurrente guardada.');
  }
  async function uploadEvidence(event) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element);
    await perform(async () => { await subirEvidenciaOrden(selected.id, form); await verificarEppOrden(selected.id, { verified: true, observations: form.get('description') || 'EPP verificado; evidencia adjunta' }); element.reset(); }, 'Evidencia guardada y EPP verificado.');
  }
  async function submitHours(event) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    await perform(async () => { await registrarHorasOrden(selected.id, { work_date: values.work_date, hours_worked: Number(values.hours_worked), description: values.description }); form.reset(); }, 'Horas de trabajo registradas.');
  }
  async function submitPart(event) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    await perform(async () => { await registrarRepuestoOrden(selected.id, { part_id: Number(values.part_id), quantity: Number(values.quantity), reason: values.reason }); form.reset(); }, 'Salida de repuesto registrada en inventario y orden.');
  }
  async function submitAssign(event) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    await perform(() => asignarOrden(selected.id, { assigned_to: Number(values.assigned_to), reason: values.reason }), 'Responsable asignado.');
  }
  async function submitCancel(event) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    await perform(() => cancelarOrden(selected.id, values.reason), 'Orden cancelada.');
  }

  const activeOrder = selected || result.items[0];
  const canWorkOrder = Boolean(activeOrder && (canManage || (isTechnician && Number(activeOrder.assigned_to) === Number(usuario.id_usuario))));
  return <div className="space-y-5">
    <Notice error={error} success={success} />
    {canManage && <Panel title="Crear orden" detail="Las órdenes nuevas incluyen checklist de seguridad y registro de historial">
      <form onSubmit={createOrder} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Field label="Equipo"><select name="id_juego" className={inputClass} required><option value="">Selecciona</option>{equipment.filter((item) => item.estado_operativo === 'Activo').map((item) => <option key={item.id_juego} value={item.id_juego}>{item.nombre_juego}</option>)}</select></Field>
        <Field label="Responsable"><select name="assigned_to" className={inputClass}><option value="">Sin asignar</option>{users.filter((item) => item.rol === 'Tecnico' || item.rol === 'Administrador').map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre_completo} · {item.rol}</option>)}</select></Field>
        <Field label="Prioridad"><select name="priority" className={inputClass}><option>Media</option><option>Alta</option><option>Baja</option><option>Crítica</option></select></Field>
        <Field label="Descripción"><input name="description" className={inputClass} required maxLength={2000} /></Field>
        <div className="flex items-end"><Button disabled={busy} className={`${primaryButton} w-full`}>Crear orden</Button></div>
      </form>
    </Panel>}

    {canManage && <Panel title="Mantenimiento recurrente" detail="Las fechas vencidas crean como máximo una orden por programación y fecha prevista">
      <form onSubmit={createSchedule} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <Field label="Equipo"><select name="id_juego" className={inputClass} required><option value="">Selecciona</option>{equipment.map((item) => <option key={item.id_juego} value={item.id_juego}>{item.nombre_juego}</option>)}</select></Field>
        <Field label="Título"><input name="title" className={inputClass} required maxLength={150} /></Field>
        <Field label="Descripción"><input name="description" className={inputClass} required /></Field>
        <Field label="Responsable"><select name="assigned_to" className={inputClass}><option value="">Sin asignar</option>{users.filter((item) => item.rol === 'Tecnico').map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre_completo}</option>)}</select></Field>
        <Field label="Repetir cada (días)"><input name="interval_days" type="number" min="1" max="3650" defaultValue="30" className={inputClass} required /></Field>
        <Field label="Primera fecha"><input name="next_due" type="date" className={inputClass} required /></Field>
        <div className="flex items-end gap-2"><Button disabled={busy} className={`${primaryButton} w-full`}>Programar</Button></div>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button disabled={busy} onClick={() => perform(async () => { const { data } = await procesarProgramaciones(); return data.generadas; }, (count) => `Proceso completado: ${count} orden(es) recurrentes generadas.`)} className={secondaryButton}>Generar vencidas</Button><span className="text-sm text-slate-500">{schedules.filter((item) => item.active).length} programación(es) activa(s)</span></div>
      {schedules.length > 0 && <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">{schedules.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div className="text-sm"><p className="font-semibold">{item.title} · {item.nombre_juego}</p><p className="text-slate-500">Cada {item.interval_days} días · próxima: {item.next_due?.slice(0, 10)} · {item.active ? 'Activa' : 'Pausada'}</p></div><Button disabled={busy} className={secondaryButton} onClick={() => perform(() => cambiarEstadoProgramacion(item.id, !item.active), item.active ? 'Programación pausada.' : 'Programación reactivada.')}>{item.active ? 'Pausar' : 'Reactivar'}</Button></li>)}</ul>}
    </Panel>}

    <Panel title="Órdenes de mantenimiento" detail={`${result.total} registros · búsqueda y filtros aplicados en el servidor`}>
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedQ(q); }} className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Buscar"><input value={q} onChange={(event) => setQ(event.target.value)} className={inputClass} placeholder="Código, equipo, descripción…" /></Field>
        <Field label="Estado"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass}><option value="">Todos</option><option>Pendiente</option><option>En proceso</option><option>Finalizada</option><option>Cancelada</option></select></Field>
        <Field label="Ordenar"><select value={sort} onChange={(event) => setSort(event.target.value)} className={inputClass}><option value="fecha">Fecha</option><option value="prioridad">Prioridad</option><option value="estado">Estado</option><option value="codigo">Código</option></select></Field>
        <Field label="Dirección"><select value={direction} onChange={(event) => setDirection(event.target.value)} className={inputClass}><option value="desc">Descendente</option><option value="asc">Ascendente</option></select></Field>
        <div className="flex items-end"><Button className={`${secondaryButton} w-full`}>Buscar</Button></div>
      </form>
      {result.items.length === 0 ? <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">No hay órdenes que coincidan con estos filtros.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Código', 'Equipo', 'Responsable', 'Estado', 'Prioridad', 'Mano de obra', 'Repuestos', ''].map((x) => <th className="px-3 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{result.items.map((order) => <tr key={order.id} className={`border-t border-slate-100 ${activeOrder?.id === order.id ? 'bg-cyan-50/50' : ''}`}><td className="px-3 py-3 font-bold">{order.order_code}</td><td className="px-3 py-3">{order.nombre_juego || 'Sin equipo'}</td><td className="px-3 py-3">{order.responsable || 'Sin asignar'}</td><td className="px-3 py-3">{order.status}</td><td className="px-3 py-3">{order.priority}</td><td className="px-3 py-3">Q {Number(order.costo_mano_obra || 0).toFixed(2)}</td><td className="px-3 py-3">Q {Number(order.costo_repuestos || 0).toFixed(2)}</td><td className="px-3 py-3"><Button className={secondaryButton} onClick={() => setSelected(order)}>Abrir</Button></td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex items-center justify-between"><Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className={secondaryButton}>Anterior</Button><span className="text-sm text-slate-600">Página {result.page || page} de {Math.max(1, result.totalPages || 1)}</span><Button disabled={page >= (result.totalPages || 1)} onClick={() => setPage((current) => current + 1)} className={secondaryButton}>Siguiente</Button></div>
    </Panel>

    {activeOrder && <Panel title={`Detalle ${activeOrder.order_code}`} detail={`${activeOrder.nombre_juego || 'Equipo sin asignar'} · ${activeOrder.status}`}>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {canWorkOrder && activeOrder.status === 'Pendiente' && <Button disabled={busy || !activeOrder.epp_verified} title={!activeOrder.epp_verified ? 'Verifica primero el EPP con evidencia' : ''} className={primaryButton} onClick={() => perform(() => iniciarOrden(activeOrder.id), 'Orden iniciada.')}>Iniciar</Button>}
            {canWorkOrder && activeOrder.status === 'En proceso' && <Button disabled={busy} className={primaryButton} onClick={() => perform(() => finalizarOrden(activeOrder.id, 'Trabajo completado'), 'Orden finalizada.')}>Finalizar</Button>}
            {canManage && !TERMINAL.includes(activeOrder.status) && <Button disabled={busy} className="border border-red-200 bg-red-50 text-red-800 hover:bg-red-100" onClick={() => document.getElementById('cancel-reason')?.focus()}>Cancelar orden</Button>}
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm"><p><b>Descripción:</b> {activeOrder.description || 'Sin descripción'}</p><p className="mt-1"><b>Horas:</b> {activeOrder.horas_trabajadas || 0} / {activeOrder.max_hours || 15}</p><p className="mt-1"><b>Costo total:</b> Q {(Number(activeOrder.costo_mano_obra || 0) + Number(activeOrder.costo_repuestos || 0)).toFixed(2)}</p><p className="mt-1"><b>EPP:</b> {activeOrder.epp_verified ? 'Verificado' : 'Pendiente de verificación'}</p></div>
          {canManage && !TERMINAL.includes(activeOrder.status) && <form onSubmit={submitAssign} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"><Field label="Asignar responsable"><select name="assigned_to" className={inputClass} required><option value="">Selecciona</option>{users.filter((item) => item.rol === 'Tecnico' || item.rol === 'Administrador').map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre_completo}</option>)}</select></Field><Field label="Motivo"><input name="reason" className={inputClass} defaultValue="Asignación de trabajo" /></Field><div className="flex items-end"><Button className={`${secondaryButton} w-full`}>Asignar</Button></div></form>}
          {canWorkOrder && !TERMINAL.includes(activeOrder.status) && <form onSubmit={uploadEvidence} className="space-y-2 rounded-lg border border-cyan-100 bg-cyan-50/40 p-3"><h3 className="font-bold text-slate-800">Equipo de protección personal</h3><Field label="Evidencia (foto o documento)"><input name="archivo" className={inputClass} type="file" accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.csv" required /></Field><Field label="Observaciones"><input name="description" className={inputClass} placeholder="EPP requerido completo y en buen estado" /></Field><Button disabled={busy} className={primaryButton}>Subir evidencia y verificar EPP</Button></form>}
          {canWorkOrder && activeOrder.status === 'En proceso' && <form onSubmit={submitHours} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"><h3 className="font-bold sm:col-span-3">Registrar mano de obra</h3><Field label="Fecha"><input name="work_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} required /></Field><Field label="Horas"><input name="hours_worked" type="number" step="0.25" min="0.25" className={inputClass} required /></Field><Field label="Descripción"><input name="description" className={inputClass} required /></Field><div className="sm:col-span-3"><Button disabled={busy} className={primaryButton}>Guardar horas</Button></div></form>}
          {canWorkOrder && activeOrder.status === 'En proceso' && <form onSubmit={submitPart} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"><h3 className="font-bold sm:col-span-3">Registrar repuesto consumido</h3><Field label="Repuesto"><select name="part_id" className={inputClass} required><option value="">Selecciona</option>{parts.filter((item) => item.estado && Number(item.stock_actual) > 0).map((item) => <option key={item.id_repuesto} value={item.id_repuesto}>{item.codigo_repuesto} · {item.nombre_repuesto} ({item.stock_actual} disponibles)</option>)}</select></Field><Field label="Cantidad"><input name="quantity" type="number" step="0.01" min="0.01" className={inputClass} required /></Field><Field label="Motivo"><input name="reason" className={inputClass} required /></Field><div className="sm:col-span-3"><Button disabled={busy} className={secondaryButton}>Registrar salida</Button></div></form>}
          {canManage && !TERMINAL.includes(activeOrder.status) && <form onSubmit={submitCancel} className="flex flex-wrap items-end gap-2"><Field label="Motivo de cancelación"><input id="cancel-reason" name="reason" className={inputClass} required minLength={5} /></Field><Button className="border border-red-200 bg-red-50 text-red-800">Confirmar cancelación</Button></form>}
        </div>
        <div className="space-y-4">
          <section><h3 className="mb-2 font-bold">Checklist</h3>{detail.checklist.length ? <ul className="space-y-2">{detail.checklist.map((item) => <li key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"><input aria-label={`Completar: ${item.description}`} type="checkbox" checked={item.completed} disabled={busy || !canWorkOrder || TERMINAL.includes(activeOrder.status) || (item.description.includes('EPP') && !activeOrder.epp_verified)} onChange={(event) => perform(() => completarChecklist(activeOrder.id, item.id, event.target.checked), 'Checklist actualizado.')} className="mt-1 h-4 w-4 accent-cyan-700" /><span className="text-sm">{item.description}{item.required && <span className="ml-2 text-xs font-semibold text-red-700">Obligatorio</span>}</span></li>)}</ul> : <p className="text-sm text-slate-500">No hay elementos de checklist.</p>}</section>
          <section><h3 className="mb-2 font-bold">Evidencias</h3>{detail.evidence.length ? <ul className="space-y-1 text-sm">{detail.evidence.map((file) => <li key={file.id} className="flex flex-wrap items-center justify-between gap-2"><span>{file.original_name} · {file.responsable || 'Usuario'} · {new Date(file.created_at).toLocaleString()}</span><Button className={secondaryButton} onClick={async () => { try { const { data } = await api.get(`/orden-evidencias/${file.id}/archivo`, { responseType: 'blob' }); const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.download = file.original_name; link.click(); URL.revokeObjectURL(url); } catch (reason) { setError(mensajeError(reason)); } }}>Descargar</Button></li>)}</ul> : <p className="text-sm text-slate-500">Sin evidencias adjuntas.</p>}</section>
          <section><h3 className="mb-2 font-bold">Mano de obra registrada</h3>{detail.hours.length ? <ul className="space-y-1 text-sm">{detail.hours.map((item) => <li key={item.id}>{item.work_date?.slice(0, 10)} · {item.hours_worked} h × Q {Number(item.hourly_rate || 0).toFixed(2)} = Q {Number(item.costo_total || Number(item.hours_worked) * Number(item.hourly_rate || 0)).toFixed(2)} · {item.description}</li>)}</ul> : <p className="text-sm text-slate-500">Sin horas registradas.</p>}</section>
          <section><h3 className="mb-2 font-bold">Repuestos usados</h3>{detail.parts.length ? <ul className="space-y-1 text-sm">{detail.parts.map((item) => <li key={item.id}>{item.codigo_repuesto} · {item.quantity} × Q {Number(item.unit_cost).toFixed(2)} = Q {Number(item.costo_total).toFixed(2)}</li>)}</ul> : <p className="text-sm text-slate-500">Sin repuestos registrados.</p>}</section>
          <section><h3 className="mb-2 font-bold">Historial de cambios</h3>{detail.history.length ? <ol className="space-y-2 border-l-2 border-slate-200 pl-4">{detail.history.map((item) => <li key={item.id} className="text-sm"><p className="font-semibold">{item.action}: {item.from_status || '—'} → {item.to_status || '—'}</p><p className="text-slate-500">{item.responsable || 'Usuario eliminado'} · {new Date(item.event_date).toLocaleString()}</p>{item.reason && <p className="text-slate-600">{item.reason}</p>}</li>)}</ol> : <p className="text-sm text-slate-500">Sin eventos.</p>}</section>
        </div>
      </div>
    </Panel>}
  </div>;
}

function InventoryPage({ usuario }) {
  const [items, setItems] = useState([]); const [movements, setMovements] = useState([]); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [query, setQuery] = useState(''); const [selected, setSelected] = useState('');
  const admin = usuario.rol === 'Administrador';
  async function refresh() { const [i, m] = await Promise.all([api.get('/inventario'), api.get('/inventario/movimientos')]); setItems(i.data); setMovements(m.data); }
  useEffect(() => { refresh().catch((e) => setError(mensajeError(e))); }, []);
  const filtered = useMemo(() => items.filter((item) => `${item.codigo_repuesto} ${item.nombre_repuesto} ${item.categoria || ''}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  async function submitCreate(event) { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); setError(''); setSuccess(''); try { await api.post('/inventario', { ...values, stock_actual: Number(values.stock_actual), stock_minimo: Number(values.stock_minimo), costo_unitario: Number(values.costo_unitario) }); setSuccess('Repuesto creado; las existencias iniciales quedaron en el historial.'); form.reset(); await refresh(); } catch (e) { setError(mensajeError(e)); } }
  async function submitMovement(event) { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); setError(''); setSuccess(''); try { await api.post(`/inventario/${selected}/movimientos`, { ...values, quantity: Number(values.quantity), unit_cost: Number(values.unit_cost || 0) }); setSuccess('Movimiento aplicado y registrado.'); form.reset(); await refresh(); } catch (e) { setError(mensajeError(e)); } }
  return <div className="space-y-5"><Notice error={error} success={success} />
    {admin && <Panel title="Registrar repuesto" detail="El costo medio se actualiza con el promedio ponderado de las entradas"><form onSubmit={submitCreate} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{[['Código','codigo_repuesto'],['Nombre','nombre_repuesto'],['Categoría','categoria'],['Unidad','unidad'],['Stock inicial','stock_actual'],['Mínimo','stock_minimo'],['Costo unitario (Q)','costo_unitario'],['Ubicación','ubicacion']].map(([label,name]) => <Field key={name} label={label}><input className={inputClass} name={name} required={['codigo_repuesto','nombre_repuesto'].includes(name)} type={['stock_actual','stock_minimo','costo_unitario'].includes(name) ? 'number' : 'text'} step={['stock_actual','stock_minimo','costo_unitario'].includes(name) ? '0.01' : undefined} min={['stock_actual','stock_minimo','costo_unitario'].includes(name) ? '0' : undefined} defaultValue={['stock_actual','stock_minimo','costo_unitario'].includes(name) ? '0' : ''} /></Field>)}<div className="flex items-end"><Button className={`${primaryButton} w-full`}>Guardar repuesto</Button></div></form></Panel>}
    <Panel title="Existencias" detail="Las salidas no pueden superar el stock disponible"><div className="mb-4 flex flex-wrap items-end gap-3"><Field label="Buscar repuesto"><input value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass} /></Field><Field label="Ajustar stock"><select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}><option value="">Selecciona</option>{items.map((item) => <option key={item.id_repuesto} value={item.id_repuesto}>{item.codigo_repuesto} · {item.nombre_repuesto}</option>)}</select></Field></div>
      {selected && <form onSubmit={submitMovement} className="mb-4 grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-5"><Field label="Movimiento"><select name="movement_type" className={inputClass}><option>Entrada</option><option>Salida</option><option>Ajuste</option></select></Field><Field label="Cantidad / stock final"><input name="quantity" type="number" step="0.01" min="0" className={inputClass} required /></Field><Field label="Costo unitario de entrada (Q)"><input name="unit_cost" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} /></Field><Field label="Motivo"><input name="reason" minLength={4} className={inputClass} required /></Field><div className="flex items-end"><Button className={`${primaryButton} w-full`}>Aplicar</Button></div></form>}
      {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Código','Repuesto','Stock','Mínimo','Costo unitario','Estado'].map((x) => <th className="px-3 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{filtered.map((item) => <tr key={item.id_repuesto} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{item.codigo_repuesto}</td><td>{item.nombre_repuesto}<span className="block text-xs text-slate-500">{item.ubicacion || ''}</span></td><td>{item.stock_actual} {item.stock_actual <= item.stock_minimo && <span className="font-bold text-red-700">· Bajo</span>}</td><td>{item.stock_minimo}</td><td>Q {Number(item.costo_unitario).toFixed(2)}</td><td>{item.estado ? 'Activo' : 'Inactivo'}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">Sin repuestos que coincidan.</p>}
    </Panel>
    <Panel title="Movimientos recientes" detail={`Se muestran los últimos ${movements.length} movimientos`}>
      {movements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr>{['Fecha','Repuesto','Tipo','Cambio','Stock final','Responsable','Motivo'].map((x) => <th className="py-2 pr-3" key={x}>{x}</th>)}</tr></thead><tbody>{movements.slice(0,100).map((m) => <tr key={m.id} className="border-t border-slate-100"><td className="py-2 pr-3">{new Date(m.created_at).toLocaleString()}</td><td>{m.codigo_repuesto} · {m.nombre_repuesto}</td><td>{m.movement_type}</td><td>{m.quantity}</td><td>{m.stock_after}</td><td>{m.responsable || '—'}</td><td>{m.reason}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">Aún no hay movimientos.</p>}
    </Panel>
  </div>;
}

function EquipmentPage() {
  const [items, setItems] = useState([]); const [selected, setSelected] = useState(''); const [summary, setSummary] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/juegos').then(({ data }) => { setItems(data); if (data[0]) setSelected(String(data[0].id_juego)); }).catch((e) => setError(mensajeError(e))); }, []);
  useEffect(() => { if (selected) api.get(`/juegos/${selected}/resumen`).then(({ data }) => setSummary(data)).catch((e) => setError(mensajeError(e))); }, [selected]);
  return <div className="space-y-5"><Notice error={error} /><Panel title="Equipos y atracciones" detail="Consulta órdenes, costos históricos y próximas fechas programadas"><Field label="Selecciona un equipo"><select className={inputClass} value={selected} onChange={(e) => setSelected(e.target.value)}>{items.map((item) => <option value={item.id_juego} key={item.id_juego}>{item.codigo_juego} · {item.nombre_juego}</option>)}</select></Field>
    {summary && <div className="mt-5 space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">Estado</p><p className="font-bold">{summary.equipo.estado_operativo}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">Costo mano de obra</p><p className="font-bold">Q {Number(summary.costos.costo_mano_obra).toFixed(2)}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">Costo repuestos</p><p className="font-bold">Q {Number(summary.costos.costo_repuestos).toFixed(2)}</p></div></div>
      <h3 className="font-bold">Historial de órdenes</h3>{summary.ordenes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Código</th><th>Estado</th><th>Fecha</th><th>Responsable</th><th>Costo total</th></tr></thead><tbody>{summary.ordenes.map((o) => <tr key={o.id} className="border-t border-slate-100"><td className="py-2 font-semibold">{o.order_code}</td><td>{o.status}</td><td>{o.scheduled_for || o.start_date?.slice(0,10) || '—'}</td><td>{o.responsable || '—'}</td><td>Q {(Number(o.costo_mano_obra) + Number(o.costo_repuestos)).toFixed(2)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">Este equipo aún no tiene órdenes.</p>}
      <h3 className="font-bold">Próximos mantenimientos</h3>{summary.programaciones.length ? <ul className="space-y-2">{summary.programaciones.map((s) => <li key={s.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm"><span>{s.title} · cada {s.interval_days} días</span><span>{s.active ? `Próximo: ${s.next_due.slice(0,10)}` : 'Pausado'}</span></li>)}</ul> : <p className="text-sm text-slate-500">No hay mantenimientos recurrentes.</p>}</div>}
  </Panel></div>;
}

function UsersPage({ usuario }) {
  const [users, setUsers] = useState([]); const [roles, setRoles] = useState([]); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const admin = usuario.rol === 'Administrador';
  async function refresh() { const { data } = await api.get('/usuarios'); setUsers(data); if (admin) { const result = await api.get('/roles'); setRoles(result.data); } }
  useEffect(() => { refresh().catch((e) => setError(mensajeError(e))); }, []);
  async function create(event) { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); setError(''); setSuccess(''); try { const { data } = await api.post('/usuarios', { ...values, id_rol: Number(values.id_rol), costo_hora: Number(values.costo_hora || 0) }); setSuccess(`Usuario creado. Contraseña temporal: ${data.contrasena_temporal}. Entrégala directamente al usuario.`); form.reset(); await refresh(); } catch (e) { setError(mensajeError(e)); } }
  async function toggle(user) { setError(''); setSuccess(''); try { await api.put(`/usuarios/${user.id_usuario}/estado`, { estado: !user.estado }); setSuccess(user.estado ? 'Usuario desactivado; su historial se conserva.' : 'Usuario reactivado.'); await refresh(); } catch (e) { setError(mensajeError(e)); } }
  async function setRate(user, event) { event.preventDefault(); const value = Object.fromEntries(new FormData(event.currentTarget)).costo_hora; setError(''); try { await api.patch(`/usuarios/${user.id_usuario}/costo-hora`, { costo_hora: Number(value) }); setSuccess('Costo laboral actualizado; solo se aplicará a nuevas horas registradas.'); await refresh(); } catch (e) { setError(mensajeError(e)); } }
  return <div className="space-y-5"><Notice error={error} success={success} />
    {admin && <Panel title="Crear usuario" detail="La contraseña temporal se muestra una sola vez y debe cambiarse al iniciar sesión"><form onSubmit={create} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[['Nombre completo','nombre_completo'],['Correo','correo'],['Usuario','usuario'],['Departamento','departamento'],['Turno','turno'],['Teléfono','telefono'],['Contraseña temporal (opcional)','contrasena_temporal']].map(([label,name]) => <Field label={label} key={name}><input className={inputClass} name={name} type={name === 'correo' ? 'email' : name === 'contrasena_temporal' ? 'password' : 'text'} required={['nombre_completo','correo','usuario'].includes(name)} /></Field>)}<Field label="Rol"><select name="id_rol" className={inputClass} required>{roles.map((role) => <option value={role.id_rol} key={role.id_rol}>{role.nombre_rol}</option>)}</select></Field><Field label="Costo laboral por hora (Q)"><input className={inputClass} name="costo_hora" type="number" min="0" step="0.01" defaultValue="0" /></Field><div className="flex items-end"><Button className={`${primaryButton} w-full`}>Crear usuario</Button></div></form></Panel>}
    <Panel title="Usuarios" detail="Desactivar una cuenta conserva sus registros y órdenes históricas">{users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Nombre</th><th>Cuenta</th><th>Rol</th><th>Estado</th><th>Costo/hora</th><th></th></tr></thead><tbody>{users.map((user) => <tr key={user.id_usuario} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{user.nombre_completo}<span className="block text-xs font-normal text-slate-500">{user.departamento || ''}</span></td><td>{user.correo}<span className="block text-xs text-slate-500">@{user.usuario}</span></td><td>{user.rol}</td><td>{user.estado ? 'Activo' : 'Inactivo'}</td><td>{admin ? <form onSubmit={(e) => setRate(user,e)} className="flex gap-1"><input className="w-24 rounded border border-slate-300 px-2 py-1" name="costo_hora" type="number" step="0.01" min="0" defaultValue={user.costo_hora ?? 0} aria-label={`Costo por hora de ${user.nombre_completo}`} /><Button className={secondaryButton}>Guardar</Button></form> : '—'}</td><td>{admin && <Button className={user.estado ? 'border border-red-200 bg-red-50 text-red-800' : secondaryButton} onClick={() => toggle(user)}>{user.estado ? 'Desactivar' : 'Reactivar'}</Button>}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No se encontraron usuarios.</p>}</Panel>
  </div>;
}

function AlertsPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  async function refresh() { const { data } = await api.get('/alertas-seguridad'); setItems(data); }
  useEffect(() => { refresh().catch((e) => setError(mensajeError(e))); }, []);
  async function attend(id) { setError(''); try { await api.put(`/alertas-seguridad/${id}/atender`); setSuccess('Alerta atendida.'); await refresh(); } catch (e) { setError(mensajeError(e)); } }
  return <Panel title="Alertas de seguridad" detail="Notificaciones de EPP y operaciones pendientes"><Notice error={error} success={success} />{items.length ? <ul className="space-y-3">{items.map((item) => <li key={item.id_alerta} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.mensaje}</p><p className="mt-1 text-sm text-slate-500">{item.prioridad} · {item.estado} · {new Date(item.fecha_creacion).toLocaleString()}</p></div>{item.estado !== 'Atendida' && <Button onClick={() => attend(item.id_alerta)} className={primaryButton}>Marcar atendida</Button>}</li>)}</ul> : <p className="text-sm text-slate-500">No hay alertas pendientes.</p>}</Panel>;
}

function AuditPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api.get('/auditoria').then(({ data }) => setItems(data)).catch((e) => setError(mensajeError(e))); }, []);
  return <Panel title="Auditoría" detail="Últimos 300 eventos registrados"><Notice error={error} />{items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Fecha</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>{items.map((item) => <tr key={item.id_auditoria} className="border-t border-slate-100"><td className="py-2">{new Date(item.fecha_hora).toLocaleString()}</td><td>{item.nombre_completo || 'Usuario retirado'}</td><td>{item.modulo}</td><td>{item.accion}</td><td>{item.descripcion}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No hay eventos de auditoría.</p>}</Panel>;
}

function ReportsPage() {
  const [summary, setSummary] = useState(null); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { api.get('/reportes/personalizado').then(({ data }) => setSummary(data.resumen)).catch((e) => setError(mensajeError(e))); }, []);
  async function exportFile(format) { setError(''); setSuccess(''); try { const { data } = await api.get(`/reportes/exportar/${format}`, { responseType: 'blob' }); const url = URL.createObjectURL(data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `rickysafe-reporte.${format === 'excel' ? 'xls' : format}`; anchor.click(); URL.revokeObjectURL(url); setSuccess('Reporte descargado.'); } catch (e) { setError(mensajeError(e)); } }
  return <div className="space-y-4"><Notice error={error} success={success} /><Panel title="Reportes operativos" detail="Información actual de órdenes, solicitudes y horas"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-4">Mantenimientos: <b>{summary?.total ?? '—'}</b></div><div className="rounded-lg bg-slate-50 p-4">Órdenes: <b>{summary?.ordenes ?? '—'}</b></div><div className="rounded-lg bg-slate-50 p-4">Horas registradas: <b>{summary?.horas_trabajadas ?? '—'}</b></div></div><div className="mt-4 flex flex-wrap gap-2">{['csv','excel','pdf'].map((format) => <Button key={format} onClick={() => exportFile(format)} className={secondaryButton}>Descargar {format.toUpperCase()}</Button>)}</div></Panel></div>;
}

function AppShell() {
  const { usuario, cerrarSesion } = useAuth();
  const [active, setActive] = useState('dashboard'); const [menu, setMenu] = useState(false);
  const titles = { dashboard: 'Inicio', orders: 'Órdenes y programación', equipment: 'Equipos', inventory: 'Inventario', users: 'Usuarios', alerts: 'Alertas', reports: 'Reportes', audit: 'Auditoría' };
  const allowed = {
    dashboard: true, orders: true, equipment: true, inventory: true,
    users: ['Administrador','Auditor'].includes(usuario.rol),
    alerts: ['Administrador','Supervisor','Auditor'].includes(usuario.rol),
    reports: ['Administrador','Supervisor','Auditor'].includes(usuario.rol),
    audit: ['Administrador','Auditor'].includes(usuario.rol)
  };
  const screens = {
    dashboard: <Dashboard />, orders: <OrdersPage usuario={usuario} />, equipment: <EquipmentPage />, inventory: <InventoryPage usuario={usuario} />,
    users: <UsersPage usuario={usuario} />, alerts: <AlertsPage />, reports: <ReportsPage />, audit: <AuditPage />
  };
  useEffect(() => { if (!allowed[active]) setActive('dashboard'); }, [active, usuario.rol]);
  return <div className="min-h-screen bg-slate-50 md:flex">
    <Sidebar abierto={menu} activo={active} usuario={usuario} onChange={setActive} onClose={() => setMenu(false)} />
    <div className="min-w-0 flex-1"><Navbar usuario={usuario} titulo={titles[active]} onLogout={cerrarSesion} onMenuClick={() => setMenu(true)} onHome={() => setActive('dashboard')} />
      <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6">{screens[active]}</main>
    </div>
  </div>;
}

function Root() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <main className="grid min-h-screen place-items-center text-sm text-slate-600">Validando sesión…</main>;
  if (!usuario) return <Login />;
  if (usuario.debe_cambiar_contrasena || usuario.must_change_password || usuario.temporary_password) return <ChangePassword />;
  return <AppShell />;
}

export default function App() {
  return <AuthProvider><Root /></AuthProvider>;
}
