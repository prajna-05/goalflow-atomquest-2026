export const computeScore = (goal, actual) => {
  if (actual === null || actual === undefined || actual === '') return 0;
  const { uom, uom_direction, target } = goal;
  if (uom === 'zero') return Number(actual) === 0 ? 100 : 0;
  if (uom === 'timeline') {
    const td = new Date(target), ad = new Date(actual);
    if (ad <= td) return 100;
    return Math.max(0, Math.round(100 - ((ad - td) / 86400000) * 5));
  }
  if (uom_direction === 'min') return Math.min(150, Math.round((Number(actual) / Number(target)) * 100));
  if (Number(actual) === 0) return 150;
  return Math.min(150, Math.round((Number(target) / Number(actual)) * 100));
};
export const getScoreColor = s => s >= 100 ? '#10b981' : s >= 75 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';
export const getStatusBadge = status => ({
  draft:            { label: 'Draft',            color: '#6b7280' },
  pending_approval: { label: 'Pending Approval', color: '#f59e0b' },
  approved:         { label: 'Approved',         color: '#10b981' },
  rework:           { label: 'Needs Rework',     color: '#ef4444' },
  not_started:      { label: 'Not Started',      color: '#6b7280' },
  on_track:         { label: 'On Track',         color: '#3b82f6' },
  completed:        { label: 'Completed',        color: '#10b981' },
}[status] || { label: status || 'Unknown', color: '#6b7280' });
