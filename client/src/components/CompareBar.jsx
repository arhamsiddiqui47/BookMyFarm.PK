import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';

// Sticky bar at the bottom of the screen while farmhouses are picked for comparison.
export default function CompareBar() {
  const { picked, toggle, clear } = useCompare();
  const { pathname } = useLocation();
  if (picked.length === 0 || pathname === '/compare') return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium">Compare ({picked.length}/3):</span>
        {picked.map((p) => (
          <span key={p._id} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
            {p.name}
            <button onClick={() => toggle(p)} className="text-gray-500 hover:text-red-600" aria-label={`Remove ${p.name}`}>×</button>
          </span>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={clear} className="px-3 text-sm text-gray-600">Clear</button>
          {picked.length >= 2 ? (
            <Link to={`/compare?ids=${picked.map((p) => p._id).join(',')}`} className="btn py-1.5">Compare now</Link>
          ) : (
            <span className="text-sm text-gray-500">Pick one more</span>
          )}
        </div>
      </div>
    </div>
  );
}
