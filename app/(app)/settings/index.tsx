import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Slider from '@react-native-community/slider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { db } from '@/lib/supabase';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';
import { TextArea } from '@/components/Inp';
import { Section, Rule } from '@/components/Section';
import { PhotoUpload } from '@/components/PhotoUpload';
import { DropdownSelect } from '@/components/DropdownSelect';
import { ChipSelect } from '@/components/ChipSelect';
import type { Gender, Orientation, Religion, MonogamyStance, Preferences } from '@/types';

const GENDERS: Gender[]          = ['Man','Woman','Trans man','Trans woman','Non-binary'];
const ORIENTATIONS: Orientation[]= ['Straight','Gay','Lesbian','Bisexual','Pansexual','Queer','Other'];
const RELIGIONS: Religion[]      = ['Christianity','Islam','Judaism','Hinduism','Buddhism','Sikhism','Spiritual','Agnostic','Atheist','Other'];
const MONOGAMY: MonogamyStance[] = [
  'Strictly monogamous','Monogamous, but open-minded',
  'Open to ethical non-monogamy','Prefer open relationships','Polyamorous',
];

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function SettingsScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { saveProfile, savePhotos, fetchPhotos, savePreferences, fetchPreferences } = useProfile();
  const router = useRouter();

  // Profile fields
  const [photos,      setPhotos]      = useState<(string | null)[]>([null,null,null,null]);
  const [gender,      setGender]      = useState<Gender | ''>('');
  const [orientation, setOrientation] = useState<Orientation | ''>('');
  const [religion,    setReligion]    = useState<Religion | ''>('');
  const [bio,         setBio]         = useState('');

  // Preference fields
  const [prefGender,   setPrefGender]   = useState<Gender[]>([]);
  const [prefOrient,   setPrefOrient]   = useState<Orientation[]>([]);
  const [prefMonogamy, setPrefMonogamy] = useState<MonogamyStance[]>([]);
  const [prefReligion, setPrefReligion] = useState<Religion[]>([]);
  const [ageMin,       setAgeMin]       = useState(24);
  const [ageMax,       setAgeMax]       = useState(50);
  const [distance,     setDistance]     = useState(30);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadExisting();
  }, [user]);

  const loadExisting = async () => {
    if (!user) return;
    const [existingPhotos, prefs] = await Promise.all([
      fetchPhotos(user.id),
      fetchPreferences(user.id),
    ]);

    const padded: (string | null)[] = [null,null,null,null];
    existingPhotos.forEach((url, i) => { if (i < 4) padded[i] = url; });
    setPhotos(padded);

    if (profile) {
      setGender(profile.gender ?? '');
      setOrientation(profile.orientation ?? '');
      setReligion(profile.religion ?? '');
      setBio(profile.bio ?? '');
    }

    if (prefs) {
      setPrefGender(prefs.genders ?? []);
      setPrefOrient(prefs.orientations ?? []);
      setPrefMonogamy(prefs.monogamy_stances ?? []);
      setPrefReligion(prefs.religions ?? []);
      setAgeMin(prefs.age_min ?? 24);
      setAgeMax(prefs.age_max ?? 50);
      setDistance(prefs.distance_miles ?? 30);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all([
        savePhotos(user.id, photos),
        saveProfile(user.id, {
          gender:      gender as Gender,
          orientation: orientation as Orientation,
          religion:    religion as Religion,
          bio,
        }),
        savePreferences(user.id, {
          genders:          prefGender,
          orientations:     prefOrient,
          monogamy_stances: prefMonogamy,
          religions:        prefReligion,
          age_min:          ageMin,
          age_max:          ageMax,
          distance_miles:   distance,
        }),
      ]);
      await refreshProfile();
      Alert.alert('Saved', 'Your profile and preferences have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your profile, matches, and messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // In production, trigger a Supabase Edge Function that deletes the
            // Stripe subscription, removes the user from auth.users (cascade
            // deletes all profile data), then calls supabase.auth.signOut().
            Alert.alert('Contact support', 'Please email support@loom.app to delete your account.');
          },
        },
      ],
    );
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Settings</Text>
        <Text style={s.sub}>Edit your profile and preferences.</Text>

        {/* ── Profile ── */}
        <Text style={s.sectionHeading}>Profile</Text>
        <View style={s.sectionDivider} />

        <Section label="Photos">
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </Section>

        <Section label="Gender">
          <DropdownSelect
            value={gender}
            onChange={v => setGender(v as Gender)}
            options={GENDERS}
            placeholder="Select your gender"
          />
        </Section>

        <Section label="Sexual orientation">
          <DropdownSelect
            value={orientation}
            onChange={v => setOrientation(v as Orientation)}
            options={ORIENTATIONS}
            placeholder="Select your orientation"
          />
        </Section>

        <Section label="Religion">
          <DropdownSelect
            value={religion}
            onChange={v => setReligion(v as Religion)}
            options={RELIGIONS}
            placeholder="Select your religion"
          />
        </Section>

        <Section label={`Bio (${bio.length}/250)`}>
          <TextArea
            value={bio}
            onChangeText={t => setBio(t.slice(0, 250))}
            placeholder="A line or two about yourself…"
            maxLength={250}
          />
        </Section>

        {/* ── Preferences ── */}
        <Text style={[s.sectionHeading, { marginTop: Sp.xl }]}>Preferences</Text>
        <View style={s.sectionDivider} />

        <Section label="Gender filter">
          <ChipSelect options={GENDERS} selected={prefGender} onToggle={v => setPrefGender(p => toggle(p, v))} />
        </Section>
        <Section label="Orientation filter">
          <ChipSelect options={ORIENTATIONS} selected={prefOrient} onToggle={v => setPrefOrient(p => toggle(p, v))} />
        </Section>
        <Section label="Monogamy filter">
          <ChipSelect options={MONOGAMY} selected={prefMonogamy} onToggle={v => setPrefMonogamy(p => toggle(p, v))} />
        </Section>
        <Section label="Religion filter">
          <ChipSelect options={RELIGIONS} selected={prefReligion} onToggle={v => setPrefReligion(p => toggle(p, v))} />
        </Section>

        <Section label={`Age range: ${ageMin} – ${ageMax}`}>
          <View style={s.sliderRow}>
            <Text style={s.sliderVal}>{ageMin}</Text>
            <Slider style={s.slider} value={ageMin} minimumValue={18} maximumValue={99} step={1}
              minimumTrackTintColor={C.text} maximumTrackTintColor={C.border} thumbTintColor={C.text}
              onValueChange={v => setAgeMin(Math.min(v, ageMax - 1))} />
          </View>
          <View style={s.sliderRow}>
            <Text style={s.sliderVal}>{ageMax}</Text>
            <Slider style={s.slider} value={ageMax} minimumValue={18} maximumValue={100} step={1}
              minimumTrackTintColor={C.text} maximumTrackTintColor={C.border} thumbTintColor={C.text}
              onValueChange={v => setAgeMax(Math.max(v, ageMin + 1))} />
          </View>
        </Section>

        <Section label={`Max distance: ${distance} miles`}>
          <View style={s.sliderRow}>
            <Slider style={[s.slider, { flex: 1 }]} value={distance} minimumValue={1} maximumValue={500} step={1}
              minimumTrackTintColor={C.text} maximumTrackTintColor={C.border} thumbTintColor={C.text}
              onValueChange={setDistance} />
            <Text style={s.distVal}>{distance} mi</Text>
          </View>
        </Section>

        <Btn primary onPress={handleSave} loading={saving} style={{ marginTop: Sp.sm }}>
          Save changes
        </Btn>

        {/* ── Account ── */}
        <Text style={[s.sectionHeading, { marginTop: Sp.xl }]}>Account</Text>
        <View style={s.sectionDivider} />

        <TouchableOpacity onPress={() => router.push('/(onboarding)/questions')} style={s.link}>
          <Text style={s.linkText}>Retake compatibility questions</Text>
          <Text style={s.linkArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignOut} style={s.link}>
          <Text style={s.linkText}>Sign out</Text>
          <Text style={s.linkArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount} style={s.link}>
          <Text style={[s.linkText, { color: C.err }]}>Delete account</Text>
          <Text style={[s.linkArrow, { color: C.err }]}>›</Text>
        </TouchableOpacity>

        <View style={{ height: Sp.xxl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
    paddingTop:      Platform.OS === 'ios' ? 56 : 36,
  },
  content: {
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.md,
    paddingBottom:     Sp.xxl,
  },
  heading: {
    fontFamily:   F.serif,
    fontSize:     28,
    color:        C.text,
    marginBottom: 4,
  },
  sub: {
    fontFamily:   F.sans,
    fontSize:     13,
    color:        C.text3,
    marginBottom: Sp.xl,
  },
  sectionHeading: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom:  Sp.sm,
  },
  sectionDivider: {
    height:          1,
    backgroundColor: C.border,
    marginBottom:    Sp.lg,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Sp.sm,
    marginBottom:  4,
  },
  sliderVal: {
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
  distVal: {
    fontFamily: F.mono,
    fontSize:   13,
    color:      C.text2,
    minWidth:   48,
    textAlign:  'right',
  },
  link: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  linkText: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.text,
  },
  linkArrow: {
    fontFamily: F.sans,
    fontSize:   18,
    color:      C.text3,
  },
});
