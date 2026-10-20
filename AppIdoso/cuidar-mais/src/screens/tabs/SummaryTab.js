import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { takenToday, useApp } from '../../store/AppContext';
import { fonts, useTheme } from '../../theme';
import { Avatar, Button, Card, Chip, ErrorText, Field, Sheet } from '../../components/ui';

export function StatusBadge({ time }) {
  const t = useTheme();
  return (
    <View style={{
      backgroundColor: time ? t.primary : 'transparent', borderColor: t.primary, borderWidth: time ? 0 : 1.5,
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
    }}>
      <Text style={{ color: time ? t.onPrimary : t.primary, fontFamily: fonts.extra, fontSize: 12 }}>
        {time ? `Tomado ${time}` : 'Pendente'}
      </Text>
    </View>
  );
}

export default function SummaryTab({ elder }) {
  const t = useTheme();
  const { user, addGuardian, guardianName } = useApp();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const err = addGuardian(elder.id, email);
    if (err) return setError(err);
    setEmail(''); setError(''); setOpen(false);
  };
  const close = () => { setOpen(false); setError(''); setEmail(''); };

  const today = [...elder.medicines].sort((a, b) => a.time.localeCompare(b.time));
  const title = { color: t.text, fontFamily: fonts.extra, fontSize: 17 };

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <Text accessibilityRole="header" style={[title, { marginBottom: 12 }]}>Doenças e condições</Text>
        {elder.conditions.length === 0 ? (
          <Text style={{ color: t.muted, fontFamily: fonts.semi }}>Nenhuma condição informada.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {elder.conditions.map((c) => <Chip key={c} label={c} />)}
          </View>
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text accessibilityRole="header" style={title}>Responsáveis</Text>
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Adicionar responsável" hitSlop={10}>
            <Text style={{ color: t.primary, fontFamily: fonts.extra, fontSize: 15 }}>+ Adicionar</Text>
          </Pressable>
        </View>
        {elder.guardians.map((g) => (
          <View key={g.email} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <Avatar name={guardianName(g)} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontFamily: fonts.extra, fontSize: 15 }}>
                {guardianName(g)}{g.email === user.email ? ' (você)' : ''}
              </Text>
              <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 13 }}>{g.email}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text accessibilityRole="header" style={[title, { marginBottom: 12 }]}>Hoje</Text>
        {today.length === 0 && (
          <Text style={{ color: t.muted, fontFamily: fonts.semi }}>Nenhum remédio cadastrado.</Text>
        )}
        {today.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: t.text, fontFamily: fonts.semi, fontSize: 15, flex: 1 }}>{m.time} · {m.name}</Text>
            <StatusBadge time={takenToday(m)} />
          </View>
        ))}
      </Card>

      <Sheet visible={open} title="Adicionar responsável" onClose={close}>
        <Field label="E-mail do responsável" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <ErrorText>{error}</ErrorText>
        <Button title="Adicionar" onPress={save} style={{ marginBottom: 10 }} />
        <Button title="Cancelar" variant="soft" onPress={close} />
      </Sheet>
    </View>
  );
}