const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const pad = (n) => String(n).padStart(2, '0');

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const nowHM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// '2026-10-22' -> '22/10/2026'
export const dateBR = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
// '2026-10-22' -> '22/10'
export const dateShort = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};
export const dayOf = (iso) => iso.split('-')[2];
export const monthAbbr = (iso) => MESES[Number(iso.split('-')[1]) - 1];

// Máscaras de digitação
export const maskDate = (text) => {
  const n = text.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
};
export const maskTime = (text) => {
  const n = text.replace(/\D/g, '').slice(0, 4);
  return n.length <= 2 ? n : `${n.slice(0, 2)}:${n.slice(2)}`;
};

// 'dd/mm/aaaa' -> 'aaaa-mm-dd' (ou null se inválida)
export const parseDateBR = (text) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
};
export const isValidTime = (t) => {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
};
export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const normEmail = (e) => e.trim().toLowerCase();
export const firstName = (name) => (name || '').trim().split(/\s+/)[0];
export const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();
export const nameFromEmail = (email) => {
  const p = email.split('@')[0].replace(/[._-]+/g, ' ');
  return p.charAt(0).toUpperCase() + p.slice(1);
};