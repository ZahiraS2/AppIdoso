import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { fonts, useTheme } from '../theme';
import { Button, ErrorText, Field } from '../components/ui';

export default function SignUpScreen({ navigation }) {
  const t = useTheme();
  const { signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Ao criar a conta, o usuário já entra (a navegação troca para a Home)
  const submit = () => {
    const err = signUp({ name, email, password });
    if (err) setError(err);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: 24 }}>
            <Text accessibilityRole="header" style={{ color: t.text, fontFamily: fonts.extra, fontSize: 28 }}>Criar conta</Text>
            <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 15, marginTop: 4 }}>
              Se alguém já adicionou seu e-mail como responsável, os idosos aparecem assim que você entrar.
            </Text>
          </View>

          <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" placeholder="Seu nome" />
          <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="voce@email.com" />
          <Field label="Senha (mínimo 6 caracteres)" value={password} onChangeText={setPassword} secureTextEntry placeholder="Crie uma senha" onSubmitEditing={submit} />
          <ErrorText>{error}</ErrorText>
          <Button title="Criar conta" onPress={submit} />
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: t.primary, fontFamily: fonts.bold, fontSize: 15 }}>Já tenho conta · Entrar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}