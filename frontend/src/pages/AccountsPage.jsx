import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmDialog from '../components/ConfirmDialog'

const AccountsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const username = localStorage.getItem('username')
  const customerIdFilter = new URLSearchParams(location.search).get('customerId')

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [threshold, setThreshold] = useState('')
  const [filtering, setFiltering] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchAllAccounts() }, [customerIdFilter])

  const fetchAllAccounts = async () => {
    setLoading(true)
    setError('')
    try {
      const url = customerIdFilter ? `/api/customers/${customerIdFilter}/accounts` : '/api/accounts'
      const res = await api.get(url)
      setAccounts(res.data)
    } catch (err) {
      setError(err.error || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const handlePremiumFilter = async () => {
    if (!threshold) return
    setFiltering(true)
    setError('')
    try {
      const res = await api.get(`/api/accounts/premium?threshold=${threshold}`)
      setAccounts(res.data)
    } catch (err) {
      setError(err.error || 'Failed to filter accounts')
    } finally {
      setFiltering(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/accounts/${confirmId}`)
      setAccounts(prev => prev.filter(a => a._id !== confirmId))
    } catch (err) {
      setError(err.error || 'Failed to delete account')
    } finally {
      setConfirmId(null)
    }
  }

  const handleReset = () => { setThreshold(''); fetchAllAccounts() }
  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {confirmId && (
        <ConfirmDialog
          message="This will permanently delete the account and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
      <Navbar username={username} role="admin" onLogout={handleLogout} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        <div className="page-header">
          <h2 className="section-title"><Building2 className="inline w-5 h-5 mr-1.5 text-slate-600" />{customerIdFilter ? 'Accounts for Customer' : 'All Accounts'}</h2>
          <button className="btn-ghost text-sm" onClick={() => navigate('/admin/dashboard')}>← Back</button>
        </div>

        {/* Premium filter */}
        <div className="flex mb-6" style={{ maxWidth: '420px' }}>
          <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg px-3 py-2.5 text-sm text-slate-400">$</span>
          <input
            className="flex-1 border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            type="number" placeholder="Min balance for premium filter"
            value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          <button className="btn-soft rounded-none px-4 disabled:opacity-50"
            onClick={handlePremiumFilter} disabled={filtering}>
            {filtering ? 'Filtering...' : 'Premium'}
          </button>
          <button className="border border-l-0 border-slate-200 text-slate-600 hover:bg-slate-100 text-sm px-3 py-2.5 rounded-r-lg transition-colors"
            onClick={handleReset}>
            Reset
          </button>
        </div>

        {loading && <Spinner message="Loading accounts..." />}
        <ErrorMessage message={error} />

        {!loading && !error && (
          <p className="text-slate-400 text-xs mb-3">{accounts.length} account(s)</p>
        )}

        {!loading && !error && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="table-th">Account No.</th>
                    <th className="table-th">Customer No.</th>
                    <th className="table-th">Type</th>
                    <th className="table-th">Balance</th>
                    <th className="table-th">Created</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="table-td text-xs text-slate-400 font-mono">{account.account_number || account._id.slice(-8)}</td>
                      <td className="table-td text-xs text-slate-400 font-mono">{account.customer_number || account.customer_id?.slice(-8)}</td>
                      <td className="table-td">
                        <span className={`badge ${account.account_type === 'SAVINGS' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {account.account_type}
                        </span>
                      </td>
                      <td className="table-td font-bold text-indigo-600">${account.balance.toFixed(2)}</td>
                      <td className="table-td text-xs text-slate-400">{new Date(account.created_at).toLocaleDateString()}</td>
                      <td className="table-td">
                        <button className="btn-danger text-xs px-2.5 py-1.5"
                          onClick={() => setConfirmId(account._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default AccountsPage
