import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { takenToday, useApp } from '../../store/AppContext';
import { fonts, useTheme } from '../../theme';
import { Button, Card, ErrorText, Field, SectionTitle, Sheet } from '../../components/ui';
import { dateShort, isValidTime, maskTime } from '../../utils/format';

export default function MedicinesTab({ elder }) {
  const t = useTheme();
  const { addMedicine, markTaken } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const close = () => { setOpen(false); setError(''); setName(''); setDose(''); setTime(''); };
  const save = () => {
    if (!name.trim()) return setError('Informe o nome do remédio.');
    if (!isValidTime(time)) return setError('Informe o horário no formato HH:MM.');
    addMedicine(elder.id, { name, dose, time });
    close();
  };

  // Histórico: todas as doses, da mais recente para a mais antiga
  const history = elder.medicines
    .flatMap((m) => m.history.map((h) => ({ ...h, med: m })))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  return (
    <View>
      <Button title="+ Adicionar remédio" variant="soft" onPress={() => setOpen(true)} style={{ marginBottom: 14 }} />

      {elder.medicines.length === 0 && (
        <Text style={{ color: t.muted, fontFamily: fonts.semi, marginBottom: 14 }}>Nenhum remédio cadastrado.</Text>
      )}

      {[...elder.medicines].sort((a, b) => a.time.localeCompare(b.time)).map((m) => {
        const taken = takenToday(m);
        return (
          <Card key={m.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontFamily: fonts.extra, fontSize: 16 }}>{m.name}</Text>
              <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 14 }}>
                {m.dose ? `${m.dose} · ` : ''}todo dia às {m.time}
              </Text>
            </View>
            {taken ? (
              <View accessible accessibilityLabel={`Tomado às ${taken}`} style={{ backgroundColor: t.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ color: t.onPrimary, fontFamily: fonts.extra, fontSize: 15 }}>✓ {taken}</Text>
              </View>
            ) : (
              <Button title={'Marcar\ntomado'} variant="outline" onPress={() => markTaken(elder.id, m.id)} style={{ paddingVertical: 8, minWidth: 96 }} />
            )}
          </Card>
        );
      })}

      <SectionTitle style={{ marginTop: 14 }}>Histórico de medicamentos</SectionTitle>
      {history.length === 0 && (
        <Text style={{ color: t.muted, fontFamily: fonts.semi }}>Nenhuma dose registrada ainda.</Text>
      )}
      {history.map((h, i) => (
        <View
          key={`${h.med.id}-${h.date}-${h.time}`}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
            borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: t.border,
          }}
        >
          <View style={{ backgroundColor: t.chipBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: t.chipText, fontFamily: fonts.extra, fontSize: 13 }}>{dateShort(h.date)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontFamily: fonts.extra, fontSize: 15 }}>{h.med.name}</Text>
            <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 13 }}>
              {h.med.dose ? `${h.med.dose} · ` : ''}tomado às {h.time}
            </Text>
          </View>
        </View>
      ))}

      <Sheet visible={open} title="Novo remédio" onClose={close}>
        <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label="Dose" value={dose} onChangeText={setDose} placeholder="Ex.: 50 mg" />
        <Field label="Horário" value={time} onChangeText={(v) => setTime(maskTime(v))} keyboardType="number-pad" placeholder="HH:MM" />
        <ErrorText>{error}</ErrorText>
        <Button title="Salvar remédio" onPress={save} style={{ marginBottom: 10 }} />
        <Button title="Cancelar" variant="soft" onPress={close} />
      </Sheet>
    </View>
  );
}