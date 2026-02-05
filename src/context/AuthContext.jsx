import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const [viewAsChauffeur, setViewAsChauffeur] = useState(false)

    useEffect(() => {
        try {
            // Init users list if empty
            const storedAllUsers = localStorage.getItem('all_users')
            if (!storedAllUsers) {
                const initialUsers = [
                    {
                        name: 'Admin General',
                        email: 'admin@demo.com',
                        password: 'admin',
                        role: 'SUPER_ADMIN',
                        approved: true,
                        direction: 'Communauté de communes'
                    },
                    {
                        name: 'Chauffeur Demo',
                        email: 'chauffeur@demo.com',
                        password: 'demo',
                        role: 'CHAUFFEUR',
                        approved: true,
                        direction: 'Société de transport'
                    }
                ]
                localStorage.setItem('all_users', JSON.stringify(initialUsers))
            }

            // Migration: Ensure Chauffeur Demo exists for testing
            // We verify existence but avoid overwriting properties unless critical
            const allUsersStr = localStorage.getItem('all_users') || '[]'
            let allUsers = []
            try {
                allUsers = JSON.parse(allUsersStr)
            } catch (pe) {
                console.error('Error parsing all_users:', pe)
                allUsers = []
            }

            // Check active session and SYNC with all_users
            const stored = localStorage.getItem('user')
            if (stored && stored !== 'undefined') {
                try {
                    const sessionUser = JSON.parse(stored)
                    // Find the most up-to-date data for this user
                    const updatedUser = allUsers.find(u => u.email === sessionUser.email)
                    if (updatedUser) {
                        setUser(updatedUser)
                        localStorage.setItem('user', JSON.stringify(updatedUser))
                    } else {
                        setUser(sessionUser)
                    }
                } catch (pe) {
                    console.error('Error parsing stored user:', pe)
                }
            }

            const chauffeurUser = allUsers.find(u => u.email === 'chauffeur@demo.com')
            if (!chauffeurUser) {
                // Only create if missing
                allUsers.push({
                    name: 'Chauffeur Demo',
                    email: 'chauffeur@demo.com',
                    password: 'demo',
                    role: 'CHAUFFEUR',
                    approved: true,
                    direction: 'Société de transport'
                })
                localStorage.setItem('all_users', JSON.stringify(allUsers))
            }
            // Removed the aggressive role reset to avoid side effects on modified users
        } catch (err) {
            console.error('Fatal crash in AuthProvider useEffect:', err)
        } finally {
            setLoading(false)
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
                logout()
            }, INACTIVITY_TIMEOUT)
        }

        const events = ['mousemove', 'keypress', 'click', 'scroll']
        events.forEach(e => window.addEventListener(e, resetTimer))
        resetTimer()

        return () => {
            if (timeoutId) clearTimeout(timeoutId)
            events.forEach(e => window.removeEventListener(e, resetTimer))
        }
    }, [user])

    const login = (email, password) => {
        try {
            const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
            const foundUser = allUsers.find(u => u.email === email && u.password === password)

            if (!foundUser) throw new Error('Identifiants incorrects')
            if (!foundUser.approved) throw new Error('Compte en attente d\'approbation')

            setUser(foundUser)
            localStorage.setItem('user', JSON.stringify(foundUser))
            navigate('/dashboard')
            return foundUser
        } catch (e) {
            throw e
        }
    }

    const register = (userData) => {
        try {
            const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
            if (allUsers.find(u => u.email === userData.email)) throw new Error('Email déjà utilisé')

            const newUser = {
                ...userData,
                role: userData.role || (userData.email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER'),
                approved: false
            }

            const updatedUsers = [...allUsers, newUser]
            localStorage.setItem('all_users', JSON.stringify(updatedUsers))
            return newUser
        } catch (e) {
            throw e
        }
    }

    const logout = () => {
        setUser(null)
        setViewAsChauffeur(false)
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, viewAsChauffeur, setViewAsChauffeur }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext) || {}
