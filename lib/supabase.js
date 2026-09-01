import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brcnxiqetcuhnfvlcwgp.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyY254aXFldGN1aG5mdmxjd2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NzE0OTIsImV4cCI6MjEwMjA0NzQ5Mn0.8gLSBhfwXcG_A7JMoRo0ZPHNFvi6YcQmzQljMYM-BIg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
