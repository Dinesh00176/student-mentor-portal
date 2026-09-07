import './Pagination.css';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page, totalPages, hasNextPage, hasPrevPage, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <div className="pagination__summary">
        Showing page <strong className="tabular-nums">{page}</strong> of <strong className="tabular-nums">{totalPages}</strong>
        {total !== undefined && <span className="pagination__total"> (<span className="tabular-nums">{total}</span> total)</span>}
      </div>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹ Previous
        </button>
        <button
          type="button"
          className="pagination__btn"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next ›
        </button>
      </div>
    </nav>
  );
}
