import { Navigate } from 'react-router-dom'

// ProtectedRoute: guards any route that requires authentication
// Props:
//   children  — the page component to render if access is granted
//   role      — required role: "admin" or "customer"
const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token')
  const storedRole = localStorage.getItem('role')

  // No token at all — redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Token exists but role does not match required role — redirect to login
  if (role && storedRole !== role) {
    return <Navigate to="/login" replace />
  }

  // Access granted — render the protected page
  return children
}

export default ProtectedRoute
