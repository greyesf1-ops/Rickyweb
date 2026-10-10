const items = [
  { id: 'dashboard', label: 'Inicio' },
  { id: 'orders', label: 'Órdenes y programación' },
  { id: 'equipment', label: 'Equipos' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'users', label: 'Usuarios', roles: ['Administrador', 'Auditor'] },
  { id: 'alerts', label: 'Alertas', roles: ['Administrador', 'Supervisor', 'Auditor'] },
  { id: 'reports', label: 'Reportes', roles: ['Administrador', 'Supervisor', 'Auditor'] },
  { id: 'audit', label: 'Auditoría', roles: ['Administrador', 'Auditor'] }
];

export default function Sidebar({ abierto, activo, usuario, onChange, onClose }) {
  const visibles = items.filter((item) => !item.roles || item.roles.includes(usuario?.rol));
  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/40 transition-opacity md:hidden ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside className={`fixed bottom-0 left-0 top-0 z-40 flex w-72 max-w-[86vw] flex-col bg-brand-navy px-4 py-5 text-white shadow-2xl transition-transform md:sticky md:top-0 md:h-screen md:max-w-none md:shrink-0 md:translate-x-0 md:shadow-none ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 border-b border-white/15 px-2 pb-5">
          <p className="text-xs font-bold uppercase text-cyan-200">Rickylandia</p>
          <h1 className="text-2xl font-bold">RickySafe</h1>
        </div>

        <nav className="space-y-2">
          {visibles.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id);
                onClose();
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold ${activo === id ? 'bg-white text-brand-navy' : 'text-slate-200 hover:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
