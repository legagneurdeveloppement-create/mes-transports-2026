import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exokpntpblfyrltcxvxk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2twbnRwYmxmeXJsdGN4dnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjk1NjIsImV4cCI6MjA4MTkwNTU2Mn0.IZKALFps-t-oYiOl_IXan9QqBIYX93aaQVC5ToqXW-w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testColumn() {
    console.log('Testing if column "managed_password" exists...')
    const { error } = await supabase
        .from('profiles')
        .select('managed_password')
        .limit(1)

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('column "managed_password" does not exist')) {
            console.error('❌ COLUMN MISSING: La colonne "managed_password" n\'existe pas encore dans la base de données.')
        } else {
            console.error('Error:', error.message)
        }
    } else {
        console.log('✅ COLUMN EXISTS: La colonne existe.')
    }
}

testColumn()
