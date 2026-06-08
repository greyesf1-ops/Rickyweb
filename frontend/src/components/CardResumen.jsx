export default function CardResumen({ titulo, valor, detalle }) {
  return (
    <article className="min-h-36 rounded-lg border border-slate-200 border-t-4 border-t-brand-teal bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-700">{titulo}</p>
      <strong className="mt-2 block text-5xl leading-none text-slate-950">{valor}</strong>
      <span className="mt-2 block text-sm font-semibold leading-snug text-slate-600">{detalle}</span>
    </article>
  );
}
