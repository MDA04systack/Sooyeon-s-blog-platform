import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    console.log("Checking all users...")

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')

    console.log("Profiles:", profiles)
    if (error) console.log("Error:", error)
}

check()
