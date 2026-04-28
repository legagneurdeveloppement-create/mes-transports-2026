import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exokpntpblfyrltcxvxk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZHdsbHRicGpqZmFwdmVpY3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTA5NTAsImV4cCI6MjA4NDA4Njk1MH0.9bzRRx8AX-8l7QCerE0NMHUtdm00iZR3NKZNnC4e9lE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email, role')

    if (error) {
        console.error('Error:', error)
        return
    }
    console.log('Users in DB:', data)
}

checkUsers()
