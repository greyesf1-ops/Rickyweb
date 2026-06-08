const estilos = {
  Activo: 'bg-emerald-100 text-emerald-700',
  Pendiente: 'bg-slate-100 text-slate-700',
  'En proceso': 'bg-blue-100 text-blue-700',
  'En revision': 'bg-amber-100 text-amber-700',
  Validado: 'bg-emerald-100 text-emerald-700',
  Rechazado: 'bg-rose-100 text-rose-700',
  Cerrado: 'bg-zinc-100 text-zinc-700',
  Inactivo: 'bg-slate-100 text-slate-600',
  Temporal: 'bg-amber-100 text-amber-700',
  Definitivo: 'bg-cyan-100 text-cyan-700',
  Alta: 'bg-rose-100 text-rose-700',
  Atendida: 'bg-emerald-100 text-emerald-700'
};

export default function BadgeEstado({ estado }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${estilos[estado] || estilos.Pendiente}`}>
      {estado}
    </span>
  );
}
