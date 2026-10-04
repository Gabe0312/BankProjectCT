import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeftRight, CheckCircle } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const TransferPage = () => {
  const navigate = useNavigate()
  const { id: fromAccountId } = useParams()
  const { state } = useLocation()
  const username = localStorage.getItem('username')
  const customerId = localStorage.getItem('customer_id')
  const accountNumber = state?.accountNumber || fromAccountId.slice(-6)

  const [accounts, setAccounts] = useState([])
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get(`/api/customers/${customerId}/accounts`)
        setAccounts(res.data.filter(a => a._id !== fromAccountId))
      } catch {
        setError('Failed to load accounts')
      }
    }
    fetchAccounts()
  }, [customerId, fromAccountId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!toAccountId) errs.toAccountId = 'Please select a destination account'
    const submittedAmount = amount.trim()
    if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(submittedAmount) || Number(submittedAmount) <= 0) {
      errs.amount = 'Enter an amount greater than 0 with no more than two decimal places'
    }
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.post('/api/accounts/transfer', {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: submittedAmount
      })
      setResult(res.data)
      setAmount('')
      setToAccountId('')
    } catch (err) {
      setError(err.error || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar username={username} role="customer" onLogout={handleLogout} />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Transfer Funds</h1>
            <p className="text-slate-400 text-xs mt-1 font-mono">{accountNumber}</p>
          </div>

          <div className="card p-8">
            {loading && <Spinner message="Processing transfer..." />}
            <ErrorMessage message={error} />

            {result && (
              <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 py-3 text-sm mb-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Transfer successful! New balance: <strong>${result.from_balance.toFixed(2)}</strong></span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">To Account</label>
                <select className={`input ${errors.toAccountId ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                  value={toAccountId} onChange={(e) => { setToAccountId(e.target.value); setErrors(prev => ({ ...prev, toAccountId: '' })) }}>
                  <option value="">Select destination account</option>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.nickname ? `${a.nickname} (${a.account_type})` : a.account_type} — ${a.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                {errors.toAccountId && <p className="text-red-500 text-xs mt-1">{errors.toAccountId}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Amount</label>
                <div className="flex">
                  <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg px-3 py-2.5 text-sm text-slate-500">$</span>
                  <input className={`flex-1 border rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.amount ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'}`}
                    type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={amount} onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })) }} />
                </div>
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button className="btn-primary flex-1" type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Transfer'}
                </button>
                <button className="btn-ghost" type="button" onClick={() => navigate('/dashboard')}>
                  Back
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

export default TransferPage
