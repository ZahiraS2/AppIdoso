import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Limpa valores colados com aspas, espaços, barra no final ou caminho extra
// (ex.: "https://xxxx.supabase.co/" ou ".../rest/v1/"). Uma barra sobrando faz o
// Supabase responder "Invalid path specified in request URL".
const clean = (v?: string) => (v ?? '').trim().replace(/^["']+|["']+$/g, '').trim();

const supabaseUrl = clean(process.env.EXPO_PUBLIC_SUPABASE_URL)
  .replace(/\/(rest|auth|storage|realtime)\/v1.*$/i, '')
  .replace(/\/+$/, '');
const supabaseKey = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase: EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY não definidas.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renova o token só enquanto o app está aberto
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});