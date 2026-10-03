import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, PiggyBank, CreditCard } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const accountTypes = [
  { value: 'SAVINGS',  label: 'Savings',  icon: PiggyBank, desc: 'Earn interest on your balance' },
  { value: 'CHECKING', label: 'Checking', icon: CreditCard, desc: 'For everyday transactions' },
]

const CreateAccountPage = () => {
  const navigate = useNavigate()
  const customerId = localStorage.getItem('customer_id')
  const username = localStorage.getItem('username')

  const [accountType, setAccountType] = useState('SAVINGS')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nicknameError, setNicknameError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (nickname && nickname.length > 30) { setNicknameError('Nickname must be 30 characters or fewer'); return }
    setNicknameError('')
    setLoading(true)
    setError('')
    try {
      await api.post('/api/accounts', { customerId, accountType, nickname: nickname || null })
      navigate('/dashboard')
    } catch (err) {
      setError(err.error || 'Failed to create account')
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
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Open New Account</h1>
            <p className="text-slate-500 text-sm mt-1">Choose your account type</p>
          </div>

          <div className="card p-8">
            {loading && <Spinner message="Creating account..." />}
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-3">
                {accountTypes.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setAccountType(t.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      accountType === t.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="mb-2">
                      <t.icon className={`w-6 h-6 ${accountType === t.value ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <div className={`text-sm font-bold ${accountType === t.value ? 'text-indigo-700' : 'text-slate-700'}`}>{t.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Nickname <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <input className={`input ${nicknameError ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                  placeholder="e.g. Emergency Fund, Daily Spending"
                  value={nickname} onChange={(e) => { setNickname(e.target.value); setNicknameError('') }} />
                {nicknameError && <p className="text-red-500 text-xs mt-1">{nicknameError}</p>}
                <p className="text-slate-400 text-xs mt-1 text-right">{nickname.length}/30</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button className="btn-primary flex-1" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
                <button className="btn-ghost" type="button" onClick={() => navigate('/dashboard')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

export default CreateAccountPage
