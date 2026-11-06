import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { cancelAllReminders, scheduleMedicineReminders } from '../lib/notifications';
import {
  isValidEmail, nameFromEmail, normEmail, nowHM, todayISO,
} from '../utils/format';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const hm = (t) => (t ? String(t).slice(0, 5) : ''); // '08:00:00' -> '08:00'

// Converte a linha do banco para o formato que as telas já usam
const mapElder = (row) => ({
  id: row.id,
  name: row.name,
  age: row.age,
  conditions: row.conditions || [],
  guardians: (row.guardians || []).map((g) => ({
    email: g.email,
    name: g.profiles?.name || nameFromEmail(g.email),
  })),
  medicines: (row.medicines || []).map((m) => ({
    id: m.id,
    name: m.name,
    dose: m.dose || '',
    time: hm(m.time),
    history: (m.medicine_logs || []).map((l) => ({ date: l.taken_on, time: hm(l.taken_at) })),
  })),
  appointments: (row.appointments || []).map((c) => ({
    id: c.id,
    doctor: c.doctor,
    specialty: c.specialty || '',
    date: c.date,
    notes: c.notes || '',
  })),
});

const toUser = (session) => {
  const u = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    email: normEmail(u.email || ''),
    name: u.user_metadata?.name || nameFromEmail(u.email || ''),
  };
};

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false); // sessão já foi restaurada?
  const [user, setUser] = useState(null);    // usuário logado
  const [elders, setElders] = useState([]);

  // ---------- Sessão (mantém o login depois de recarregar) ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---------- Carregar dados do banco ----------
  const loadElders = useCallback(async () => {
    const { data, error } = await supabase
      .from('elders')
      .select(`
        id, name, age, conditions,
        guardians ( email, profiles ( name ) ),
        medicines ( id, name, dose, time, medicine_logs ( taken_on, taken_at ) ),
        appointments ( id, doctor, specialty, date, notes )
      `)
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Erro ao carregar idosos:', error.message);
      return;
    }
    setElders((data || []).map(mapElder));
  }, []);

  useEffect(() => {
    if (user?.id) loadElders();
    else setElders([]);
  }, [user?.id, loadElders]);

  // Atualiza ao voltar para o app (outros responsáveis podem ter feito alterações)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user?.id) loadElders();
    });
    return () => sub.remove();
  }, [user?.id, loadElders]);

  // ---------- Lembretes de remédios (notificações no aparelho) ----------
  // A assinatura só muda quando um remédio é criado/alterado, evitando reagendar à toa
  const remindersKey = useMemo(
    () => elders
      .flatMap((e) => e.medicines.map((m) => `${e.id}|${e.name}|${m.id}|${m.name}|${m.dose}|${m.time}`))
      .sort()
      .join(';'),
    [elders],
  );

  useEffect(() => {
    if (!user?.id) {
      cancelAllReminders(); // saiu da conta: remove os avisos deste aparelho
      return;
    }
    scheduleMedicineReminders(elders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, remindersKey]);

  // ---------- Autenticação ----------
  const signUp = async ({ name, email, password }) => {
    const mail = normEmail(email);
    if (!name.trim()) return 'Informe seu nome.';
    if (!isValidEmail(mail)) return 'Informe um e-mail válido.';
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';

    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      if (/already registered/i.test(error.message)) return 'Já existe uma conta com este e-mail.';
      return `Não foi possível criar a conta: ${error.message}`;
    }
    // E-mail já cadastrado (quando a confirmação por e-mail está ligada)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return 'Já existe uma conta com este e-mail.';
    }
    // Sem sessão = o Supabase está exigindo confirmação por e-mail
    if (!data.session) return 'Conta criada! Confirme seu e-mail para poder entrar.';
    return null; // sessão aberta: onAuthStateChange leva para a Home
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: normEmail(email),
      password,
    });
    if (!error) return null;
    if (/invalid login credentials/i.test(error.message)) return 'E-mail ou senha incorretos.';
    if (/not confirmed/i.test(error.message)) return 'Confirme seu e-mail antes de entrar.';
    return `Não foi possível entrar: ${error.message}`;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setElders([]);
  };

  // ---------- Idosos ----------
  const addElder = async ({ name, age, conditions, partnerEmail }) => {
    const ageNum = Number(age);
    if (!name.trim() || !ageNum || ageNum < 0) return 'Informe nome completo e idade.';
    const partner = normEmail(partnerEmail || '');
    if (partner && !isValidEmail(partner)) return 'O e-mail do responsável é inválido.';

    // O banco já adiciona quem cadastra como primeiro responsável (gatilho)
    const { data, error } = await supabase
      .from('elders')
      .insert({ name: name.trim(), age: ageNum, conditions })
      .select('id')
      .single();
    if (error) return `Não foi possível salvar o idoso: ${error.message}`;

    if (partner && partner !== user.email) {
      const { error: gErr } = await supabase
        .from('guardians')
        .insert({ elder_id: data.id, email: partner });
      if (gErr) {
        await loadElders();
        return `Idoso salvo, mas não foi possível adicionar o responsável: ${gErr.message}`;
      }
    }
    await loadElders();
    return null;
  };

  const addGuardian = async (elderId, email) => {
    const mail = normEmail(email);
    if (!mail) return 'Informe o e-mail do responsável.';
    if (!isValidEmail(mail)) return 'E-mail inválido.';
    const elder = elders.find((e) => e.id === elderId);
    if (elder?.guardians.some((g) => g.email === mail)) return 'Esta pessoa já é responsável.';

    const { error } = await supabase.from('guardians').insert({ elder_id: elderId, email: mail });
    if (error) {
      if (error.code === '23505') return 'Esta pessoa já é responsável.';
      return `Não foi possível adicionar: ${error.message}`;
    }
    await loadElders();
    return null;
  };

  // ---------- Remédios ----------
  const addMedicine = async (elderId, { name, dose, time }) => {
    const { error } = await supabase.from('medicines').insert({
      elder_id: elderId,
      name: name.trim(),
      dose: dose.trim(),
      time,
    });
    if (error) return `Não foi possível salvar o remédio: ${error.message}`;
    await loadElders();
    return null;
  };

  // Registra a hora atual; não pode ser desfeito
  const markTaken = async (elderId, medId) => {
    const { error } = await supabase.from('medicine_logs').insert({
      medicine_id: medId,
      taken_on: todayISO(),
      taken_at: nowHM(),
    });
    // 23505 = já foi marcado hoje (outro responsável pode ter marcado antes)
    if (error && error.code !== '23505') {
      console.warn('Erro ao marcar como tomado:', error.message);
      return 'Não foi possível registrar a dose.';
    }
    await loadElders();
    return null;
  };

  // ---------- Consultas ----------
  const addAppointment = async (elderId, { doctor, specialty, date, notes }) => {
    const { error } = await supabase.from('appointments').insert({
      elder_id: elderId,
      doctor: doctor.trim(),
      specialty: specialty.trim(),
      date,
      notes: notes.trim(),
    });
    if (error) return `Não foi possível salvar a consulta: ${error.message}`;
    await loadElders();
    return null;
  };

  // O nome já vem resolvido do banco (perfil do responsável)
  const guardianName = (g) => g.name;

  const myElders = useMemo(() => elders, [elders]); // o RLS já filtra por responsável

  const value = {
    ready, user, signUp, signIn, signOut,
    myElders, elders, addElder, addGuardian,
    addMedicine, markTaken, addAppointment, guardianName,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ---------- Helpers de leitura ----------
export const takenToday = (med) => med.history.find((h) => h.date === todayISO())?.time || null;
export const pendingCount = (elder) => elder.medicines.filter((m) => !takenToday(m)).length;
export const upcoming = (elder) =>
  elder.appointments.filter((c) => c.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
export const pastAppointments = (elder) =>
  elder.appointments.filter((c) => c.date < todayISO()).sort((a, b) => b.date.localeCompare(a.date));