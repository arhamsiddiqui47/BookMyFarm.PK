import { MAX_COMPARE, useCompare } from '../context/CompareContext';

export default function CompareButton({ fh, className = '' }) {
  const { has, toggle, picked } = useCompare();
  const on = has(fh._id);
  const full = !on && picked.length >= MAX_COMPARE;
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm ${full ? 'opacity-50' : ''} ${className}`}
      title={full ? `You can compare up to ${MAX_COMPARE}` : ''}>
      <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(fh)} className="accent-brand-600" />
      Compare
    </label>
  );
}
