import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let crmonefactoryInstance: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

export const getCrmonefactoryClient = (): SupabaseClient => {
  if (!crmonefactoryInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    crmonefactoryInstance = createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'crmonefactory'
      }
    })
  }
  return crmonefactoryInstance
}

export const supabase = getSupabaseClient()
export const crmonefactory = getCrmonefactoryClient() 