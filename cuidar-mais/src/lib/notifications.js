import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { firstName } from '../utils/format';

// Notificações agendadas não funcionam no navegador (expo start --web)
export const notificationsSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'medicamentos';

if (notificationsSupported) {
  // Mostra o aviso mesmo com o app aberto
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Fila: evita que duas reprogramações rodem ao mesmo tempo e dupliquem avisos
let chain = Promise.resolve();
const enqueue = (fn) => {
  chain = chain.then(fn).catch((e) => console.warn('Notificações:', e?.message || e));
  return chain;
};

let channelReady = false;
async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Remédios',
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (e) {
    // Em alguns aparelhos o canal é criado, mas o retorno da função falha ao ser
    // convertido. Não deve impedir o pedido de permissão nem o agendamento.
    console.warn('Canal de notificação:', e?.message || e);
  }
  channelReady = true;
}

// Pede permissão se ainda não foi decidida. Retorna true se permitido.
export async function ensurePermission() {
  if (!notificationsSupported) return false;
  await ensureChannel(); // no Android 13+, o canal precisa existir antes do pedido
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  return status === 'granted';
}

// Cancela tudo (ao sair da conta)
export function cancelAllReminders() {
  if (!notificationsSupported) return Promise.resolve();
  return enqueue(() => Notifications.cancelAllScheduledNotificationsAsync());
}

// Agenda um lembrete DIÁRIO para cada remédio de cada idoso.
// Apaga os anteriores e recria, então sempre acompanha o cadastro.
export function scheduleMedicineReminders(elders) {
  if (!notificationsSupported) return Promise.resolve();
  return enqueue(async () => {
    const meds = elders.flatMap((e) => e.medicines.map((m) => ({ elder: e, med: m })));
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (meds.length === 0) return; // nada para avisar: nem pede permissão

    if (!(await ensurePermission())) return;

    for (const { elder, med } of meds) {
      const [hour, minute] = String(med.time).split(':').map(Number);
      if (Number.isNaN(hour) || Number.isNaN(minute)) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Hora do remédio de ${firstName(elder.name)}`,
          body: `${med.name}${med.dose ? ` · ${med.dose}` : ''} — às ${med.time}.\nDepois, é só marcar como tomado no Cuidar+ 💙`,
          sound: true,
          data: { elderId: elder.id, medicineId: med.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  });
}