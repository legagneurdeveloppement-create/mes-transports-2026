import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth()

    if (loading) {
        return <div className="p-8 text-center">Chargement...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole) {
        // If requiredRole is an array, check if user has one of the roles
        if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(user.role)) {
                return <Navigate to="/dashboard" replace />
            }
        }
        // If single role
        else if (user.role !== requiredRole) {
            return <Navigate to="/dashboard" replace />
        }
    }

    // Additional check for unapproved accounts (optional, but good practice)
    if (user.approved === false) {
        // You might want to show a specific "Pending Approval" page instead of redirecting
        // For now, let's allow them to see the dashboard but maybe limited?
        // Or if you want to strictly block:
        // return <div className="p-8 text-center">Votre compte est en attente d'approbation.</div>
    }

    return children
}
