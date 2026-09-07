import './DataTable.css';

export default function DataTable({
  columns = [],
  rows = [],
  keyField = '_id',
  onRowClick,
  emptyMessage = 'No records found.',
  striped = false,
  className = '',
}) {
  return (
    <div className={`data-table-wrap ${className}`}>
      <table className={`data-table ${striped ? 'data-table--striped' : ''}`}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={c.align === 'right' ? 'data-table__th--right' : c.align === 'center' ? 'data-table__th--center' : ''}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                <div className="data-table__empty-content">
                  <span className="data-table__empty-icon">🗂️</span>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                className={onRowClick ? 'data-table__row--clickable' : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={c.align === 'right' ? 'data-table__td--right' : c.align === 'center' ? 'data-table__td--center' : ''}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
