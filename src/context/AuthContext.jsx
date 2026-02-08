import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [viewAsChauffeur, setViewAsChauffeur] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user)
            } else {
                setLoading(false)
            }
        })

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user)
            } else {
                setUser(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (authUser) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                // Fallback if profile doesn't exist yet (should be handled by trigger, but just in case)
                setUser({ ...authUser, role: authUser.user_metadata?.role || 'USER' })
            } else {
                setUser({ ...authUser, ...data })
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            return data
        } catch (e) {
            console.error("Login error:", e)
            throw new Error(e.message === "Invalid login credentials" ? "Identifiants incorrects" : e.message)
        }
    }

    const register = async (userData) => {
        try {
            console.log("DEBUG: Tentative d'inscription pour", userData.email)

            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name,
                        role: userData.role || 'USER',
                        direction: userData.direction,
                        phone: userData.phone
                    }
                }
            })

            if (error) {
                throw error
            }

            // Note: The 'profiles' trigger in SQL will handle creating the profile record.
            return data
        } catch (e) {
            console.error("Registration error:", e)
            alert("ERREUR CRITIQUE: " + e.message);
            throw new Error(e.message)
        }
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setViewAsChauffeur(false)
            navigate('/login')
        } catch (e) {
            console.error("Logout error:", e)
        }
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, viewAsChauffeur, setViewAsChauffeur }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext) || {}
