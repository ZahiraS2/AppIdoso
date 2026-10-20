import React from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { fonts, useTheme } from '../theme';
import { initial } from '../utils/format';

export function Avatar({ name, size = 44 }) {
  const t = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: t.chipBg,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.chipText, fontFamily: fonts.extra, fontSize: size * 0.4 }}>{initial(name)}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress, small }) {
  const t = useTheme();
  const bg = selected ? t.primary : t.chipBg;
  const color = selected ? t.onPrimary : t.chipText;
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={{
        backgroundColor: bg, borderRadius: 999,
        paddingHorizontal: small ? 12 : 14, paddingVertical: small ? 6 : 8,
      }}
    >
      <Text style={{ color, fontFamily: fonts.bold, fontSize: 13 }}>{label}</Text>
    </Comp>
  );
}

export function Card({ children, style }) {
  const t = useTheme();
  return (
    <View
      style={[{
        backgroundColor: t.surface, borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: t.border,
      }, style]}
    >
      {children}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', style }) {
  const t = useTheme();
  const v = {
    primary: { bg: t.primary, color: t.onPrimary, border: t.primary },
    soft: { bg: t.surface2, color: t.primary, border: t.border },
    outline: { bg: 'transparent', color: t.primary, border: t.primary },
    ghost: { bg: t.surface2, color: t.primary, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [{
        backgroundColor: v.bg, borderColor: v.border, borderWidth: 2, borderRadius: 14,
        paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.8 : 1, minHeight: 48,
      }, style]}
    >
      <Text style={{ color: v.color, fontFamily: fonts.extra, fontSize: 16, textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, error, ...props }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: t.text, fontFamily: fonts.bold, fontSize: 14, marginBottom: 6 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        style={{
          backgroundColor: t.surface, color: t.text, fontFamily: fonts.semi, fontSize: 16,
          borderRadius: 12, borderWidth: 1, borderColor: error ? t.danger : t.border,
          paddingHorizontal: 14, paddingVertical: 13,
        }}
        {...props}
      />
    </View>
  );
}

// Mensagem de erro anunciada por leitores de tela
export function ErrorText({ children }) {
  const t = useTheme();
  if (!children) return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{ color: t.danger, fontFamily: fonts.bold, fontSize: 14, marginBottom: 12 }}
    >
      {children}
    </Text>
  );
}

export function SectionTitle({ children, style }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={[{ color: t.text, fontFamily: fonts.extra, fontSize: 18, marginBottom: 10 }, style]}>
      {children}
    </Text>
  );
}

// Painel inferior (bottom sheet)
export function Sheet({ visible, title, onClose, children }) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar painel" />
        <View
          style={{
            backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            maxHeight: '88%', paddingTop: 20, paddingHorizontal: 20,
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 28 }}>
            <Text accessibilityRole="header" style={{ color: t.text, fontFamily: fonts.extra, fontSize: 20, marginBottom: 14 }}>
              {title}
            </Text>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}