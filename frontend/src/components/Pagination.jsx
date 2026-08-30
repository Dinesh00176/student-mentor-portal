import './Pagination.css';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page, totalPages, hasNextPage, hasPrevPage, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="pagination__status">
        Page {page} of {totalPages} · {total} total
      </span>
      <button type="button" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
