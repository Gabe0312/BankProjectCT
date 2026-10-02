const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />

    {/* Dialog */}
    <div className="relative bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 w-full max-w-sm p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="bg-red-100 rounded-xl p-2.5 shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-1">Are you sure?</h3>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
)

export default ConfirmDialog
