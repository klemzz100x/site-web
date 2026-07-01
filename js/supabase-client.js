// Client Supabase partagé — nécessite d'avoir chargé le CDN Supabase + supabase-config.js avant ce script
window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
