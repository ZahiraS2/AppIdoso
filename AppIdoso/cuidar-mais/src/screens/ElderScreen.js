import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { fonts, useTheme } from '../theme';
import { Avatar } from '../components/ui';
import { BackButton } from './NewElderScreen';
import SummaryTab from './tabs/SummaryTab';
import MedicinesTab from './tabs/MedicinesTab';
import AppointmentsTab from './tabs/AppointmentsTab';

const TABS = ['Resumo', 'Remédios', 'Consultas'];

export default function ElderScreen({ route, navigation }) {
  const t = useTheme();
  const { elders } = useApp();
  const [tab, setTab] = useState('Resumo');
  const elder = elders.find((e) => e.id === route.params.elderId);
  if (!elder) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Avatar name={elder.name} size={48} />
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: t.text, fontFamily: fonts.extra, fontSize: 20 }}>{elder.name}</Text>
          <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 14 }}>{elder.age} anos</Text>
        </View>
      </View>

      {/* Abas */}
      <View
        accessibilityRole="tablist"
        style={{ flexDirection: 'row', margin: 20, padding: 4, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
      >
        {TABS.map((name) => {
          const active = tab === name;
          return (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center', backgroundColor: active ? t.surface2 : 'transparent' }}
            >
              <Text style={{ color: active ? t.text : t.muted, fontFamily: fonts.extra, fontSize: 14 }}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {tab === 'Resumo' && <SummaryTab elder={elder} />}
        {tab === 'Remédios' && <MedicinesTab elder={elder} />}
        {tab === 'Consultas' && <AppointmentsTab elder={elder} />}
      </ScrollView>
    </SafeAreaView>
  );
}