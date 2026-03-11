import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';
import { Section } from '@/components/Section';
import { Progress } from '@/components/Progress';
import { ChipSelect } from '@/components/ChipSelect';
import type { Gender, Orientation, Religion, MonogamyStance } from '@/types';

const GENDERS: Gender[]          = ['Man','Woman','Trans man','Trans woman','Non-binary'];
const ORIENTATIONS: Orientation[]= ['Straight','Gay','Lesbian','Bisexual','Pansexual','Queer','Other'];
const RELIGIONS: Religion[]      = ['Christianity','Islam','Judaism','Hinduism','Buddhism','Sikhism','Spiritual','Agnostic','Atheist','Other'];
const MONOGAMY: MonogamyStance[] = [
  'Strictly monogamous',
  'Monogamous, but open-minded',
  'Open to ethical non-monogamy',
  'Prefer open relationships',
  'Polyamorous',
];

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function PreferencesScreen() {
  const { user, refreshProfile } = useAuth();
  const { savePreferences }      = useProfile();
  const router                   = useRouter();

  const [prefGender,      setPrefGender]      = useState<Gender[]>([]);
  const [prefOrientation, setPrefOrientation] = useState<Orientation[]>([]);
  const [prefMonogamy,    setPrefMonogamy]    = useState<MonogamyStance[]>([]);
  const [prefReligion,    setPrefReligion]    = useState<Religion[]>([]);
  const [ageMin,          setAgeMin]          = useState(24);
  const [ageMax,          setAgeMax]          = useState(50);
  const [distance,        setDistance]        = useState(30);
  const [saving,          setSaving]          = useState(false);

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePreferences(user.id, {
        genders:          prefGender,
        orientations:     prefOrientation,
        monogamy_stances: prefMonogamy,
        religions:        prefReligion,
        age_min:          ageMin,
        age_max:          ageMax,
        distance_miles:   distance,
      });
      await user && saveProfileStep3(user.id);
      await refreshProfile();
      router.replace('/(onboarding)/questions');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfileStep3 = async (uid: string) => {
    const { db } = await import('@/lib/supabase');
    await db.profiles()
      .update({ onboarding_step: 3, updated_at: new Date().toISOString() })
      .eq('id', uid);
  };

  return (
    <View style={s.flex}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.content}>
        <Progress current={2} total={4} label="Step 2 of 4 — Your preferences" />

        <Text style={s.heading}>Who you'd like to see</Text>
        <Text style={s.sub}>
          Set hard filters for profiles shown to you. Leave any section blank for no restriction. Adjust anytime in settings.
        </Text>

        <Section label="Gender (leave blank for no filter)">
          <ChipSelect
            options={GENDERS}
            selected={prefGender}
            onToggle={v => setPrefGender(p => toggle(p, v))}
          />
        </Section>

        <Section label="Sexual orientation">
          <ChipSelect
            options={ORIENTATIONS}
            selected={prefOrientation}
            onToggle={v => setPrefOrientation(p => toggle(p, v))}
          />
        </Section>

        <Section label="Stance on monogamy">
          <ChipSelect
            options={MONOGAMY}
            selected={prefMonogamy}
            onToggle={v => setPrefMonogamy(p => toggle(p, v))}
          />
        </Section>

        <Section label="Religion">
          <ChipSelect
            options={RELIGIONS}
            selected={prefReligion}
            onToggle={v => setPrefReligion(p => toggle(p, v))}
          />
        </Section>

        {/* Age range */}
        <Section label={`Age range: ${ageMin} – ${ageMax}`}>
          <View style={s.sliderRow}>
            <Text style={s.sliderLabel}>{ageMin}</Text>
            <Slider
              style={s.slider}
              value={ageMin}
              minimumValue={18}
              maximumValue={99}
              step={1}
              minimumTrackTintColor={C.text}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.text}
              onValueChange={v => setAgeMin(Math.min(v, ageMax - 1))}
            />
          </View>
          <View style={s.sliderRow}>
            <Text style={s.sliderLabel}>{ageMax}</Text>
            <Slider
              style={s.slider}
              value={ageMax}
              minimumValue={18}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={C.text}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.text}
              onValueChange={v => setAgeMax(Math.max(v, ageMin + 1))}
            />
          </View>
        </Section>

        {/* Distance */}
        <Section label={`Maximum distance: ${distance} miles`}>
          <View style={s.sliderRow}>
            <Slider
              style={[s.slider, { flex: 1 }]}
              value={distance}
              minimumValue={1}
              maximumValue={500}
              step={1}
              minimumTrackTintColor={C.text}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.text}
              onValueChange={setDistance}
            />
            <Text style={s.distLabel}>{distance} mi</Text>
          </View>
        </Section>

        <Btn primary onPress={handleContinue} loading={saving}>
          Continue to questions
        </Btn>

        <View style={{ height: Sp.xxl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: {
    flex:            1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.lg,
    paddingBottom:     Sp.xxl,
    gap:               Sp.xs,
  },
  heading: {
    fontFamily:   F.serif,
    fontSize:     28,
    color:        C.text,
    marginTop:    Sp.sm,
    marginBottom: 4,
  },
  sub: {
    fontFamily:   F.sans,
    fontSize:     13,
    color:        C.text3,
    lineHeight:   18,
    marginBottom: Sp.sm,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Sp.sm,
    marginBottom:  Sp.xs,
  },
  sliderLabel: {
    fontFamily: F.mono,
    fontSize:   13,
    color:      C.text2,
    minWidth:   28,
    textAlign:  'right',
  },
  slider: {
    flex:   1,
    height: 32,
  },
  distLabel: {
    fontFamily: F.mono,
    fontSize:   13,
    color:      C.text2,
    minWidth:   48,
    textAlign:  'right',
  },
});
