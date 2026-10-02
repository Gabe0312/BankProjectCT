const ErrorMessage = ({ message }) => {
  if (!message) return null
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  )
}

export default ErrorMessage
