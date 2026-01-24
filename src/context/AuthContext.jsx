import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
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
            if (stored && stored !== 'undefined') {
                try {
                    setUser(JSON.parse(stored))
                } catch (pe) {
                    console.error('Error parsing stored user:', pe)
                }
            }

            // Migration: Ensure Chauffeur Demo exists for testing and has the correct role
            const allUsersStr = localStorage.getItem('all_users') || '[]'
            let allUsers = []
            try {
                allUsers = JSON.parse(allUsersStr)
            } catch (pe) {
                console.error('Error parsing all_users:', pe)
                allUsers = []
            }

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
                chauffeurUser.role = 'CHAUFFEUR'
                localStorage.setItem('all_users', JSON.stringify(allUsers))
            }
        } catch (err) {
            console.error('Fatal crash in AuthProvider useEffect:', err)
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
        <AuthContext.Provider value={{ user, login, register, logout, viewAsChauffeur, setViewAsChauffeur }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext) || {}
