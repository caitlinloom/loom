import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';
import { Inp, TextArea } from '@/components/Inp';
import { Section } from '@/components/Section';
import { Progress } from '@/components/Progress';
import { PhotoUpload } from '@/components/PhotoUpload';
import { DropdownSelect } from '@/components/DropdownSelect';
import type { Gender, Orientation, Religion } from '@/types';

const GENDERS: Gender[]       = ['Man','Woman','Trans man','Trans woman','Non-binary'];
const ORIENTATIONS: Orientation[] = ['Straight','Gay','Lesbian','Bisexual','Pansexual','Queer','Other'];
const RELIGIONS: Religion[]   = ['Christianity','Islam','Judaism','Hinduism','Buddhism','Sikhism','Spiritual','Agnostic','Atheist','Other'];

export default function ProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const { saveProfile, savePhotos } = useProfile();
  const router = useRouter();

  const [photos,      setPhotos]      = useState<(string | null)[]>([null,null,null,null]);
  const [birthDate,   setBirthDate]   = useState('');
  const [gender,      setGender]      = useState<Gender | ''>('');
  const [orientation, setOrientation] = useState<Orientation | ''>('');
  const [religion,    setReligion]    = useState<Religion | ''>('');
  const [bio,         setBio]         = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationLat,  setLocationLat]  = useState<number | null>(null);
  const [locationLng,  setLocationLng]  = useState<number | null>(null);
  const [locationSet,  setLocationSet]  = useState(false);
  const [locLoading,   setLocLoading]   = useState(false);
  const [saving,       setSaving]       = useState(false);

  const photosReady = photos.filter(Boolean).length === 4;
  const isReady     =
    photosReady  &&
    birthDate    &&
    gender       &&
    orientation  &&
    religion     &&
    locationSet;

  const enableLocation = async () => {
    setLocLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable location in Settings to continue.');
      setLocLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [geo] = await Location.reverseGeocodeAsync(loc.coords);
    const name  = geo ? `${geo.city ?? geo.region}, ${geo.region ?? geo.country}` : 'Location set';
    setLocationName(name);
    setLocationLat(loc.coords.latitude);
    setLocationLng(loc.coords.longitude);
    setLocationSet(true);
    setLocLoading(false);
  };

  const handleContinue = async () => {
    if (!user || !isReady) return;
    setSaving(true);
    try {
      await savePhotos(user.id, photos);
      await saveProfile(user.id, {
        birth_date:      birthDate,
        gender:          gender as Gender,
        orientation:     orientation as Orientation,
        religion:        religion as Religion,
        bio,
        location_name:   locationName,
        location_lat:    locationLat,
        location_lng:    locationLng,
        onboarding_step: 2,
      });
      await refreshProfile();
      router.replace('/(onboarding)/preferences');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Progress current={1} total={4} label="Step 1 of 4 — Your profile" />

        <Text style={s.heading}>Build your profile</Text>
        <Text style={s.sub}>
          Four photos and the essentials. Everything here can be updated in settings.
        </Text>

        {/* Photos */}
        <Section label="Photos (4 required)">
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </Section>

        {/* Date of birth */}
        <Section label="Date of birth">
          <Inp
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </Section>

        {/* Location */}
        <Section label="Location">
          {!locationSet ? (
            <Btn
              onPress={enableLocation}
              loading={locLoading}
              style={s.locBtn}
            >
              Enable location services
            </Btn>
          ) : (
            <View style={s.locConfirm}>
              <Text style={s.locCheckmark}>✓</Text>
              <Text style={s.locText}>{locationName}</Text>
            </View>
          )}
        </Section>

        {/* Gender */}
        <Section label="Gender">
          <DropdownSelect
            value={gender}
            onChange={v => setGender(v as Gender)}
            options={GENDERS}
            placeholder="Select your gender"
          />
        </Section>

        {/* Orientation */}
        <Section label="Sexual orientation">
          <DropdownSelect
            value={orientation}
            onChange={v => setOrientation(v as Orientation)}
            options={ORIENTATIONS}
            placeholder="Select your orientation"
          />
        </Section>

        {/* Religion */}
        <Section label="Religion">
          <DropdownSelect
            value={religion}
            onChange={v => setReligion(v as Religion)}
            options={RELIGIONS}
            placeholder="Select your religion"
          />
        </Section>

        {/* Bio */}
        <Section label={`Bio (${bio.length}/250)`}>
          <TextArea
            value={bio}
            onChangeText={t => setBio(t.slice(0, 250))}
            placeholder="A line or two about yourself…"
            maxLength={250}
          />
        </Section>

        <Btn
          primary
          onPress={handleContinue}
          disabled={!isReady}
          loading={saving}
        >
          {isReady ? 'Continue' : 'Complete all fields to continue'}
        </Btn>

        <View style={{ height: Sp.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  locBtn: {
    borderWidth: 1,
    borderColor: C.border,
  },
  locConfirm: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   13,
    paddingHorizontal: 16,
    borderWidth:       1,
    borderColor:       C.border,
    gap:               Sp.sm,
  },
  locCheckmark: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.ok,
  },
  locText: {
    fontFamily: F.sans,
    fontSize:   15,
    color:      C.text,
  },
});
