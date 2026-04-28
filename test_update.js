import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exokpntpblfyrltcxvxk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2twbnRwYmxmeXJsdGN4dnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjk1NjIsImV4cCI6MjA4MTkwNTU2Mn0.IZKALFps-t-oYiOl_IXan9QqBIYX93aaQVC5ToqXW-w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpdate() {
    console.log('Testing update on profiles table...')

    // Attempt to update a profile (we need a valid ID, but let's see if we get a policy error)
    // We'll try a random UUID just to see the error type
    const { error } = await supabase
        .from('profiles')
        .update({ managed_password: 'test_password' })
        .eq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
        console.log('Update result error:', error.message, error.code)
    } else {
        console.log('Update call sent (might have matched 0 rows but call was allowed).')
    }
}

testUpdate()
