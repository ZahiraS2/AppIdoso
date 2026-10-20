import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { fonts, useTheme } from '../theme';
import { Button, Chip, ErrorText, Field } from '../components/ui';

const CONDITIONS = [
  'Diabetes', 'Pressão alta', 'Pressão baixa', 'Alzheimer',
  'Cardiopatia', 'Artrose', 'Osteoporose', 'Colesterol alto',
];

export function BackButton({ onPress }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: t.text, fontSize: 22, marginTop: -2 }}>‹</Text>
    </Pressable>
  );
}

export default function NewElderScreen({ navigation }) {
  const t = useTheme();
  const { addElder } = useApp();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selected, setSelected] = useState([]);
  const [others, setOthers] = useState('');
  const [partner, setPartner] = useState('');
  const [error, setError] = useState('');

  const toggle = (c) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = () => {
    const extra = others.split(',').map((s) => s.trim()).filter(Boolean);
    const conditions = [...selected, ...extra.filter((x) => !selected.includes(x))];
    const err = addElder({ name, age, conditions, partnerEmail: partner });
    if (err) return setError(err);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text accessibilityRole="header" style={{ color: t.text, fontFamily: fonts.extra, fontSize: 22 }}>Novo idoso</Text>
          </View>

          <Field label="Nome completo" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Idade" value={age} onChangeText={(v) => setAge(v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />

          <Text style={{ color: t.text, fontFamily: fonts.bold, fontSize: 14, marginBottom: 8 }}>Doenças e condições</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {CONDITIONS.map((c) => (
              <Chip key={c} label={c} selected={selected.includes(c)} onPress={() => toggle(c)} />
            ))}
          </View>

          <Field label="Outras (separe por vírgula)" value={others} onChangeText={setOthers} placeholder="Ex.: Glaucoma, Artrite" />
          <Field label="E-mail de outro responsável (opcional)" value={partner} onChangeText={setPartner} keyboardType="email-address" autoCapitalize="none" />
          <ErrorText>{error}</ErrorText>
          <Button title="Salvar idoso" onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}