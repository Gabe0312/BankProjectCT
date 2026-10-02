import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import WelcomePage from './pages/WelcomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Customer pages (role: "customer")
import CustomerDashboard from './pages/CustomerDashboard'
import CreateAccountPage from './pages/CreateAccountPage'
import DepositPage from './pages/DepositPage'
import WithdrawPage from './pages/WithdrawPage'
import TransactionHistoryPage from './pages/TransactionHistoryPage'
import TransferPage from './pages/TransferPage'

// Admin pages (role: "admin")
import AdminDashboard from './pages/AdminDashboard'
import CustomersPage from './pages/CustomersPage'
import AccountsPage from './pages/AccountsPage'
import AuditPage from './pages/AuditPage'
import UsersPage from './pages/UsersPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect root to /welcome */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />

        {/* Public routes — no auth required */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer routes — CustomerToken required */}
        <Route path="/dashboard" element={
          <ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="/accounts/new" element={
          <ProtectedRoute role="customer"><CreateAccountPage /></ProtectedRoute>
        } />
        <Route path="/accounts/:id/deposit" element={
          <ProtectedRoute role="customer"><DepositPage /></ProtectedRoute>
        } />
        <Route path="/accounts/:id/withdraw" element={
          <ProtectedRoute role="customer"><WithdrawPage /></ProtectedRoute>
        } />
        <Route path="/accounts/:id/transactions" element={
          <ProtectedRoute role="customer"><TransactionHistoryPage /></ProtectedRoute>
        } />
        <Route path="/accounts/:id/transfer" element={
          <ProtectedRoute role="customer"><TransferPage /></ProtectedRoute>
        } />

        {/* Admin routes — AdminToken required */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/customers" element={
          <ProtectedRoute role="admin"><CustomersPage /></ProtectedRoute>
        } />
        <Route path="/admin/accounts" element={
          <ProtectedRoute role="admin"><AccountsPage /></ProtectedRoute>
        } />
        <Route path="/admin/audit" element={
          <ProtectedRoute role="admin"><AuditPage /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute role="admin"><UsersPage /></ProtectedRoute>
        } />

        {/* 404 catch-all — redirect unknown paths to /welcome */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
