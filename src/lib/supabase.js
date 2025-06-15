
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bunolnhegwzhxqxymmet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bm9sbmhlZ3d6aHhxeHltbWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNzY4MjIsImV4cCI6MjA2MTc1MjgyMn0.f3lUOwuDDIAiZN5p0UwPXmBHjsXCW-ryB6m-G1nof6E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
