import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

const typeBadge = (type) => {
  if (type === 'DEPOSIT')    return 'bg-indigo-100 text-indigo-700'
  if (type === 'WITHDRAWAL') return 'bg-slate-100 text-slate-600'
  return 'bg-indigo-50 text-indigo-500'
}

const AuditPage = () => {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [filterType, setFilterType] = useState('account')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    setCurrentPage(1)
    try {
      const res = await api.get('/api/audit')
      setRecords(res.data)
    } catch (err) {
      setError(err.error || 'Failed to load audit records')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = async () => {
    if (!filterValue) return
    setLoading(true)
    setError('')
    setCurrentPage(1)
    try {
      const endpoint = filterType === 'account'
        ? `/api/audit/account/${filterValue}`
        : `/api/audit/customer/${filterValue}`
      const res = await api.get(endpoint)
      setRecords(res.data)
    } catch (err) {
      setError(err.error || 'Failed to filter audit records')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => { setFilterValue(''); fetchAll() }
  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  const totalPages = Math.ceil(records.length / PAGE_SIZE)
  const paginated = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar username={username} role="admin" onLogout={handleLogout} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        <div className="page-header">
          <h2 className="section-title">📋 Audit Log</h2>
          <button className="btn-ghost text-sm" onClick={() => navigate('/admin/dashboard')}>← Back</button>
        </div>

        {/* Filter */}
        <div className="flex mb-6" style={{ maxWidth: '500px' }}>
          <select
            className="border border-r-0 border-slate-200 rounded-l-lg px-3 py-2.5 text-sm bg-slate-50 focus:outline-none text-slate-600"
            style={{ maxWidth: '150px' }}
            value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="account">By Account</option>
            <option value="customer">By Customer</option>
          </select>
          <input
            className="flex-1 border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter ID..." value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
          <button className="btn-primary rounded-none px-4" onClick={handleFilter}>Filter</button>
          <button className="border border-l-0 border-slate-200 text-slate-600 hover:bg-slate-100 text-sm px-3 py-2.5 rounded-r-lg transition-colors"
            onClick={handleReset}>Reset</button>
        </div>

        {loading && <Spinner message="Loading audit records..." />}
        <ErrorMessage message={error} />

        {!loading && !error && (
          <p className="text-slate-400 text-xs mb-3">{records.length} record(s)</p>
        )}

        {!loading && !error && (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="table-th">Audit No.</th>
                      <th className="table-th">Type</th>
                      <th className="table-th">Customer ID</th>
                      <th className="table-th">Accounts Involved</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(record => (
                      <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="table-td text-xs text-slate-400 font-mono">{record.audit_number || record._id.slice(-8)}</td>
                        <td className="table-td">
                          <span className={`badge ${typeBadge(record.transaction_type)}`}>
                            {record.transaction_type}
                          </span>
                        </td>
                        <td className="table-td text-xs text-slate-400 font-mono">{record.customer_number || record.customer_id}</td>
                        <td className="table-td text-xs text-slate-500">{record.account_numbers?.join(', ') || record.accounts_involved?.join(', ')}</td>
                        <td className="table-td font-bold text-slate-800">${record.amount?.toFixed(2)}</td>
                        <td className="table-td text-xs text-slate-400">{new Date(record.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
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

export default AuditPage
