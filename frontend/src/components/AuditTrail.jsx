import { format } from 'date-fns';

const AuditTrail = ({ entries }) => {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Audit Trail</h3>
      <div className="space-y-2">
        {entries.map((entry, idx) => {
          const user = entry.user || {};
          const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'Unknown');
          const role = user.role || entry.role || '';
          return (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm border-b pb-2">
              <span className="font-medium capitalize">{entry.action} by:</span>
              <span className="font-semibold">{fullName}</span>
              {role && <span className="text-gray-500 text-xs">({role})</span>}
              <span className="text-gray-400 text-xs">at {format(new Date(entry.timestamp), 'M/d/yyyy, h:mm:ss a')}</span>
              {entry.details && <span className="text-gray-600 text-xs ml-2">- {entry.details}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AuditTrail;
