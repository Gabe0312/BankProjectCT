import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import Navbar from '../components/Navbar'
import AccountCard from '../components/AccountCard'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

const CustomerDashboard = () => {
  const navigate = useNavigate()
  const customerId = localStorage.getItem('customer_id')
  const username = localStorage.getItem('username')

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get(`/api/customers/${customerId}/accounts`)
        setAccounts(res.data)
      } catch (err) {
        setError(err.error || 'Failed to load accounts')
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [customerId])

  const handleAction = (accountId, actionType, accountNumber) => {
    if (actionType === 'deposit')      navigate(`/accounts/${accountId}/deposit`, { state: { accountNumber } })
    if (actionType === 'withdraw')     navigate(`/accounts/${accountId}/withdraw`, { state: { accountNumber } })
    if (actionType === 'transactions') navigate(`/accounts/${accountId}/transactions`, { state: { accountNumber } })
    if (actionType === 'transfer')     navigate(`/accounts/${accountId}/transfer`, { state: { accountNumber } })
  }

  const handleNicknameUpdate = (accountId, newNickname) => {
    setAccounts(prev => prev.map(a => a._id === accountId ? { ...a, nickname: newNickname } : a))
  }

  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  const totalBalanceCents = accounts.reduce(
    (sum, account) => sum + (account.balance_cents ?? Math.round(account.balance * 100)),
    0,
  )

  const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e0e7ff']
  const donutData = accounts.map(a => ({
    name: a.nickname || a.account_type,
    value: (a.balance_cents ?? Math.round(a.balance * 100)) / 100,
  }))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar username={username} role="customer" onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Banner */}
        <div className="rounded-2xl p-7 mb-8 text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)' }}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Total Balance</p>
          <p className="text-4xl font-extrabold mb-1">${(totalBalanceCents / 100).toFixed(2)}</p>
          <p className="text-indigo-300 text-sm">Welcome back, <span className="text-white font-semibold">{username}</span></p>
        </div>

        {/* Donut chart — only show with 2+ accounts */}
        {!loading && accounts.length >= 2 && (
          <div className="card p-5 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Balance Distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Header row */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="section-title">My Accounts</h2>
          <button className="btn-primary text-sm" onClick={() => navigate('/accounts/new')}>
            + New Account
          </button>
        </div>

        {loading && <Spinner message="Loading your accounts..." />}
        <ErrorMessage message={error} />

        {!loading && !error && accounts.length === 0 && (
          <div className="card text-center py-20 text-slate-400">
            <div className="flex justify-center mb-4">
              <Building2 className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-slate-500">No accounts yet. Use the button above to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {accounts.map(account => (
            <AccountCard key={account._id} account={account} onAction={handleAction} onNicknameUpdate={handleNicknameUpdate} />
          ))}
        </div>

      </main>
    </div>
  )
}

export default CustomerDashboard
