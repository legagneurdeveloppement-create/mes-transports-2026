import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eldwlltbpjjfapveicvs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZHdsbHRicGpqZmFwdmVpY3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTA5NTAsImV4cCI6MjA4NDA4Njk1MH0.9bzRRx8AX-8l7QCerE0NMHUtdm00iZR3NKZNnC4e9lE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
