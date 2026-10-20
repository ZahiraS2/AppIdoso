import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { pastAppointments, upcoming, useApp } from '../../store/AppContext';
import { fonts, useTheme } from '../../theme';
import { Button, Card, ErrorText, Field, SectionTitle, Sheet } from '../../components/ui';
import { dateBR, dayOf, maskDate, monthAbbr, parseDateBR } from '../../utils/format';

function AppointmentCard({ c }) {
  const t = useTheme();
  return (
    <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 52, height: 56, borderRadius: 14, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.chipText, fontFamily: fonts.extra, fontSize: 20, lineHeight: 22 }}>{dayOf(c.date)}</Text>
        <Text style={{ color: t.chipText, fontFamily: fonts.bold, fontSize: 13 }}>{monthAbbr(c.date)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontFamily: fonts.extra, fontSize: 16 }}>{c.doctor}</Text>
        <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 14 }}>
          {c.specialty ? `${c.specialty} · ` : ''}{dateBR(c.date)}
        </Text>
        {!!c.notes && <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 14 }}>{c.notes}</Text>}
      </View>
    </Card>
  );
}

export default function AppointmentsTab({ elder }) {
  const t = useTheme();
  const { addAppointment } = useApp();
  const [open, setOpen] = useState(false);
  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false); setError(''); setDoctor(''); setSpecialty(''); setDate(''); setNotes('');
  };
  const save = () => {
    if (!doctor.trim()) return setError('Informe o nome do médico.');
    const iso = parseDateBR(date);
    if (!iso) return setError('Informe uma data válida (dd/mm/aaaa).');
    addAppointment(elder.id, { doctor, specialty, date: iso, notes });
    close();
  };

  const next = upcoming(elder);
  const past = pastAppointments(elder);

  return (
    <View>
      <Button title="+ Agendar consulta" variant="soft" onPress={() => setOpen(true)} style={{ marginBottom: 16 }} />

      <SectionTitle>Próximas</SectionTitle>
      {next.length === 0 && <Text style={{ color: t.muted, fontFamily: fonts.semi, marginBottom: 14 }}>Nenhuma consulta agendada.</Text>}
      {next.map((c) => <AppointmentCard key={c.id} c={c} />)}

      <SectionTitle style={{ marginTop: 8 }}>Histórico de consultas</SectionTitle>
      {past.length === 0 && <Text style={{ color: t.muted, fontFamily: fonts.semi }}>Nenhuma consulta no histórico.</Text>}
      {past.map((c) => <AppointmentCard key={c.id} c={c} />)}

      <Sheet visible={open} title="Nova consulta" onClose={close}>
        <Field label="Médico" value={doctor} onChangeText={setDoctor} autoCapitalize="words" />
        <Field label="Especialidade" value={specialty} onChangeText={setSpecialty} autoCapitalize="sentences" />
        <Field label="Data" value={date} onChangeText={(v) => setDate(maskDate(v))} keyboardType="number-pad" placeholder="dd/mm/aaaa" />
        <Field label="Observações" value={notes} onChangeText={setNotes} multiline />
        <ErrorText>{error}</ErrorText>
        <Button title="Salvar consulta" onPress={save} style={{ marginBottom: 10 }} />
        <Button title="Cancelar" variant="soft" onPress={close} />
      </Sheet>
    </View>
  );
}