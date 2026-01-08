import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        // Init users list if empty
        const storedAllUsers = localStorage.getItem('all_users')
        if (!storedAllUsers) {
            const initialUsers = [
                {
                    name: 'Admin General',
                    email: 'admin@demo.com',
                    password: 'admin',
                    role: 'SUPER_ADMIN',
                    approved: true
                }
            ]
            localStorage.setItem('all_users', JSON.stringify(initialUsers))
        }

        // Check active session
        const stored = localStorage.getItem('user')
        if (stored) {
            setUser(JSON.parse(stored))
        }
    }, [])

    const login = (email, password) => {
        const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
        const foundUser = allUsers.find(u => u.email === email && u.password === password)

        if (!foundUser) {
            throw new Error('Identifiants incorrects')
        }

        if (!foundUser.approved) {
            throw new Error('Votre compte est en attente d\'approbation par un administrateur')
        }

        setUser(foundUser)
        localStorage.setItem('user', JSON.stringify(foundUser))
        navigate('/dashboard')
        return foundUser
    }

    const register = (userData) => {
        const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')

        if (allUsers.find(u => u.email === userData.email)) {
            throw new Error('Cet email est déjà utilisé')
        }

        const newUser = {
            ...userData,
            role: userData.role || (userData.email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER'),
            approved: false // All new users need approval
        }

        const updatedUsers = [...allUsers, newUser]
        localStorage.setItem('all_users', JSON.stringify(updatedUsers))
        return newUser
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
