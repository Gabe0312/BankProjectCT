const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-slate-400">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default Pagination
