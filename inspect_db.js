import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exokpntpblfyrltcxvxk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2twbnRwYmxmeXJsdGN4dnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjk1NjIsImV4cCI6MjA4MTkwNTU2Mn0.IZKALFps-t-oYiOl_IXan9QqBIYX93aaQVC5ToqXW-w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspect() {
    const { data, error } = await supabase.from('transports').select('*').limit(50)
    if (error) {
        console.error('Error:', error)
        return
    }
    if (data && data.length > 0) {
        const allKeys = new Set()
        data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)))
        console.log('Columns:', Array.from(allKeys))
    } else {
        console.log('No data found to inspect columns.')
    }
}

inspect()
