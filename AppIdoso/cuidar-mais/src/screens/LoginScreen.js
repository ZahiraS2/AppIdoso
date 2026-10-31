import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { fonts, useTheme } from '../theme';
import { Button, ErrorText, Field } from '../components/ui';

export default function LoginScreen({ navigation }) {
  const t = useTheme();
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const err = signIn(email, password);
    if (err) setError(err);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.onPrimary, fontFamily: fonts.extra, fontSize: 36 }}>+</Text>
            </View>
            <Text style={{ color: t.text, fontFamily: fonts.extra, fontSize: 30, marginTop: 14 }}>Cuidar+</Text>
            <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 15, marginTop: 4, textAlign: 'center' }}>
              Cuide de quem você ama, junto com a família
            </Text>
          </View>

          <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="voce@email.com" />
          <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Sua senha" onSubmitEditing={submit} />
          <ErrorText>{error}</ErrorText>
          <Button title="Entrar" onPress={submit} />
          <Pressable onPress={() => navigation.navigate('SignUp')} accessibilityRole="button" style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: t.primary, fontFamily: fonts.bold, fontSize: 15 }}>Não tem conta? Criar conta</Text>
          </Pressable>
          <Text style={{ color: t.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Conta de teste: demo@cuidar.com · senha 123456
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}