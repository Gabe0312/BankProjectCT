import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmDialog from '../components/ConfirmDialog'

const CustomersPage = () => {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')

  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addMode, setAddMode] = useState('quick') // 'quick' | 'login'
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', username: '', password: '' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/api/customers')
        setCustomers(res.data)
        setFiltered(res.data)
      } catch (err) {
        setError(err.error || 'Failed to load customers')
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const handleSearch = (e) => {
    const val = e.target.value
    setSearch(val)
    setFiltered(!val ? customers : customers.filter(c => c.name.toLowerCase().startsWith(val.toLowerCase())))
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/customers/${confirmId}`)
      const updated = customers.filter(c => c._id !== confirmId)
      setCustomers(updated)
      setFiltered(updated)
    } catch (err) {
      setError(err.error || 'Failed to delete customer')
    } finally {
      setConfirmId(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateError('')
    if (addMode === 'login') {
      if (newCustomer.username.trim().length < 3) return setCreateError('Username must be at least 3 characters')
      if (newCustomer.username.toLowerCase() === 'admin') return setCreateError("Username 'admin' is reserved")
      if (newCustomer.password.length < 6) return setCreateError('Password must be at least 6 characters')
    }
    setCreating(true)
    try {
      if (addMode === 'login') {
        await api.post('/auth/register', {
          username: newCustomer.username,
          password: newCustomer.password,
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
        })
        // fetch updated list since register doesn't return the customer directly
        const res = await api.get('/api/customers')
        setCustomers(res.data)
        setFiltered(res.data)
      } else {
        const res = await api.post('/api/customers', { name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone })
        const updated = [...customers, res.data]
        setCustomers(updated)
        setFiltered(updated)
      }
      setNewCustomer({ name: '', email: '', phone: '', username: '', password: '' })
    } catch (err) {
      setCreateError(err.response?.data?.detail || err.error || 'Failed to create customer')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (customer) => {
    setEditingId(customer._id)
    setEditFields({ name: customer.name, email: customer.email, phone: customer.phone })
  }

  const handleUpdate = async (customerId) => {
    setSaving(true)
    try {
      const res = await api.put(`/api/customers/${customerId}`, editFields)
      const updated = customers.map(c => c._id === customerId ? { ...c, ...res.data } : c)
      setCustomers(updated)
      setFiltered(updated)
      setEditingId(null)
    } catch (err) {
      setError(err.error || 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { localStorage.clear(); navigate('/welcome') }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {confirmId && (
        <ConfirmDialog
          message="This will permanently delete the customer and cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
      <Navbar username={username} role="admin" onLogout={handleLogout} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        <div className="page-header">
          <h2 className="section-title"><Users className="inline w-5 h-5 mr-1.5 text-slate-600" />Customers</h2>
          <button className="btn-ghost text-sm" onClick={() => navigate('/admin/dashboard')}>← Back</button>
        </div>

        {/* Add Customer */}
        <div className="card mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Add Customer</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAddMode('quick'); setCreateError('') }}
                className={`px-3 py-1.5 transition-colors ${
                  addMode === 'quick' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}>
                Quick Add
              </button>
              <button
                type="button"
                onClick={() => { setAddMode('login'); setCreateError('') }}
                className={`px-3 py-1.5 transition-colors ${
                  addMode === 'login' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}>
                Add with Login
              </button>
            </div>
          </div>
          <div className="p-5">
            {addMode === 'login' && (
              <p className="text-xs text-slate-500 mb-3">Creates a customer record <span className="font-semibold text-indigo-600">and</span> a login account — customer can sign in immediately.</p>
            )}
            {addMode === 'quick' && (
              <p className="text-xs text-slate-500 mb-3">Creates a data record only — no login credentials.</p>
            )}
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
              {[['Name', 'name'], ['Email', 'email'], ['Phone', 'phone']].map(([label, key]) => (
                <div key={key} className="flex-1 min-w-36">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                  <input className="input" placeholder={label} value={newCustomer[key]} required
                    onChange={e => { setNewCustomer({ ...newCustomer, [key]: e.target.value }); setCreateError('') }} />
                </div>
              ))}
              {addMode === 'login' && (
                <>
                  <div className="flex-1 min-w-36">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Username</label>
                    <input className="input" placeholder="Username" value={newCustomer.username} required
                      onChange={e => { setNewCustomer({ ...newCustomer, username: e.target.value }); setCreateError('') }} />
                  </div>
                  <div className="flex-1 min-w-36">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Password</label>
                    <input className="input" type="password" placeholder="Password" value={newCustomer.password} required
                      onChange={e => { setNewCustomer({ ...newCustomer, password: e.target.value }); setCreateError('') }} />
                  </div>
                </>
              )}
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? 'Adding...' : '+ Add'}
              </button>
            </form>
            {createError && <p className="text-red-500 text-xs mt-2">{createError}</p>}
          </div>
        </div>

        {/* Search */}
        <div className="flex mb-4" style={{ maxWidth: '340px' }}>
          <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg px-3 py-2.5 text-sm text-slate-400 flex items-center">
            <Search className="w-4 h-4" />
          </span>
          <input className="flex-1 border border-slate-200 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Search by first name..." value={search} onChange={handleSearch} />
        </div>

        {loading && <Spinner message="Loading customers..." />}
        <ErrorMessage message={error} />

        {!loading && !error && (
          <p className="text-slate-400 text-xs mb-3">{filtered.length} customer(s)</p>
        )}

        {!loading && !error && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="table-th">ID</th>
                    <th className="table-th">Name</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Phone</th>
                    <th className="table-th">Created</th>
                    <th className="table-th">Actions</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(customer => (
                    <tr key={customer._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="table-td text-xs text-slate-400 font-mono">{customer.customer_number || customer._id.slice(-8)}</td>
                      {editingId === customer._id ? (
                        <>
                          <td className="table-td">
                            <input className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={editFields.name} onChange={e => setEditFields({ ...editFields, name: e.target.value })} />
                          </td>
                          <td className="table-td">
                            <input className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={editFields.email} onChange={e => setEditFields({ ...editFields, email: e.target.value })} />
                          </td>
                          <td className="table-td">
                            <input className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={editFields.phone} onChange={e => setEditFields({ ...editFields, phone: e.target.value })} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="table-td font-semibold text-slate-800">{customer.name}</td>
                          <td className="table-td text-slate-600">{customer.email}</td>
                          <td className="table-td text-slate-600">{customer.phone}</td>
                        </>
                      )}
                      <td className="table-td text-xs text-slate-400">{new Date(customer.created_at).toLocaleDateString()}</td>
                      <td className="table-td">
                        <div className="flex gap-1.5">
                          <button className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1.5"
                            onClick={() => navigate(`/admin/accounts?customerId=${customer._id}`)}>
                            Accounts
                          </button>
                          <button className="btn-danger text-xs px-2.5 py-1.5"
                            onClick={() => setConfirmId(customer._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="table-td">
                        {editingId === customer._id ? (
                          <div className="flex gap-1.5">
                            <button className="btn-soft text-xs px-2.5 py-1.5"
                              onClick={() => handleUpdate(customer._id)} disabled={saving}>
                              {saving ? '...' : 'Save'}
                            </button>
                            <button className="btn-ghost text-xs px-2.5 py-1.5"
                              onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button className="btn-soft text-xs px-2.5 py-1.5"
                            onClick={() => handleEdit(customer)}>
                            Edit
                          </button>
                        )}
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

export default CustomersPage
