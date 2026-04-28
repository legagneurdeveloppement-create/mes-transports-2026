import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exokpntpblfyrltcxvxk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2twbnRwYmxmeXJsdGN4dnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjk1NjIsImV4cCI6MjA4MTkwNTU2Mn0.IZKALFps-t-oYiOl_IXan9QqBIYX93aaQVC5ToqXW-w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listUsers() {
    console.log('Fetching users from profiles...')
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, managed_password')

    if (error) {
        console.error('Error:', error.message)
    } else {
        console.table(data)
    }
}

listUsers()
