const Spinner = ({ message = 'Loading...' }) => (
  <div className="flex items-center gap-3 text-slate-500 my-4">
    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm">{message}</span>
  </div>
)

export default Spinner
