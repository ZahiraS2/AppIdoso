import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  addDaysISO, isValidEmail, nameFromEmail, normEmail, nowHM, todayISO,
} from '../utils/format';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEMO = { name: 'Ana Souza', email: 'demo@cuidar.com', password: '123456' };
const today = todayISO();

const seedElders = () => [
  {
    id: 'e1',
    name: 'Maria Aparecida',
    age: 78,
    conditions: ['Diabetes', 'Pressão alta'],
    guardians: [
      { name: 'Ana Souza', email: DEMO.email },
      { name: 'Carlos Souza', email: 'carlos@email.com' },
    ],
    medicines: [
      {
        id: 'm1', name: 'Metformina', dose: '850 mg', time: '08:00',
        history: [
          { date: addDaysISO(-2), time: '08:10' },
          { date: today, time: '08:05' },
        ],
      },
      {
        id: 'm2', name: 'Losartana', dose: '50 mg', time: '12:00',
        history: [{ date: addDaysISO(-1), time: '12:20' }],
      },
      {
        id: 'm3', name: 'Insulina NPH', dose: '10 UI', time: '20:00',
        history: [{ date: addDaysISO(-1), time: '20:05' }],
      },
    ],
    appointments: [
      { id: 'c1', doctor: 'Dra. Helena Prado', specialty: 'Endocrinologia', date: addDaysISO(3), notes: 'Levar exames de glicemia' },
      { id: 'c2', doctor: 'Dr. Paulo Mota', specialty: 'Cardiologia', date: addDaysISO(-40), notes: 'Pressão controlada' },
    ],
  },
  {
    id: 'e2',
    name: 'José Almeida',
    age: 84,
    conditions: ['Pressão baixa', 'Alzheimer'],
    guardians: [
      { name: 'Ana Souza', email: DEMO.email },
      { name: 'Beatriz Almeida', email: 'bia@email.com' },
    ],
    medicines: [{ id: 'm4', name: 'Donepezila', dose: '10 mg', time: '21:00', history: [] }],
    appointments: [
      { id: 'c3', doctor: 'Dr. Renato Lima', specialty: 'Neurologia', date: addDaysISO(12), notes: '' },
    ],
  },
];

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function AppProvider({ children }) {
  const [users, setUsers] = useState([DEMO]);
  const [user, setUser] = useState(null); // usuário logado
  const [elders, setElders] = useState(seedElders);

  // ---------- Autenticação ----------
  const signUp = ({ name, email, password }) => {
    const mail = normEmail(email);
    if (!name.trim()) return 'Informe seu nome.';
    if (!isValidEmail(mail)) return 'Informe um e-mail válido.';
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (users.some((u) => u.email === mail)) return 'Já existe uma conta com este e-mail.';
    const novo = { name: name.trim(), email: mail, password };
    setUsers((prev) => [...prev, novo]);
    setUser(novo);
    return null;
  };

  const signIn = (email, password) => {
    const found = users.find((u) => u.email === normEmail(email) && u.password === password);
    if (!found) return 'E-mail ou senha incorretos.';
    setUser(found);
    return null;
  };

  const signOut = () => setUser(null);

  // ---------- Idosos ----------
  const myElders = useMemo(
    () => (user ? elders.filter((e) => e.guardians.some((g) => g.email === user.email)) : []),
    [elders, user],
  );

  const addElder = ({ name, age, conditions, partnerEmail }) => {
    const ageNum = Number(age);
    if (!name.trim() || !ageNum || ageNum < 0) return 'Informe nome completo e idade.';
    const partner = normEmail(partnerEmail || '');
    if (partner && !isValidEmail(partner)) return 'O e-mail do responsável é inválido.';
    const guardians = [{ name: user.name, email: user.email }];
    if (partner && partner !== user.email) guardians.push({ name: nameFromEmail(partner), email: partner });
    setElders((prev) => [
      ...prev,
      { id: uid('e'), name: name.trim(), age: ageNum, conditions, guardians, medicines: [], appointments: [] },
    ]);
    return null;
  };

  const patchElder = (id, fn) =>
    setElders((prev) => prev.map((e) => (e.id === id ? fn(e) : e)));

  const addGuardian = (elderId, email) => {
    const mail = normEmail(email);
    if (!mail) return 'Informe o e-mail do responsável.';
    if (!isValidEmail(mail)) return 'E-mail inválido.';
    const elder = elders.find((e) => e.id === elderId);
    if (elder.guardians.some((g) => g.email === mail)) return 'Esta pessoa já é responsável.';
    const known = users.find((u) => u.email === mail);
    patchElder(elderId, (e) => ({
      ...e,
      guardians: [...e.guardians, { name: known ? known.name : nameFromEmail(mail), email: mail }],
    }));
    return null;
  };

  // ---------- Remédios ----------
  const addMedicine = (elderId, { name, dose, time }) => {
    patchElder(elderId, (e) => ({
      ...e,
      medicines: [...e.medicines, { id: uid('m'), name: name.trim(), dose: dose.trim(), time, history: [] }],
    }));
  };

  // Registra a hora atual; não pode ser desfeito
  const markTaken = (elderId, medId) => {
    patchElder(elderId, (e) => ({
      ...e,
      medicines: e.medicines.map((m) =>
        m.id === medId && !m.history.some((h) => h.date === todayISO())
          ? { ...m, history: [...m.history, { date: todayISO(), time: nowHM() }] }
          : m,
      ),
    }));
  };

  // ---------- Consultas ----------
  const addAppointment = (elderId, { doctor, specialty, date, notes }) => {
    patchElder(elderId, (e) => ({
      ...e,
      appointments: [
        ...e.appointments,
        { id: uid('c'), doctor: doctor.trim(), specialty: specialty.trim(), date, notes: notes.trim() },
      ],
    }));
  };

  // Nome do responsável: usa o cadastro do usuário, se existir
  const guardianName = (g) => users.find((u) => u.email === g.email)?.name || g.name;

  const value = {
    user, signUp, signIn, signOut,
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