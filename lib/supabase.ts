import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckmrzgljnzjokdlzwlkk.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbXJ6Z2xqbnpqb2tkbHp3bGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MjUwMTQsImV4cCI6MjEwNjIwMTAxNH0.0pFr8BFVlu-UhJViGyw4ZyN5AG4xJH4F8uctNNUgml4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
