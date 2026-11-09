const STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-200 text-gray-700',
};
const LABELS = { pending: 'Pending verification', approved: 'Live (verified)', rejected: 'Rejected', suspended: 'Suspended' };

export default function StatusBadge({ status }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>;
}
