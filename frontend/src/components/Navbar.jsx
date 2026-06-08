import { Home, LogOut, Menu } from 'lucide-react';

export default function Navbar({ usuario, onLogout, onMenuClick, onHome }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-navy text-white"
        >
          <Menu size={22} />
        </button>
        <div>
          <p className="text-sm text-slate-500">Sistema de seguridad industrial</p>
          <h2 className="text-xl font-bold text-slate-900">Panel de mantenimiento</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
        >
          <Home size={16} />
          Inicio
        </button>
        <span className="rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          {usuario?.rol || 'Administrador'}
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
}
