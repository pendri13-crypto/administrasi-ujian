import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://frjaihrbffdnnjdiuvxm.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyamFpaHJiZmZkbm5qZGl1dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxOTU5NzIsImV4cCI6MjEwOTc3MTk3Mn0.vQumvKaaYMKOImQeK2k7rQQyFF048KsqhVqUT39JxYc';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
