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
                },
                {
                    name: 'Chauffeur Demo',
                    email: 'chauffeur@demo.com',
                    password: 'demo',
                    role: 'CHAUFFEUR',
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

        // Migration: Ensure Chauffeur Demo exists for testing and has the correct role
        const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
        const chauffeurUser = allUsers.find(u => u.email === 'chauffeur@demo.com')

        if (!chauffeurUser) {
            allUsers.push({
                name: 'Chauffeur Demo',
                email: 'chauffeur@demo.com',
                password: 'demo',
                role: 'CHAUFFEUR',
                approved: true
            })
            localStorage.setItem('all_users', JSON.stringify(allUsers))
        } else if (chauffeurUser.role !== 'CHAUFFEUR') {
            // Force the role to CHAUFFEUR if it was changed or incorrectly set
            chauffeurUser.role = 'CHAUFFEUR'
            localStorage.setItem('all_users', JSON.stringify(allUsers))
        }
    }, [])

    // Automatic Logout on Inactivity
    useEffect(() => {
        if (!user) return

        const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
        let timeoutId

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                console.log('Déconnexion automatique pour inactivité')
                logout()
            }, INACTIVITY_TIMEOUT)
        }

        // Events that reset the timer
        window.addEventListener('mousemove', resetTimer)
        window.addEventListener('keypress', resetTimer)
        window.addEventListener('click', resetTimer)
        window.addEventListener('scroll', resetTimer)

        // Init timer
        resetTimer()

        return () => {
            if (timeoutId) clearTimeout(timeoutId)
            window.removeEventListener('mousemove', resetTimer)
            window.removeEventListener('keypress', resetTimer)
            window.removeEventListener('click', resetTimer)
            window.removeEventListener('scroll', resetTimer)
        }
    }, [user])

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
