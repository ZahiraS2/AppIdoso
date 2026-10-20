import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { pendingCount, upcoming, useApp } from '../store/AppContext';
import { fonts, useTheme } from '../theme';
import { Avatar, Button, Card, Chip, SectionTitle } from '../components/ui';
import { dateBR, firstName } from '../utils/format';

function Stat({ value, label }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
    >
      <Text style={{ color: t.heroText, fontFamily: fonts.extra, fontSize: 26 }}>{value}</Text>
      <Text style={{ color: t.heroText, fontFamily: fonts.semi, fontSize: 13, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function ElderCard({ elder, onPress }) {
  const t = useTheme();
  const pend = pendingCount(elder);
  const next = upcoming(elder)[0];
  const doses = elder.medicines.length === 0
    ? 'Nenhum remédio cadastrado'
    : pend > 0 ? `${pend} dose(s) pendente(s) hoje` : 'Todos os remédios tomados hoje';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir ${elder.name}`} style={{ marginBottom: 14 }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={elder.name} size={52} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: t.text, fontFamily: fonts.extra, fontSize: 17 }}>{elder.name}</Text>
            <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 14 }}>{elder.age} anos</Text>
          </View>
          <Text style={{ color: t.muted, fontSize: 22 }}>›</Text>
        </View>

        {elder.conditions.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {elder.conditions.map((c) => <Chip key={c} label={c} small />)}
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <Text style={{ color: pend > 0 ? t.text : t.muted, fontFamily: fonts.semi, fontSize: 14, flex: 1 }}>{doses}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {elder.guardians.map((g) => <Avatar key={g.email} name={g.name} size={28} />)}
          </View>
        </View>
        <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 14, marginTop: 10 }}>
          {next ? `Próxima consulta: ${dateBR(next.date)} · ${next.specialty}` : 'Sem consultas agendadas'}
        </Text>
      </Card>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, myElders, signOut } = useApp();

  const totalPend = myElders.reduce((s, e) => s + pendingCount(e), 0);
  const totalCons = myElders.reduce((s, e) => s + upcoming(e).length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        <LinearGradient
          colors={[t.heroFrom, t.heroTo]}
          style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: t.heroText, fontFamily: fonts.semi, fontSize: 15 }}>Olá,</Text>
              <Text accessibilityRole="header" style={{ color: t.heroText, fontFamily: fonts.extra, fontSize: 28 }}>
                {firstName(user.name)}
              </Text>
            </View>
            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Sair"
              style={{ backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}
            >
              <Text style={{ color: t.heroText, fontFamily: fonts.extra, fontSize: 14 }}>Sair</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Stat value={myElders.length} label="idosos" />
            <Stat value={totalPend} label={'doses\npendentes'} />
            <Stat value={totalCons} label="consultas" />
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          <SectionTitle>Seus idosos</SectionTitle>
          {myElders.length === 0 && (
            <Text style={{ color: t.muted, fontFamily: fonts.semi, fontSize: 15 }}>
              Você ainda não é responsável por nenhum idoso. Toque em “Adicionar idoso” para começar.
            </Text>
          )}
          {myElders.map((e) => (
            <ElderCard key={e.id} elder={e} onPress={() => navigation.navigate('Elder', { elderId: e.id })} />
          ))}
        </View>
      </ScrollView>

      {/* Botão fixo */}
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: Math.max(insets.bottom, 12) }}>
        <Button title="+ Adicionar idoso" onPress={() => navigation.navigate('NewElder')} />
      </View>
    </View>
  );
}