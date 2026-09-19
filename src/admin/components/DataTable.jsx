import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import Card from '../../components/ui/Card';

export default function DataTable({ columns, data, searchable = false, searchPlaceholder = 'Search...', emptyMessage = 'No records found.' }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const col = columns.find(c => c.key === sortCol);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor];
      const bVal = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir, columns]);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {searchable && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              className="search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={col.style}
                >
                  {col.header}
                  {col.sortable !== false && (
                    <span className={`sort-icon ${sortCol === col.key ? 'sort-icon--active' : ''}`}>
                      {sortCol === col.key
                        ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                        : <ArrowUpDown size={12} />
                      }
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={columns.length} className="data-table__empty">{emptyMessage}</td></tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map(col => (
                    <td key={col.key} style={col.cellStyle} className={col.cellClass || ''}>
                      {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
