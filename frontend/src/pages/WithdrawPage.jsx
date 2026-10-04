import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowUpCircle, CheckCircle } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const WithdrawPage = () => {
  const navigate = useNavigate()
  const { id: accountId } = useParams()
  const { state } = useLocation()
  const username = localStorage.getItem('username')
  const accountNumber = state?.accountNumber || accountId.slice(-6)

  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatedBalance, setUpdatedBalance] = useState(null)
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const submittedAmount = amount.trim()
    if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(submittedAmount) || Number(submittedAmount) <= 0) {
      setFieldError('Enter an amount greater than 0 with no more than two decimal places')
      return
    }
    setFieldError('')
    setLoading(true)
    setError('')
    setUpdatedBalance(null)
    try {
      const res = await api.post(`/api/accounts/${accountId}/withdraw`, { amount: submittedAmount })
      setUpdatedBalance(res.data.balance)
      setAmount('')
    } catch (err) {
      setError(err.error || 'Withdrawal failed')
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
              <ArrowUpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Withdraw Funds</h1>
            <p className="text-slate-400 text-xs mt-1 font-mono">{accountNumber}</p>
          </div>

          <div className="card p-8">
            {loading && <Spinner message="Processing withdrawal..." />}
            <ErrorMessage message={error} />

            {updatedBalance !== null && (
              <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 py-3 text-sm mb-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Withdrawal successful! New balance: <strong>${updatedBalance.toFixed(2)}</strong></span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Amount</label>
                <div className="flex">
                  <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg px-3 py-2.5 text-sm text-slate-500">$</span>
                  <input className={`flex-1 border rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${fieldError ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'}`}
                    type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={amount} onChange={(e) => { setAmount(e.target.value); setFieldError('') }} required />
                </div>
                {fieldError && <p className="text-red-500 text-xs mt-1">{fieldError}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button className="btn-primary flex-1" type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Withdraw'}
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

export default WithdrawPage
