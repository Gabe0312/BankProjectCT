import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import Navbar from '../components/Navbar'
import TransactionCard from '../components/TransactionCard'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

const TransactionHistoryPage = () => {
  const navigate = useNavigate()
  const { id: accountId } = useParams()
  const { state } = useLocation()
  const username = localStorage.getItem('username')
  const accountNumber = state?.accountNumber || accountId.slice(-6)

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get(`/api/accounts/${accountId}/transactions`)
        setTransactions(res.data)
      } catch (err) {
        setError(err.error || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [accountId])

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1) }, [fromDate, toDate])

  const filtered = useMemo(() => {
    return transactions.filter(txn => {
      const date = new Date(txn.created_at)
      if (fromDate && date < new Date(fromDate)) return false
      if (toDate   && date > new Date(toDate + 'T23:59:59')) return false
      return true
    })
  }, [transactions, fromDate, toDate])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const runningBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    let balance = 0
    return sorted.map(txn => {
      balance += txn.txn_type === 'DEPOSIT' ? txn.amount : -txn.amount
      return {
        date: new Date(txn.created_at).toLocaleDateString(),
        balance: parseFloat(balance.toFixed(2)),
      }
    })
  }, [transactions])

  const handleExportCSV = () => {
    const header = 'Transaction ID,Type,Amount,Date'
    const rows = filtered.map(txn =>
      `${txn.txn_id},${txn.txn_type},${txn.amount.toFixed(2)},${new Date(txn.created_at).toLocaleString()}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statement-${accountNumber || accountId.slice(-6)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar username={username} role="customer" onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        <div className="page-header">
          <div>
            <h2 className="section-title">Transaction History</h2>
            <p className="text-slate-400 text-xs font-mono mt-0.5">{accountNumber}</p>
          </div>
          <button className="btn-ghost text-sm" onClick={() => navigate('/dashboard')}>← Back</button>
        </div>

        {/* Date range filter + export */}
        <div className="card p-4 mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">From</label>
            <input type="date" className="input w-auto" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">To</label>
            <input type="date" className="input w-auto" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="btn-ghost text-sm" onClick={() => { setFromDate(''); setToDate('') }}>
            Clear
          </button>
          <div className="ml-auto">
            <button className="btn-primary text-sm flex items-center gap-1.5" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {!loading && !error && runningBalance.length >= 2 && (
          <div className="card p-5 mb-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Running Balance</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={runningBalance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Balance']} />
                <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading && <Spinner message="Loading transactions..." />}
        <ErrorMessage message={error} />

        {!loading && !error && (
          <>
            <p className="text-slate-400 text-xs mb-3">
              {filtered.length} transaction(s)
              {(fromDate || toDate) && <span className="ml-1 text-indigo-500">(filtered)</span>}
            </p>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="table-th">Transaction ID</th>
                      <th className="table-th">Type</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-slate-400 py-12">
                          {transactions.length === 0 ? 'No transactions yet.' : 'No transactions match the selected date range.'}
                        </td>
                      </tr>
                    ) : (
                      paginated.map(txn => (
                        <TransactionCard key={txn.txn_id || txn._id} transaction={txn} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}

      </main>
    </div>
  )
}

export default TransactionHistoryPage
