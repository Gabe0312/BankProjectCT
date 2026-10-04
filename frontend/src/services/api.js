import axios from 'axios'

// Single Axios instance — all FastAPI calls go through here, never raw axios in components
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Request interceptor — attaches JWT Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handles 401 and 403 globally
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.clear()
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      // Role mismatch — return structured error to the calling component
      return Promise.reject({ error: 'Access denied' })
    }
    // All other errors — return structured { error: detail } to caller
    const detail = error.response?.data?.detail || 'An unexpected error occurred'
    return Promise.reject({ error: detail })
  }
)

// ─── AUTH (6.6.1) ────────────────────────────────────────────────────────────

// POST /auth/register — creates a new customer account
export const register = async (username, password, name, email, phone) => {
  try {
    const res = await api.post('/auth/register', { username, password, name, email, phone })
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Registration failed' }
  }
}

// POST /auth/login — returns JWT token, role, customer_id
// Stores token + role + customer_id + username in localStorage on success
export const login = async (username, password) => {
  try {
    const res = await api.post('/auth/login', { username, password })
    const { access_token, role, customer_id } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('role', role)
    localStorage.setItem('customer_id', customer_id)
    localStorage.setItem('username', username)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Login failed' }
  }
}

// ─── CUSTOMERS (6.6.2) ───────────────────────────────────────────────────────

// GET /api/customers — all customers (admin only, list >= 7 for list demo)
export const getAllCustomers = async () => {
  try {
    const res = await api.get('/api/customers')
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load customers' }
  }
}

// GET /api/customers/{id}
export const getCustomer = async (customerId) => {
  try {
    const res = await api.get(`/api/customers/${customerId}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load customer' }
  }
}

// GET /api/customers/search?name={firstName} — search/filter demo
export const getCustomerByFirstName = async (firstName) => {
  try {
    const res = await api.get(`/api/customers/search?name=${firstName}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Search failed' }
  }
}

// PUT /api/customers/{id}
export const updateCustomer = async (customerId, fields) => {
  try {
    const res = await api.put(`/api/customers/${customerId}`, fields)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to update customer' }
  }
}

// DELETE /api/customers/{id}
export const deleteCustomer = async (customerId) => {
  try {
    const res = await api.delete(`/api/customers/${customerId}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to delete customer' }
  }
}

// POST /api/customers — admin creates a customer and linked login
export const postCustomer = async (username, password, name, email, phone) => {
  try {
    const res = await api.post('/api/customers', { username, password, name, email, phone })
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to create customer' }
  }
}

// ─── ACCOUNTS (6.6.3) ────────────────────────────────────────────────────────

// POST /api/accounts — create account for a customer
export const createAccount = async (customerId, accountType) => {
  try {
    const res = await api.post('/api/accounts', { customerId, accountType })
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to create account' }
  }
}

// GET /api/accounts — all accounts (admin only)
export const getAllAccounts = async () => {
  try {
    const res = await api.get('/api/accounts')
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load accounts' }
  }
}

// GET /api/accounts/{id}
export const getAccount = async (accountId) => {
  try {
    const res = await api.get(`/api/accounts/${accountId}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load account' }
  }
}

// GET /api/accounts/premium?threshold={n} — search/filter demo
export const getPremiumAccounts = async (threshold) => {
  try {
    const res = await api.get(`/api/accounts/premium?threshold=${threshold}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load premium accounts' }
  }
}

// PUT /api/accounts/{id}
export const updateAccount = async (accountId, fields) => {
  try {
    const res = await api.put(`/api/accounts/${accountId}`, fields)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to update account' }
  }
}

// DELETE /api/accounts/{id}
export const deleteAccount = async (accountId) => {
  try {
    const res = await api.delete(`/api/accounts/${accountId}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to delete account' }
  }
}

// GET /api/customers/{id}/accounts — customer <-> accounts relationship display
export const getAccountsByCustomer = async (customerId) => {
  try {
    const res = await api.get(`/api/customers/${customerId}/accounts`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load accounts' }
  }
}

// ─── FINANCIAL OPERATIONS (6.6.4) ────────────────────────────────────────────

// POST /api/accounts/{id}/deposit
export const deposit = async (accountId, amount) => {
  try {
    const res = await api.post(`/api/accounts/${accountId}/deposit`, { amount: String(amount) })
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Deposit failed' }
  }
}

// POST /api/accounts/{id}/withdraw
export const withdraw = async (accountId, amount) => {
  try {
    const res = await api.post(`/api/accounts/${accountId}/withdraw`, { amount: String(amount) })
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Withdrawal failed' }
  }
}

// POST /api/accounts/transfer
export const transfer = async (fromAccountId, toAccountId, amount) => {
  try {
    const res = await api.post('/api/accounts/transfer', { from_account_id: fromAccountId, to_account_id: toAccountId, amount: String(amount) })
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Transfer failed' }
  }
}

// ─── TRANSACTIONS (6.6.5) ────────────────────────────────────────────────────

// GET /api/accounts/{id}/transactions
export const getTransactions = async (accountId) => {
  try {
    const res = await api.get(`/api/accounts/${accountId}/transactions`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load transactions' }
  }
}

// ─── AUDIT (6.6.6) ───────────────────────────────────────────────────────────

// GET /api/audit — all audit records (admin only)
export const getAllAudit = async () => {
  try {
    const res = await api.get('/api/audit')
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load audit log' }
  }
}

// GET /api/audit/account/{id}
export const getAuditByAccount = async (accountId) => {
  try {
    const res = await api.get(`/api/audit/account/${accountId}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load audit by account' }
  }
}

// GET /api/audit/customer/{id}
export const getAuditByCustomer = async (customerId) => {
  try {
    const res = await api.get(`/api/audit/customer/${customerId}`)
    return { data: res.data }
  } catch (err) {
    return { error: err.error || 'Failed to load audit by customer' }
  }
}

export default api
